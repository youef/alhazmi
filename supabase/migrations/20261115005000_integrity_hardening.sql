-- Integrity hardening V5, designed for V1-V4 fresh or existing schemas.
-- IMPORTANT: backup and stage-test before applying to a populated production database.
-- No destructive table drops. No new client grants or public SELECT policies.

-- Generic tree validator; detects self/cyclic parent and cross-scope parent.
create or replace function public.enforce_lineage_unit_integrity()
returns trigger language plpgsql set search_path = public as $$
declare parent_tribe uuid; cycle_found boolean;
begin
 if new.parent_id is null then return new; end if;
 if new.id=new.parent_id then raise exception 'Lineage unit cannot be its own parent'; end if;
 select tribe_id into parent_tribe from public.lineage_units where id=new.parent_id;
 if parent_tribe is distinct from new.tribe_id then
  raise exception 'Lineage unit parent belongs to a different tribe';
 end if;
 with recursive chain(id, parent_id, path) as (
  select u.id,u.parent_id,array[u.id] from public.lineage_units u where u.id=new.parent_id
  union all
  select u.id,u.parent_id,c.path||u.id
  from chain c join public.lineage_units u on u.id=c.parent_id
  where not u.id=any(c.path)
 ) select exists(select 1 from chain where id=new.id) into cycle_found;
 if cycle_found then raise exception 'Cyclic lineage unit ancestry'; end if;
 return new;
end $$;
drop trigger if exists lineage_unit_integrity on public.lineage_units;
create trigger lineage_unit_integrity before insert or update of parent_id,tribe_id
on public.lineage_units for each row execute function public.enforce_lineage_unit_integrity();

-- Person may have parents from different tribes, but the assigned family unit
-- must belong to the person's own tribe. NEVER overwrite maternal lineage.
create or replace function public.enforce_person_family_scope()
returns trigger language plpgsql set search_path = public as $$
declare unit_tribe uuid;
begin
 if new.family_unit_id is null then return new; end if;
 select tribe_id into unit_tribe from public.lineage_units where id=new.family_unit_id;
 if unit_tribe is distinct from new.tribe_id then
   raise exception 'Assigned family unit is not in the same tribe as the person';
 end if;
 return new;
end $$;
drop trigger if exists person_family_scope on public.people;
create trigger person_family_scope before insert or update of family_unit_id,tribe_id
on public.people for each row execute function public.enforce_person_family_scope();

-- Household family unit must be in the household tribe.
create or replace function public.enforce_household_family_scope()
returns trigger language plpgsql set search_path = public as $$
declare unit_tribe uuid;
begin
 if new.family_unit_id is null then return new; end if;
 select tribe_id into unit_tribe from public.lineage_units where id=new.family_unit_id;
 if unit_tribe is distinct from new.tribe_id then
  raise exception 'Household family unit is in another tribe';
 end if;
 return new;
end $$;
drop trigger if exists household_family_scope on public.family_households;
create trigger household_family_scope before insert or update of family_unit_id,tribe_id
on public.family_households for each row execute function public.enforce_household_family_scope();

-- An extended family root and optional unit must be of the same tribe.
create or replace function public.enforce_extended_family_scope()
returns trigger language plpgsql set search_path = public as $$
declare person_tribe uuid; unit_tribe uuid;
begin
 select tribe_id into person_tribe from public.people where id=new.root_person_id;
 if person_tribe is distinct from new.tribe_id then
  raise exception 'Extended family root belongs to another tribe';
 end if;
 if new.lineage_unit_id is not null then
  select tribe_id into unit_tribe from public.lineage_units where id=new.lineage_unit_id;
  if unit_tribe is distinct from new.tribe_id then
   raise exception 'Extended family unit belongs to another tribe';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists extended_family_scope on public.extended_families;
create trigger extended_family_scope before insert or update of tribe_id,root_person_id,lineage_unit_id
on public.extended_families for each row execute function public.enforce_extended_family_scope();

-- Group hierarchy and optional linked marriage/household must not mix families.
create or replace function public.enforce_family_group_integrity()
returns trigger language plpgsql set search_path = public as $$
declare parent_family uuid; ext_tribe uuid; household_tribe uuid; cycle_found boolean;
begin
 if new.parent_group_id is not null then
   if new.id=new.parent_group_id then raise exception 'Group cannot parent itself'; end if;
   select extended_family_id into parent_family from public.family_groups where id=new.parent_group_id;
   if parent_family is distinct from new.extended_family_id then
    raise exception 'Parent group must belong to same extended family';
   end if;
   with recursive chain(id,parent_group_id,path) as (
      select g.id,g.parent_group_id,array[g.id] from public.family_groups g where g.id=new.parent_group_id
      union all
      select g.id,g.parent_group_id,c.path||g.id
      from chain c join public.family_groups g on g.id=c.parent_group_id
      where not g.id=any(c.path)
   ) select exists(select 1 from chain where id=new.id) into cycle_found;
   if cycle_found then raise exception 'Cyclic family group hierarchy'; end if;
 end if;
 if new.household_id is not null then
  select tribe_id into ext_tribe from public.extended_families where id=new.extended_family_id;
  select tribe_id into household_tribe from public.family_households where id=new.household_id;
  if ext_tribe is distinct from household_tribe then
    raise exception 'Household and extended family are from different tribes';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists family_group_integrity on public.family_groups;
create trigger family_group_integrity before insert or update of parent_group_id,extended_family_id,household_id
on public.family_groups for each row execute function public.enforce_family_group_integrity();

-- Places must form an acyclic hierarchy.
create or replace function public.enforce_place_integrity()
returns trigger language plpgsql set search_path = public as $$
declare cycle_found boolean;
begin
 if new.parent_id is null then return new; end if;
 if new.parent_id=new.id then raise exception 'Place cannot parent itself'; end if;
 with recursive chain(id,parent_id,path) as (
   select p.id,p.parent_id,array[p.id] from public.places p where p.id=new.parent_id
   union all
   select p.id,p.parent_id,c.path||p.id
   from chain c join public.places p on p.id=c.parent_id
   where not p.id=any(c.path)
 ) select exists(select 1 from chain where id=new.id) into cycle_found;
 if cycle_found then raise exception 'Cyclic place hierarchy'; end if;
 return new;
end $$;
drop trigger if exists place_integrity on public.places;
create trigger place_integrity before insert or update of parent_id
on public.places for each row execute function public.enforce_place_integrity();

-- Households can include members with different tribal roots through marriage.
-- Do NOT force every member into the same tribe.
-- Membership records must refer to valid persons and time ranges (FK/check exist).
-- Disallow approved duplicates of the SAME role for the SAME person and household
-- only when no effective dates are recorded; historical memberships are legitimate.
create unique index if not exists household_undated_approved_membership_unique
on public.household_members(household_id,person_id,member_role)
where status='approved' and starts_on is null and ends_on is null;

-- Canonical father/mother assertions may be disputed while pending, but only
-- one can be approved for a given parental role.
create unique index if not exists one_approved_parent_assertion_per_role
on public.parentage_assertions(child_id,parent_role)
where status='approved' and parent_role in ('father','mother');

-- Important: some ancestry may be contested; leave unapproved assertions intact.
-- Prevent accidental duplicate account provisioning simultaneously.
create unique index if not exists member_one_pending_issuance
on public.member_account_issuance_requests(person_id)
where status in ('submitted','identity_review','age_review','guardian_review','approved');

-- Avoid duplicate claims by multiple sources being mistaken for separate persons.
create index if not exists people_family_search_idx on public.people(tribe_id,family_unit_id,normalized_name);
create index if not exists marriages_partner_a_status_idx on public.marriages(partner_a_id,status);
create index if not exists marriages_partner_b_status_idx on public.marriages(partner_b_id,status);
create index if not exists person_events_event_type_idx on public.person_events(person_id,event_type,event_date);
create index if not exists parentage_parent_idx on public.parentage_assertions(parent_id,status);
create index if not exists name_parts_name_idx on public.person_name_parts(name_id,position);
create index if not exists household_members_household_idx on public.household_members(household_id,person_id);
create index if not exists family_group_members_group_idx on public.family_group_members(group_id,person_id);
create index if not exists access_grants_subject_idx on public.data_access_grants(subject_person_id,expires_at);
create index if not exists account_issuance_requester_idx on public.member_account_issuance_requests(requested_by,created_at desc);
create index if not exists child_care_child_idx on public.child_care_records(child_id,status);

-- Scope-aware structure of person name parts: a family/clan/tribe unit chosen
-- in their names must belong to the same tribe as the person record.
-- Do not infer a genealogical relationship merely from a name segment.
create or replace function public.enforce_name_part_unit_scope()
returns trigger language plpgsql set search_path = public as $$
declare person_tribe uuid; unit_tribe uuid;
begin
 if new.lineage_unit_id is null then return new; end if;
 select p.tribe_id into person_tribe
 from public.person_names n join public.people p on p.id=n.person_id where n.id=new.name_id;
 select tribe_id into unit_tribe from public.lineage_units where id=new.lineage_unit_id;
 if person_tribe is distinct from unit_tribe then
  raise exception 'Name unit belongs to a different tribe';
 end if;
 return new;
end $$;
drop trigger if exists name_part_scope on public.person_name_parts;
create trigger name_part_scope before insert or update of lineage_unit_id,name_id
on public.person_name_parts for each row execute function public.enforce_name_part_unit_scope();

-- Prevent accidental updates to the persistent registry number or UUID.
create or replace function public.enforce_immutable_registry_id()
returns trigger language plpgsql set search_path = public as $$
begin
 if old.person_id is distinct from new.person_id
   or old.registry_uuid is distinct from new.registry_uuid
   or old.member_number is distinct from new.member_number then
  raise exception 'Permanent registry identity cannot be modified';
 end if;
 return new;
end $$;
drop trigger if exists immutable_registry_id on public.person_registry_ids;
create trigger immutable_registry_id before update on public.person_registry_ids
for each row execute function public.enforce_immutable_registry_id();

-- Optional migration compatibility: no new table definitions overwrite old ones.
-- Restrict function execution, since only trigger invocation is intended.
revoke execute on function public.enforce_lineage_unit_integrity() from public, anon, authenticated;
revoke execute on function public.enforce_person_family_scope() from public, anon, authenticated;
revoke execute on function public.enforce_household_family_scope() from public, anon, authenticated;
revoke execute on function public.enforce_extended_family_scope() from public, anon, authenticated;
revoke execute on function public.enforce_family_group_integrity() from public, anon, authenticated;
revoke execute on function public.enforce_place_integrity() from public, anon, authenticated;
revoke execute on function public.enforce_name_part_unit_scope() from public, anon, authenticated;
revoke execute on function public.enforce_immutable_registry_id() from public, anon, authenticated;
