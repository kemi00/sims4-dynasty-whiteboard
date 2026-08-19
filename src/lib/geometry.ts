import {
  ALIGN_TH,
  BAND,
  GRID,
  PILL_H,
  PILL_HALF_W,
  PILL_W,
  RGAP,
  SNAP_HYST,
  SNAP_RANGE,
  STUB,
  UNION_MIN_GAP,
} from './constants.ts';
import { LAYOUT } from './layout.ts';
import type {
  BuildRectsResult,
  Edge,
  Group,
  Guides,
  HhBox,
  HhBoxDraw,
  Rect,
  ShowToggles,
  SimNode,
  UnionGeom,
  UnionRender,
  Viewport,
} from '../types/whiteboard.ts';

/** Intersection on a sim card border toward (tox, toy). */
export function border(n: SimNode, tox: number, toy: number): [number, number] {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const dx = tox - cx;
  const dy = toy - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const hw = n.w / 2 + 2;
  const hh = n.h / 2 + 2;
  const sx = dx ? hw / Math.abs(dx) : 1e9;
  const sy = dy ? hh / Math.abs(dy) : 1e9;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

export function edgeVisible(e: Edge, show: ShowToggles): boolean {
  if (
    e.type === 'marriage' ||
    e.type === 'romance' ||
    e.type === 'divorced' ||
    e.type === 'parent' ||
    e.type === 'sibling'
  ) {
    return show.seed;
  }
  return true;
}

export type SnapSticky = { x: number | null; y: number | null };

function collectSnapEdges(
  x: number,
  y: number,
  w: number,
  h: number,
  nodes: SimNode[],
  excludeId?: string,
): { xe: number[]; ye: number[] } {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const xe = new Set<number>();
  const ye = new Set<number>();

  for (const o of nodes) {
    if (o.id === excludeId) continue;
    const ocx = o.x + o.w / 2;
    const ocy = o.y + o.h / 2;
    if (
      Math.abs(ocx - cx) > SNAP_RANGE + (o.w + w) / 2 ||
      Math.abs(ocy - cy) > SNAP_RANGE + (o.h + h) / 2
    ) {
      continue;
    }
    xe.add(o.x);
    xe.add(o.x + o.w - w);
    xe.add(o.x + o.w / 2 - w / 2);
    ye.add(o.y);
    ye.add(o.y + o.h - h);
    ye.add(o.y + o.h / 2 - h / 2);
  }
  return { xe: [...xe], ye: [...ye] };
}

function snapAxisSticky(
  v: number,
  edges: number[],
  sticky: number | null,
): { v: number; guide: number | null; sticky: number | null } {
  if (sticky !== null && Math.abs(v - sticky) <= ALIGN_TH + SNAP_HYST) {
    return { v: Math.round(sticky), guide: sticky, sticky };
  }

  let best: number | null = null;
  let bd = ALIGN_TH + 1;
  for (const e of edges) {
    const d = Math.abs(e - v);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  if (best !== null) {
    return { v: Math.round(best), guide: best, sticky: best };
  }
  return { v: Math.round(v / GRID) * GRID, guide: null, sticky: null };
}

export function snapAxis(v: number, edges: number[]): number {
  return snapAxisSticky(v, edges, null).v;
}

/** Alignment guides for a rectangle near other nodes (within ALIGN_TH). */
export function guidesForRect(
  x: number,
  y: number,
  w: number,
  h: number,
  nodes: SimNode[],
  excludeId?: string,
  th = ALIGN_TH,
): Guides {
  const gx = new Set<number>();
  const gy = new Set<number>();
  const L = [x, x + w / 2, x + w];
  const T = [y, y + h / 2, y + h];
  for (const o of nodes) {
    if (o.id === excludeId) continue;
    [o.x, o.x + o.w / 2, o.x + o.w].forEach((v) =>
      L.forEach((l) => {
        if (Math.abs(v - l) <= th) gx.add(v);
      }),
    );
    [o.y, o.y + o.h / 2, o.y + o.h].forEach((v) =>
      T.forEach((t) => {
        if (Math.abs(v - t) <= th) gy.add(v);
      }),
    );
  }
  return { gx: [...gx], gy: [...gy] };
}

/** Snap a top-left position; guides show only the active snap target (0–2 lines). */
export function snapPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  nodes: SimNode[],
  excludeId?: string,
  snap = true,
  sticky: SnapSticky = { x: null, y: null },
): { x: number; y: number; guides: Guides; sticky: SnapSticky } {
  if (!snap) {
    return { x, y, guides: { gx: [], gy: [] }, sticky: { x: null, y: null } };
  }
  const { xe, ye } = collectSnapEdges(x, y, w, h, nodes, excludeId);
  const sx = snapAxisSticky(x, xe, sticky.x);
  const sy = snapAxisSticky(y, ye, sticky.y);
  return {
    x: sx.v,
    y: sy.v,
    guides: {
      gx: sx.guide !== null ? [sx.guide] : [],
      gy: sy.guide !== null ? [sy.guide] : [],
    },
    sticky: { x: sx.sticky, y: sy.sticky },
  };
}

export function snapNode(
  n: SimNode,
  nodes: SimNode[],
  snap = true,
): void {
  const { x, y } = snapPosition(n.x, n.y, n.w, n.h, nodes, n.id, snap);
  n.x = x;
  n.y = y;
}

export function guidesFor(n: SimNode, nodes: SimNode[]): Guides {
  return guidesForRect(n.x, n.y, n.w, n.h, nodes, n.id);
}

/** Node-bounds box for a household (used by snapHousehold). */
export function hhBox(gid: string, nodes: SimNode[]): HhBox | null {
  const m = nodes.filter((n) => n.gid === gid);
  if (!m.length) return null;
  return {
    minx: Math.min(...m.map((n) => n.x)),
    miny: Math.min(...m.map((n) => n.y)),
    maxx: Math.max(...m.map((n) => n.x + n.w)),
    maxy: Math.max(...m.map((n) => n.y + n.h)),
  };
}

/** Drawn household box extent (matches drawGroups; includes title width). */
export function hhBoxDraw(
  gid: string,
  nodes: SimNode[],
  groups: Group[],
  packVis: (n: SimNode) => boolean,
): HhBoxDraw | null {
  const mem = nodes.filter((n) => n.gid === gid && packVis(n));
  if (!mem.length) return null;
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  mem.forEach((n) => {
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x + n.w);
    y1 = Math.max(y1, n.y + n.h);
  });
  const g0 = groups.find((g) => g.gid === gid);
  const pad = LAYOUT.hhPad;
  const HDROFF = LAYOUT.hhHeader;
  const label = [
    g0?.hh,
    g0?.nb && g0.nb !== '-' && g0.nb !== g0.world ? g0.nb : null,
    g0?.world,
  ]
    .filter(Boolean)
    .join('  ·  ');
  const lw = label ? label.length * 6.6 + 30 : 0;
  const boxW = Math.max(x1 - x0 + pad * 2, lw + pad);
  return { l: x0 - pad, t: y0 - pad - HDROFF, r: x0 - pad + boxW, b: y1 + pad };
}

/** Drawn world frame (matches WorldLayer: household union + title/margin). */
export function worldFrame(
  world: string,
  nodes: SimNode[],
  groups: Group[],
  packVis: (n: SimNode) => boolean,
): HhBoxDraw | null {
  const gids = new Set<string>();
  for (const n of nodes) {
    if (n.world !== world || !packVis(n)) continue;
    gids.add(n.gid);
  }
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  let any = false;
  for (const gid of gids) {
    const bx = hhBoxDraw(gid, nodes, groups, packVis);
    if (!bx) continue;
    any = true;
    x0 = Math.min(x0, bx.l);
    y0 = Math.min(y0, bx.t);
    x1 = Math.max(x1, bx.r);
    y1 = Math.max(y1, bx.b);
  }
  if (!any) return null;
  const M = LAYOUT.worldMargin;
  const TITLE = LAYOUT.worldTitle;
  return { l: x0 - M, t: y0 - TITLE, r: x1 + M, b: y1 + M };
}

function rectIntersectionArea(a: HhBoxDraw, b: HhBoxDraw): number {
  const l = Math.max(a.l, b.l);
  const t = Math.max(a.t, b.t);
  const r = Math.min(a.r, b.r);
  const btm = Math.min(a.b, b.b);
  if (r <= l || btm <= t) return 0;
  return (r - l) * (btm - t);
}

function dist2PointToRect(x: number, y: number, r: HhBoxDraw): number {
  const dx = x < r.l ? r.l - x : x > r.r ? x - r.r : 0;
  const dy = y < r.t ? r.t - y : y > r.b ? y - r.b : 0;
  return dx * dx + dy * dy;
}

/** Visible board area in world coordinates. */
export function viewportWorldRect(
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number,
): HhBoxDraw {
  const { tx, ty, k } = viewport;
  return {
    l: -tx / k,
    t: -ty / k,
    r: (svgWidth - tx) / k,
    b: (svgHeight - ty) / k,
  };
}

/** Top-left so a card of this size sits centred in the current view. */
export function cardOriginAtViewportCenter(
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number,
  cardW: number,
  cardH: number,
): { x: number; y: number } {
  const view = viewportWorldRect(viewport, svgWidth, svgHeight);
  return {
    x: (view.l + view.r) / 2 - cardW / 2,
    y: (view.t + view.b) / 2 - cardH / 2,
  };
}

/**
 * World whose frame covers the most of the current view. If nothing overlaps
 * (empty gap / zoomed into void), the closest frame to the view centre wins.
 */
export function dominantWorldInViewport(
  nodes: SimNode[],
  groups: Group[],
  packVis: (n: SimNode) => boolean,
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number,
): string | null {
  const view = viewportWorldRect(viewport, svgWidth, svgHeight);
  const cx = (view.l + view.r) / 2;
  const cy = (view.t + view.b) / 2;
  const names = new Set<string>();
  for (const n of nodes) {
    if (!n.world || n.world === '—' || !packVis(n)) continue;
    names.add(n.world);
  }
  let best: string | null = null;
  let bestArea = -1;
  let bestDist = Infinity;
  for (const world of names) {
    const frame = worldFrame(world, nodes, groups, packVis);
    if (!frame) continue;
    const area = rectIntersectionArea(view, frame);
    const dist = dist2PointToRect(cx, cy, frame);
    if (area > bestArea || (area === bestArea && dist < bestDist)) {
      best = world;
      bestArea = area;
      bestDist = dist;
    }
  }
  return best;
}

const HH_SNAP_TH = 16;

function hhBoxesNear(b: HhBox, range: number): (o: HhBox) => boolean {
  return (o) =>
    !(
      o.maxx + range < b.minx ||
      o.minx - range > b.maxx ||
      o.maxy + range < b.miny ||
      o.miny - range > b.maxy
    );
}

/** Snap a household drag delta; does not mutate nodes. */
export function snapHouseholdDelta(
  gid: string,
  nodes: SimNode[],
  dx: number,
  dy: number,
  snap = true,
): { dx: number; dy: number; guides: Guides } | null {
  if (!snap) return null;
  const members = nodes.filter((n) => n.gid === gid);
  if (!members.length) return null;
  const b = {
    minx: Math.min(...members.map((n) => n.x + dx)),
    miny: Math.min(...members.map((n) => n.y + dy)),
    maxx: Math.max(...members.map((n) => n.x + n.w + dx)),
    maxy: Math.max(...members.map((n) => n.y + n.h + dy)),
  };
  const others = [
    ...new Set(nodes.filter((n) => n.gid !== gid).map((n) => n.gid)),
  ]
    .map((g) => hhBox(g, nodes))
    .filter((x): x is HhBox => x !== null)
    .filter(hhBoxesNear(b, SNAP_RANGE));

  let snapDx = 0;
  let guideX: number | null = null;
  let bd = HH_SNAP_TH + 1;
  others.forEach((o) => {
    [o.minx - b.minx, o.maxx - b.maxx].forEach((off) => {
      if (Math.abs(off) < bd) {
        bd = Math.abs(off);
        snapDx = off;
        guideX = off === o.minx - b.minx ? o.minx : o.maxx;
      }
    });
  });
  if (bd > HH_SNAP_TH) {
    snapDx = Math.round(b.minx / GRID) * GRID - b.minx;
    guideX = null;
  }

  let snapDy = 0;
  let guideY: number | null = null;
  bd = HH_SNAP_TH + 1;
  others.forEach((o) => {
    [o.miny - b.miny, o.maxy - b.maxy].forEach((off) => {
      if (Math.abs(off) < bd) {
        bd = Math.abs(off);
        snapDy = off;
        guideY = off === o.miny - b.miny ? o.miny : o.maxy;
      }
    });
  });
  if (bd > HH_SNAP_TH) {
    snapDy = Math.round(b.miny / GRID) * GRID - b.miny;
    guideY = null;
  }

  return {
    dx: dx + snapDx,
    dy: dy + snapDy,
    guides: {
      gx: guideX !== null ? [guideX] : [],
      gy: guideY !== null ? [guideY] : [],
    },
  };
}

/** True when (wx, wy) is on a ⚭ / ❤ / ⚮ pill. */
export function unionAtPoint(
  wx: number,
  wy: number,
  unions: UnionRender[],
): UnionRender | null {
  for (let i = unions.length - 1; i >= 0; i--) {
    const u = unions[i]!;
    const w = PILL_W[u.type];
    if (Math.abs(wx - u.rx) <= w / 2 && Math.abs(wy - u.ry) <= PILL_H / 2)
      return u;
  }
  return null;
}

/**
 * Spouse union geometry. The connector is ALWAYS sideways: it leaves a tag
 * through its left or right edge and enters the relationship pill through the
 * pill's left or right edge. Height differences are absorbed by vertical jogs
 * that stay clear of both tags and of the pill.
 */
export function unionGeom(a: SimNode, b: SimNode): UnionGeom {
  const L = a.x <= b.x ? a : b;
  const R = a.x <= b.x ? b : a;
  const sx = L.x + L.w;
  const sy = L.y + L.h / 2;
  const ex = R.x;
  const ey = R.y + R.h / 2;
  const rx = (sx + ex) / 2;
  const ry = (sy + ey) / 2;
  const gap = ex - sx;
  const sameRow = Math.abs(sy - ey) < 12;

  // Same-generation partners: one straight horizontal between inner edges (∞ sits on midpoint).
  if (sameRow && ex > sx) {
    const pts = `${sx},${ry} ${ex},${ry}`;
    return { sx, sy: ry, ex, ey: ry, rx, ry, pts };
  }

  if (gap >= UNION_MIN_GAP) {
    const S = Math.min(STUB, gap / 2);
    const lx = rx - S;
    const rxx = rx + S;
    const pts = `${sx},${sy} ${lx},${sy} ${lx},${ry} ${rx},${ry} ${rxx},${ry} ${rxx},${ey} ${ex},${ey}`;
    return { sx, sy, ex, ey, rx, ry, pts };
  }

  if (Math.min(L.y + L.h, R.y + R.h) < Math.max(L.y, R.y)) {
    const first = gap < 0 && sy > ey ? R : L;
    const second = first === L ? R : L;
    const fx = first.x + first.w;
    const fy = first.y + first.h / 2;
    const gx = second.x;
    const gy = second.y + second.h / 2;
    const jogR = Math.max(fx, rx + PILL_HALF_W) + STUB;
    const jogL = Math.min(gx, rx - PILL_HALF_W) - STUB;
    const pts = `${fx},${fy} ${jogR},${fy} ${jogR},${ry} ${rx},${ry} ${jogL},${ry} ${jogL},${gy} ${gx},${gy}`;
    return { sx: fx, sy: fy, ex: gx, ey: gy, rx, ry, pts };
  }

  const bx = L.x;
  const bex = Math.max(L.x + L.w, R.x + R.w);
  const outL = bx - STUB;
  const outR = bex + STUB;
  const above = Math.min(L.y, R.y) - RGAP;
  const below = Math.max(L.y + L.h, R.y + R.h) + RGAP;
  const py = ry - above <= below - ry ? above : below;
  const pts = `${bx},${sy} ${outL},${sy} ${outL},${py} ${rx},${py} ${outR},${py} ${outR},${ey} ${bex},${ey}`;
  return { sx: bx, sy, ex: bex, ey, rx, ry: py, pts };
}

export function bbox(
  nodes: SimNode[],
  packVis: (n: SimNode) => boolean,
): [number, number, number, number] {
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  let any = false;
  nodes.forEach((n) => {
    if (!packVis(n)) return;
    any = true;
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x + n.w);
    y1 = Math.max(y1, n.y + n.h);
  });
  return any ? [x0, y0, x1, y1] : [0, 0, 100, 100];
}

export function buildRects(
  nodes: SimNode[],
  groups: Group[],
  show: ShowToggles,
  packVis: (n: SimNode) => boolean,
): BuildRectsResult {
  const R: Rect[] = [];
  for (const n of nodes) {
    if (!packVis(n)) continue;
    R.push({
      l: n.x - RGAP,
      t: n.y - RGAP,
      r: n.x + n.w + RGAP,
      b: n.y + n.h + RGAP,
      id: n.id,
    });
  }
  if (show.groups) {
    for (const g of groups) {
      const m = nodes.filter((n) => n.gid === g.gid && packVis(n));
      if (!m.length) continue;
      let x0 = 1e9;
      let y0 = 1e9;
      m.forEach((n) => {
        x0 = Math.min(x0, n.x);
        y0 = Math.min(y0, n.y);
      });
      const lw =
        [g.hh, g.nb && g.nb !== '-' && g.nb !== g.world ? g.nb : null, g.world]
          .filter(Boolean)
          .join('  ·  ').length *
          6.6 +
        40;
      R.push({
        l: x0 - 18 - RGAP,
        t: y0 - 58,
        r: x0 - 18 + lw + RGAP,
        b: y0 - 34,
        id: `__t_${g.gid}`,
      });
    }
  }
  if (show.worlds) {
    const byW: Record<string, SimNode[]> = {};
    nodes.forEach((n) => {
      const w = n.world;
      if (!w || w === '—' || !packVis(n)) return;
      (byW[w] = byW[w] || []).push(n);
    });
    Object.keys(byW).forEach((w) => {
      const m = byW[w]!;
      let x0 = 1e9;
      let y0 = 1e9;
      m.forEach((n) => {
        x0 = Math.min(x0, n.x);
        y0 = Math.min(y0, n.y);
      });
      const lw = w.length * 8.2 + 46;
      R.push({
        l: x0 - 30 - RGAP,
        t: y0 - 88,
        r: x0 - 30 + lw + RGAP,
        b: y0 - 60,
        id: `__w_${w}`,
      });
    });
  }
  const RBANDS: Record<number, Rect[]> = {};
  for (const r of R) {
    const b0 = Math.floor(r.t / BAND);
    const b1 = Math.floor(r.b / BAND);
    for (let bb = b0; bb <= b1; bb++) {
      (RBANDS[bb] = RBANDS[bb] || []).push(r);
    }
  }
  return { rects: R, rbands: RBANDS };
}

export function segHit(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: Rect,
): boolean {
  if (Math.abs(x1 - x2) < 1e-6) {
    if (x1 <= r.l || x1 >= r.r) return false;
    const lo = Math.min(y1, y2);
    const hi = Math.max(y1, y2);
    return !(hi <= r.t || lo >= r.b);
  }
  if (Math.abs(y1 - y2) < 1e-6) {
    if (y1 <= r.t || y1 >= r.b) return false;
    const lo = Math.min(x1, x2);
    const hi = Math.max(x1, x2);
    return !(hi <= r.l || lo >= r.r);
  }
  return false;
}

export function segClear(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rbands: Record<number, Rect[]>,
  ex?: Set<string>,
): boolean {
  const b0 = Math.floor(Math.min(y1, y2) / BAND);
  const b1 = Math.floor(Math.max(y1, y2) / BAND);
  for (let bb = b0; bb <= b1; bb++) {
    const arr = rbands[bb];
    if (!arr) continue;
    for (const r of arr) {
      if (ex?.has(r.id)) continue;
      if (segHit(x1, y1, x2, y2, r)) return false;
    }
  }
  return true;
}

export function ptsClear(
  pts: [number, number][],
  rbands: Record<number, Rect[]>,
  ex?: Set<string>,
): boolean {
  for (let i = 0; i + 1 < pts.length; i++) {
    if (
      !segClear(
        pts[i]![0],
        pts[i]![1],
        pts[i + 1]![0],
        pts[i + 1]![1],
        rbands,
        ex,
      )
    ) {
      return false;
    }
  }
  return true;
}
