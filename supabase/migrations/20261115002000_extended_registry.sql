-- V2 expanded records for alhazmi: apply after initial schema and security policies.
create table public.person_names (
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 name_type text not null check(name_type in ('legal','former','alias','nickname','kunya','historical')),
 full_text text not null, from_date date, to_date date,
 verified_source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','verified','disputed')),
 preferred boolean not null default false, created_at timestamptz not null default now(),
 check(to_date is null or from_date is null or to_date>=from_date)
);
create unique index one_preferred_name on public.person_names(person_id) where preferred;
create table public.person_name_parts(
 id uuid primary key default gen_random_uuid(),
 name_id uuid not null references public.person_names(id) on delete cascade,
 position smallint not null check(position>0), token text not null,
 kind text not null check(kind in ('given','father','grandfather','ancestor','family','clan','subclan','tribe','nickname','unknown')),
 ancestor_person_id uuid references public.people(id),
 lineage_unit_id uuid references public.lineage_units(id),
 confirmed boolean not null default false,
 unique(name_id,position)
);
create index on public.person_name_parts(token);
create table public.ancestral_roots(
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 unit_id uuid references public.lineage_units(id), founder_person_id uuid references public.people(id),
 label text not null, narrative text, date_from date, date_to date,
 source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','verified','disputed'))
);
-- Normalize + HMAC-SHA256 in trusted application with secret external to DB.
-- Same identity, issuer and type cannot appear twice for active records.
create table public.person_identifiers (
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 country_code char(2) not null, issuer text not null, identifier_type text not null
 check(identifier_type in ('national_id','passport','residency','birth_certificate','other')),
 identifier_hmac bytea not null check(octet_length(identifier_hmac)=32),
 hmac_key_version smallint not null default 1,
 encrypted_value bytea, masked_value text,
 status text not null default 'pending' check(status in ('pending','verified','disputed','revoked')),
 verified_at timestamptz, created_at timestamptz not null default now()
);
create unique index unique_active_identifier on public.person_identifiers
 (country_code,issuer,identifier_type,hmac_key_version,identifier_hmac)
 where status in ('pending','verified','disputed');
create index on public.person_identifiers(person_id);
create table public.person_birth_records(
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 born_on date, birth_place_text text, registration_date date,
 nationality_code char(2), source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','verified','disputed'))
);
create table public.marriage_history(
 id uuid primary key default gen_random_uuid(), marriage_id uuid not null references public.marriages(id),
 event_type text not null check(event_type in ('contract','divorce','annulment','widowhood','reconciliation')),
 event_date date, source_id uuid references public.sources(id),
 approved_request_id uuid references public.change_requests(id),
 status text not null default 'pending' check(status in ('pending','approved','disputed'))
);
create table public.child_care_records(
 id uuid primary key default gen_random_uuid(), child_id uuid not null references public.people(id),
 caregiver_id uuid not null references public.people(id),
 care_type text not null check(care_type in ('guardianship','custody','foster','care','step_parent')),
 start_on date, end_on date, source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','approved','disputed','ended')),
 check(child_id<>caregiver_id), check(end_on is null or start_on is null or end_on>=start_on)
);
create table public.person_education(
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 institution text, qualification text not null, major text, start_on date, end_on date,
 source_id uuid references public.sources(id), visibility text not null default 'private'
 check(visibility in ('private','approved_family','approved_members'))
);
create table public.person_employment(
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 kind text not null check(kind in ('employed','self_employed','unemployed','student','retired','other')),
 employer_ciphertext bytea, role_ciphertext bytea, start_on date, end_on date,
 visibility text not null default 'private' check(visibility in ('private','approved_family','approved_members'))
);
create table public.places(
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.places(id),
 name_ar text not null, kind text not null check(kind in ('country','region','city','village','settlement','other')),
 country_code char(2), lat numeric(9,6), lon numeric(9,6), description text,
 check(id is distinct from parent_id), check(lat between -90 and 90), check(lon between -180 and 180)
);
create table public.place_aliases(
 id uuid primary key default gen_random_uuid(), place_id uuid not null references public.places(id),
 alias_name text not null, from_date date, to_date date, source_id uuid references public.sources(id)
);
create table public.person_residences(
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 place_id uuid not null references public.places(id),
 national_address_ciphertext bytea, start_on date, end_on date,
 current_residence boolean not null default false
);
create unique index one_current_residence on public.person_residences(person_id) where current_residence;
create table public.historical_settlements(
 id uuid primary key default gen_random_uuid(), unit_id uuid not null references public.lineage_units(id),
 place_id uuid not null references public.places(id), start_on date, end_on date,
 source_id uuid references public.sources(id), narrative text,
 status text not null default 'pending' check(status in ('pending','verified','disputed'))
);
create table public.family_migrations(
 id uuid primary key default gen_random_uuid(), unit_id uuid not null references public.lineage_units(id),
 origin_place_id uuid references public.places(id), destination_place_id uuid references public.places(id),
 migrated_on date, date_precision text not null default 'unknown'
 check(date_precision in ('day','month','year','estimated','unknown')),
 reason text, source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','verified','disputed')),
 check(origin_place_id is distinct from destination_place_id)
);
create table public.family_delegations(
 id uuid primary key default gen_random_uuid(), granting_user_id uuid references auth.users(id),
 delegate_user_id uuid not null references auth.users(id),
 family_id uuid not null references public.lineage_units(id),
 scopes text[] not null default array['submit_request']::text[],
 approved_by uuid references auth.users(id),
 expires_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table public.guardian_permissions(
 id uuid primary key default gen_random_uuid(), guardian_user_id uuid not null references auth.users(id),
 child_person_id uuid not null references public.people(id),
 permission text not null check(permission in ('view_basic','submit_update','upload_evidence','manage_consent')),
 approved_by uuid references auth.users(id), approved_at timestamptz,
 expires_at timestamptz, revoked_at timestamptz,
 unique(guardian_user_id,child_person_id,permission)
);
create table public.genealogists(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 tribe_id uuid not null references public.tribes(id),
 accreditation_note text, verified_by uuid references auth.users(id),
 valid_until date, revoked_at timestamptz, unique(user_id,tribe_id)
);
create table public.verification_tasks(
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 request_id uuid references public.change_requests(id), entity_type text not null, entity_id uuid not null,
 genealogist_id uuid references public.genealogists(id),
 status text not null default 'open' check(status in ('open','reviewing','needs_evidence','approved','rejected','closed')),
 created_at timestamptz not null default now()
);
create table public.expert_opinions(
 id uuid primary key default gen_random_uuid(), task_id uuid not null references public.verification_tasks(id),
 genealogist_id uuid not null references public.genealogists(id),
 conclusion text not null check(conclusion in ('supports','opposes','uncertain','need_evidence')),
 note text, source_id uuid references public.sources(id), created_at timestamptz not null default now()
);
create table public.notifications(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 category text not null, title text not null, body text,
 related_record_id uuid, read_at timestamptz, created_at timestamptz not null default now()
);
create index on public.notifications(user_id,created_at desc);
create table public.notification_preferences(
 user_id uuid not null references auth.users(id), category text not null,
 in_app boolean not null default true, email boolean not null default false,
 primary key(user_id,category)
);
create table public.family_statistics(
 unit_id uuid primary key references public.lineage_units(id),
 individual_count integer not null default 0 check(individual_count>=0),
 verified_count integer not null default 0 check(verified_count>=0),
 calculated_at timestamptz
);
create table public.statistics_snapshots(
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 unit_id uuid references public.lineage_units(id),
 metric text not null, value numeric not null, period_start date, period_end date,
 generated_at timestamptz not null default now()
);
create table public.record_revisions(
 id bigint generated always as identity primary key,
 entity_type text not null, entity_id uuid not null, revision integer not null check(revision>0),
 previous jsonb, current jsonb, reason text,
 approved_request_id uuid references public.change_requests(id),
 actor_id uuid references auth.users(id),
 happened_at timestamptz not null default now(), unique(entity_type,entity_id,revision)
);
create table public.audit_events(
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id), action text not null,
 entity_type text not null, entity_id uuid,
 outcome text not null check(outcome in ('success','denied','error')),
 details jsonb not null default '{}'::jsonb,
 happened_at timestamptz not null default now()
);
create table public.data_conflicts(
 id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id),
 entity_type text not null, entity_id uuid not null, conflict_type text not null,
 description text, status text not null default 'open'
 check(status in ('open','investigating','resolved','dismissed')),
 created_at timestamptz not null default now()
);
create table public.conflict_resolutions(
 id uuid primary key default gen_random_uuid(),
 conflict_id uuid not null references public.data_conflicts(id),
 outcome text not null check(outcome in ('corrected','not_an_error','insufficient_evidence','merged')),
 rationale text not null, reviewer_id uuid not null references auth.users(id),
 source_id uuid references public.sources(id), decided_at timestamptz not null default now()
);
-- Append-only guard for normal application writes; database owners can still alter triggers.
create function public.prevent_revision_mutations() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'Append-only table cannot be updated or deleted'; end; $$;
create trigger protect_revisions before update or delete on public.record_revisions
for each row execute function public.prevent_revision_mutations();
create trigger protect_audit_events before update or delete on public.audit_events
for each row execute function public.prevent_revision_mutations();
do $$
declare t text;
begin
 foreach t in array array[
 'person_names','person_name_parts','ancestral_roots','person_identifiers','person_birth_records',
 'marriage_history','child_care_records','person_education','person_employment','places','place_aliases',
 'person_residences','historical_settlements','family_migrations','family_delegations','guardian_permissions',
 'genealogists','verification_tasks','expert_opinions','notifications','notification_preferences',
 'family_statistics','statistics_snapshots','record_revisions','audit_events','data_conflicts','conflict_resolutions']
 loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;
revoke all on sequence public.record_revisions_id_seq from anon,authenticated;
revoke all on sequence public.audit_events_id_seq from anon,authenticated;
revoke execute on function public.prevent_revision_mutations() from public,anon,authenticated;
