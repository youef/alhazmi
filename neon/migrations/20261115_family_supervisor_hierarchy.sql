-- Diwan family supervisor hierarchy, secure invitations and reviewed family-link proposals
-- Additive schema only. Do not auto-create verified people or disclose sensitive IDs.

insert into public.custom_roles(role_key,name_ar,description_ar,is_system,role_state,max_scope)
values
('diwan_fakhth_supervisor','مشرف فخذ','مراجعة الطلبات المقترحة ضمن الفخذ فقط',false,'active','unit'),
('diwan_family_supervisor','مشرف عائلة','مراجعة بيانات عائلة واحدة ضمن فخذها',false,'active','family'),
('diwan_parent_supervisor','مشرف أسرة','اقتراح روابط أبنائه وذريته دون اطلاع على بيانات البالغين الخاصة',false,'active','self')
on conflict do nothing;

insert into public.custom_role_permissions(role_id,permission_id,decision)
select r.id,p.id,'allow'
from public.custom_roles r
join public.permission_catalog p on p.permission_key in ('lineage.propose','family.read','selfservice.submit')
where r.role_key in ('diwan_fakhth_supervisor','diwan_family_supervisor','diwan_parent_supervisor')
and p.is_active
on conflict do nothing;

create table if not exists public.diwan_supervisor_invitations (
 id uuid primary key default gen_random_uuid(),
 invited_email text not null check(invited_email=lower(btrim(invited_email)) and invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 invited_name text check(length(invited_name)<=100),
 role_key text not null check(role_key in ('diwan_fakhth_supervisor','diwan_family_supervisor','diwan_parent_supervisor')),
 fakhth_unit_id uuid references public.lineage_fakhths(unit_id),
 family_unit_id uuid references public.lineage_family_fakhth_links(family_unit_id),
 parent_person_id uuid references public.people(id),
 invited_by uuid not null references auth.users(id),
 approved_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days'),
 accepted_by uuid references auth.users(id),
 accepted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check ((role_key='diwan_fakhth_supervisor' and fakhth_unit_id is not null and family_unit_id is null and parent_person_id is null)
 or (role_key='diwan_family_supervisor' and fakhth_unit_id is not null and family_unit_id is not null and parent_person_id is null)
 or (role_key='diwan_parent_supervisor' and fakhth_unit_id is not null and family_unit_id is not null and parent_person_id is not null)),
 check(expires_at>created_at)
);

create unique index if not exists diwan_invitation_open_unique on public.diwan_supervisor_invitations
(lower(invited_email),role_key,coalesce(fakhth_unit_id::text,''),coalesce(family_unit_id::text,''),coalesce(parent_person_id::text,''))
where revoked_at is null and accepted_at is null;

create index if not exists diwan_invitation_by_email on public.diwan_supervisor_invitations(invited_email,expires_at);

create table if not exists public.diwan_family_relation_requests (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 family_unit_id uuid not null references public.lineage_family_fakhth_links(family_unit_id),
 fakhth_unit_id uuid not null references public.lineage_fakhths(unit_id),
 submitter_id uuid not null references auth.users(id),
 anchor_person_id uuid references public.people(id),
 linked_person_id uuid references public.people(id),
 relationship text not null check(relationship in ('self','spouse','son','daughter','father','mother','grandson','granddaughter','paternal_uncle','paternal_aunt','maternal_uncle','maternal_aunt','paternal_grandfather','paternal_grandmother','maternal_grandfather','maternal_grandmother','guardian')),
 proposed_name_ar text not null check(length(btrim(proposed_name_ar)) between 3 and 200),
 proposed_gender text check(proposed_gender in ('male','female','unknown','undisclosed')),
 proposed_birth_date date,
 proposed_birth_precision text not null default 'unknown' check(proposed_birth_precision in ('day','month','year','estimated','unknown')),
 identifier_type text check(identifier_type in ('national_id','residency','passport','birth_certificate')),
 identifier_digest bytea check(identifier_digest is null or octet_length(identifier_digest)=32),
 identifier_last4 text check(identifier_last4 is null or identifier_last4 ~ '^[0-9A-Za-z]{4}$'),
 proposed_notes text check(length(proposed_notes)<=1000),
 status text not null default 'submitted' check(status in ('submitted','needs_evidence','under_review','approved','rejected','withdrawn')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 reviewed_notes text,
 created_person_id uuid references public.people(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (linked_person_id is null or linked_person_id <> anchor_person_id),
 check (identifier_type is not null or identifier_digest is null),
 check (identifier_digest is null or identifier_type is not null),
 check (status<>'approved' or (reviewed_by is not null and reviewed_at is not null))
);

create index if not exists diwan_relation_requests_queue on public.diwan_family_relation_requests(status,created_at desc);

create index if not exists diwan_relation_requests_submitter on public.diwan_family_relation_requests(submitter_id,created_at desc);

create index if not exists diwan_relation_requests_family on public.diwan_family_relation_requests(family_unit_id,status);

create index if not exists diwan_relation_identifier_lookup on public.diwan_family_relation_requests(identifier_digest) where identifier_digest is not null;

create table if not exists public.diwan_person_visibility_consents(
 person_id uuid not null references public.people(id),
 allowed_user_id uuid not null references auth.users(id),
 show_name boolean not null default true,
 consent_recorded_by uuid references auth.users(id),
 consent_at timestamptz not null default now(),
 revoked_at timestamptz,
 primary key(person_id,allowed_user_id)
);

create or replace function public.diwan_check_supervisor_invite()
returns trigger language plpgsql set search_path=public as $$
declare mapped_fakhth uuid; verified_person boolean;
begin
 if new.family_unit_id is not null then
  select fakhth_unit_id into mapped_fakhth from public.lineage_family_fakhth_links where family_unit_id=new.family_unit_id;
  if mapped_fakhth is distinct from new.fakhth_unit_id then raise exception 'Selected family must belong to the selected existing fakhth'; end if;
 end if;
 if new.parent_person_id is not null then
  select exists(select 1 from public.people where id=new.parent_person_id and record_status='verified' and family_unit_id=new.family_unit_id) into verified_person;
  if not verified_person then raise exception 'Parent supervisor requires a verified person in the selected family';end if;
 end if;
 return new;
end $$;

drop trigger if exists diwan_supervisor_invite_scope on public.diwan_supervisor_invitations;

create trigger diwan_supervisor_invite_scope before insert or update of role_key,fakhth_unit_id,family_unit_id,parent_person_id
on public.diwan_supervisor_invitations for each row execute function public.diwan_check_supervisor_invite();

create or replace function public.diwan_check_relation_request()
returns trigger language plpgsql set search_path=public as $$
declare actual_tribe uuid;actual_fakhth uuid;anchor_tribe uuid;
begin
 select tribe_id,fakhth_unit_id into actual_tribe,actual_fakhth from public.lineage_family_fakhth_links where family_unit_id=new.family_unit_id;
 if actual_tribe is distinct from new.tribe_id or actual_fakhth is distinct from new.fakhth_unit_id then
   raise exception 'Family must belong to the selected existing fakhth and tribe';
 end if;
 if new.anchor_person_id is not null then
  select tribe_id into anchor_tribe from public.people where id=new.anchor_person_id;
  if anchor_tribe is distinct from new.tribe_id then raise exception 'Proposed anchor must be within tribe';end if;
 end if;
 return new;
end $$;

drop trigger if exists diwan_relation_request_scope on public.diwan_family_relation_requests;

create trigger diwan_relation_request_scope before insert or update of tribe_id,fakhth_unit_id,family_unit_id,anchor_person_id
on public.diwan_family_relation_requests for each row execute function public.diwan_check_relation_request();

alter table public.diwan_supervisor_invitations enable row level security;

alter table public.diwan_family_relation_requests enable row level security;

alter table public.diwan_person_visibility_consents enable row level security;

revoke all on public.diwan_supervisor_invitations from public,anon,authenticated;

revoke all on public.diwan_family_relation_requests from public,anon,authenticated;

revoke all on public.diwan_person_visibility_consents from public,anon,authenticated;

comment on table public.diwan_family_relation_requests is 'Protected source assertions requiring human approval: a national ID hash only detects possible duplicates and never proves parentage or identity ownership.';

comment on table public.diwan_supervisor_invitations is 'Approved email invitations, scoped to existing fakhth/family/person only; accepting never grants system administration.';
