-- Verified guest identities retain the same per-user ownership boundary.
alter policy own_records_read on public.paasaa_records using ((select auth.uid())=owner);
alter policy own_records_insert on public.paasaa_records with check ((select auth.uid())=owner);
alter policy own_records_update on public.paasaa_records using ((select auth.uid())=owner) with check ((select auth.uid())=owner);
-- Keep the existing 60 requests/hour owner quota, including for guests.
create or replace function paasaa_private.take_ai_quota() returns boolean
language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); current_bucket bigint := floor(extract(epoch from now())/3600); used integer;
begin
  if caller is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  insert into paasaa_private.ai_quota as q(owner,bucket,count) values(caller,current_bucket,1)
  on conflict(owner) do update set bucket=current_bucket,
    count=case when q.bucket=current_bucket then least(q.count+1,61) else 1 end
  returning count into used;
  return used<=60;
end $$;
