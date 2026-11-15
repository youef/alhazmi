-- PRE-FLIGHT DIAGNOSTICS: read-only queries before applying V5 integrity hardening.
-- Run on staging after V1-V4 migration. Each result should be reviewed.
-- These queries do NOT mutate data or declare that source documents are true.

-- 1. People assigned to a family unit of another tribe.
select 'person_wrong_tribe_family' issue, p.id entity_id, p.tribe_id actual_tribe, u.tribe_id linked_tribe
from public.people p join public.lineage_units u on u.id=p.family_unit_id
where p.tribe_id is distinct from u.tribe_id;

-- 2. Lineage branch parent from another tribe.
select 'branch_parent_scope' issue, child.id entity_id, child.tribe_id actual_tribe, parent.tribe_id linked_tribe
from public.lineage_units child join public.lineage_units parent on parent.id=child.parent_id
where child.tribe_id is distinct from parent.tribe_id;

-- 3. Cycles in lineage-unit graph.
with recursive ancestry(start_id, ancestor_id, path, cyclic) as (
 select id,id,array[id],false from public.lineage_units
 union all
 select a.start_id,p.id,a.path||p.id,p.id=any(a.path)
 from ancestry a join public.lineage_units c on c.id=a.ancestor_id
 join public.lineage_units p on p.id=c.parent_id
 where not a.cyclic
)
select distinct 'branch_cycle' issue,start_id entity_id from ancestry where cyclic;

-- 4. People with one parent assigned in both canonical columns.
select 'same_parent_twice' issue,id entity_id
from public.people where father_id=mother_id and father_id is not null;

-- 5. Approved duplicated biological parent assertions.
select 'duplicate_approved_parent' issue,child_id entity_id,parent_role,count(*) duplicates
from public.parentage_assertions
where status='approved' and parent_role in ('father','mother')
group by child_id,parent_role having count(*)>1;

-- 6. Concurrent account requests that would violate the new guard.
select 'multiple_pending_account_requests' issue,person_id entity_id,count(*) pending_count
from public.member_account_issuance_requests
where status in ('submitted','identity_review','age_review','guardian_review','approved')
group by person_id having count(*)>1;

-- 7. Repeated undated memberships with same role in one household.
select 'duplicate_undated_membership' issue,person_id entity_id,household_id,member_role,count(*) duplicates
from public.household_members
where status='approved' and starts_on is null and ends_on is null
group by person_id,household_id,member_role having count(*)>1;

-- 8. Extended family root or lineage unit outside the chosen tribe.
select 'extended_family_root_scope' issue,e.id entity_id,e.tribe_id actual_tribe,p.tribe_id linked_tribe
from public.extended_families e join public.people p on p.id=e.root_person_id
where e.tribe_id is distinct from p.tribe_id;
select 'extended_family_unit_scope' issue,e.id entity_id,e.tribe_id actual_tribe,u.tribe_id linked_tribe
from public.extended_families e join public.lineage_units u on u.id=e.lineage_unit_id
where e.tribe_id is distinct from u.tribe_id;

-- 9. Household's family unit outside its own tribe.
select 'household_wrong_unit_scope' issue,h.id entity_id,h.tribe_id actual_tribe,u.tribe_id linked_tribe
from public.family_households h join public.lineage_units u on u.id=h.family_unit_id
where h.tribe_id is distinct from u.tribe_id;

-- 10. Family group linked to a parent group from another extended family.
select 'cross_family_group' issue,g.id entity_id
from public.family_groups g join public.family_groups parent on parent.id=g.parent_group_id
where parent.extended_family_id is distinct from g.extended_family_id;

-- 11. Person name linked to lineage unit from another tribe.
select 'person_name_unit_wrong_tribe' issue,p.id entity_id
from public.person_name_parts n
join public.person_names pn on pn.id=n.name_id
join public.people p on p.id=pn.person_id
join public.lineage_units u on u.id=n.lineage_unit_id
where p.tribe_id is distinct from u.tribe_id;

-- 12. Security: verify RLS enabled on all exposed public base tables.
select 'rls_missing' issue,c.oid::regclass entity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity;

-- 13. Overly broad client table grants (must be reviewed together with policies).
select table_name,grantee,privilege_type
from information_schema.table_privileges
where table_schema='public' and grantee in ('anon','authenticated')
order by table_name,grantee,privilege_type;
