-- V8: fine-grained permission governance, workflow rules, and observability.
-- Depends on all V1-V7 migrations. Execute only after staging validation.
-- This migration NEVER grants browser access to the new tables.
-- No user, role or permission assignment is created automatically.

-- A role may inherit selected permissions from a parent role.
create table public.role_inheritance (
 id uuid primary key default gen_random_uuid(),
 child_role_id uuid not null references public.custom_roles(id) on delete restrict,
 parent_role_id uuid not null references public.custom_roles(id) on delete restrict,
 inheritance_mode text not null default 'allow_only'
   check(inheritance_mode in ('allow_only','allow_and_deny')),
 enabled boolean not null default false,
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 unique(child_role_id,parent_role_id),
 check(child_role_id<>parent_role_id)
);
-- IMPORTANT: no role may inherit system-level rights from a broader domain.
-- Runtime resolver must intersect permissions, scopes, field restrictions, and audiences.

create or replace function public.validate_role_inheritance()
returns trigger language plpgsql set search_path=public as $$
declare child_row record; parent_row record; cyc boolean;
declare ordered_scopes text[]:=array['self','dependent','family','unit','tribe','system'];
begin
 perform pg_catalog.pg_advisory_xact_lock(723145, 8);
 select tribe_id,max_scope into child_row from public.custom_roles where id=new.child_role_id;
 select tribe_id,max_scope into parent_row from public.custom_roles where id=new.parent_role_id;
 if child_row.tribe_id is distinct from parent_row.tribe_id then
    raise exception 'Inheritance requires the same role tribe scope';
 end if;
 if array_position(ordered_scopes,parent_row.max_scope) >
    array_position(ordered_scopes,child_row.max_scope) then
    raise exception 'Cannot inherit from a role with wider scope';
 end if;
 with recursive chain(id,path) as (
   select new.parent_role_id, array[new.parent_role_id]
   union all
   select ri.parent_role_id,c.path||ri.parent_role_id
   from chain c join public.role_inheritance ri on ri.child_role_id=c.id
   where ri.id<>new.id and not ri.parent_role_id=any(c.path)
 ) select exists(select 1 from chain where id=new.child_role_id) into cyc;
 if cyc then raise exception 'Role inheritance cycle detected'; end if;
 return new;
end $$;
create trigger role_inheritance_validation before insert or update
 on public.role_inheritance for each row execute function public.validate_role_inheritance();

-- User exceptions must be explicitly approved and short-lived.
create table public.permission_overrides (
 id uuid primary key default gen_random_uuid(),
 subject_user_id uuid not null references auth.users(id),
 permission_id uuid not null references public.permission_catalog(id),
 effect text not null check(effect in ('allow','deny')),
 scope_type text not null check(scope_type in ('self','dependent','family','unit','tribe')),
 target_person_id uuid references public.people(id),
 target_unit_id uuid references public.lineage_units(id),
 target_tribe_id uuid references public.tribes(id),
 justification text not null,
 requested_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 starts_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check(expires_at>starts_at),
 check(
 (scope_type in ('self','dependent') and target_person_id is not null and target_unit_id is null and target_tribe_id is null)
 or (scope_type in ('family','unit') and target_unit_id is not null and target_person_id is null and target_tribe_id is null)
 or (scope_type='tribe' and target_tribe_id is not null and target_person_id is null and target_unit_id is null)
 )
);
create index on public.permission_overrides(subject_user_id,expires_at) where revoked_at is null;
-- ALLOW overrides cannot bypass base scope, confidential-field visibility,
-- approvals, or the assigner's effective rights. DENY wins.

create table public.scope_boundaries (
 id uuid primary key default gen_random_uuid(),
 role_id uuid not null references public.custom_roles(id),
 scoped_unit_id uuid references public.lineage_units(id),
 scoped_tribe_id uuid references public.tribes(id),
 include_descendants boolean not null default false,
 excluded_unit_id uuid references public.lineage_units(id),
 boundary_mode text not null default 'restrict'
   check(boundary_mode in ('restrict','exclude')),
 approved_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 check((scoped_unit_id is not null) <> (scoped_tribe_id is not null))
);
create index on public.scope_boundaries(role_id);

-- Administrators configure workflows; applying a change must use a server transaction.
create table public.approval_workflows (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid references public.tribes(id),
 workflow_key text not null,
 name_ar text not null,
 entity_type text not null,
 event_type text not null,
 version integer not null default 1 check(version>0),
 status text not null default 'draft'
   check(status in ('draft','active','retired')),
 created_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tribe_id,workflow_key,version)
);
create unique index global_approval_workflow_key
 on public.approval_workflows(workflow_key,version) where tribe_id is null;
create table public.approval_workflow_steps (
 id uuid primary key default gen_random_uuid(),
 workflow_id uuid not null references public.approval_workflows(id),
 step_order integer not null check(step_order>0),
 title_ar text not null,
 required_role_id uuid references public.custom_roles(id),
 required_permission_id uuid references public.permission_catalog(id),
 minimum_approvers integer not null default 1 check(minimum_approvers between 1 and 10),
 require_distinct_from_requester boolean not null default true,
 timeout_hours integer check(timeout_hours>0),
 unique(workflow_id,step_order),
 check(required_role_id is not null or required_permission_id is not null)
);
create table public.approval_workflow_instances (
 id uuid primary key default gen_random_uuid(),
 workflow_id uuid not null references public.approval_workflows(id),
 change_request_id uuid references public.change_requests(id),
 permissions_request_id uuid references public.permission_change_requests(id),
 initiator_user_id uuid not null references auth.users(id),
 state text not null default 'pending'
 check(state in ('pending','in_review','approved','rejected','cancelled','applied')),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 check((change_request_id is not null) <> (permissions_request_id is not null))
);
create table public.approval_workflow_decisions (
 id uuid primary key default gen_random_uuid(),
 instance_id uuid not null references public.approval_workflow_instances(id),
 step_id uuid not null references public.approval_workflow_steps(id),
 actor_user_id uuid not null references auth.users(id),
 verdict text not null check(verdict in ('approve','reject','needs_evidence')),
 notes text,
 decided_at timestamptz not null default now(),
 unique(instance_id,step_id,actor_user_id)
);
-- Approval backend must verify step belongs to instance workflow, reviewer rights,
-- required distinct approvers and immutable workflow version during review.

create table public.temporary_delegations (
 id uuid primary key default gen_random_uuid(),
 from_assignment_id uuid not null references public.user_custom_role_assignments(id),
 delegate_user_id uuid not null references auth.users(id),
 permission_ids uuid[] not null,
 scope_type text not null check(scope_type in ('self','dependent','family','unit','tribe')),
 approved_by uuid references auth.users(id),
 reason text not null,
 starts_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 check(expires_at>starts_at),
 check(expires_at<=starts_at+interval '30 days'),
 check(cardinality(permission_ids)>0)
);
create index on public.temporary_delegations(delegate_user_id,expires_at) where revoked_at is null;
-- Runtime MUST verify every delegated capability is an effective subset of source
-- assignment, the source remains active, no administrative/grant capabilities,
-- and delegate cannot redelegate. Defaults to zero capability until approved.

create table public.automation_rules (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid references public.tribes(id),
 rule_key text not null,
 name_ar text not null,
 trigger_event text not null check(trigger_event in
 ('birth.approved','death.approved','branch.changed','grant.expired','verification.rejected')),
 action_type text not null check(action_type in
 ('recalculate_kinship','send_notification','review_delegations','recalculate_scopes','queue_review')),
 config jsonb not null default '{}'::jsonb,
 enabled boolean not null default false,
 approved_by uuid references auth.users(id),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tribe_id,rule_key)
);
create unique index global_automation_rule_key on public.automation_rules(rule_key) where tribe_id is null;
create table public.automation_executions (
 id uuid primary key default gen_random_uuid(),
 rule_id uuid not null references public.automation_rules(id),
 event_id uuid not null,
 idempotency_key text not null,
 status text not null default 'queued'
   check(status in ('queued','running','succeeded','failed','cancelled')),
 attempt_count integer not null default 0 check(attempt_count>=0),
 last_error_code text,
 started_at timestamptz,
 finished_at timestamptz,
 created_at timestamptz not null default now(),
 unique(rule_id,idempotency_key)
);
create index on public.automation_executions(status,created_at);
-- Rule execution is never raw SQL/javascript from config. Workers use allowlisted handlers.

create table public.security_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 auth_session_id uuid,
 device_label text,
 approximate_location text,
 last_seen_at timestamptz,
 started_at timestamptz not null default now(),
 revoked_at timestamptz,
 expires_at timestamptz
);
create index on public.security_sessions(user_id,started_at desc);
-- Session revocation must also be enforced against auth.sessions/token refresh.

create table public.permission_simulations (
 id uuid primary key default gen_random_uuid(),
 performed_by uuid not null references auth.users(id),
 subject_user_id uuid not null references auth.users(id),
 permission_id uuid not null references public.permission_catalog(id),
 target_person_id uuid references public.people(id),
 target_unit_id uuid references public.lineage_units(id),
 simulated_result text not null check(simulated_result in ('allow','deny','needs_approval')),
 explanation_code text not null,
 policy_version text not null,
 created_at timestamptz not null default now(),
 check(target_person_id is not null or target_unit_id is not null)
);
-- Simulation writes MUST NOT apply access changes or reveal hidden target details.

create table public.administrative_tenures (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 assignment_id uuid references public.user_custom_role_assignments(id),
 role_name_snapshot text not null,
 scope_snapshot jsonb not null default '{}'::jsonb,
 appointed_by uuid references auth.users(id),
 revoked_by uuid references auth.users(id),
 begins_at timestamptz not null,
 ends_at timestamptz,
 reason text,
 created_at timestamptz not null default now(),
 check(ends_at is null or ends_at>=begins_at)
);
create index on public.administrative_tenures(user_id,begins_at desc);

create table public.record_quality_reviews (
 id uuid primary key default gen_random_uuid(),
 person_id uuid references public.people(id),
 lineage_unit_id uuid references public.lineage_units(id),
 reviewer_user_id uuid references auth.users(id),
 quality_state text not null
   check(quality_state in ('incomplete','needs_evidence','unverified','disputed','verified')),
 completeness_score integer check(completeness_score between 0 and 100),
 review_notes text,
 source_id uuid references public.sources(id),
 reviewed_at timestamptz not null default now(),
 check((person_id is not null) <> (lineage_unit_id is not null))
);
create index on public.record_quality_reviews(person_id,reviewed_at desc);
create index on public.record_quality_reviews(lineage_unit_id,reviewed_at desc);

-- New capabilities for configurable actions and fields; catalog entries alone
-- do not create working API endpoints or access to sensitive fields.
insert into public.permission_catalog(permission_key,module_key,display_name_ar,risk_level)
values
 ('person.delete','people','حذف سجل الفرد وفق سياسة الاحتفاظ','critical'),
 ('person.export','people','تصدير معلومات الأفراد','critical'),
 ('person.edit','people','طلب تعديل بيانات فرد','sensitive'),
 ('identity.read','identity','عرض الهوية بعد تحقق الغرض','critical'),
 ('identity.edit','identity','تغيير بيانات الهوية بعد مراجعة','critical'),
 ('lineage.edit_ancestor','lineage','طلب تعديل اسم الجد','critical'),
 ('approval.configure','approval','إدارة مسارات الموافقات','critical'),
 ('approval.review','approval','مراجعة مراحل الموافقة','sensitive'),
 ('delegations.create','delegations','طلب تفويض مؤقت','sensitive'),
 ('automation.configure','automation','إدارة القواعد الآلية','critical'),
 ('sessions.read_own','security','عرض جلسات حسابه','normal'),
 ('sessions.revoke_own','security','إنهاء جلساته الخاصة','normal'),
 ('permissions.simulate','security','محاكاة الصلاحيات','critical'),
 ('quality.review','quality','تقييم جودة سجلات النسب','sensitive')
on conflict (permission_key) do nothing;

-- Append-only journal protection for regular user/app roles.
create trigger protect_automation_executions_history before delete on public.automation_executions
 for each row execute function public.prevent_revision_mutations();
create trigger protect_simulation_history before update or delete on public.permission_simulations
 for each row execute function public.prevent_revision_mutations();

do $$
declare tbl text;
begin
 foreach tbl in array array[
 'role_inheritance','permission_overrides','scope_boundaries',
 'approval_workflows','approval_workflow_steps',
 'approval_workflow_instances','approval_workflow_decisions',
 'temporary_delegations','automation_rules','automation_executions',
 'security_sessions','permission_simulations','administrative_tenures','record_quality_reviews'
 ] loop
   execute format('alter table public.%I enable row level security',tbl);
   execute format('revoke all on public.%I from anon,authenticated',tbl);
 end loop;
end $$;
revoke execute on function public.validate_role_inheritance() from public,anon,authenticated;
-- Deliberately no blanket role or RLS grants. Authorization is server-side and deny-by-default.
