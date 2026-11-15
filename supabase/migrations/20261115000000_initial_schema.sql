-- ديوان الحازمي: initial PostgreSQL 15+ schema. Run in a private test project first.
create extension if not exists pgcrypto;

create table public.tribes (
 id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text,
 description text, logo_path text, created_at timestamptz not null default now()
);
create table public.lineage_units (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 parent_id uuid references public.lineage_units(id), unit_type text not null
   check (unit_type in ('branch','clan','subclan','family','house')),
 name_ar text not null, name_en text, normalized_name text,
 description text, created_at timestamptz not null default now(),
 unique (id, tribe_id), check(id is distinct from parent_id)
);
create index on public.lineage_units(tribe_id,parent_id);
create index on public.lineage_units(tribe_id,normalized_name);

create table public.people (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 family_unit_id uuid references public.lineage_units(id),
 given_name_ar text not null, middle_name_ar text, surname_ar text,
 full_name_ar text not null, normalized_name text,
 gender text check (gender in ('male','female','undisclosed','unknown')),
 birth_date date, birth_date_precision text default 'unknown'
   check (birth_date_precision in ('day','month','year','estimated','unknown')),
 death_date date, death_date_precision text default 'unknown'
   check (death_date_precision in ('day','month','year','estimated','unknown')),
 birth_place text, biography text, living_status text not null default 'unknown'
   check (living_status in ('alive','deceased','unknown')),
 father_id uuid references public.people(id), mother_id uuid references public.people(id),
 record_status text not null default 'draft'
   check(record_status in ('draft','under_review','verified','disputed','archived')),
 visibility text not null default 'private'
   check(visibility in ('private','approved_family','approved_members','public_biography')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (id is distinct from father_id and id is distinct from mother_id),
 check (father_id is distinct from mother_id),
 check (birth_date is null or death_date is null or birth_date <= death_date)
);
create index on public.people(tribe_id,family_unit_id);
create index on public.people(tribe_id,normalized_name);
create index on public.people(father_id);
create index on public.people(mother_id);
create index on public.people(record_status);

-- Structured links for biological/legal/adoptive/guardianship assertions; not interchangeable.
create table public.parentage_assertions (
 id uuid primary key default gen_random_uuid(), child_id uuid not null references public.people(id),
 parent_id uuid not null references public.people(id), parent_role text not null
   check(parent_role in ('father','mother','legal_parent','guardian','step_parent','foster_parent')),
 basis text not null default 'reported'
   check(basis in ('reported','documented','court_record','historical')),
 valid_from date, valid_to date, confidence text not null default 'unverified'
   check(confidence in ('unverified','reviewed','documented','disputed')),
 status text not null default 'pending' check(status in ('pending','approved','rejected','superseded')),
 created_at timestamptz not null default now(), check(child_id<>parent_id)
);
create index on public.parentage_assertions(child_id,parent_role,status);

create table public.marriages (
 id uuid primary key default gen_random_uuid(), partner_a_id uuid not null references public.people(id),
 partner_b_id uuid not null references public.people(id),
 start_date date, end_date date, end_reason text
   check (end_reason in ('divorce','death','annulment','other','unknown')),
 status text not null default 'reported' check(status in ('reported','current','ended','disputed','void')),
 notes text, created_at timestamptz not null default now(),
 check(partner_a_id<>partner_b_id),
 check(end_date is null or start_date is null or end_date>=start_date)
);
create index on public.marriages(partner_a_id);
create index on public.marriages(partner_b_id);

-- Sensitive information is deliberately separated from genealogical records.
create table public.person_private (
 person_id uuid primary key references public.people(id) on delete cascade,
 national_id_ciphertext bytea, national_id_last4 text,
 phone_ciphertext bytea, email_ciphertext bytea,
 national_address_ciphertext bytea, city text, region text, country text default 'SA',
 employment_status text check (employment_status in ('employed','self_employed','unemployed','student','retired','unknown')),
 employer_ciphertext bytea, job_title_ciphertext bytea, education_level text,
 updated_at timestamptz not null default now()
);
comment on table public.person_private is 'Application-layer encryption with managed external KMS; never store plaintext national IDs, emails, or addresses.';

create table public.user_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 person_id uuid unique references public.people(id),
 display_name text, account_status text not null default 'pending'
  check(account_status in ('pending','active','suspended')),
 created_at timestamptz not null default now()
);
create table public.role_grants (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('system_admin','tribe_admin','unit_moderator','family_moderator','genealogist','archivist','welfare_officer','member')),
 tribe_id uuid references public.tribes(id), unit_id uuid references public.lineage_units(id),
 granted_by uuid references auth.users(id), starts_at timestamptz not null default now(),
 ends_at timestamptz, revoked_at timestamptz, reason text, created_at timestamptz not null default now(),
 check (ends_at is null or ends_at>starts_at)
);
create index on public.role_grants(user_id,role) where revoked_at is null;

create table public.care_delegations (
 id uuid primary key default gen_random_uuid(),
 guardian_user_id uuid not null references auth.users(id),
 dependent_person_id uuid not null references public.people(id),
 scope text[] not null default array['request_update']::text[],
 legal_basis text, verified_by uuid references auth.users(id),
 approved_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index on public.care_delegations(guardian_user_id,dependent_person_id);

create table public.sources (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 source_type text not null check(source_type in ('oral','manuscript','book','civil_record','court','photo','other')),
 title text not null, author text, publication_year integer, archive_id text,
 source_url text, citation_text text, confidentiality text not null default 'restricted'
 check(confidentiality in ('restricted','reviewers','public')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.evidence_links (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.sources(id),
 target_type text not null check(target_type in ('person','parentage','marriage','event','biography','request')),
 target_id uuid not null, page_reference text, excerpt text,
 reviewer_notes text, added_by uuid references auth.users(id), added_at timestamptz not null default now()
);
create index on public.evidence_links(target_type,target_id);

create table public.change_requests (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 request_type text not null check(request_type in ('new_person','new_birth','death','marriage','divorce','parentage','correction','archive','biography','privacy')),
 target_person_id uuid references public.people(id), submitter_id uuid not null references auth.users(id),
 payload jsonb not null default '{}'::jsonb, justification text,
 status text not null default 'submitted'
   check(status in ('submitted','triage','needs_evidence','approved','rejected','cancelled')),
 assigned_to uuid references auth.users(id), reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz, review_notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.change_requests(tribe_id,status,created_at desc);
create table public.request_reviews (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.change_requests(id),
 reviewer_id uuid not null references auth.users(id), decision text not null
   check(decision in ('approve','reject','request_evidence','comment')),
 notes text, created_at timestamptz not null default now()
);
create table public.person_events (
 id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id),
 event_type text not null check(event_type in ('birth','death','marriage','divorce','residence','education','achievement','other')),
 event_date date, precision text not null default 'unknown'
   check(precision in ('day','month','year','estimated','unknown')),
 location_text text, description text, approved_request_id uuid references public.change_requests(id),
 status text not null default 'pending' check(status in ('pending','approved','disputed')),
 created_at timestamptz not null default now()
);
create index on public.person_events(person_id,event_date);

create table public.archive_items (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 uploader_id uuid references auth.users(id), item_type text not null
   check(item_type in ('photo','manuscript','document','audio','video','other')),
 title text not null, description text, storage_path text not null,
 mime_type text, sha256 text, photographed_on date,
 visibility text not null default 'restricted'
   check(visibility in ('restricted','reviewers','approved_members','public')),
 review_status text not null default 'pending'
   check(review_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table public.archive_people (
 archive_id uuid not null references public.archive_items(id),
 person_id uuid not null references public.people(id),
 primary key(archive_id,person_id)
);
create table public.notable_profiles (
 id uuid primary key default gen_random_uuid(), person_id uuid not null unique references public.people(id),
 biography text not null, achievement_summary text,
 consent_status text not null default 'pending'
  check(consent_status in ('pending','granted','withdrawn','historical_public_interest_review')),
 reviewed_by uuid references auth.users(id), published_at timestamptz
);

-- Welfare finances: ledger separate from the family tree; no payment-card data.
create table public.welfare_funds (
 id uuid primary key default gen_random_uuid(), tribe_id uuid not null references public.tribes(id),
 name text not null, currency char(3) not null default 'SAR',
 status text not null default 'draft' check(status in ('draft','active','paused','closed')),
 created_at timestamptz not null default now()
);
create table public.welfare_cases (
 id uuid primary key default gen_random_uuid(), fund_id uuid not null references public.welfare_funds(id),
 beneficiary_person_id uuid references public.people(id),
 case_ref text not null, purpose text not null, confidential_notes text,
 status text not null default 'submitted'
  check(status in ('submitted','review','approved','declined','paid','closed')),
 submitted_by uuid references auth.users(id), reviewed_by uuid references auth.users(id),
 created_at timestamptz not null default now(), unique(fund_id,case_ref)
);
create table public.welfare_transactions (
 id uuid primary key default gen_random_uuid(), fund_id uuid not null references public.welfare_funds(id),
 case_id uuid references public.welfare_cases(id),
 kind text not null check(kind in ('donation','disbursement','refund','adjustment')),
 amount numeric(14,2) not null check(amount>0), currency char(3) not null default 'SAR',
 external_reference text, transaction_status text not null default 'pending'
  check(transaction_status in ('pending','confirmed','reversed')),
 recorded_by uuid references auth.users(id), occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index on public.welfare_transactions(fund_id,occurred_at desc);

create table public.audit_log (
 id bigint generated always as identity primary key,
 actor_user_id uuid, actor_source text not null default 'application',
 operation text not null, entity_table text not null, entity_id uuid,
 before_data jsonb, after_data jsonb, request_id uuid, ip_hash text,
 happened_at timestamptz not null default now()
);
create index on public.audit_log(entity_table,entity_id,happened_at desc);
create index on public.audit_log(happened_at desc);

-- Prevent cycles in the two canonical parent pointers. Execution in SECURITY INVOKER context.
create function public.validate_person_parentage()
returns trigger language plpgsql set search_path = public as $$
begin
 if new.father_id = new.id or new.mother_id = new.id then
  raise exception 'A person cannot be their own parent';
 end if;
 if new.father_id is not null and exists (
   with recursive ancestors(id,path) as (
     select new.father_id, array[new.father_id]
     union all
     select p.father_id, a.path || p.father_id from ancestors a
       join public.people p on p.id=a.id
       where p.father_id is not null and not p.father_id=any(a.path)
     union all
     select p.mother_id, a.path || p.mother_id from ancestors a
       join public.people p on p.id=a.id
       where p.mother_id is not null and not p.mother_id=any(a.path)
   ) select 1 from ancestors where id=new.id
 ) then raise exception 'Parentage cycle detected'; end if;
 if new.mother_id is not null and exists (
   with recursive ancestors(id,path) as (
     select new.mother_id, array[new.mother_id]
     union all
     select p.father_id, a.path || p.father_id from ancestors a
       join public.people p on p.id=a.id
       where p.father_id is not null and not p.father_id=any(a.path)
     union all
     select p.mother_id, a.path || p.mother_id from ancestors a
       join public.people p on p.id=a.id
       where p.mother_id is not null and not p.mother_id=any(a.path)
   ) select 1 from ancestors where id=new.id
 ) then raise exception 'Parentage cycle detected'; end if;
 return new;
end; $$;
create trigger validate_people_parentage before insert or update of father_id,mother_id on public.people
 for each row execute function public.validate_person_parentage();

-- No seed persons or personal data. Approved requests must be applied only by a privileged backend transaction.