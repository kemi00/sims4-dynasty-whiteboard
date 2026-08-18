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

// Landry — Family Fortune. Nyssa is grandmother of Eddie, Ava, and Lila
// (siblings). Wiki family tree inserts an unnamed middle generation.
addSim({
  id: 'Unknown Landry',
  gid: 'Other||Landry',
  first: 'Unknown',
  sur: 'Landry',
  age: 'Adult',
  state: 'Sim',
  gender: '',
  hh: 'Landry',
  ...townie,
  ohh: 'Landry',
  oplay: 'Townie',
});
addEdge('Nyssa Landry', 'Unknown Landry', 'parent');
addEdge('Unknown Landry', 'Eddie Landry', 'parent');
addEdge('Unknown Landry', 'Ava Landry', 'parent');
addEdge('Unknown Landry', 'Lila Landry', 'parent');

// Bailey — For Rent tenants; married couple (wiki: Newlyweds).
addEdge('Tia Bailey', 'Haru Matsuda', 'marriage');

// Brock — For Rent; single mother Nancy and her two children.
addEdge('Nancy Brock', 'Julie Brock', 'parent');
addEdge('Nancy Brock', 'Johnny Brock', 'parent');

// Cragg — For Rent retirees; married couple. Wiki: Jesse is male.
const jesse = byId.get('Jesse Cragg');
if (jesse) jesse.gender = 'Male';
addEdge('Jesse Cragg', 'Meekah Cragg', 'marriage');

// Gonzales — CAS defaults; twins / siblings (wiki: Gonzalez).
addEdge('Gabby Gonzales', 'Gael Gonzales', 'sibling');

// Lee — For Rent generational: Sunja → Minsung → Daesung & Yuri.
addEdge('Sunja Lee', 'Minsung Lee', 'parent');
addEdge('Minsung Lee', 'Daesung Lee', 'parent');
addEdge('Minsung Lee', 'Yuri Lee', 'parent');

// Purdue — Gallery siblings. Ollie married Babs (wiki bios / Stories trailer).
// Sophia Jordan is a past fling, not a current partner — do not add romance.
addEdge('Cassidy Purdue', 'Ollie Purdue', 'sibling');
addEdge('Ollie Purdue', "Babs L'Amour", 'marriage');

// Sage — For Rent; married parents of Xavier and Zehava.
addEdge('Owen Sage', 'Jilliana Sage', 'marriage');
addEdge('Owen Sage', 'Xavier Sage', 'parent');
addEdge('Owen Sage', 'Zehava Sage', 'parent');
addEdge('Jilliana Sage', 'Xavier Sage', 'parent');
addEdge('Jilliana Sage', 'Zehava Sage', 'parent');

// Lu — Kitty Lu + three cats. Wiki: pets / acquaintances, no family edges.
// Shadows — Luna + Gretchen, best friends / roommates. No family edges.
// Zaki — four young-adult roommates, acquaintances. No family edges.
// Malpractice — gallery roommates (doctors). Chuck's Gladys romance is Morse.

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
