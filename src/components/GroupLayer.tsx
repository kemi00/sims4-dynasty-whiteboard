import type { Group, SimNode } from '../types/whiteboard.ts';
import { LAYOUT } from '../lib/layout.ts';

type Props = {
  groups: Group[];
  nodes: SimNode[];
  show: boolean;
  packVis: (n: SimNode) => boolean;
  onHouseholdDragStart: (
    gid: string,
    wx: number,
    wy: number,
    base: Record<string, { ox: number; oy: number }>,
  ) => void;
};

export function GroupLayer({
  groups,
  nodes,
  show,
  packVis,
  onHouseholdDragStart,
}: Props) {
  if (!show) return null;

  return (
    <g id="lGroups">
      {groups.map((g0) => {
        const mem = nodes.filter((n) => n.gid === g0.gid && packVis(n));
        if (!mem.length) return null;
        let x0 = 1e9,
          y0 = 1e9,
          x1 = -1e9,
          y1 = -1e9;
        mem.forEach((n) => {
          x0 = Math.min(x0, n.x);
          y0 = Math.min(y0, n.y);
          x1 = Math.max(x1, n.x + n.w);
          y1 = Math.max(y1, n.y + n.h);
        });
        const pad = LAYOUT.hhPad;
        const HDROFF = LAYOUT.hhHeader;
        const label = [
          g0.hh,
          g0.nb && g0.nb !== '-' && g0.nb !== g0.world ? g0.nb : null,
          g0.world,
        ]
          .filter(Boolean)
          .join('  ·  ');
        const lw = label.length * 6.6 + 30;
        const boxW = Math.max(x1 - x0 + pad * 2, lw + pad);
        return (
          <g key={g0.gid}>
            <rect
              x={x0 - pad}
              y={y0 - pad - HDROFF}
              width={boxW}
              height={y1 - y0 + pad * 2 + HDROFF}
              rx={14}
              fill={g0.color + '12'}
              stroke={g0.color + '55'}
              strokeWidth={1.5}
              strokeDasharray="2 4"
              style={{ pointerEvents: 'none' }}
            />
            <g
              className="hhandle"
              style={{ cursor: 'grab' }}
              onPointerDown={(ev) => {
                ev.stopPropagation();
                const base: Record<string, { ox: number; oy: number }> = {};
                nodes.forEach((n) => {
                  if (n.gid === g0.gid)
                    base[n.id] = { ox: n.ox ?? 0, oy: n.oy ?? 0 };
                });
                const svg = (ev.target as Element).closest('svg');
                const r = svg!.getBoundingClientRect();
                const scene = svg!.querySelector('#scene')!;
                const { tx, ty, k } = JSON.parse(
                  scene.getAttribute('data-vp') || '{}',
                ) as { tx: number; ty: number; k: number };
                const wx = (ev.clientX - r.left - tx) / k;
                const wy = (ev.clientY - r.top - ty) / k;
                onHouseholdDragStart(g0.gid, wx, wy, base);
                (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
              }}
            >
              <rect
                x={x0 - pad}
                y={y0 - pad - HDROFF}
                width={lw}
                height={19}
                rx={8}
                fill={g0.color + '22'}
                stroke={g0.color + '55'}
                strokeWidth={1}
              />
              <text
                x={x0 - pad + 8}
                y={y0 - pad - HDROFF + 14}
                fontSize={12}
                fill={g0.color + '99'}
              >
                ⠿
              </text>
              <text
                x={x0 - pad + 22}
                y={y0 - pad - HDROFF + 13}
                fontSize={12}
                fontWeight={700}
                fill={g0.color}
              >
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
