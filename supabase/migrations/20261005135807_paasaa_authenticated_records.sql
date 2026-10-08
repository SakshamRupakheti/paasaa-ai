create table public.paasaa_records (
  owner uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 160),
  kind text not null check (kind in ('worry','conversation')),
  payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<1000000),
  revision integer not null check (revision>0),
  updated_at timestamptz not null default now(),
  primary key(owner,id)
);
create index paasaa_records_owner_kind_updated on public.paasaa_records(owner,kind,updated_at desc);
alter table public.paasaa_records enable row level security;
revoke all on public.paasaa_records from public,anon,authenticated;
grant select,insert,update on public.paasaa_records to authenticated;
create policy own_records_read on public.paasaa_records for select to authenticated
  using ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
create policy own_records_insert on public.paasaa_records for insert to authenticated
  with check ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
create policy own_records_update on public.paasaa_records for update to authenticated
  using ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false))
  with check ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));

create schema if not exists paasaa_private;
revoke all on schema paasaa_private from public,anon,authenticated;
grant usage on schema paasaa_private to authenticated;
create table paasaa_private.ai_quota (
  owner uuid primary key references auth.users(id) on delete cascade,
  bucket bigint not null,
  count integer not null
);
alter table paasaa_private.ai_quota enable row level security;
revoke all on paasaa_private.ai_quota from public,anon,authenticated;
-- This narrowly scoped definer only increments the caller's own quota. No caller
-- controls the user, clock, maximum, or counter. The table is not API-exposed.
create function paasaa_private.take_ai_quota() returns boolean
language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); current_bucket bigint := floor(extract(epoch from now())/3600); used integer;
begin
  if caller is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  insert into paasaa_private.ai_quota as q(owner,bucket,count) values(caller,current_bucket,1)
  on conflict(owner) do update set bucket=current_bucket,
    count=case when q.bucket=current_bucket then least(q.count+1,61) else 1 end
  returning count into used;
  return used<=60;
end $$;
revoke all on function paasaa_private.take_ai_quota() from public,anon;
grant execute on function paasaa_private.take_ai_quota() to authenticated;
create function public.paasaa_take_ai_quota() returns boolean
language sql security invoker set search_path='' as $$ select paasaa_private.take_ai_quota(); $$;
revoke all on function public.paasaa_take_ai_quota() from public,anon;
grant execute on function public.paasaa_take_ai_quota() to authenticated;
