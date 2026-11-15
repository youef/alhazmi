-- V4: extended families, generation indexes, delegated account provisioning.
-- After migrations 00000 / 01000 / 02000 / 03000. No personal seed data.
-- All new public tables deny client access by default.
create table public.extended_families (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 root_person_id uuid not null references public.people(id),
 lineage_unit_id uuid references public.lineage_units(id),
 label text not null, description text,
 status text not null default 'draft' check(status in ('draft','approved','disputed','archived')),
 approved_request_id uuid references public.change_requests(id),
 created_at timestamptz not null default now()
);
create index on public.extended_families(tribe_id,root_person_id);

create table public.family_groups (
 id uuid primary key default gen_random_uuid(),
 extended_family_id uuid not null references public.extended_families(id),
 group_type text not null check(group_type in ('descendants','marital_household','branch','care','custom')),
 group_name text not null, parent_group_id uuid references public.family_groups(id),
 marriage_id uuid references public.marriages(id),
 household_id uuid references public.family_households(id),
 start_on date, end_on date,
 check(id is distinct from parent_group_id),
 check(end_on is null or start_on is null or end_on>=start_on)
);
create index on public.family_groups(extended_family_id,parent_group_id);
create table public.family_group_members (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.family_groups(id),
 person_id uuid not null references public.people(id),
 membership_kind text not null check(membership_kind in ('descendant','spouse','child','caregiver','other')),
 from_date date, to_date date,
 source_id uuid references public.sources(id),
 status text not null default 'pending' check(status in ('pending','approved','disputed','ended')),
 check(to_date is null or from_date is null or to_date>=from_date)
);
create index on public.family_group_members(person_id,group_id);

-- History is append-only; current membership is derived from approved claims.
create table public.family_membership_history (
 id bigint generated always as identity primary key,
 person_id uuid not null references public.people(id),
 previous_unit_id uuid references public.lineage_units(id),
 new_unit_id uuid references public.lineage_units(id),
 change_kind text not null check(change_kind in ('initial','correction','transfer','reversal')),
 effective_on date, source_id uuid references public.sources(id),
 approved_request_id uuid references public.change_requests(id),
 recorded_by uuid references auth.users(id),
 recorded_at timestamptz not null default now(),
 check(previous_unit_id is distinct from new_unit_id)
);
create index on public.family_membership_history(person_id,recorded_at desc);

-- Tree generation number is relative to a specified founder, not an absolute property.
create table public.ancestral_generation_index (
 root_person_id uuid not null references public.people(id),
 descendant_person_id uuid not null references public.people(id),
 generation_depth integer not null check(generation_depth>=0),
 relationship_path uuid[] not null,
 graph_revision bigint not null check(graph_revision>=0),
 computed_at timestamptz not null default now(),
 primary key(root_person_id,descendant_person_id,graph_revision)
);
create index on public.ancestral_generation_index(descendant_person_id,root_person_id);
create table public.generation_levels (
 root_person_id uuid not null references public.people(id),
 graph_revision bigint not null check(graph_revision>=0),
 generation_depth integer not null check(generation_depth>=0),
 person_count bigint not null check(person_count>=0),
 counted_at timestamptz not null default now(),
 primary key(root_person_id,graph_revision,generation_depth)
);
create table public.lineage_statistics (
 root_person_id uuid not null references public.people(id),
 graph_revision bigint not null check(graph_revision>=0),
 direct_sons_count integer not null default 0 check(direct_sons_count>=0),
 direct_daughters_count integer not null default 0 check(direct_daughters_count>=0),
 descendants_count integer not null default 0 check(descendants_count>=0),
 generations_count integer not null default 0 check(generations_count>=0),
 computed_at timestamptz not null default now(),
 primary key(root_person_id,graph_revision)
);
-- Population totals are internal: API must suppress small cohorts and enforce access scope.

create table public.household_guardianship_history (
 id bigint generated always as identity primary key,
 child_person_id uuid not null references public.people(id),
 guardian_person_id uuid not null references public.people(id),
 household_id uuid references public.family_households(id),
 care_record_id uuid references public.child_care_records(id),
 change_kind text not null check(change_kind in ('appointed','renewed','limited','ended','revoked')),
 effective_from date, effective_to date,
 approved_request_id uuid references public.change_requests(id),
 source_id uuid references public.sources(id),
 recorded_at timestamptz not null default now(),
 check(child_person_id<>guardian_person_id)
);
create index on public.household_guardianship_history(child_person_id,recorded_at desc);

create table public.record_access_purposes (
 code text primary key,
 label_ar text not null,
 requires_elevated_approval boolean not null default false,
 retention_days integer not null check(retention_days>=1),
 is_active boolean not null default true
);
-- Do not add universal client read privileges just because a purpose code is valid.
create table public.family_document_collections (
 id uuid primary key default gen_random_uuid(),
 family_unit_id uuid not null references public.lineage_units(id),
 title text not null,
 description text,
 visibility text not null default 'private' check(visibility in ('private','reviewers','approved_family')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.family_document_collection_items (
 collection_id uuid not null references public.family_document_collections(id),
 archive_item_id uuid not null references public.archive_items(id),
 added_by uuid references auth.users(id), added_at timestamptz not null default now(),
 primary key(collection_id,archive_item_id)
);
create table public.user_security_events (
 id bigint generated always as identity primary key,
 user_id uuid references auth.users(id), event_code text not null,
 outcome text not null check(outcome in ('success','denied','failed')),
 ip_digest text, correlation_id uuid,
 created_at timestamptz not null default now()
);
create index on public.user_security_events(user_id,created_at desc);
create table public.data_retention_policies (
 id uuid primary key default gen_random_uuid(),
 data_category text not null unique, retention_days integer not null check(retention_days>=1),
 justification text not null, disposition text not null
 check(disposition in ('delete','anonymize','archive_restricted','review')),
 approved_by uuid references auth.users(id), effective_on date, updated_at timestamptz not null default now()
);

-- One private profile per individual, including those with no account.
create table public.person_profiles (
 person_id uuid primary key references public.people(id),
 preferred_name_id uuid references public.person_names(id),
 summary text, photo_archive_id uuid references public.archive_items(id),
 profile_state text not null default 'draft' check(profile_state in ('draft','approved','restricted','archived')),
 discoverability text not null default 'private' check(discoverability in ('private','family','members','public_consented')),
 updated_at timestamptz not null default now()
);

-- Requested login name or ID must not be a public lookup endpoint.
-- The normalized identity HMAC already exists in person_identifiers, NEVER store plaintext here.
create table public.member_login_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 person_id uuid not null unique references public.people(id),
 login_handle text unique,
 account_state text not null default 'pending'
  check(account_state in ('pending','activation_required','active','locked','suspended')),
 is_minor_at_activation boolean, activated_at timestamptz,
 password_change_required boolean not null default true,
 created_at timestamptz not null default now(),
 check(login_handle is null or (length(login_handle) between 3 and 64 and login_handle ~ '^[a-zA-Z0-9._-]+$'))
);
-- Age 15+ is an APPLICATION POLICY configured in the provisioning workflow.
-- For a verified exact birth date, age is checked at provisioning time.
-- For unknown/estimated birth dates, manual identity and age verification is mandatory.
-- Date of birth itself is not enough proof of identity or legal guardian authority.

create table public.member_account_issuance_requests (
 id uuid primary key default gen_random_uuid(),
 person_id uuid not null references public.people(id),
 requested_by uuid not null references auth.users(id),
 authority_delegation_id uuid references public.care_delegations(id),
 status text not null default 'submitted'
 check(status in ('submitted','identity_review','age_review','guardian_review','approved','rejected','cancelled','fulfilled')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, approved_at timestamptz, fulfilled_at timestamptz,
 rejection_reason text, expires_at timestamptz,
 created_at timestamptz not null default now()
);
create index on public.member_account_issuance_requests(person_id,status);

-- Only hash the high-entropy one-time code. Never store plaintext credentials.
create table public.member_activation_challenges (
 id uuid primary key default gen_random_uuid(),
 issuance_request_id uuid not null references public.member_account_issuance_requests(id),
 person_id uuid not null references public.people(id),
 token_hash bytea not null unique check(octet_length(token_hash)=32),
 token_kind text not null check(token_kind in ('initial_activation','credential_reset')),
 issued_by uuid not null references auth.users(id),
 expires_at timestamptz not null, used_at timestamptz, revoked_at timestamptz,
 failed_attempts integer not null default 0 check(failed_attempts>=0),
 created_at timestamptz not null default now(),
 check(expires_at>created_at)
);
create index on public.member_activation_challenges(person_id,expires_at);
-- Issuer (e.g. verified father/guardian) may deliver one-time activation code,
-- but must never view or reset the final password directly.
-- Reset requires independent owner verification and session revocation.
-- All passwords reside in Supabase Auth, never in these application tables.

create table public.member_credential_actions (
 id bigint generated always as identity primary key,
 target_person_id uuid not null references public.people(id),
 actor_user_id uuid references auth.users(id),
 action_code text not null check(action_code in ('issue_activation','reset_requested','reset_approved','password_changed','access_locked','session_revoked')),
 outcome text not null check(outcome in ('success','denied','failed')),
 created_at timestamptz not null default now()
);

-- Block ordinary history mutations; strong integrity also requires offsite append-only logs.
create trigger family_membership_history_append_only before update or delete on public.family_membership_history
 for each row execute function public.prevent_revision_mutations();
create trigger household_guardianship_history_append_only before update or delete on public.household_guardianship_history
 for each row execute function public.prevent_revision_mutations();
create trigger user_security_events_append_only before update or delete on public.user_security_events
 for each row execute function public.prevent_revision_mutations();
create trigger credential_actions_append_only before update or delete on public.member_credential_actions
 for each row execute function public.prevent_revision_mutations();

do $$
declare t text;
begin
 foreach t in array array[
 'extended_families','family_groups','family_group_members','family_membership_history',
 'ancestral_generation_index','generation_levels','lineage_statistics',
 'household_guardianship_history','record_access_purposes','family_document_collections',
 'family_document_collection_items','user_security_events','data_retention_policies',
 'person_profiles','member_login_accounts','member_account_issuance_requests',
 'member_activation_challenges','member_credential_actions']
 loop
  execute format('alter table public.%I enable row level security', t);
  execute format('revoke all on public.%I from anon, authenticated', t);
 end loop;
end $$;
revoke all on sequence public.family_membership_history_id_seq from anon, authenticated;
revoke all on sequence public.household_guardianship_history_id_seq from anon, authenticated;
revoke all on sequence public.user_security_events_id_seq from anon, authenticated;
revoke all on sequence public.member_credential_actions_id_seq from anon, authenticated;
-- No permissive browser RLS policies. Build/test scoped auth endpoints before launch.
