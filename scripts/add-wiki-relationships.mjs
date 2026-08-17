/**
 * Add relationship edges (and missing sims) sourced from The Sims Wiki.
 * Usage: node scripts/add-wiki-relationships.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'src/data/whiteboard.json');

const data = JSON.parse(readFileSync(OUT, 'utf8'));
const byId = new Map(data.nodes.map((n) => [n.id, n]));
const edgeKey = (a, b, type) => `${type}|${[a, b].sort().join('|')}`;
const existingEdgeKeys = new Set(
  data.edges.map((e) => edgeKey(e.a, e.b, e.type)),
);

let nextEdge = Math.max(
  ...data.edges.map((e) => {
    const m = /^e(\d+)$/.exec(e.id);
    return m ? +m[1] : 0;
  }),
  0,
);

function addEdge(a, b, type) {
  if (!byId.has(a) || !byId.has(b)) {
    console.warn(`skip edge ${type} ${a} → ${b} (missing sim)`);
    return;
  }
  if (type === 'sibling') {
    const parentsOf = {};
    for (const e of data.edges) {
      if (e.type !== 'parent') continue;
      (parentsOf[e.b] = parentsOf[e.b] || []).push(e.a);
    }
    const key = (id) => (parentsOf[id] || []).slice().sort().join('|');
    const ka = key(a);
    const kb = key(b);
    if (ka && ka === kb) {
      console.warn(`skip sibling ${a} ↔ ${b} (implied by shared parents)`);
      return;
    }
  }
  const key = edgeKey(a, b, type);
  if (existingEdgeKeys.has(key)) return;
  nextEdge += 1;
  data.edges.push({ id: `e${nextEdge}`, a, b, type });
  existingEdgeKeys.add(key);
}

function addSim(node, group) {
  if (byId.has(node.id)) return;
  data.nodes.push(node);
  byId.set(node.id, node);
  if (group && !data.groups.some((g) => g.gid === group.gid)) {
    data.groups.push(group);
  }
}

const townie = {
  world: 'Other',
  nb: '-',
  color: '#9aa0a6',
  townie: false,
  oworld: 'Other',
  onb: '-',
  oplay: 'Legacy',
  pack: 'Base Game',
  ox: 0,
  oy: 0,
};

// Malpractice household (Get to Work trailer) — Kai Kahue + Chuck Cenzo
addSim(
  {
    id: 'Chuck Cenzo',
    gid: 'Other||Malpractice',
    first: 'Chuck',
    sur: 'Cenzo',
    age: 'Young Adult',
    state: 'Sim',
    gender: 'Male',
    hh: 'Malpractice',
    ...townie,
    ohh: 'Malpractice',
  },
  {
    gid: 'Other||Malpractice',
    hh: 'Malpractice',
    world: 'Other',
    nb: '-',
    color: '#9aa0a6',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  },
);

const kai = byId.get('Kai Kahue');
if (kai) {
  kai.gid = 'Other||Malpractice';
  kai.hh = 'Malpractice';
}

addSim(
  {
    id: 'Laney Voom',
    gid: 'Other||Voom',
    first: 'Laney',
    sur: 'Voom',
    age: 'Young Adult',
    state: 'Sim',
    gender: 'Female',
    hh: 'Voom',
    ...townie,
    ohh: 'Voom',
  },
  {
    gid: 'Other||Voom',
    hh: 'Voom',
    world: 'Other',
    nb: '-',
    color: '#9aa0a6',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  },
);

// Morse — wiki: Gladys → Chuck (her romance; one-sided), Vernon → Laney (his romance).
// Gladys & Vernon are roommates only; no marriage/parent link when downloaded.
addEdge('Gladys Morse', 'Chuck Cenzo', 'romance');
addEdge('Vernon Morse', 'Laney Voom', 'romance');

// Martínez — Parenting Predicaments scenario (wiki: married parents + twin children).
addEdge('Pablo Martínez', 'Jennifer Martínez', 'marriage');
addEdge('Pablo Martínez', 'Leonardo Martínez', 'parent');
addEdge('Pablo Martínez', 'Sofía Martínez', 'parent');
addEdge('Jennifer Martínez', 'Leonardo Martínez', 'parent');
addEdge('Jennifer Martínez', 'Sofía Martínez', 'parent');

// Landry — add parent edges when known; never add sibling edges if parents are linked.

function pruneImpliedSiblingEdges(edges) {
  const parentsOf = {};
  for (const e of edges) {
    if (e.type !== 'parent') continue;
    (parentsOf[e.b] = parentsOf[e.b] || []).push(e.a);
  }
  const key = (id) => (parentsOf[id] || []).slice().sort().join('|');
  return edges.filter((e) => {
    if (e.type !== 'sibling') return true;
    const ka = key(e.a);
    const kb = key(e.b);
    return !ka || ka !== kb;
  });
}

data.edges = pruneImpliedSiblingEdges(data.edges);

const memberGids = new Set(data.nodes.map((n) => n.gid));
data.groups = data.groups.filter((g) => memberGids.has(g.gid));

writeFileSync(OUT, `${JSON.stringify(data, null, 1)}\n`);
console.log(`Wrote ${OUT} — ${data.nodes.length} nodes, ${data.edges.length} edges`);
