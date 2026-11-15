-- V7 post-migration read-only smoke checks; run in private staging.
select count(*) as permission_count from public.permission_catalog;
select count(*) as defined_roles from public.custom_roles;
select count(*) as active_assignments from public.user_custom_role_assignments where revoked_at is null;
select c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
and c.relname in ('permission_catalog','custom_roles','custom_role_permissions','user_custom_role_assignments','permission_change_requests','permission_audit_events')
order by c.relname;
-- Negative integration tests:
-- unauthenticated read role assignment => deny
-- self-grant roles.manage => deny
-- supervisor of family A reads family B => deny
-- disabled role => deny
-- expired assignment => deny
-- role with explicit deny => deny
-- withdrawn care delegation => deny
-- attempt to assign system scope to tribal role => reject
