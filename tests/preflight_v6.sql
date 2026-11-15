-- Read-only checks before V6 migration
-- Result sets should normally be empty; investigate every violation before deployment.
select p.id person_id,p.father_id from public.people p
where p.father_id is not null
and not exists (select 1 from public.parentage_assertions a
where a.child_id=p.id and a.parent_id=p.father_id and a.parent_role='father' and a.status='approved');
select p.id person_id,p.mother_id from public.people p
where p.mother_id is not null
and not exists (select 1 from public.parentage_assertions a
where a.child_id=p.id and a.parent_id=p.mother_id and a.parent_role='mother' and a.status='approved');
select a.user_id,a.person_id account_person, u.person_id profile_person
from public.member_login_accounts a join public.user_profiles u on u.user_id=a.user_id
where u.person_id is not null and u.person_id<>a.person_id;
select group_id,person_id,membership_kind,count(*) from public.family_group_members
where status='approved' and from_date is null and to_date is null
group by group_id,person_id,membership_kind having count(*)>1;
