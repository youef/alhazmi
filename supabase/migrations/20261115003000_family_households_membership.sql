-- Tribal registry V3: households, memberships, privacy, lineage continuity.
-- Requires V1 + V2 migrations. No real individuals seeded.
create extension if not exists pgcrypto;

-- Persistent internal identifiers remain stable across name/family changes.
create sequence if not exists public.member_card_counter as bigint;
revoke all on sequence public.member_card_counter from public, anon, authenticated;
create table public.person_registry_ids (
 person_id uuid primary key references public.people(id) on delete restrict,
 registry_uuid uuid not null unique default gen_random_uuid(),
 member_number bigint not null unique default nextval('public.member_card_counter'),
 created_at timestamptz not null default now(),
 retired_at timestamptz,
 check (member_number > 0)
);
-- ID remains attached to a person and is not recycled. No national ID stored here.

create table public.membership_cards (
 id uuid primary key default gen_random_uuid(),
 person_id uuid not null references public.person_registry_ids(person_id),
 version integer not null default 1 check(version>0),
 card_status text not null default 'draft'
  check(card_status in ('draft','active','suspended','revoked','expired')),
 issued_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
 public_token_hash bytea unique,
 display_scope text not null default 'minimal'
  check(display_scope in ('minimal','consented_profile')),
 issued_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(person_id,version),
 check(expires_at is null or issued_at is null or expires_at>issued_at),
 check(public_token_hash is null or octet_length(public_token_hash)=32)
);
create unique index membership_only_one_active on public.membership_cards(person_id)
 where card_status='active' and revoked_at is null;
-- Generate unpredictable QR token on trusted backend, store hash only,
-- verify token expiry/revocation and consent on each request.

-- Family households are social/residential units, NOT genealogical ancestry.
create table public.family_households (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 family_unit_id uuid references public.lineage_units(id),
 household_code text, household_name text,
 kind text not null default 'residential'
  check(kind in ('residential','marital','historical','care')),
 start_on date, end_on date,
 state text not null default 'active'
  check(state in ('draft','active','historical','closed','disputed')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 check(end_on is null or start_on is null or end_on>=start_on),
 unique(tribe_id,household_code)
);
create index on public.family_households(tribe_id,family_unit_id);

create table public.household_members (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.family_households(id),
 person_id uuid not null references public.people(id),
 member_role text not null check(member_role in
 ('adult','child','guardian','dependent','caregiver','other')),
 starts_on date, ends_on date,
 verified_request_id uuid references public.change_requests(id),
 status text not null default 'proposed'
  check(status in ('proposed','approved','disputed','superseded')),
 created_at timestamptz not null default now(),
 check(ends_on is null or starts_on is null or ends_on>=starts_on)
);
create index on public.household_members(person_id,household_id);
-- Multi-household participation can be legitimate. Do not enforce one household globally.
-- No inferred mother/father from co-residence, marriage, or step-parent status.

-- Versions of identity references; no raw IDs in audit trail.
create table public.person_identifiers_history (
 id bigint generated always as identity primary key,
 identifier_id uuid not null references public.person_identifiers(id),
 person_id uuid not null references public.people(id),
 previous_status text, new_status text not null,
 change_reason text not null, verified_by uuid references auth.users(id),
 change_request_id uuid references public.change_requests(id),
 changed_at timestamptz not null default now()
);
create index on public.person_identifiers_history(identifier_id,changed_at desc);

-- Family membership changes are approved historical assertions, not physical migrations.
create table public.family_branch_transfers (
 id uuid primary key default gen_random_uuid(),
 person_id uuid references public.people(id),
 household_id uuid references public.family_households(id),
 previous_unit_id uuid not null references public.lineage_units(id),
 new_unit_id uuid not null references public.lineage_units(id),
 effective_on date, reason text not null,
 approval_request_id uuid not null references public.change_requests(id),
 review_status text not null default 'proposed'
  check(review_status in ('proposed','approved','rejected','disputed')),
 source_id uuid references public.sources(id),
 created_at timestamptz not null default now(),
 check(previous_unit_id<>new_unit_id),
 check((person_id is not null) <> (household_id is not null))
);

-- Consent explicitly governs fields and audiences, not merely generic "public".
create table public.privacy_consents (
 id uuid primary key default gen_random_uuid(),
 subject_person_id uuid not null references public.people(id),
 granted_by_user_id uuid not null references auth.users(id),
 lawful_authority_note text,
 purpose text not null, audience text not null
  check(audience in ('self','family','tribe_members','public')),
 allowed_fields text[] not null,
 accepted_at timestamptz not null default now(),
 expires_at timestamptz, withdrawn_at timestamptz,
 evidence_source_id uuid references public.sources(id),
 check(cardinality(allowed_fields)>0),
 check(expires_at is null or expires_at>accepted_at)
);
create index on public.privacy_consents(subject_person_id,audience);
-- For minors require checked guardian authority, not simply any parent-child assertion.

create table public.data_access_grants (
 id uuid primary key default gen_random_uuid(),
 grantee_user_id uuid not null references auth.users(id),
 subject_person_id uuid references public.people(id),
 scoped_unit_id uuid references public.lineage_units(id),
 access_purpose text not null,
 allowed_fields text[] not null,
 allowed_operations text[] not null default array['read']::text[],
 valid_from timestamptz not null default now(),
 expires_at timestamptz not null,
 granted_by uuid not null references auth.users(id),
 revoked_at timestamptz,
 justification text not null,
 created_at timestamptz not null default now(),
 check((subject_person_id is not null) <> (scoped_unit_id is not null)),
 check(expires_at>valid_from),
 check(cardinality(allowed_fields)>0),
 check(cardinality(allowed_operations)>0)
);
create index on public.data_access_grants(grantee_user_id,expires_at) where revoked_at is null;
-- This table is not itself authorization. Backend/RLS must evaluate restrictions.

create table public.document_access_logs (
 id bigint generated always as identity primary key,
 viewer_user_id uuid references auth.users(id),
 document_id uuid not null references public.archive_items(id),
 purpose text not null,
 access_result text not null check(access_result in ('allowed','denied','error')),
 request_correlation_id uuid,
 accessed_at timestamptz not null default now()
);
create index on public.document_access_logs(document_id,accessed_at desc);

create table public.person_record_claims (
 id uuid primary key default gen_random_uuid(),
 claimant_user_id uuid not null references auth.users(id),
 person_id uuid not null references public.people(id),
 status text not null default 'submitted'
  check(status in ('submitted','review','needs_evidence','approved','rejected','withdrawn')),
 evidence_source_id uuid references public.sources(id),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, created_at timestamptz not null default now()
);
create unique index person_one_active_claim on public.person_record_claims(claimant_user_id,person_id)
 where status in ('submitted','review','needs_evidence');

create table public.family_timeline (
 id uuid primary key default gen_random_uuid(),
 family_unit_id uuid not null references public.lineage_units(id),
 person_id uuid references public.people(id),
 related_event_id uuid references public.person_events(id),
 event_kind text not null,
 occurred_on date, date_precision text not null default 'unknown'
  check(date_precision in ('day','month','year','estimated','unknown')),
 description text,
 source_id uuid references public.sources(id),
 approved_request_id uuid references public.change_requests(id),
 review_status text not null default 'pending'
  check(review_status in ('pending','approved','disputed','rejected')),
 recorded_at timestamptz not null default now()
);
create index on public.family_timeline(family_unit_id,occurred_on);

-- Cache must not contain private names, national IDs, addresses or unseen kinship paths.
-- Cache results must be keyed by authorization scope and invalidated after any graph/privacy change.
create table public.relationship_paths_cache (
 id uuid primary key default gen_random_uuid(),
 person_a_id uuid not null references public.people(id),
 person_b_id uuid not null references public.people(id),
 authorization_scope_hash bytea not null check(octet_length(authorization_scope_hash)=32),
 graph_revision bigint not null check(graph_revision>=0),
 path_person_ids uuid[] not null,
 relation_code text, calculated_at timestamptz not null default now(),
 expires_at timestamptz not null,
 unique(person_a_id,person_b_id,authorization_scope_hash,graph_revision)
);
create index on public.relationship_paths_cache(expires_at);

create table public.kinship_calculation_logs (
 id bigint generated always as identity primary key,
 requester_user_id uuid references auth.users(id),
 calculation_id uuid not null default gen_random_uuid(),
 request_purpose text not null,
 result_type text not null check(result_type in ('found','not_found','restricted','error')),
 relation_depth integer,
 graph_revision bigint, created_at timestamptz not null default now()
);
-- No person IDs, lineage paths or full names in kinship calculation logs.

create table public.deceased_record_workflows (
 id uuid primary key default gen_random_uuid(),
 person_id uuid not null references public.people(id),
 death_event_id uuid references public.person_events(id),
 source_id uuid references public.sources(id),
 requested_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id),
 approved_request_id uuid references public.change_requests(id),
 status text not null default 'submitted'
  check(status in ('submitted','under_review','needs_evidence','approved','rejected','cancelled')),
 effective_on date, review_note text, created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index on public.deceased_record_workflows(person_id,status);
create table public.deceased_delegation_reviews (
 id uuid primary key default gen_random_uuid(),
 workflow_id uuid not null references public.deceased_record_workflows(id),
 old_delegation_id uuid references public.care_delegations(id),
 old_family_grant_id uuid references public.family_delegations(id),
 decision text not null check(decision in ('revoke','retain_with_basis','seek_new_authority')),
 legal_basis_note text, reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 check((old_delegation_id is not null) <> (old_family_grant_id is not null))
);
-- Death approval triggers review of grants; do not automatically delegate to oldest son.

-- Historical name form equivalences and documented spelling variants.
create table public.person_name_variants (
 id uuid primary key default gen_random_uuid(),
 name_id uuid not null references public.person_names(id) on delete cascade,
 variant_text text not null,
 variant_kind text not null check(variant_kind in ('spelling','dialect','transliteration','historical','clerical')),
 source_id uuid references public.sources(id),
 verified_status text not null default 'pending'
  check(verified_status in ('pending','verified','disputed')),
 created_at timestamptz not null default now(),
 unique(name_id,variant_text)
);

-- Append-only table enforcement for typical application operations.
create trigger protect_identifier_history before update or delete on public.person_identifiers_history
 for each row execute function public.prevent_revision_mutations();
create trigger protect_document_access_logs before update or delete on public.document_access_logs
 for each row execute function public.prevent_revision_mutations();
create trigger protect_kinship_calculation_logs before update or delete on public.kinship_calculation_logs
 for each row execute function public.prevent_revision_mutations();

do $$
declare t text;
begin
 foreach t in array array[
 'person_registry_ids','membership_cards','family_households','household_members',
 'person_identifiers_history','family_branch_transfers','privacy_consents',
 'data_access_grants','document_access_logs','person_record_claims','family_timeline',
 'relationship_paths_cache','kinship_calculation_logs','deceased_record_workflows',
 'deceased_delegation_reviews','person_name_variants']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
revoke all on sequence public.person_identifiers_history_id_seq from anon,authenticated;
revoke all on sequence public.document_access_logs_id_seq from anon,authenticated;
revoke all on sequence public.kinship_calculation_logs_id_seq from anon,authenticated;
-- No client-access policies until scope-, purpose-, and field-level authorization is implemented.
