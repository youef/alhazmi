-- Verified kinship derivation (includes married children and grandchildren, up to 12 generations).
-- Security invoker; function execute is denied to public clients.

create or replace function public.diwan_family_kinship(p_person_id uuid)
returns table(related_person_id uuid, relation_kind text, generation integer)
language sql stable security invoker set search_path=public as $$
with recursive descendants(person_id,generation,path) as (
 select p.id,1,array[p_person_id,p.id]::uuid[] from public.people p
 where (p.father_id=p_person_id or p.mother_id=p_person_id) and p.id<>p_person_id and p.record_status='verified'
 union all
 select p.id,d.generation+1,d.path||p.id from descendants d join public.people p
 on (p.father_id=d.person_id or p.mother_id=d.person_id)
 where d.generation<12 and not p.id=any(d.path) and p.record_status='verified'
), anchor as(select * from public.people where id=p_person_id and record_status='verified'),
direct as(
 select father_id id,'father'::text kind,-1 gen from anchor where father_id is not null
 union all select mother_id,'mother',-1 from anchor where mother_id is not null
 union all select d.person_id,case when d.generation=1 then 'child' else 'grandchild_or_descendant' end,d.generation from descendants d
 union all select case when m.partner_a_id=p_person_id then m.partner_b_id else m.partner_a_id end,'spouse',0
 from public.marriages m where m.status='current' and p_person_id in(m.partner_a_id,m.partner_b_id)
 union all
 select gp.id,case when gp.id=father.father_id then 'paternal_grandfather' else 'paternal_grandmother' end,-2
 from anchor a join public.people father on father.id=a.father_id join public.people gp on gp.id in (father.father_id,father.mother_id)
 union all
 select gp.id,case when gp.id=mother.father_id then 'maternal_grandfather' else 'maternal_grandmother' end,-2
 from anchor a join public.people mother on mother.id=a.mother_id join public.people gp on gp.id in (mother.father_id,mother.mother_id)
 union all
 select relative.id,case when relative.gender='male' then 'paternal_uncle' else 'paternal_aunt' end,-1
 from anchor a join public.people parent on parent.id=a.father_id join public.people relative on relative.id<>parent.id
 and ((parent.father_id is not null and relative.father_id=parent.father_id)
 or (parent.mother_id is not null and relative.mother_id=parent.mother_id))
 where relative.gender in ('male','female')
 union all
 select relative.id,case when relative.gender='male' then 'maternal_uncle' else 'maternal_aunt' end,-1
 from anchor a join public.people parent on parent.id=a.mother_id join public.people relative on relative.id<>parent.id
 and ((parent.father_id is not null and relative.father_id=parent.father_id)
 or (parent.mother_id is not null and relative.mother_id=parent.mother_id))
 where relative.gender in ('male','female')
)
select distinct d.id,d.kind,d.gen from direct d
join public.people p on p.id=d.id
where p.record_status='verified' and d.id<>p_person_id
$$;

revoke all on function public.diwan_family_kinship(uuid) from public,anon,authenticated;

comment on function public.diwan_family_kinship(uuid) is 'Derives verified family connections (including married adult descendants) from approved parent pointers and current marriages, without implying access to private data.';
