create table public.paasaa_update_interest (
  owner uuid primary key references auth.users(id) on delete cascade,
  email text not null check(length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  consent_version text not null default 'product-updates-v1' check(consent_version = 'product-updates-v1'),
  updated_at timestamptz not null default now()
);
alter table public.paasaa_update_interest enable row level security;
revoke all on public.paasaa_update_interest from public, anon, authenticated;
grant select, insert, update on public.paasaa_update_interest to authenticated;
create policy updates_read_own on public.paasaa_update_interest for select to authenticated using ((select auth.uid()) = owner);
create policy updates_insert_own on public.paasaa_update_interest for insert to authenticated with check ((select auth.uid()) = owner);
create policy updates_change_own on public.paasaa_update_interest for update to authenticated using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
comment on table public.paasaa_update_interest is 'Explicit optional product-update interest only. No clinical activity, no automatic email delivery, no public reads.';
