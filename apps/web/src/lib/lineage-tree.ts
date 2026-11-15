import type { PublicUnit } from './diwan-api';

export type LineageNode = { unit: PublicUnit; children: LineageNode[] };

export function buildLineageTree(units: PublicUnit[]): LineageNode[] {
  const nodes = new Map<string, LineageNode>();
  for (const unit of units) nodes.set(unit.id, { unit, children: [] });
  const roots: LineageNode[] = [];
  const linkedParents = new Map<string, string>();

  for (const [id, node] of nodes) {
    const parentId = node.unit.parent_id;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (!parent || !parentId) {
      roots.push(node);
      continue;
    }
    let ancestor: string | undefined = parentId;
    while (ancestor && ancestor !== id) ancestor = linkedParents.get(ancestor);
    if (ancestor === id) {
      roots.push(node);
      continue;
    }
    linkedParents.set(id, parentId);
    parent.children.push(node);
  }

  return roots;
}
