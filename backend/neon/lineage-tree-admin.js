import { readModule } from './api.js';
import { authorized, isId, pool } from './shared.js';

export async function lineageTreeData(user, url) {
  const [admin, write] = await Promise.all([authorized(user, 'roles.view'), authorized(user, 'lineage.structure_apply')]);
  if (!admin || !write) {
    const { items } = await readModule('tree', user);
    return { items, canManage: false };
  }

  const { rows: tribes } = await pool.query('select id,name_ar from public.tribes order by name_ar,id');
  const tribe = tribes.find(item => item.id === url.searchParams.get('tribe')) || tribes[0];
  if (!tribe) return { tribes, items: [], sources: [], canManage: true };
  const [registry, sources] = await Promise.all([
    pool.query(`select l.id,l.parent_id,l.unit_type,l.name_ar,r.review_status,
        f.unit_id is not null as registered_fakhth, f.major_branch_id, link.fakhth_unit_id,
        r.review_status='needs_review' and r.raw_source_path like 'admin/manual/%'
          and not exists (select 1 from public.lineage_units child where child.parent_id=l.id)
          and not exists (select 1 from public.people p where p.family_unit_id=l.id)
          and not exists (select 1 from public.lineage_family_fakhth_links x where x.fakhth_unit_id=l.id) as can_delete
      from public.lineage_units l
      left join public.lineage_seed_reviews r on r.unit_id=l.id
      left join public.lineage_fakhths f on f.unit_id=l.id
      left join public.lineage_family_fakhth_links link on link.family_unit_id=l.id
      where l.tribe_id=$1 order by l.name_ar,l.id`, [tribe.id]),
    pool.query('select id,title from public.sources where tribe_id=$1 order by created_at desc,id', [tribe.id]),
  ]);
  const id = url.searchParams.get('unit');
  const focused = isId(id || '') && registry.rows.find(item => item.id === id);
  return { tribes, tribe, items: registry.rows, focused, sources: sources.rows, canManage: true };
}

