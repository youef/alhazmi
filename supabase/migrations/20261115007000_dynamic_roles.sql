-- V7: extensible, scoped roles and permissions.
-- Apply after V1-V6 in staging; never run untested SQL on a production database.
-- Existing role_grants are preserved for backwards compatibility; there are NO automatic
-- grants or broad access policies from this migration.

create table public.permission_catalog (
 id uuid primary key default gen_random_uuid(),
 permission_key text not null unique
   check(permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,3}$'),
 module_key text not null,
 display_name_ar text not null,
 description_ar text,
 risk_level text not null default 'normal'
   check(risk_level in ('normal','sensitive','critical')),
 is_active boolean not null default true,
 is_assignable boolean not null default true,
 created_at timestamptz not null default now()
);
comment on table public.permission_catalog is 'Permissions must be enforced by backend/RLS; adding a catalog row alone grants no capability.';

create table public.custom_roles (
 id uuid primary key default gen_random_uuid(),
 tribe_id uuid references public.tribes(id),
 role_key text not null check(role_key ~ '^[a-z][a-z0-9_-]{1,63}$'),
 name_ar text not null check(length(btrim(name_ar)) between 2 and 100),
 description_ar text,
 is_system boolean not null default false,
 role_state text not null default 'draft'
   check(role_state in ('draft','active','disabled','archived')),
 max_scope text not null default 'self'
   check(max_scope in ('self','dependent','family','unit','tribe','system')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index custom_roles_global_key
 on public.custom_roles(role_key) where tribe_id is null;
create unique index custom_roles_tribe_key
 on public.custom_roles(tribe_id,role_key) where tribe_id is not null;
create index custom_roles_tribe_state on public.custom_roles(tribe_id,role_state);

create table public.custom_role_permissions (
 role_id uuid not null references public.custom_roles(id) on delete restrict,
 permission_id uuid not null references public.permission_catalog(id) on delete restrict,
 decision text not null default 'allow' check(decision in ('allow','deny')),
 created_by uuid references auth.users(id),
 granted_at timestamptz not null default now(),
 primary key(role_id,permission_id)
);
-- Explicit deny wins when combining multiple role assignments.

create table public.user_custom_role_assignments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 role_id uuid not null references public.custom_roles(id) on delete restrict,
 scope_type text not null check(scope_type in ('self','dependent','family','unit','tribe','system')),
 scope_person_id uuid references public.people(id),
 scope_unit_id uuid references public.lineage_units(id),
 scope_tribe_id uuid references public.tribes(id),
 starts_at timestamptz not null default now(),
 expires_at timestamptz,
 revoked_at timestamptz,
 assigned_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 reason text,
 created_at timestamptz not null default now(),
 check(expires_at is null or expires_at>starts_at),
 check(
   (scope_type in ('self','dependent') and scope_person_id is not null
     and scope_unit_id is null and scope_tribe_id is null)
   or (scope_type in ('family','unit') and scope_unit_id is not null
     and scope_person_id is null and scope_tribe_id is null)
   or (scope_type='tribe' and scope_tribe_id is not null
     and scope_person_id is null and scope_unit_id is null)
   or (scope_type='system' and scope_person_id is null
     and scope_unit_id is null and scope_tribe_id is null)
 )
);
create index on public.user_custom_role_assignments(user_id,revoked_at,expires_at);
create index on public.user_custom_role_assignments(role_id,scope_type);

create table public.permission_change_requests (
 id uuid primary key default gen_random_uuid(),
 requested_by uuid not null references auth.users(id),
 role_id uuid references public.custom_roles(id),
 assignment_id uuid references public.user_custom_role_assignments(id),
 change_kind text not null check(change_kind in
 ('role_create','role_update','permission_change','assignment_create','assignment_revoke')),
 proposed_change jsonb not null,
 justification text not null,
 status text not null default 'pending'
   check(status in ('pending','reviewing','approved','rejected','cancelled','applied')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 applied_at timestamptz,
 created_at timestamptz not null default now(),
 check(role_id is not null or assignment_id is not null or change_kind='role_create')
);
create index on public.permission_change_requests(status,created_at);

create table public.permission_audit_events (
 id bigint generated always as identity primary key,
 actor_user_id uuid references auth.users(id),
 event_type text not null,
 target_role_id uuid,
 target_assignment_id uuid,
 target_user_id uuid,
 request_id uuid references public.permission_change_requests(id),
 outcome text not null check(outcome in ('success','denied','failed')),
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index on public.permission_audit_events(created_at desc);

-- Assignments must fit the role's configured scope and tribe.
-- No user-editable metadata can establish authorization.
create or replace function public.validate_custom_role_assignment()
returns trigger language plpgsql set search_path=public as $$
declare r record; linked_tribe uuid; self_person uuid; allowed text[];
begin
 select tribe_id,role_state,max_scope into r from public.custom_roles where id=new.role_id;
 if not found or r.role_state<>'active' then
   raise exception 'Role must be active';
 end if;
 allowed := case r.max_scope
  when 'self' then array['self']
  when 'dependent' then array['self','dependent']
  when 'family' then array['self','dependent','family']
  when 'unit' then array['self','dependent','family','unit']
  when 'tribe' then array['self','dependent','family','unit','tribe']
  else array['self','dependent','family','unit','tribe','system'] end;
 if not (new.scope_type=any(allowed)) then
   raise exception 'Assigned scope is wider than the role allows';
 end if;
 if new.scope_type='system' and r.tribe_id is not null then
   raise exception 'Tribe-specific role cannot be assigned system-wide';
 end if;
 if new.scope_person_id is not null then
   select tribe_id into linked_tribe from public.people where id=new.scope_person_id;
 elsif new.scope_unit_id is not null then
   select tribe_id into linked_tribe from public.lineage_units where id=new.scope_unit_id;
 elsif new.scope_tribe_id is not null then
   linked_tribe := new.scope_tribe_id;
 end if;
 if r.tribe_id is not null and linked_tribe is distinct from r.tribe_id then
   raise exception 'Assignment scope is outside role tribe';
 end if;
 if new.scope_type='self' then
   select person_id into self_person from public.user_profiles where user_id=new.user_id;
   if self_person is distinct from new.scope_person_id then
     raise exception 'Self scope must reference the assigned user''s verified person';
   end if;
 end if;
 if new.scope_type='dependent' then
   if not exists(
     select 1 from public.care_delegations d
     where d.guardian_user_id=new.user_id and d.dependent_person_id=new.scope_person_id
       and d.approved_at is not null and d.revoked_at is null
       and (d.expires_at is null or d.expires_at>now())
   ) then raise exception 'Dependent scope requires current approved delegation'; end if;
 end if;
 return new;
end $$;
create trigger validate_custom_assignment
 before insert or update of user_id,role_id,scope_type,scope_person_id,scope_unit_id,scope_tribe_id
 on public.user_custom_role_assignments
 for each row execute function public.validate_custom_role_assignment();

-- Role scope cannot silently expand after assignments have been approved.
create or replace function public.prevent_role_scope_expansion()
returns trigger language plpgsql set search_path=public as $$
declare ranks text[]:=array['self','dependent','family','unit','tribe','system'];
begin
 if old.is_system and
  (new.tribe_id is distinct from old.tribe_id
    or new.role_key is distinct from old.role_key) then
   raise exception 'Protected system role identity cannot change';
 end if;
 if array_position(ranks,new.max_scope)>array_position(ranks,old.max_scope)
 and exists(select 1 from public.user_custom_role_assignments a
            where a.role_id=old.id and a.revoked_at is null) then
    raise exception 'Cannot expand assigned role scope without review/regrant';
 end if;
 return new;
end $$;
create trigger prevent_custom_role_scope_expansion
 before update on public.custom_roles
 for each row execute function public.prevent_role_scope_expansion();

-- Audit records are append-only for ordinary application transactions.
create trigger protect_permission_audit
 before update or delete on public.permission_audit_events
 for each row execute function public.prevent_revision_mutations();

-- Catalog only: application endpoints must implement checks for these capabilities.
-- More capabilities can be added later without changing the roles schema.
insert into public.permission_catalog
 (permission_key,module_key,display_name_ar,risk_level)
values
 ('profile.read_own','profile','عرض الملف الشخصي','normal'),
 ('profile.edit_own','profile','تعديل الملف الشخصي','normal'),
 ('family.read','family','عرض أفراد العائلة المصرح بهم','sensitive'),
 ('family.manage','family','إدارة سجلات الأسرة','critical'),
 ('person.create','people','اقتراح إضافة فرد','normal'),
 ('person.review','people','مراجعة بيانات فرد','sensitive'),
 ('lineage.read','lineage','عرض شجرة النسب المصرح بها','normal'),
 ('lineage.propose','lineage','اقتراح تصحيح النسب','sensitive'),
 ('lineage.approve','lineage','اعتماد تصحيح النسب','critical'),
 ('documents.read','documents','قراءة الوثائق المسموحة','sensitive'),
 ('documents.manage','documents','إدارة وثائق العائلة','critical'),
 ('welfare.read','welfare','عرض سجل التكافل المسموح','sensitive'),
 ('welfare.approve','welfare','اعتماد مساعدات التكافل','critical'),
 ('accounts.invite','accounts','طلب تفعيل حساب فرد','sensitive'),
 ('roles.view','roles','عرض الأدوار والصلاحيات','sensitive'),
 ('roles.manage','roles','إنشاء وتعديل الأدوار','critical'),
 ('roles.assign','roles','إسناد الصلاحيات للمستخدمين','critical'),
 ('audit.read','audit','قراءة سجلات التدقيق','critical')
on conflict (permission_key) do nothing;

do $$
declare t text;
begin
 foreach t in array array[
 'permission_catalog','custom_roles','custom_role_permissions',
 'user_custom_role_assignments','permission_change_requests','permission_audit_events']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
revoke all on sequence public.permission_audit_events_id_seq from anon,authenticated;
revoke execute on function public.validate_custom_role_assignment() from public,anon,authenticated;
revoke execute on function public.prevent_role_scope_expansion() from public,anon,authenticated;
-- Intentionally NO policies for general authenticated/anon access:
-- privileged API transactions must verify permission, record scope, status, consent,
-- approval, request purpose, and no privilege escalation before any operation.
