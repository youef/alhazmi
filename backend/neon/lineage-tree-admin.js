import { readModule } from './api.js';
import { authorized, isId, pool } from './shared.js';

export async function lineageTreeData(user, url) {
  const selectedId = url.searchParams.get('unit') || '';
  const [admin, write] = await Promise.all([authorized(user, 'roles.view'), authorized(user, 'lineage.structure_apply')]);
  if (!admin || !write) {
    const { items } = await readModule('tree', user);
    if (!items.length) return { items, canManage: false };
    const byId = new Map(items.map(item=>[item.id,item]));
    const published = items.filter(item=>{
      const seen=new Set([item.id]);
      for(let parentId=item.parent_id;parentId;){
        const parent=byId.get(parentId);
        if(!parent||seen.has(parentId))return false;
        seen.add(parentId);
        parentId=parent.parent_id;
      }
      return true;
    });
    const ids = published.map(item => item.id);
    if (!ids.length) return { items:[], canManage:false };
    const [fakhth, links] = await Promise.all([
      pool.query(`select unit_id,major_branch_id from public.lineage_fakhths
        where unit_id=any($1::uuid[]) and review_status='approved' and verified_at is not null and verified_by is not null`,[ids]),
      pool.query(`select family_unit_id,fakhth_unit_id from public.lineage_family_fakhth_links
        where family_unit_id=any($1::uuid[]) and fakhth_unit_id=any($1::uuid[])
        and review_status='approved' and verified_at is not null and verified_by is not null`,[ids]),
    ]);
    const branches = new Map(fakhth.rows.map(row=>[row.unit_id,row.major_branch_id]));
    const relationships = new Map(links.rows.map(row=>[row.family_unit_id,row.fakhth_unit_id]));
    const linkedFakhths = new Set(relationships.values());
    const visible = new Set(ids);
    const units = published.map(item=>({
      ...item,
      registered_fakhth:branches.has(item.id)||linkedFakhths.has(item.id),
      major_branch_id:visible.has(branches.get(item.id))?branches.get(item.id):null,
      fakhth_unit_id:relationships.get(item.id)||null,
    }));
    return { items:units, focused:units.find(item=>item.id===selectedId), canManage:false };
  }

  const { rows: tribes } = await pool.query('select id,name_ar from public.tribes order by name_ar,id');
  const tribe = tribes.find(item => item.id === url.searchParams.get('tribe')) || tribes[0];
  if (!tribe) return { tribes, items: [], sources: [], canManage: true };
  const [registry, sources, canBrowsePeople] = await Promise.all([
    pool.query(`select l.id,l.parent_id,l.unit_type,l.name_ar,r.review_status,
        f.unit_id is not null as registered_fakhth, f.major_branch_id, link.fakhth_unit_id,
        r.review_status='needs_review' and r.raw_source_path like 'admin/manual/%'
          and not exists (select 1 from public.permission_audit_events a where a.event_type='genealogy_unit_publication_approved' and a.metadata->>'id'=l.id::text)
          and not exists (select 1 from public.lineage_units child where child.parent_id=l.id)
          and not exists (select 1 from public.people p where p.family_unit_id=l.id)
          and not exists (select 1 from public.lineage_family_fakhth_links x where x.fakhth_unit_id=l.id) as can_delete
      from public.lineage_units l
      left join public.lineage_seed_reviews r on r.unit_id=l.id
      left join public.lineage_fakhths f on f.unit_id=l.id
      left join public.lineage_family_fakhth_links link on link.family_unit_id=l.id
      where l.tribe_id=$1 order by l.name_ar,l.id`, [tribe.id]),
    pool.query('select id,title from public.sources where tribe_id=$1 order by created_at desc,id', [tribe.id]),
    authorized(user,'identity.read'),
  ]);
  const focused = isId(selectedId) && registry.rows.find(item => item.id === selectedId);
  return { tribes, tribe, items: registry.rows, focused, sources: sources.rows, canManage: true };
}

