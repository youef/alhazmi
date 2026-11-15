-- Dيوان الحازمي — Family-to-fakhth registry (source claims only, not approved genealogy)
-- Additive and repeatable; parentage remains untouched. All source claims need human review.
-- Sources: https://bnabar.com/vb/showthread.php?t=5150 and existing reviewed source rows.

create table if not exists public.lineage_fakhths (
 unit_id uuid primary key,
 tribe_id uuid not null,
 major_branch_id uuid not null,
 source_id uuid not null references public.sources(id) on delete restrict,
 raw_source_path text not null,
 review_status text not null default 'needs_review' check (review_status in ('needs_review','verified','approved','disputed','rejected')),
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(unit_id,tribe_id) references public.lineage_units(id,tribe_id) on delete restrict,
 foreign key(major_branch_id,tribe_id) references public.lineage_units(id,tribe_id) on delete restrict,
 unique(unit_id,tribe_id),
 check (unit_id<>major_branch_id),
 check (review_status not in ('verified','approved') or (verified_by is not null and verified_at is not null))
);

create table if not exists public.lineage_family_fakhth_links (
 family_unit_id uuid primary key,
 tribe_id uuid not null,
 fakhth_unit_id uuid not null,
 source_id uuid not null references public.sources(id) on delete restrict,
 raw_source_path text not null,
 review_status text not null default 'needs_review' check (review_status in ('needs_review','verified','approved','disputed','rejected')),
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 imported_at timestamptz not null default now(),
 foreign key(family_unit_id,tribe_id) references public.lineage_units(id,tribe_id) on delete restrict,
 foreign key(fakhth_unit_id,tribe_id) references public.lineage_fakhths(unit_id,tribe_id) on delete restrict,
 check (family_unit_id<>fakhth_unit_id),
 check (review_status not in ('verified','approved') or (verified_by is not null and verified_at is not null))
);

create index if not exists ix_lineage_fakhths_branch on public.lineage_fakhths(tribe_id,major_branch_id);

create index if not exists ix_lineage_family_fakhth_lookup on public.lineage_family_fakhth_links(tribe_id,fakhth_unit_id,review_status);

create or replace function public.assert_lineage_fakhth()
 returns trigger language plpgsql set search_path=public as $$
declare actual_type text;root_type text;root_parent uuid;src_tribe uuid;
begin
 select unit_type into actual_type from public.lineage_units where id=new.unit_id and tribe_id=new.tribe_id;
 select unit_type,parent_id into root_type,root_parent from public.lineage_units where id=new.major_branch_id and tribe_id=new.tribe_id;
 select tribe_id into src_tribe from public.sources where id=new.source_id;
 if actual_type not in ('clan','subclan') or root_type is distinct from 'branch'
   or root_parent is not null or src_tribe is distinct from new.tribe_id
 then raise exception 'Invalid fakhth registry source or type'; end if;
 if not exists (
   with recursive upward(id,parent_id,visited) as (
    select id,parent_id,array[id] from public.lineage_units where id=new.unit_id
    union all
    select p.id,p.parent_id,upward.visited||p.id
    from upward join public.lineage_units p on p.id=upward.parent_id
    where not p.id=any(upward.visited)
   )
   select 1 from upward where id=new.major_branch_id
 ) then raise exception 'Fakhth must be descendant of its major branch';end if;
 return new;
end $$;

drop trigger if exists assert_lineage_fakhth on public.lineage_fakhths;

create trigger assert_lineage_fakhth before insert or update of unit_id,tribe_id,major_branch_id,source_id
 on public.lineage_fakhths for each row execute function public.assert_lineage_fakhth();

create or replace function public.assert_family_fakhth_link()
 returns trigger language plpgsql set search_path=public as $$
declare unit_kind text;source_tribe uuid;
begin
 select unit_type into unit_kind from public.lineage_units where id=new.family_unit_id and tribe_id=new.tribe_id;
 select tribe_id into source_tribe from public.sources where id=new.source_id;
 if unit_kind is distinct from 'family' or source_tribe is distinct from new.tribe_id then
  raise exception 'Fakhth link must reference an existing family and same-tribe evidence';
 end if;
 if not exists (
  with recursive ancestor(id,parent_id,visited) as (
   select p.id,p.parent_id,array[p.id] from public.lineage_units p where p.id=new.family_unit_id
   union all select p.id,p.parent_id,a.visited||p.id
   from ancestor a join public.lineage_units p on p.id=a.parent_id
   where not p.id=any(a.visited)
  )
  select 1 from ancestor where id=new.fakhth_unit_id
 ) then raise exception 'The family must descend from the selected fakhth';end if;
 return new;
end $$;

drop trigger if exists assert_family_fakhth_link on public.lineage_family_fakhth_links;

create trigger assert_family_fakhth_link before insert or update of family_unit_id,tribe_id,fakhth_unit_id,source_id
 on public.lineage_family_fakhth_links for each row execute function public.assert_family_fakhth_link();

alter table public.lineage_fakhths enable row level security;

alter table public.lineage_family_fakhth_links enable row level security;

revoke all on public.lineage_fakhths from public,anon,authenticated;

revoke all on public.lineage_family_fakhth_links from public,anon,authenticated;

with recursive hier as (
  select l.id,l.tribe_id,l.parent_id,l.id as root_id,array[l.id] visited
  from public.lineage_units l
  where l.parent_id is null and l.tribe_id=md5('alhazmi:tribe:v1')::uuid
  union all
  select c.id,c.tribe_id,c.parent_id,h.root_id,h.visited||c.id
  from public.lineage_units c join hier h on c.parent_id=h.id and c.tribe_id=h.tribe_id
  where not c.id=any(h.visited)
), accepted(branch_name,fakhth_name) as (
 values
 ('الضوامرة','الدرويش'),('الضوامرة','الحمد'),('الضوامرة','العجلان'),
 ('الضوامرة','الشرهة'),('الضوامرة','الغافل'),('الضوامرة','الجمال'),('الضوامرة','الحصيني'),
 ('القريشم','العماوية'),('القريشم','الوريك'),('القريشم','الثوابتة')
)
insert into public.lineage_fakhths(unit_id,tribe_id,major_branch_id,source_id,raw_source_path,review_status)
select l.id,l.tribe_id,h.root_id,r.source_id,r.raw_source_path,'needs_review'
from accepted v
join public.lineage_units l on l.name_ar=v.fakhth_name and l.unit_type in ('clan','subclan')
join hier h on h.id=l.id
join public.lineage_units root on root.id=h.root_id and root.name_ar=v.branch_name
join public.lineage_seed_reviews r on r.unit_id=l.id
where l.tribe_id=md5('alhazmi:tribe:v1')::uuid
on conflict(unit_id) do nothing;

with recursive ancestry as (
 select l.id as family_id,l.id as ancestor_id,l.parent_id,0 as distance,array[l.id] as visited
 from public.lineage_units l where l.unit_type='family' and l.tribe_id=md5('alhazmi:tribe:v1')::uuid
 union all
 select a.family_id,p.id,p.parent_id,a.distance+1,a.visited||p.id
 from ancestry a join public.lineage_units p on p.id=a.parent_id
 where not p.id=any(a.visited)
), selected as (
 select distinct on(a.family_id) a.family_id,f.unit_id as fakhth_id
 from ancestry a join public.lineage_fakhths f on f.unit_id=a.ancestor_id
 where a.distance>0
 order by a.family_id,a.distance asc
)
insert into public.lineage_family_fakhth_links
(family_unit_id,tribe_id,fakhth_unit_id,source_id,raw_source_path,review_status)
select s.family_id,u.tribe_id,s.fakhth_id,r.source_id,r.raw_source_path,'needs_review'
from selected s join public.lineage_units u on u.id=s.family_id
join public.lineage_seed_reviews r on r.unit_id=s.family_id
where u.tribe_id=md5('alhazmi:tribe:v1')::uuid
on conflict(family_unit_id) do nothing;

create or replace view public.lineage_family_fakhth_directory with (security_invoker=true)
as select fam.id family_id,fam.tribe_id,fam.name_ar family_name_ar,
 parent.id parent_id,parent.name_ar parent_name_ar,
 fk.unit_id fakhth_id,fakh.name_ar fakhth_name_ar,
 root.id major_branch_id,root.name_ar major_branch_name_ar,
 link.raw_source_path,link.source_id,link.review_status,link.verified_by,link.verified_at,link.imported_at
from public.lineage_family_fakhth_links link
join public.lineage_units fam on fam.id=link.family_unit_id
left join public.lineage_units parent on parent.id=fam.parent_id
join public.lineage_fakhths fk on fk.unit_id=link.fakhth_unit_id
join public.lineage_units fakh on fakh.id=fk.unit_id
join public.lineage_units root on root.id=fk.major_branch_id;

revoke all on public.lineage_family_fakhth_directory from public,anon,authenticated;

comment on table public.lineage_family_fakhth_links is 'One source-attributed, review-gated fakhth link per family. Does not attest individual identity or authorize public genealogy.';

comment on table public.lineage_fakhths is 'Ten principal fakhths registered as existing lineage nodes, retaining native hierarchy and archival source claims.';

do $$
declare expected_fakhths int; expected_families int; linked_families int; wrong_links int;
begin
 select count(*) into expected_fakhths from public.lineage_fakhths where tribe_id=md5('alhazmi:tribe:v1')::uuid;
 select count(*) into expected_families from public.lineage_units where tribe_id=md5('alhazmi:tribe:v1')::uuid and unit_type='family';
 select count(*) into linked_families from public.lineage_family_fakhth_links where tribe_id=md5('alhazmi:tribe:v1')::uuid;
 select count(*) into wrong_links
 from public.lineage_family_fakhth_links x join public.lineage_units u on u.id=x.family_unit_id
 where x.tribe_id=md5('alhazmi:tribe:v1')::uuid and (u.unit_type <> 'family' or u.tribe_id<>x.tribe_id);
 if expected_fakhths<>10 or expected_families<>linked_families or expected_families<1 or wrong_links<>0 then
  raise exception 'Import check failed: fakhths %, families %, links %, wrong %',expected_fakhths,expected_families,linked_families,wrong_links;
 end if;
end $$;
