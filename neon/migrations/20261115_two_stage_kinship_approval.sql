-- Separation of approval to create a private draft person and final approval to verify a family link.
alter table public.diwan_family_relation_requests add column if not exists lineage_verified_at timestamptz;

alter table public.diwan_family_relation_requests add column if not exists lineage_verified_by uuid references auth.users(id);

alter table public.diwan_family_relation_requests add column if not exists lineage_verification_note text;

alter table public.diwan_family_relation_requests add column if not exists marriage_id uuid references public.marriages(id);

create index if not exists diwan_relation_verified_index on public.diwan_family_relation_requests(created_person_id,lineage_verified_at) where status='approved';

comment on column public.diwan_family_relation_requests.lineage_verified_at is 'Final separate genealogical link approval; initial approval alone does not validate parentage or marriage.';
