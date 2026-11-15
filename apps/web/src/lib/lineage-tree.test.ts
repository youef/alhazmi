import { describe, expect, it } from 'vitest';
import { buildLineageTree } from './lineage-tree';
import type { PublicUnit } from './diwan-api';

function unit(id: string, parent_id: string | null): PublicUnit {
  return { id, parent_id, unit_type: 'family', name_ar: id, name_en: null };
}

describe('buildLineageTree', () => {
  it('links parent and child regardless of response order', () => {
    const [root] = buildLineageTree([unit('child', 'root'), unit('root', null)]);
    expect(root.unit.id).toBe('root');
    expect(root.children.map(child => child.unit.id)).toEqual(['child']);
  });

  it('retains partial pages and deduplicates overlapping results', () => {
    const roots = buildLineageTree([unit('child', 'unloaded'), unit('child', 'unloaded')]);
    expect(roots).toHaveLength(1);
    expect(roots[0].unit.id).toBe('child');
  });

  it('breaks cycles and self links while retaining every unit', () => {
    const roots = buildLineageTree([unit('a', 'b'), unit('b', 'a'), unit('c', 'c')]);
    expect(roots.map(node => node.unit.id)).toEqual(['b', 'c']);
    expect(roots[0].children[0].unit.id).toBe('a');
    expect(roots[1].children).toEqual([]);
  });
});
