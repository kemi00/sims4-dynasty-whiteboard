import type { PointerEvent as ReactPointerEvent } from 'react';
import { worldFrame } from '../lib/geometry.ts';
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
    ev: ReactPointerEvent,
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

  const worldNames: string[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    const w = n.world;
    if (!w || w === '—' || !packVis(n) || seen.has(w)) continue;
    seen.add(w);
    worldNames.push(w);
  }

  return (
    <g id="lWorlds">
      {worldNames.map((w) => {
        const frame = worldFrame(w, nodes, groups, packVis);
        if (!frame) return null;
        const col = worldColor(w, worlds);
        const bx = frame.l;
        const by = frame.t;
        const bw = frame.r - frame.l;
        const bh = frame.b - frame.t;
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
                onWorldDragStart(w, wx, wy, base, ev);
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
