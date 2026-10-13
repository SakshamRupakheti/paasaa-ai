-- Reuse the existing owner-scoped records table and unchanged RLS policies.
alter table public.paasaa_records drop constraint paasaa_records_kind_check;
alter table public.paasaa_records add constraint paasaa_records_kind_check
  check (kind in ('worry','conversation','mood'));
