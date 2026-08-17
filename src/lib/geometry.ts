import {
  ALIGN_TH,
  BAND,
  GRID,
  RGAP,
  STUB,
  UNION_MIN_GAP,
} from './constants.ts';
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

export function snapAxis(v: number, edges: number[]): number {
  let best: number | null = null;
  let bd = ALIGN_TH + 1;
  for (const e of edges) {
    const d = Math.abs(e - v);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best !== null ? Math.round(best) : Math.round(v / GRID) * GRID;
}

export function snapNode(
  n: SimNode,
  nodes: SimNode[],
  snap = true,
): void {
  if (!snap) return;
  const xe: number[] = [];
  const ye: number[] = [];
  for (const o of nodes) {
    if (o === n) continue;
    xe.push(o.x, o.x + o.w - n.w, o.x + o.w / 2 - n.w / 2);
    ye.push(o.y, o.y + o.h - n.h, o.y + o.h / 2 - n.h / 2);
  }
  n.x = snapAxis(n.x, xe);
  n.y = snapAxis(n.y, ye);
}

export function guidesFor(n: SimNode, nodes: SimNode[]): Guides {
  const gx = new Set<number>();
  const gy = new Set<number>();
  const L = [n.x, n.x + n.w / 2, n.x + n.w];
  const T = [n.y, n.y + n.h / 2, n.y + n.h];
  for (const o of nodes) {
    if (o === n) continue;
    [o.x, o.x + o.w / 2, o.x + o.w].forEach((v) =>
      L.forEach((l) => {
        if (Math.abs(v - l) < 1) gx.add(v);
      }),
    );
    [o.y, o.y + o.h / 2, o.y + o.h].forEach((v) =>
      T.forEach((t) => {
        if (Math.abs(v - t) < 1) gy.add(v);
      }),
    );
  }
  return { gx: [...gx], gy: [...gy] };
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
  const pad = 16;
  const HDROFF = 40;
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

export function snapHousehold(
  gid: string,
  nodes: SimNode[],
  snap = true,
): Guides | null {
  if (!snap) return null;
  const b = hhBox(gid, nodes);
  if (!b) return null;
  const others = [
    ...new Set(nodes.filter((n) => n.gid !== gid).map((n) => n.gid)),
  ]
    .map((g) => hhBox(g, nodes))
    .filter((x): x is HhBox => x !== null);
  const TH = 16;
  let ox: number | null = null;
  let bd = TH + 1;
  others.forEach((o) => {
    [o.minx - b.minx, o.maxx - b.maxx].forEach((off) => {
      if (Math.abs(off) < bd) {
        bd = Math.abs(off);
        ox = off;
      }
    });
  });
  if (ox === null) ox = Math.round(b.minx / GRID) * GRID - b.minx;
  let oy: number | null = null;
  bd = TH + 1;
  others.forEach((o) => {
    [o.miny - b.miny, o.maxy - b.maxy].forEach((off) => {
      if (Math.abs(off) < bd) {
        bd = Math.abs(off);
        oy = off;
      }
    });
  });
  if (oy === null) oy = Math.round(b.miny / GRID) * GRID - b.miny;
  nodes.forEach((n) => {
    if (n.gid === gid) {
      n.x = Math.round(n.x + ox!);
      n.y = Math.round(n.y + oy!);
    }
  });
  const gx: number[] = [];
  const gy: number[] = [];
  const nb = {
    minx: b.minx + ox,
    maxx: b.maxx + ox,
    miny: b.miny + oy,
    maxy: b.maxy + oy,
  };
  others.forEach((o) => {
    if (Math.abs(o.minx - nb.minx) < 1) gx.push(o.minx);
    if (Math.abs(o.maxx - nb.maxx) < 1) gx.push(o.maxx);
    if (Math.abs(o.miny - nb.miny) < 1) gy.push(o.miny);
    if (Math.abs(o.maxy - nb.maxy) < 1) gy.push(o.maxy);
  });
  return { gx, gy };
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

  if (gap >= UNION_MIN_GAP) {
    // The tags face each other with room to spare, so the pill drops straight
    // into the gap: out of L's right edge, into the pill's left edge, out of
    // the pill's right edge, into R's left edge.
    const S = Math.max(14, Math.min(26, gap / 2 - 14));
    const lx = rx - S;
    const rxx = rx + S;
    const pts = `${sx},${sy} ${lx},${sy} ${lx},${ry} ${rx},${ry} ${rxx},${ry} ${rxx},${ey} ${ex},${ey}`;
    return { sx, sy, ex, ey, rx, ry, pts };
  }

  // The tags overlap horizontally (typically stacked), so there is no gap to
  // sit in. Wrap around the outside instead: the upper tag leaves its right
  // edge and enters the pill's right edge, and the pill's left edge runs out
  // and back into the lower tag's left edge. Both vertical jogs stay outside
  // every tag, so nothing is ever entered from the top or bottom.
  const T = sy <= ey ? L : R;
  const B = sy <= ey ? R : L;
  const tx = T.x + T.w;
  const ty = T.y + T.h / 2;
  const bx = B.x;
  const by = B.y + B.h / 2;
  const outR = Math.max(L.x + L.w, R.x + R.w) + STUB;
  const outL = Math.min(L.x, R.x) - STUB;
  const pts = `${tx},${ty} ${outR},${ty} ${outR},${ry} ${rx},${ry} ${outL},${ry} ${outL},${by} ${bx},${by}`;
  return { sx: tx, sy: ty, ex: bx, ey: by, rx, ry, pts };
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
