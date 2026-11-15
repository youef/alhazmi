-- V8 safe structural checks; run on isolated staging after V1-V8.
do $$
declare t text;
begin
 foreach t in array array[
 'role_inheritance','permission_overrides','scope_boundaries',
 'approval_workflows','approval_workflow_steps','approval_workflow_instances',
 'approval_workflow_decisions','temporary_delegations','automation_rules',
 'automation_executions','security_sessions','permission_simulations',
 'administrative_tenures','record_quality_reviews'
 ] loop
 if to_regclass('public.'||t) is null then raise exception 'Missing table %',t; end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname=t and c.relrowsecurity) then
  raise exception 'RLS missing for %',t; end if;
 if has_table_privilege('anon','public.'||t,'select') or has_table_privilege('authenticated','public.'||t,'select')
 then raise exception 'Unexpected client select grant on %',t; end if;
 end loop;
 raise notice 'V8 structural RLS smoke check passed';
end $$;
-- Additional backend tests (not included in database-only schema):
-- 1. role A -> B -> A inheritance rejected
-- 2. parent broader than child scope rejected
-- 3. cross-tribe role inheritance rejected
-- 4. deny overrides inherited allow
-- 5. allow override cannot grant new rights
-- 6. delegated permission not in source denied
-- 7. expired/revoked delegation denied
-- 8. impersonating family moderator across units denied
-- 9. originator cannot self-approve
-- 10. manager cannot view identity.read or person.export without separate grant
-- 11. workflow steps cannot be approved in another workflow instance
-- 12. automation event idempotency prevents duplicate running
