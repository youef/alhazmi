-- V9: member self-service, configurable forms, scoped family spaces and oversight.
-- Prerequisites: migrations V1 through V8 in timestamp order.
-- This is schema only. No client grants, public RLS policies, or automatic publication.

-- Service definitions keep actionable workflows distinct from user-designed forms.
create table public.service_definitions (
 id uuid primary key default gen_random_uuid(),
 service_key text not null unique check(service_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
 title_ar text not null, description_ar text,
 required_permission_id uuid references public.permission_catalog(id),
 workflow_id uuid references public.approval_workflows(id),
 visibility text not null default 'authenticated'
 check(visibility in ('authenticated','authorized_family','admins')),
 status text not null default 'draft' check(status in ('draft','active','retired')),
 created_at timestamptz not null default now()
);
create table public.form_templates (
 id uuid primary key default gen_random_uuid(),
 service_id uuid not null references public.service_definitions(id),
 version integer not null default 1 check(version>0),
 name_ar text not null, schema_revision text,
 status text not null default 'draft' check(status in ('draft','published','retired')),
 created_by uuid references auth.users(id),
 published_by uuid references auth.users(id),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 unique(service_id,version),
 check(status <> 'published' or (published_at is not null and published_by is not null))
);
create table public.form_fields (
 id uuid primary key default gen_random_uuid(),
 template_id uuid not null references public.form_templates(id),
 field_key text not null check(field_key ~ '^[a-z][a-z0-9_]{0,63}$'),
 label_ar text not null,
 field_type text not null check(field_type in
 ('short_text','long_text','date','number','boolean','person_reference','place_reference','archive_reference','single_choice')),
 required boolean not null default false,
 is_sensitive boolean not null default false,
 choices jsonb,
 validation_rules jsonb not null default '{}'::jsonb,
 sort_order integer not null check(sort_order>0),
 unique(template_id,field_key), unique(template_id,sort_order)
);
-- Form configuration never includes SQL, HTML, executable code or arbitrary API URLs.
create table public.form_submissions (
 id uuid primary key default gen_random_uuid(),
 template_id uuid not null references public.form_templates(id),
 submitted_by uuid not null references auth.users(id),
 subject_person_id uuid references public.people(id),
 family_unit_id uuid references public.lineage_units(id),
 answers_ciphertext bytea not null,
 answers_digest bytea check(answers_digest is null or octet_length(answers_digest)=32),
 status text not null default 'draft'
 check(status in ('draft','submitted','under_review','approved','rejected','cancelled')),
 linked_change_request_id uuid references public.change_requests(id),
 submitted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index on public.form_submissions(submitted_by,created_at desc);
create index on public.form_submissions(family_unit_id,status);

-- Generic self-service case, but the canonical person changes remain in change_requests.
create table public.member_service_requests (
 id uuid primary key default gen_random_uuid(),
 service_id uuid not null references public.service_definitions(id),
 submission_id uuid references public.form_submissions(id),
 user_id uuid not null references auth.users(id),
 person_id uuid not null references public.people(id),
 tribe_id uuid not null references public.tribes(id),
 change_request_id uuid references public.change_requests(id),
 state text not null default 'draft'
 check(state in ('draft','submitted','in_review','needs_evidence','approved','rejected','cancelled','completed')),
 assigned_to uuid references auth.users(id),
 created_at timestamptz not null default now(),
 finished_at timestamptz
);
create index on public.member_service_requests(user_id,created_at desc);
create table public.self_service_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 show_family_shortcuts boolean not null default true,
 notify_request_updates boolean not null default true,
 preferred_language text not null default 'ar' check(preferred_language in ('ar','en')),
 updated_at timestamptz not null default now()
);

-- Assigned tasks are distinct from approval decisions, though both may link to a request.
create table public.work_items (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 family_unit_id uuid references public.lineage_units(id),
 change_request_id uuid references public.change_requests(id),
 service_request_id uuid references public.member_service_requests(id),
 title_ar text not null,
 task_type text not null,
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 state text not null default 'open'
 check(state in ('open','assigned','blocked','completed','cancelled')),
 due_at timestamptz,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index on public.work_items(family_unit_id,state,due_at);
create table public.task_assignments (
 id uuid primary key default gen_random_uuid(),
 work_item_id uuid not null references public.work_items(id),
 assigned_user_id uuid not null references auth.users(id),
 assigned_by uuid references auth.users(id),
 assigned_at timestamptz not null default now(),
 unassigned_at timestamptz,
 state text not null default 'active' check(state in ('active','completed','revoked')),
 check(unassigned_at is null or unassigned_at>=assigned_at)
);
create unique index task_one_active_assignee on public.task_assignments(work_item_id,assigned_user_id)
where state='active' and unassigned_at is null;

create table public.data_quality_suggestions (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 person_id uuid references public.people(id),
 lineage_unit_id uuid references public.lineage_units(id),
 suggestion_kind text not null check(suggestion_kind in
 ('possible_duplicate','parent_conflict','name_discrepancy','missing_mother','unlinked_branch','marriage_status','lineage_gap','other')),
 details_ciphertext bytea,
 confidence_score numeric(5,4) check(confidence_score between 0 and 1),
 source_id uuid references public.sources(id),
 state text not null default 'suggested'
 check(state in ('suggested','investigating','dismissed','accepted_for_review','resolved')),
 reviewed_by uuid references auth.users(id),
 linked_change_request_id uuid references public.change_requests(id),
 detected_at timestamptz not null default now(),
 check(person_id is not null or lineage_unit_id is not null)
);
create index on public.data_quality_suggestions(tribe_id,state,detected_at);
-- Suggestions NEVER auto-modify canonical genealogy.

-- Shared kinship results are scoped caches, not public family relationship disclosures.
create table public.shared_kinship_results (
 id uuid primary key default gen_random_uuid(),
 person_a_id uuid not null references public.people(id),
 person_b_id uuid not null references public.people(id),
 authorization_scope_hash bytea not null check(octet_length(authorization_scope_hash)=32),
 graph_revision bigint not null check(graph_revision>=0),
 result_ciphertext bytea not null,
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 check(person_a_id<>person_b_id),
 unique(person_a_id,person_b_id,authorization_scope_hash,graph_revision)
);
create index on public.shared_kinship_results(expires_at);

-- The archive item remains canonical; this records verification.
create table public.document_verifications (
 id uuid primary key default gen_random_uuid(),
 archive_item_id uuid not null references public.archive_items(id),
 reviewed_by uuid not null references auth.users(id),
 outcome text not null check(outcome in ('verified','rejected','requires_evidence','disputed')),
 evidence_source_id uuid references public.sources(id),
 review_request_id uuid references public.change_requests(id),
 note text,
 reviewed_at timestamptz not null default now()
);
create index on public.document_verifications(archive_item_id,reviewed_at desc);

-- Changing lineage structure requires an approved workflow, keeps historical origin.
create table public.lineage_structure_changes (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 lineage_unit_id uuid not null references public.lineage_units(id),
 change_type text not null check(change_type in ('rename','split','merge','reparent','historical_alias')),
 previous_parent_id uuid references public.lineage_units(id),
 new_parent_id uuid references public.lineage_units(id),
 previous_name_ar text,
 new_name_ar text,
 effective_on date,
 source_id uuid references public.sources(id),
 change_request_id uuid references public.change_requests(id),
 state text not null default 'proposed' check(state in ('proposed','under_review','approved','rejected','applied')),
 requested_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 applied_at timestamptz,
 created_at timestamptz not null default now(),
 check(state not in ('approved','applied') or (change_request_id is not null and approved_by is not null and approved_at is not null)),
 check(state<>'applied' or applied_at is not null),
 check(previous_parent_id is distinct from new_parent_id or change_type<>'reparent')
);
create index on public.lineage_structure_changes(lineage_unit_id,created_at desc);

-- Privacy reviews do not overwrite legal/consent rules.
create table public.privacy_access_reviews (
 id uuid primary key default gen_random_uuid(),
 subject_person_id uuid not null references public.people(id),
 requested_by uuid not null references auth.users(id),
 review_type text not null check(review_type in ('visibility','consent','grant','disclosure','complaint')),
 target_grant_id uuid references public.data_access_grants(id),
 state text not null default 'submitted' check(state in ('submitted','review','approved','rejected','withdrawn')),
 reason text not null, reviewer_id uuid references auth.users(id),
 reviewer_note text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index on public.privacy_access_reviews(subject_person_id,created_at desc);

-- Backup metadata, NOT backups themselves; never put actual personal-data dumps in git.
create table public.backup_runs (
 id uuid primary key default gen_random_uuid(),
 backup_kind text not null check(backup_kind in ('database','files','combined')),
 storage_reference text not null,
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 result text not null default 'running' check(result in ('running','success','failure')),
 size_bytes bigint check(size_bytes is null or size_bytes>=0),
 checksum_sha256 text,
 error_code text
);
create table public.restore_tests (
 id uuid primary key default gen_random_uuid(),
 backup_run_id uuid not null references public.backup_runs(id),
 executed_by uuid references auth.users(id),
 test_environment text not null,
 result text not null check(result in ('passed','failed','partial')),
 verification_summary text,
 tested_at timestamptz not null default now()
);
create index on public.restore_tests(backup_run_id,tested_at desc);

-- Private family microsite, kept distinct from genealogy membership.
create table public.family_spaces (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid not null references public.tribes(id),
 family_unit_id uuid not null references public.lineage_units(id),
 name_ar text not null,
 visibility text not null default 'private' check(visibility in ('private','approved_family')),
 status text not null default 'draft' check(status in ('draft','active','suspended','archived')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index on public.family_spaces(family_unit_id,status);
create table public.family_space_members (
 id uuid primary key default gen_random_uuid(),
 space_id uuid not null references public.family_spaces(id),
 user_id uuid not null references auth.users(id),
 membership_role text not null default 'member' check(membership_role in ('member','moderator','owner')),
 status text not null default 'invited' check(status in ('invited','active','suspended','left')),
 approved_by uuid references auth.users(id),
 joined_at timestamptz,
 created_at timestamptz not null default now(),
 unique(space_id,user_id)
);
create index on public.family_space_members(user_id,status);

-- Database-level scope checks (authorization is separate and more restrictive).
create or replace function public.check_v9_family_scope()
returns trigger language plpgsql set search_path=public as $$
declare actual_tribe uuid;
begin
 if tg_table_name='family_spaces' then
   select tribe_id into actual_tribe from public.lineage_units where id=new.family_unit_id;
 elsif tg_table_name='work_items' and new.family_unit_id is not null then
   select tribe_id into actual_tribe from public.lineage_units where id=new.family_unit_id;
 else
   return new;
 end if;
 if actual_tribe is distinct from new.tribe_id then
   raise exception 'Family unit and tribe must match';
 end if;
 return new;
end $$;
create trigger family_space_tribe_guard before insert or update of tribe_id,family_unit_id
 on public.family_spaces for each row execute function public.check_v9_family_scope();
create trigger work_item_tribe_guard before insert or update of tribe_id,family_unit_id
 on public.work_items for each row execute function public.check_v9_family_scope();

-- Add workflow capabilities; the application's backend must implement each operation.
insert into public.permission_catalog(permission_key,module_key,display_name_ar,risk_level)
values
 ('selfservice.read_own','selfservice','عرض خدماتي وطلباتي','normal'),
 ('selfservice.submit','selfservice','تقديم طلباتي','normal'),
 ('selfservice.correct_profile','selfservice','طلب تصحيح ملفي','sensitive'),
 ('forms.configure','forms','تصميم ونشر النماذج','critical'),
 ('forms.submit','forms','تقديم نموذج خدمة','normal'),
 ('tasks.assign','tasks','تعيين المهام للعاملين','sensitive'),
 ('tasks.manage','tasks','إدارة قائمة أعمال العائلة','sensitive'),
 ('quality.suggest','quality','إنشاء اقتراح جودة','normal'),
 ('documents.verify','documents','التحقق من الوثائق','critical'),
 ('lineage.structure_propose','lineage','طلب تغيير الفرع','critical'),
 ('lineage.structure_apply','lineage','اعتماد وتنفيذ تغيير الفروع','critical'),
 ('privacy.review_access','privacy','مراجعة وصول البيانات','critical'),
 ('family_space.manage','family_space','إدارة المساحة العائلية','sensitive'),
 ('family_space.read','family_space','عرض المساحة العائلية','normal'),
 ('backup.read_status','backup','عرض حالة النسخ الاحتياطي','critical')
on conflict (permission_key) do nothing;

do $$
declare t text;
begin
 foreach t in array array[
 'service_definitions','form_templates','form_fields','form_submissions',
 'member_service_requests','self_service_settings','work_items','task_assignments',
 'data_quality_suggestions','shared_kinship_results','document_verifications',
 'lineage_structure_changes','privacy_access_reviews','backup_runs','restore_tests',
 'family_spaces','family_space_members'
 ] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
revoke execute on function public.check_v9_family_scope() from public,anon,authenticated;
-- No browser-facing policy: deny by default until real authorization engine is tested.
