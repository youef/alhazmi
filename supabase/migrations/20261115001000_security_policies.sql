-- Secure baseline: no direct client access until authenticated, scoped RLS policies are reviewed.
-- Supabase service_role must ONLY be used on trusted servers.
do $$
declare t text;
begin
 foreach t in array array[
 'tribes','lineage_units','people','parentage_assertions','marriages','person_private',
 'user_profiles','role_grants','care_delegations','sources','evidence_links',
 'change_requests','request_reviews','person_events','archive_items','archive_people',
 'notable_profiles','welfare_funds','welfare_cases','welfare_transactions','audit_log']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
revoke all on sequence public.audit_log_id_seq from anon, authenticated;
revoke execute on function public.validate_person_parentage() from public, anon, authenticated;
-- Intentional: no broad policies. Until scoped, tested policies exist, all browser reads and writes are denied.
-- Implement access through reviewed RLS policies or trusted backend endpoints; never forward service_role to browser.
