-- Additive record kinds. Existing ownership, non-anonymous policies and grants
-- remain unchanged. No backfill and no clinician access to patient records.
alter table public.paasaa_records drop constraint paasaa_records_kind_check;
alter table public.paasaa_records add constraint paasaa_records_kind_check
  check (kind in ('worry','conversation','mood','memory','intervention_outcome'));
