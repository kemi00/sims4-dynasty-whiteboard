import type { Edge } from '../types/whiteboard.ts';

/**
 * The selected sim plus every ancestor and descendant on parent edges.
 * Spouses and siblings who are not on that vertical line are left out.
 */
export function lineageIds(focusId: string, edges: Edge[]): Set<string> {
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type !== 'parent') continue;
    const kids = children.get(e.a) ?? [];
    kids.push(e.b);
    children.set(e.a, kids);
    const pars = parents.get(e.b) ?? [];
    pars.push(e.a);
    parents.set(e.b, pars);
  }

  const keep = new Set<string>([focusId]);
  const walk = (adj: Map<string, string[]>) => {
    const q = [focusId];
    const seen = new Set<string>([focusId]);
    while (q.length) {
      const id = q.pop()!;
      for (const n of adj.get(id) ?? []) {
        if (seen.has(n)) continue;
        seen.add(n);
        keep.add(n);
        q.push(n);
      }
    }
  };
  walk(parents);
  walk(children);
  return keep;
}
