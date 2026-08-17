import { BAND, MINDROP, STUB } from './constants.ts';
import {
  buildRects,
  edgeVisible,
  ptsClear,
  segClear,
  segHit,
  unionGeom,
} from './geometry.ts';
import { isUserE, simplify, uKey } from './utils.ts';
import type {
  BloodPath,
  BloodVert,
  CustomRender,
  Edge,
  EdgeRenderData,
  Group,
  Point,
  Rect,
  ShowToggles,
  SimNode,
  UnionRender,
} from '../types/whiteboard.ts';

/** Binary min-heap for A* open set (keyed by priority). */
export class MinHeap {
  private p: number[] = [];
  private v: number[] = [];

  size(): number {
    return this.v.length;
  }

  push(pri: number, val: number): void {
    const p = this.p;
    const v = this.v;
    p.push(pri);
    v.push(val);
    let i = v.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (p[par]! <= p[i]!) break;
      const tp = p[par]!;
      p[par] = p[i]!;
      p[i] = tp;
      const tv = v[par]!;
      v[par] = v[i]!;
      v[i] = tv;
      i = par;
    }
  }

  pop(): number {
    const p = this.p;
    const v = this.v;
    const top = v[0]!;
    const lastP = p.pop()!;
    const lastV = v.pop()!;
    if (v.length) {
      p[0] = lastP;
      v[0] = lastV;
      let i = 0;
      const n = v.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < n && p[l]! < p[m]!) m = l;
        if (r < n && p[r]! < p[m]!) m = r;
        if (m === i) break;
        const tp = p[m]!;
        p[m] = p[i]!;
        p[i] = tp;
        const tv = v[m]!;
        v[m] = v[i]!;
        v[i] = tv;
        i = m;
      }
    }
    return top;
  }
}

export interface RoutingContext {
  rects: Rect[];
  rbands: Record<number, Rect[]>;
  fastRoute: boolean;
}

function astar(
  p0: Point,
  p1: Point,
  ex: Set<string>,
  ctx: RoutingContext,
  clr = 1,
): Point[] | null {
  const { rects: RECTS } = ctx;
  let minx = Math.min(p0[0], p1[0]) - 40;
  let maxx = Math.max(p0[0], p1[0]) + 40;
  let miny = Math.min(p0[1], p1[1]) - 40;
  let maxy = Math.max(p0[1], p1[1]) + 40;
  for (let pass = 0; pass < 4; pass++) {
    let grew = false;
    for (const r of RECTS) {
      if (ex.has(r.id)) continue;
      if (r.r >= minx && r.l <= maxx && r.b >= miny && r.t <= maxy) {
        if (r.l - clr - 12 < minx) {
          minx = r.l - clr - 12;
          grew = true;
        }
        if (r.r + clr + 12 > maxx) {
          maxx = r.r + clr + 12;
          grew = true;
        }
        if (r.t - clr - 12 < miny) {
          miny = r.t - clr - 12;
          grew = true;
        }
        if (r.b + clr + 12 > maxy) {
          maxy = r.b + clr + 12;
          grew = true;
        }
      }
    }
    if (!grew) break;
  }
  const xs = new Set<number>([p0[0], p1[0]]);
  const ys = new Set<number>([p0[1], p1[1]]);
  const near: Rect[] = [];
  for (const r of RECTS) {
    if (ex.has(r.id)) continue;
    if (r.r < minx || r.l > maxx || r.b < miny || r.t > maxy) continue;
    near.push(r);
    [r.l - clr, r.r + clr].forEach((v) => {
      if (v >= minx && v <= maxx) xs.add(v);
    });
    [r.t - clr, r.b + clr].forEach((v) => {
      if (v >= miny && v <= maxy) ys.add(v);
    });
  }
  const X = [...xs].sort((a, b) => a - b);
  const Y = [...ys].sort((a, b) => a - b);
  const NY = Y.length;
  if (X.length * NY > 60000) return null;
  const xi = new Map(X.map((v, i) => [v, i] as const));
  const yi = new Map(Y.map((v, i) => [v, i] as const));
  const clrSeg = (x1: number, y1: number, x2: number, y2: number): boolean => {
    for (const r of near) {
      if (segHit(x1, y1, x2, y2, r)) return false;
    }
    return true;
  };
  const s = xi.get(p0[0])! * NY + yi.get(p0[1])!;
  const gg = xi.get(p1[0])! * NY + yi.get(p1[1])!;
  const TURN = 26;
  const gc: Record<number, number> = {};
  const came: Record<number, number | undefined> = {};
  const dir: Record<number, number> = {};
  gc[s] = 0;
  dir[s] = 0;
  const open = new MinHeap();
  open.push(0, s);
  const done = new Set<number>();
  while (open.size()) {
    const cur = open.pop();
    if (cur === gg) break;
    if (done.has(cur)) continue;
    done.add(cur);
    const i = (cur / NY) | 0;
    const j = cur % NY;
    const cx = X[i]!;
    const cy = Y[j]!;
    const nb: [number, number][] = [];
    if (i > 0) nb.push([i - 1, j]);
    if (i < X.length - 1) nb.push([i + 1, j]);
    if (j > 0) nb.push([i, j - 1]);
    if (j < NY - 1) nb.push([i, j + 1]);
    for (const [ni, nj] of nb) {
      const nx = X[ni]!;
      const ny = Y[nj]!;
      if (!clrSeg(cx, cy, nx, ny)) continue;
      const k = ni * NY + nj;
      const md = nx !== cx ? 1 : 2;
      const turn = dir[cur] && dir[cur] !== md ? TURN : 0;
      const ng =
        gc[cur]! + Math.abs(nx - cx) + Math.abs(ny - cy) + turn;
      if (gc[k] === undefined || ng < gc[k]!) {
        gc[k] = ng;
        came[k] = cur;
        dir[k] = md;
        open.push(ng + Math.abs(nx - p1[0]) + Math.abs(ny - p1[1]), k);
      }
    }
  }
  if (came[gg] === undefined && s !== gg) return null;
  const path: Point[] = [];
  let c: number | undefined = gg;
  while (c !== undefined) {
    const i = (c / NY) | 0;
    const j = c % NY;
    path.push([X[i]!, Y[j]!]);
    if (c === s) break;
    c = came[c];
  }
  path.reverse();
  return simplify(path);
}

export function orthPath(
  p0: Point,
  p1: Point,
  exIds: string[] | undefined,
  ctx: RoutingContext,
): Point[] {
  const ex = new Set(exIds ?? []);
  const { rbands, fastRoute } = ctx;
  const tries: Point[][] = [
    [p0, [p1[0], p0[1]], p1],
    [p0, [p0[0], p1[1]], p1],
    [p0, [(p0[0] + p1[0]) / 2, p0[1]], [(p0[0] + p1[0]) / 2, p1[1]], p1],
    [p0, [p0[0], (p0[1] + p1[1]) / 2], [p1[0], (p0[1] + p1[1]) / 2], p1],
  ];
  for (const t of tries) {
    if (ptsClear(t, rbands, ex)) return simplify(t);
  }
  if (fastRoute) return simplify(tries[0]!);
  return (
    astar(p0, p1, ex, ctx, 10) ||
    astar(p0, p1, ex, ctx, 1) ||
    simplify(tries[0]!)
  );
}

export function childRoute(
  ax: number,
  ay: number,
  child: SimNode,
  exIds: string[],
  ctx: RoutingContext,
): Point[] {
  const ex = new Set(exIds);
  const cx = child.x + child.w / 2;
  const top = child.y;
  const ts = top - STUB;
  const { rbands, fastRoute } = ctx;
  if (fastRoute) {
    if (ts > ay + 8) {
      return simplify([
        [ax, ay],
        [ax, ts],
        [cx, ts],
        [cx, top],
      ]);
    }
    return simplify([
      [ax, ay],
      [ax, ay + MINDROP],
      [cx, ay + MINDROP],
      [cx, ts],
      [cx, top],
    ]);
  }
  const exNoChild = [...ex].filter((id) => id !== child.id);
  if (ts > ay + 8) {
    const pts: Point[] = [
      [ax, ay],
      [ax, ts],
      [cx, ts],
      [cx, top],
    ];
    if (ptsClear(pts, rbands, ex)) return simplify(pts);
    const forkY = Math.min(ay + MINDROP, ts - 2);
    const r = orthPath([ax, forkY], [cx, ts], exNoChild, ctx);
    r.unshift([ax, ay]);
    r.push([cx, top]);
    return simplify(r);
  }
  const riseCands =
    cx >= ax
      ? [child.x - 22, child.x + child.w + 22]
      : [child.x + child.w + 22, child.x - 22];
  for (const riseX of riseCands) {
    for (let low = ay + MINDROP; low <= ay + MINDROP + 150; low += 13) {
      for (let up = ts; up >= ts - 90; up -= 13) {
        const pts: Point[] = [
          [ax, ay],
          [ax, low],
          [riseX, low],
          [riseX, up],
          [cx, up],
          [cx, top],
        ];
        if (ptsClear(pts, rbands, ex)) return simplify(pts);
      }
    }
  }
  const forkY = ay + MINDROP;
  const r = orthPath([ax, forkY], [cx, ts], exNoChild, ctx);
  r.unshift([ax, ay]);
  r.push([cx, top]);
  return simplify(r);
}

export function laneBus(
  ax: number,
  ay: number,
  kidNodes: SimNode[],
  exIds: string[],
  ctx: RoutingContext,
): number | null {
  const ex = new Set([...exIds, ...kidNodes.map((n) => n.id)]);
  const cxs = kidNodes.map((n) => n.x + n.w / 2);
  const minx = Math.min(ax, ...cxs);
  const maxx = Math.max(ax, ...cxs);
  const minTop = Math.min(...kidNodes.map((n) => n.y));
  const topLimit = minTop - STUB;
  const { rbands } = ctx;
  for (let lane = ay + MINDROP; lane <= topLimit; lane += 8) {
    if (!segClear(ax, ay, ax, lane, rbands, ex)) continue;
    if (!segClear(minx, lane, maxx, lane, rbands, ex)) continue;
    let ok = true;
    for (const n of kidNodes) {
      const cx = n.x + n.w / 2;
      if (!segClear(cx, lane, cx, n.y, rbands, ex)) {
        ok = false;
        break;
      }
    }
    if (ok) return lane;
  }
  return null;
}

/** PARENT link geometry (legacy helper; childRoute is used in production). */
export function routeParent(p: SimNode, c: SimNode): string {
  const pcx = p.x + p.w / 2;
  const ccx = c.x + c.w / 2;
  if (c.y > p.y + p.h + 8) {
    const my = (p.y + p.h + c.y) / 2;
    return `${pcx},${p.y + p.h} ${pcx},${my} ${ccx},${my} ${ccx},${c.y}`;
  }
  const goR = ccx >= pcx;
  const sx = goR ? p.x + p.w : p.x;
  const sy = p.y + p.h / 2;
  const ex = goR ? c.x : c.x + c.w;
  const ey = c.y + c.h / 2;
  const mx = (sx + ex) / 2;
  return `${sx},${sy} ${mx},${sy} ${mx},${ey} ${ex},${ey}`;
}

export function bloodVerts(polys: BloodPath[]): BloodVert[] {
  const V: BloodVert[] = [];
  polys.forEach((p, pi) => {
    for (let i = 1; i < p.pts.length; i++) {
      const a = p.pts[i - 1]!;
      const b = p.pts[i]!;
      if (Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) > 1) {
        V.push({
          x: a[0],
          y1: Math.min(a[1], b[1]),
          y2: Math.max(a[1], b[1]),
          pi,
        });
      }
    }
  });
  return V;
}

export function hopD(pts: Point[], verts: BloodVert[], pi: number): string {
  const R = 5;
  if (!pts || pts.length < 1) return '';
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (Math.abs(a[1] - b[1]) < 0.5 && Math.abs(a[0] - b[0]) > 1) {
      const y = a[1];
      const dir = b[0] > a[0] ? 1 : -1;
      let xs = verts
        .filter(
          (v) =>
            v.pi !== pi &&
            v.y1 < y - 2 &&
            v.y2 > y + 2 &&
            v.x > Math.min(a[0], b[0]) + R + 1 &&
            v.x < Math.max(a[0], b[0]) - R - 1,
        )
        .map((v) => v.x);
      xs = [...new Set(xs)].sort((m, n) => dir * (m - n));
      for (const x of xs) {
        d += ` L ${x - dir * R} ${y} A ${R} ${R} 0 0 ${dir > 0 ? 1 : 0} ${x + dir * R} ${y}`;
      }
      d += ` L ${b[0]} ${b[1]}`;
    } else {
      d += ` L ${b[0]} ${b[1]}`;
    }
  }
  return d;
}

export interface ComputeEdgeRenderInput {
  nodes: SimNode[];
  edges: Edge[];
  groups: Group[];
  show: ShowToggles;
  packVis: (n: SimNode) => boolean;
  fastRoute: boolean;
}

/** Pure routing pass — returns geometry instead of mutating the DOM. */
export function computeEdgeRenderData(
  input: ComputeEdgeRenderInput,
): EdgeRenderData {
  const { nodes, edges, groups, show, packVis, fastRoute } = input;
  const byid: Record<string, SimNode> = {};
  nodes.forEach((n) => {
    byid[n.id] = n;
  });

  const built = buildRects(nodes, groups, show, packVis);
  const RECTS = [...built.rects];
  const RBANDS = { ...built.rbands };

  const ctx: RoutingContext = { rects: RECTS, rbands: RBANDS, fastRoute };

  const vis = (e: Edge): boolean =>
    !!byid[e.a] &&
    !!byid[e.b] &&
    edgeVisible(e, show) &&
    packVis(byid[e.a]!) &&
    packVis(byid[e.b]!);

  const unions = edges.filter(
    (e) =>
      (e.type === 'marriage' ||
        e.type === 'romance' ||
        e.type === 'divorced') &&
      vis(e),
  );

  const uAnchor: Record<string, { rx: number; ry: number }> = {};
  const mObs: Record<string, string[]> = {};

  unions.forEach((e) => {
    const g0 = unionGeom(byid[e.a]!, byid[e.b]!);
    const key = uKey(e.a, e.b);
    uAnchor[key] = { rx: g0.rx, ry: g0.ry };
    mObs[key] = [];
    const pp = g0.pts.split(' ').map((s) => s.split(',').map(Number) as Point);
    for (let i = 0; i + 1 < pp.length; i++) {
      const M = 4;
      const id = `__m_${i}_${key}`;
      const segRect: Rect = {
        l: Math.min(pp[i]![0], pp[i + 1]![0]) - M,
        t: Math.min(pp[i]![1], pp[i + 1]![1]) - M,
        r: Math.max(pp[i]![0], pp[i + 1]![0]) + M,
        b: Math.max(pp[i]![1], pp[i + 1]![1]) + M,
        id,
      };
      RECTS.push(segRect);
      mObs[key]!.push(id);
      const b0 = Math.floor(segRect.t / BAND);
      const b1 = Math.floor(segRect.b / BAND);
      for (let bb = b0; bb <= b1; bb++) {
        (RBANDS[bb] = RBANDS[bb] || []).push(segRect);
      }
    }
  });

  ctx.rects = RECTS;
  ctx.rbands = RBANDS;

  const pEdges = edges.filter((e) => e.type === 'parent' && vis(e));
  const parentsOf: Record<string, string[]> = {};
  const pEB: Record<string, string[]> = {};

  pEdges.forEach((e) => {
    (parentsOf[e.b] = parentsOf[e.b] || []);
    if (!parentsOf[e.b]!.includes(e.a)) parentsOf[e.b]!.push(e.a);
    (pEB[e.b] = pEB[e.b] || []).push(e.id);
  });

  const fam: Record<
    string,
    { parents: string[]; kids: string[] }
  > = {};
  Object.keys(parentsOf).forEach((c) => {
    const ps = parentsOf[c]!.slice().sort();
    const key = ps.join('|');
    (fam[key] = fam[key] || { parents: ps, kids: [] }).kids.push(c);
  });

  const BLOOD: BloodPath[] = [];

  Object.values(fam).forEach((f) => {
    const kids = f.kids.filter((c) => byid[c]);
    if (!kids.length) return;
    const ps = f.parents;
    const isCouple = ps.length === 2 && uAnchor[uKey(ps[0]!, ps[1]!)];
    let ax: number;
    let ay: number;
    let exBase: string[];
    if (isCouple) {
      const a = uAnchor[uKey(ps[0]!, ps[1]!)]!;
      ax = a.rx;
      ay = a.ry + 12;
      exBase = [ps[0]!, ps[1]!].concat(mObs[uKey(ps[0]!, ps[1]!)] || []);
    } else if (ps.length === 1 && byid[ps[0]!]) {
      const p = byid[ps[0]!]!;
      ax = p.x + p.w / 2;
      ay = p.y + p.h;
      exBase = [ps[0]!];
    } else {
      ps.forEach((pid) => {
        const p = byid[pid];
        if (!p) return;
        kids.forEach((c) => {
          const n = byid[c];
          if (!n) return;
          BLOOD.push({
            ids: pEB[c] || [],
            pts: childRoute(p.x + p.w / 2, p.y + p.h, n, [pid, c], ctx),
          });
        });
      });
      return;
    }
    const kn = kids.map((c) => byid[c]!);
    const belowK = kn.filter((n) => n.y > ay + STUB);
    const sideK = kn.filter((n) => !(n.y > ay + STUB));
    if (belowK.length) {
      const forkY = ay + MINDROP;
      BLOOD.push({
        ids: belowK.length === 1 ? pEB[belowK[0]!.id] || [] : [],
        pts: [
          [ax, ay],
          [ax, forkY],
        ],
      });
      belowK.forEach((n) => {
        BLOOD.push({
          ids: pEB[n.id] || [],
          pts: childRoute(ax, forkY, n, exBase.concat([n.id]), ctx),
        });
      });
    }
    sideK.forEach((n) => {
      BLOOD.push({
        ids: pEB[n.id] || [],
        pts: childRoute(ax, ay, n, exBase.concat([n.id]), ctx),
      });
    });
  });

  const sibEdges = edges.filter((e) => e.type === 'sibling' && vis(e));
  if (sibEdges.length) {
    const adj: Record<string, string[]> = {};
    const comp: Record<string, number> = {};
    sibEdges.forEach((e) => {
      (adj[e.a] = adj[e.a] || []).push(e.b);
      (adj[e.b] = adj[e.b] || []).push(e.a);
    });
    let ci = 0;
    const comps: string[][] = [];
    Object.keys(adj).forEach((s) => {
      if (comp[s] !== undefined) return;
      const st = [s];
      const mm: string[] = [];
      comp[s] = ci;
      while (st.length) {
        const x = st.pop()!;
        mm.push(x);
        (adj[x] || []).forEach((y) => {
          if (comp[y] === undefined) {
            comp[y] = ci;
            st.push(y);
          }
        });
      }
      comps.push(mm);
      ci++;
    });
    comps.forEach((members) => {
      const ms = members.filter((m) => byid[m]);
      if (ms.length < 2) return;
      const cxs = ms.map((m) => byid[m]!.x + byid[m]!.w / 2);
      const barY = Math.min(...ms.map((m) => byid[m]!.y)) - 28;
      const minx = Math.min(...cxs);
      const maxx = Math.max(...cxs);
      const ids = sibEdges
        .filter((e) => members.includes(e.a) && members.includes(e.b))
        .map((e) => e.id);
      const ex = new Set(ms);
      const segs: [Point, Point][] = [[[minx, barY], [maxx, barY]]];
      ms.forEach((m) => {
        const n = byid[m]!;
        const cx = n.x + n.w / 2;
        segs.push([[cx, barY], [cx, n.y]]);
      });
      const ok = segs.every((s) =>
        segClear(s[0][0], s[0][1], s[1][0], s[1][1], RBANDS, ex),
      );
      if (ok) {
        BLOOD.push({ ids, pts: [[minx, barY], [maxx, barY]] });
        ms.forEach((m) => {
          const n = byid[m]!;
          const cx = n.x + n.w / 2;
          BLOOD.push({ ids, pts: [[cx, barY], [cx, n.y]] });
        });
      } else {
        for (let i = 0; i + 1 < ms.length; i++) {
          const a = byid[ms[i]!]!;
          const b = byid[ms[i + 1]!]!;
          const ax = a.x + a.w / 2;
          const bx = b.x + b.w / 2;
          const r = orthPath(
            [ax, a.y - STUB],
            [bx, b.y - STUB],
            [ms[i]!, ms[i + 1]!],
            ctx,
          );
          r.unshift([ax, a.y]);
          r.push([bx, b.y]);
          BLOOD.push({ ids, pts: simplify(r) });
        }
      }
    });
  }

  const unionRenders: UnionRender[] = unions.map((e) => {
    const g0 = unionGeom(byid[e.a]!, byid[e.b]!);
    return {
      edgeId: e.id,
      type: e.type as UnionRender['type'],
      a: e.a,
      b: e.b,
      pts: g0.pts,
      rx: g0.rx,
      ry: g0.ry,
      isUser: isUserE(e),
    };
  });

  const customs: CustomRender[] = edges
    .filter((e) => e.type === 'custom' && vis(e))
    .map((e) => {
      const a = byid[e.a]!;
      const b = byid[e.b]!;
      return {
        edgeId: e.id,
        a: e.a,
        b: e.b,
        pts: orthPath(
          [a.x + a.w / 2, a.y + a.h / 2],
          [b.x + b.w / 2, b.y + b.h / 2],
          [e.a, e.b],
          ctx,
        ),
        isUser: isUserE(e),
      };
    });

  return {
    blood: BLOOD,
    unions: unionRenders,
    customs,
    rects: RECTS,
  };
}
