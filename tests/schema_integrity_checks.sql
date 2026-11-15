-- Read-only catalogue checks. Run manually on staging AFTER all migrations.
do $$
declare tab text; n int;
begin
 foreach tab in array array[
 'tribes','lineage_units','people','parentage_assertions','marriages',
 'person_identifiers','person_name_parts','family_households',
 'family_groups','family_group_members','ancestral_generation_index',
 'person_profiles','member_login_accounts','member_activation_challenges',
 'audit_log','record_revisions','user_security_events']
 loop
  if to_regclass(format('public.%I',tab)) is null then
    raise exception 'Missing expected table: %',tab;
  end if;
  if not exists(
    select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname=tab and c.relrowsecurity
  ) then raise exception 'RLS missing: %',tab; end if;
  if has_table_privilege('anon',format('public.%I',tab),'SELECT')
    or has_table_privilege('authenticated',format('public.%I',tab),'SELECT')
  then raise exception 'Unreviewed browser SELECT privilege: %',tab; end if;
 end loop;
 select count(*) into n from pg_trigger
 where tgrelid='public.lineage_units'::regclass and tgname='lineage_unit_integrity' and not tgisinternal;
 if n <> 1 then raise exception 'Lineage unit integrity trigger missing'; end if;
 select count(*) into n from pg_trigger
 where tgrelid='public.person_registry_ids'::regclass and tgname='immutable_registry_id' and not tgisinternal;
 if n <> 1 then raise exception 'Permanent ID guard missing'; end if;
 raise notice 'Registry schema checks passed';
end $$;

-- Run PRE-MIGRATION diagnostics separately if an existing DB already has data:
-- select tribe_id,parent_id,count(*) from public.lineage_units group by 1,2;
-- inspect any duplicate approved parents before creating unique index.
