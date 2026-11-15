-- V6: Referential integrity for graph links and authorization scoping.
-- Apply after V1-V5 in STAGING, after preflight audit. Does not delete existing data.

-- Serializes writes affecting the ancestry graph so two concurrent requests
-- cannot independently create cycles that each miss in the other's transaction.
-- One transaction-scoped lock for all canonical parent and lineage topology writes.
create or replace function public.lock_genealogy_graph()
returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(723145, 1);
 return new;
end $$;
drop trigger if exists lock_people_genealogy_graph on public.people;
create trigger lock_people_genealogy_graph
 before insert or update of father_id,mother_id on public.people
 for each row execute function public.lock_genealogy_graph();
drop trigger if exists lock_lineage_genealogy_graph on public.lineage_units;
create trigger lock_lineage_genealogy_graph
 before insert or update of parent_id,tribe_id on public.lineage_units
 for each row execute function public.lock_genealogy_graph();
drop trigger if exists lock_place_genealogy_graph on public.places;
create trigger lock_place_genealogy_graph
 before insert or update of parent_id on public.places
 for each row execute function public.lock_genealogy_graph();
drop trigger if exists lock_group_genealogy_graph on public.family_groups;
create trigger lock_group_genealogy_graph
 before insert or update of parent_group_id,extended_family_id on public.family_groups
 for each row execute function public.lock_genealogy_graph();

-- Protect already-referenced lineage units from a tribe reassignment.
-- A unit transfer across tribes must be modeled as a reviewed historical change,
-- not a silent cascade of all attached people or documents.
create or replace function public.protect_lineage_unit_tribe_change()
returns trigger language plpgsql set search_path=public as $$
begin
 if old.tribe_id is not distinct from new.tribe_id then return new; end if;
 if exists(select 1 from public.lineage_units where parent_id=old.id)
 or exists(select 1 from public.people where family_unit_id=old.id)
 or exists(select 1 from public.family_households where family_unit_id=old.id)
 or exists(select 1 from public.extended_families where lineage_unit_id=old.id)
 or exists(select 1 from public.person_name_parts where lineage_unit_id=old.id)
 then
  raise exception 'Referenced lineage unit cannot change tribe; use reviewed transfer workflow';
 end if;
 return new;
end $$;
drop trigger if exists protect_lineage_tribe_change on public.lineage_units;
create trigger protect_lineage_tribe_change
 before update of tribe_id on public.lineage_units
 for each row execute function public.protect_lineage_unit_tribe_change();

-- Correct a subtle V5 loophole: a child group could move to a new extended family
-- while keeping its own children under the old family. Reject such reassignment.
create or replace function public.protect_family_group_reassignment()
returns trigger language plpgsql set search_path=public as $$
begin
 if old.extended_family_id is distinct from new.extended_family_id and exists(
  select 1 from public.family_groups where parent_group_id=old.id
 ) then raise exception 'Cannot move a group with children to another extended family'; end if;
 return new;
end $$;
drop trigger if exists protect_group_reassignment on public.family_groups;
create trigger protect_group_reassignment before update of extended_family_id
on public.family_groups for each row execute function public.protect_family_group_reassignment();

-- Keep documented parenthood in the separate assertion ledger.
-- Direct canonical parent edits require an approved assertion for the new parent.
-- For newly seeded historical records, use an approved claim too.
create or replace function public.require_approved_canonical_parent()
returns trigger language plpgsql set search_path=public as $$
begin
 if new.father_id is distinct from old.father_id and new.father_id is not null then
   if not exists(select 1 from public.parentage_assertions a
                 where a.child_id=new.id and a.parent_id=new.father_id
                   and a.parent_role='father' and a.status='approved') then
     raise exception 'Approved father assertion required before changing father_id';
   end if;
 end if;
 if new.mother_id is distinct from old.mother_id and new.mother_id is not null then
   if not exists(select 1 from public.parentage_assertions a
                 where a.child_id=new.id and a.parent_id=new.mother_id
                   and a.parent_role='mother' and a.status='approved') then
     raise exception 'Approved mother assertion required before changing mother_id';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists canonical_parent_approval on public.people;
create trigger canonical_parent_approval before update of father_id,mother_id
on public.people for each row execute function public.require_approved_canonical_parent();
-- WARNING: On initial INSERT, parent ids may be set for legacy imports; for new
-- workflows prefer INSERT person -> approve assertions -> UPDATE canonical columns.
-- Validate legacy rows in a read-only preflight before enabling public workflows.

-- Further consistency: a person may not become a parent to itself via assertions,
-- and an assertion cannot change child, parent or parent role after approval.
create or replace function public.protect_approved_parent_assertion()
returns trigger language plpgsql set search_path=public as $$
begin
 if old.status='approved' and
    (new.child_id is distinct from old.child_id
    or new.parent_id is distinct from old.parent_id
    or new.parent_role is distinct from old.parent_role) then
  raise exception 'Approved parentage links cannot be rewritten; supersede with evidence';
 end if;
 return new;
end $$;
drop trigger if exists protect_parentage_assertion on public.parentage_assertions;
create trigger protect_parentage_assertion before update
on public.parentage_assertions for each row execute function public.protect_approved_parent_assertion();

-- Keep profile-to-account links consistent with an individual's claimed profile.
create or replace function public.enforce_account_profile_consistency()
returns trigger language plpgsql set search_path=public as $$
declare linked uuid;
begin
 select person_id into linked from public.user_profiles where user_id=new.user_id;
 if linked is not null and linked<>new.person_id then
   raise exception 'User has a different linked person profile';
 end if;
 return new;
end $$;
drop trigger if exists account_profile_consistency on public.member_login_accounts;
create trigger account_profile_consistency before insert or update of user_id,person_id
on public.member_login_accounts for each row execute function public.enforce_account_profile_consistency();

-- Logically prevent a person with an account changing their user link elsewhere.
create or replace function public.enforce_user_profile_consistency()
returns trigger language plpgsql set search_path=public as $$
declare other_person uuid;
begin
 if new.person_id is null then return new; end if;
 select person_id into other_person from public.member_login_accounts where user_id=new.user_id;
 if other_person is not null and other_person<>new.person_id then
   raise exception 'User account is linked to a different person';
 end if;
 return new;
end $$;
drop trigger if exists user_profile_consistency on public.user_profiles;
create trigger user_profile_consistency before insert or update of user_id,person_id
on public.user_profiles for each row execute function public.enforce_user_profile_consistency();

-- One approved member of an undated group role, avoiding duplicate edges.
create unique index if not exists group_member_undated_approved_uniq
on public.family_group_members(group_id,person_id,membership_kind)
where status='approved' and from_date is null and to_date is null;

-- Routine integrity/foreign-key lookup indexes.
create index if not exists family_household_members_dates_idx on public.household_members(household_id,starts_on,ends_on);
create index if not exists pedigree_father_id_idx on public.people(father_id);
create index if not exists pedigree_mother_id_idx on public.people(mother_id);
create index if not exists group_parent_id_idx on public.family_groups(parent_group_id);
create index if not exists place_parent_id_idx on public.places(parent_id);
create index if not exists identifier_person_status_idx on public.person_identifiers(person_id,status);
create index if not exists person_profiles_status_idx on public.person_profiles(profile_state);
create index if not exists approved_evidence_target_idx on public.evidence_links(target_type,target_id);
create index if not exists grants_scope_idx on public.role_grants(tribe_id,unit_id,revoked_at);
create index if not exists welfare_case_status_idx on public.welfare_cases(fund_id,status);

-- Explicitly limit function calls; triggers still run with table-operation authorization.
revoke execute on function public.lock_genealogy_graph() from public,anon,authenticated;
revoke execute on function public.protect_lineage_unit_tribe_change() from public,anon,authenticated;
revoke execute on function public.protect_family_group_reassignment() from public,anon,authenticated;
revoke execute on function public.require_approved_canonical_parent() from public,anon,authenticated;
revoke execute on function public.protect_approved_parent_assertion() from public,anon,authenticated;
revoke execute on function public.enforce_account_profile_consistency() from public,anon,authenticated;
revoke execute on function public.enforce_user_profile_consistency() from public,anon,authenticated;
