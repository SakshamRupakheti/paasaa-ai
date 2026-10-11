-- Guests can use temporary tools, but cannot read or write persistent activity.
alter policy own_records_read on public.paasaa_records using ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
alter policy own_records_insert on public.paasaa_records with check ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
alter policy own_records_update on public.paasaa_records using ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false)) with check ((select auth.uid())=owner and not coalesce((select auth.jwt()->>'is_anonymous')::boolean,false));
