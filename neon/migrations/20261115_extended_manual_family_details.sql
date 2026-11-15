-- Add compact, protected manual biographical data for human-reviewed family proposals.
alter table public.diwan_family_relation_requests add column if not exists proposed_details jsonb not null default '{}'::jsonb;
alter table public.diwan_family_relation_requests add constraint diwan_relation_details_object check (jsonb_typeof(proposed_details)='object' and pg_column_size(proposed_details)<=4096);
