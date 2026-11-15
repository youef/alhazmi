import type { PublicUnit } from './diwan-api';
import type { LineageNode } from './lineage-tree';

export function normalizeArabic(value: string): string {
  return value.toLocaleLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Public hierarchy only; never infer a family relationship from unit ancestry. */
export function ancestryOf(id: string, units: PublicUnit[]): PublicUnit[] {
  const index = new Map(units.map(unit => [unit.id, unit]));
  const path: PublicUnit[] = [];
  const visited = new Set<string>();
  let current: string | null = id;
  while (current && index.has(current) && !visited.has(current)) {
    visited.add(current);
    const unit = index.get(current)!;
    path.push(unit);
    current = unit.parent_id;
  }
  return path.reverse();
}

export function findLineageNode(nodes: LineageNode[], id: string): LineageNode | undefined {
  for (const node of nodes) {
    if (node.unit.id === id) return node;
    const found = findLineageNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function countDescendants(node: LineageNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

/** Keep ancestor context when searching or filtering the published hierarchy. */
export function pruneLineageTree(
  roots: LineageNode[],
  predicate: (unit: PublicUnit) => boolean,
): LineageNode[] {
  const result: LineageNode[] = [];
  for (const node of roots) {
    const children = pruneLineageTree(node.children, predicate);
    if (predicate(node.unit) || children.length > 0) {
      result.push({ unit: node.unit, children });
    }
  }
  return result;
}

export function lineageTypeCounts(units: PublicUnit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const unit of units) counts[unit.unit_type] = (counts[unit.unit_type] || 0) + 1;
  return counts;
}
