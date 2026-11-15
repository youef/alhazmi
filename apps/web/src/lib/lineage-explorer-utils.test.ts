import { describe, expect, it } from 'vitest';
import type { PublicUnit } from './diwan-api';
import { buildLineageTree } from './lineage-tree';
import { ancestryOf, countDescendants, findLineageNode, lineageTypeCounts, normalizeArabic, pruneLineageTree } from './lineage-explorer-utils';

const unit = (id: string, parent_id: string | null, unit_type = 'family'): PublicUnit =>
  ({ id, parent_id, unit_type, name_ar: id, name_en: null });

describe('lineage explorer public hierarchy helpers', () => {
  const units = [
    unit('root', null, 'branch'),
    unit('sub', 'root', 'subclan'),
    unit('family', 'sub'),
    unit('other', 'root', 'family'),
  ];
  it('normalizes Arabic search without leaking or changing source names', () => {
    expect(normalizeArabic('  أَسْرَة الشّجَارِيّـة  ')).toBe('اسره الشجاريه');
    expect(normalizeArabic('إبراهيم')).toBe(normalizeArabic('ابراهيم'));
  });
  it('builds trusted ancestry path and tolerates absent parents', () => {
    expect(ancestryOf('family', units).map(x => x.id)).toEqual(['root', 'sub', 'family']);
    expect(ancestryOf('missing', units)).toEqual([]);
    expect(ancestryOf('orphan', [unit('orphan', 'missing')]).map(x => x.id)).toEqual(['orphan']);
  });
  it('does not loop on corrupted cyclic parent references', () => {
    expect(ancestryOf('a', [unit('a', 'b'), unit('b', 'a')]).map(x => x.id)).toEqual(['b', 'a']);
  });
  it('retains ancestors for family-only matches, not unrelated siblings', () => {
    const roots = buildLineageTree(units);
    const filtered = pruneLineageTree(roots, x => x.id === 'family');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].children.map(x => x.unit.id)).toEqual(['sub']);
    expect(filtered[0].children[0].children.map(x => x.unit.id)).toEqual(['family']);
    expect(findLineageNode(filtered, 'other')).toBeUndefined();
    expect(countDescendants(roots[0])).toBe(3);
  });
  it('computes distinct published unit kinds without inferred persons', () => {
    expect(lineageTypeCounts(units)).toEqual({ branch: 1, subclan: 1, family: 2 });
  });
});
