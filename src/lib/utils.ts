import type { Edge, Group, Point, SimNode, World } from '../types/whiteboard.ts';

export const uKey = (a: string, b: string): string =>
  [a, b].slice().sort().join('|');

export const isUserE = (e: Edge): boolean => String(e.id).charAt(0) === 'u';

export const esc = (s: unknown): string =>
  (s == null ? '' : String(s))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const ptsStr = (pts: Point[]): string =>
  pts.map((p) => `${p[0]},${p[1]}`).join(' ');

/**
 * Timestamp for download filenames, as yyyy-mm-dd_hh-mm-ss on a 24-hour clock.
 * Deliberately local time: the name should match the clock on the wall when
 * the file was saved, not UTC. Zero-padded so names sort chronologically, and
 * second-precision so two saves in the same minute stay distinct files.
 */
export const fileStamp = (d: Date = new Date()): string => {
  const p = (n: number): string => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
  );
};

export const simplify = (pts: Point[]): Point[] => {
  if (pts.length < 3) return pts;
  const o: Point[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = o[o.length - 1]!;
    const b = pts[i]!;
    const c = pts[i + 1]!;
    const col =
      (Math.abs(a[0] - b[0]) < 1 && Math.abs(b[0] - c[0]) < 1) ||
      (Math.abs(a[1] - b[1]) < 1 && Math.abs(b[1] - c[1]) < 1);
    if (!col) o.push(b);
  }
  o.push(pts[pts.length - 1]!);
  return o;
};

export const worldColor = (w: string, worlds: World[]): string => {
  const name = w === 'Other / Townie' ? 'Other' : w;
  const x = worlds.find((o) => o.name === name);
  return x ? x.color : '#9aa0a6';
};

/** Parent ids for each child, from parent edges (a → b). */
export function parentsOfFromEdges(edges: Edge[]): Record<string, string[]> {
  const parentsOf: Record<string, string[]> = {};
  edges.forEach((e) => {
    if (e.type !== 'parent') return;
    (parentsOf[e.b] = parentsOf[e.b] || []).push(e.a);
  });
  return parentsOf;
}

export function parentSetKey(
  parentsOf: Record<string, string[]>,
  id: string,
): string {
  return (parentsOf[id] || []).slice().sort().join('|');
}

/** Same non-empty parent set — sibling link is implied by the parent fork. */
export function siblingsShareParents(
  a: string,
  b: string,
  edges: Edge[],
): boolean {
  const parentsOf = parentsOfFromEdges(edges);
  const ka = parentSetKey(parentsOf, a);
  const kb = parentSetKey(parentsOf, b);
  return !!ka && ka === kb;
}

/** Drop parent edges that contradict a union link between the same pair. */
export function pruneContradictoryParentEdges(edges: Edge[]): Edge[] {
  const unionPairs = new Set(
    edges
      .filter((e) =>
        ['marriage', 'romance', 'divorced'].includes(e.type),
      )
      .map((e) => uKey(e.a, e.b)),
  );
  return edges.filter((e) => {
    if (e.type !== 'parent') return true;
    return !unionPairs.has(uKey(e.a, e.b));
  });
}

/** Sanitize relationship edges used for layout and routing. */
export function sanitizeEdges(edges: Edge[]): Edge[] {
  return pruneImpliedSiblingEdges(pruneContradictoryParentEdges(edges));
}

/** Drop sibling edges when both sims already share the same parents on the board. */
export function pruneImpliedSiblingEdges(edges: Edge[]): Edge[] {
  const parentsOf = parentsOfFromEdges(edges);
  return edges.filter((e) => {
    if (e.type !== 'sibling') return true;
    const ka = parentSetKey(parentsOf, e.a);
    const kb = parentSetKey(parentsOf, e.b);
    return !ka || ka !== kb;
  });
}

/** Rename legacy world labels in loaded saves. */
export function migrateWhiteboardData(d: {
  nodes: SimNode[];
  edges: Edge[];
  groups?: Group[];
  worlds?: World[];
  hiddenPacks?: string[];
  hiddenPlay?: string[];
}): typeof d {
  const world = (w: string) => (w === 'Other / Townie' ? 'Other' : w);
  const gid = (g: string) => g.replace(/^Other \/ Townie\|\|/, 'Other||');
  return {
    ...d,
    nodes: d.nodes.map((n) => ({
      ...n,
      world: world(n.world),
      oworld: n.oworld ? world(n.oworld) : n.oworld,
      gid: gid(n.gid),
    })),
    groups: d.groups?.map((g) => ({
      ...g,
      world: world(g.world),
      gid: gid(g.gid),
    })),
    worlds: d.worlds?.map((w) => ({ ...w, name: world(w.name) })),
    edges: sanitizeEdges(d.edges),
  };
}

export const cssesc = (s: string): string =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(s)
    : s.replace(/["\\]/g, '\\$&');

export function isPet(n: SimNode): boolean {
  return !!n.species || n.state === 'Pet';
}

/** Current partners: marriage or romance. Divorced alone does not count. */
export function partneredIdSet(edges: Edge[]): Set<string> {
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.type !== 'marriage' && e.type !== 'romance') continue;
    ids.add(e.a);
    ids.add(e.b);
  }
  return ids;
}

export function isUnpartnered(id: string, edges: Edge[]): boolean {
  return !partneredIdSet(edges).has(id);
}

/**
 * Age/species chips OR with each other; Single ANDs with that set.
 * Pets ignore Single and only match species chips.
 */
export function isHighlightMatch(
  n: SimNode,
  hi: Set<string>,
  hiSingle: boolean,
  partnered: Set<string>,
): boolean {
  if (hi.size === 0 && !hiSingle) return true;
  if (isPet(n)) {
    if (hi.size === 0) return false;
    return !!n.species && hi.has(n.species);
  }
  const ageOk = hi.size === 0 || hi.has(n.age);
  const singleOk = !hiSingle || !partnered.has(n.id);
  return ageOk && singleOk;
}
