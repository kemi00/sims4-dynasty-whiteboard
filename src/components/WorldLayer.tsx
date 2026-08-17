import { hhBoxDraw } from '../lib/geometry.ts';
import { LAYOUT } from '../lib/layout.ts';
import { worldColor } from '../lib/utils.ts';
import type { Group, SimNode, World } from '../types/whiteboard.ts';

type Props = {
  nodes: SimNode[];
  groups: Group[];
  worlds: World[];
  show: boolean;
  packVis: (n: SimNode) => boolean;
  onWorldDragStart: (
    world: string,
    wx: number,
    wy: number,
    base: Record<string, { ox: number; oy: number }>,
  ) => void;
};

export function WorldLayer({
  nodes,
  groups,
  worlds,
  show,
  packVis,
  onWorldDragStart,
}: Props) {
  if (!show) return null;

  const byW: Record<string, Set<string>> = {};
  nodes.forEach((n) => {
    const w = n.world;
    if (!w || w === '—' || !packVis(n)) return;
    (byW[w] = byW[w] || new Set()).add(n.gid);
  });

  return (
    <g id="lWorlds">
      {Object.keys(byW).map((w) => {
        let x0 = 1e9,
          y0 = 1e9,
          x1 = -1e9,
          y1 = -1e9,
          any = false;
        byW[w]!.forEach((gid) => {
          const bx = hhBoxDraw(gid, nodes, groups, packVis);
          if (!bx) return;
          any = true;
          x0 = Math.min(x0, bx.l);
          y0 = Math.min(y0, bx.t);
          x1 = Math.max(x1, bx.r);
          y1 = Math.max(y1, bx.b);
        });
        if (!any) return null;
        const col = worldColor(w, worlds);
        const M = LAYOUT.worldMargin;
        const TITLE = LAYOUT.worldTitle;
        const bx = x0 - M;
        const by = y0 - TITLE;
        const bw = x1 - x0 + M * 2;
        const bh = y1 - y0 + TITLE + M;
        const lw = w.length * 8.2 + 46;
        return (
          <g key={w}>
            <rect
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx={22}
              fill={col + '0c'}
              stroke={col + '66'}
              strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
            <g
              className="whandle"
              style={{ cursor: 'grab' }}
              onPointerDown={(ev) => {
                ev.stopPropagation();
                const base: Record<string, { ox: number; oy: number }> = {};
                nodes.forEach((n) => {
                  if (n.world === w)
                    base[n.id] = { ox: n.ox ?? 0, oy: n.oy ?? 0 };
                });
                const svg = (ev.target as Element).closest('svg');
                const r = svg!.getBoundingClientRect();
                const { tx, ty, k } = JSON.parse(
                  svg!.querySelector('#scene')!.getAttribute('data-vp') || '{}',
                ) as { tx: number; ty: number; k: number };
                const wx = (ev.clientX - r.left - tx) / k;
                const wy = (ev.clientY - r.top - ty) / k;
                onWorldDragStart(w, wx, wy, base);
                (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
              }}
            >
              <rect
                x={bx}
                y={by}
                width={lw}
                height={26}
                rx={13}
                fill={col}
                stroke={col}
                strokeWidth={1}
              />
              <text x={bx + 14} y={by + 18} fontSize={12} fill="#ffffffbb">
                ⠿
              </text>
              <text
                x={bx + 31}
                y={by + 18}
                fontSize={14}
                fontWeight={800}
                fill="#fff"
              >
                {w}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
