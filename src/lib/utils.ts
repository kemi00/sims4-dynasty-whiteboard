import type { Edge, Point, World } from '../types/whiteboard.ts';

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
  const x = worlds.find((o) => o.name === w);
  return x ? x.color : '#9aa0a6';
};

export const cssesc = (s: string): string =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(s)
    : s.replace(/["\\]/g, '\\$&');
