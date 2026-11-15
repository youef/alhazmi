-- V9 structural smoke; run in an isolated staging PostgreSQL after V1-V9.
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
  if to_regclass(format('public.%I',t)) is null then raise exception 'Missing %',t; end if;
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname=t and c.relrowsecurity) then
   raise exception 'Missing RLS %',t; end if;
  if has_table_privilege('anon',format('public.%I',t),'select')
  or has_table_privilege('authenticated',format('public.%I',t),'select') then
    raise exception 'Unexpected browser select %',t;
  end if;
 end loop;
 raise notice 'V9 schema and baseline RLS grants check passed';
end $$;
-- Integration checks requiring backend and fixtures:
-- self-service user cannot submit on behalf of unrelated person;
-- submitted form must match published version;
-- user cannot alter hidden fields or form template in-flight;
-- correction request cannot directly edit approved genealogy;
-- cross-tribe family space rejected;
-- family space membership does not bypass individual privacy;
-- suggestions cannot auto-approve or mutate lineage;
-- backup metadata does not grant access to backup contents.
