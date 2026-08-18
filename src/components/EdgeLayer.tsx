import type { PointerEvent as ReactPointerEvent } from 'react';
import { COL, UEDIT } from '../lib/constants.ts';
import { ptsStr } from '../lib/utils.ts';
import type { BloodPath, BloodVert, UnionRender } from '../types/whiteboard.ts';

const PILL_H = 24;

/** Opaque capsule that masks the connector where the relationship glyph sits. */
function PillBg({
  x,
  y,
  w,
  color,
}: {
  x: number;
  y: number;
  w: number;
  color: string;
}) {
  return (
    <rect
      x={x - w / 2}
      y={y - PILL_H / 2}
      width={w}
      height={PILL_H}
      rx={PILL_H / 2}
      fill="#fff"
      stroke={`${color}44`}
      strokeWidth={1}
    />
  );
}

function RingPill({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <PillBg x={x} y={y} w={36} color={color} />
      <circle cx={x - 5.5} cy={y} r={6.6} fill="none" stroke={color} strokeWidth={2.3} />
      <circle cx={x + 5.5} cy={y} r={6.6} fill="none" stroke={color} strokeWidth={2.3} />
    </>
  );
}

// Material "favorite" glyph, authored in a 24×24 box centred on (12, 12.2).
const HEART_D =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function HeartPill({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <PillBg x={x} y={y} w={36} color={color} />
      <path
        d={HEART_D}
        fill={color}
        stroke="none"
        transform={`translate(${x} ${y}) scale(0.9) translate(-12 -12.2)`}
      />
    </>
  );
}

function DivorcePill({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <PillBg x={x} y={y} w={38} color={color} />
      <circle cx={x - 6.5} cy={y} r={6.3} fill="none" stroke={color} strokeWidth={2.2} />
      <circle cx={x + 6.5} cy={y} r={6.3} fill="none" stroke={color} strokeWidth={2.2} />
      {[-2.5, 1.5].map((o) => (
        <g key={o}>
          <line
            x1={x + o - 3}
            y1={y + 8}
            x2={x + o + 3}
            y2={y - 8}
            stroke="#fff"
            strokeWidth={3.4}
          />
          <line
            x1={x + o - 3}
            y1={y + 8}
            x2={x + o + 3}
            y2={y - 8}
            stroke={color}
            strokeWidth={1.9}
          />
        </g>
      ))}
    </>
  );
}

type Props = {
  blood: BloodPath[];
  bloodVerts: BloodVert[];
  hopD: (pts: [number, number][], verts: BloodVert[], pi: number) => string;
  unions: UnionRender[];
  customs: { edgeId: string; pts: [number, number][]; isUser: boolean }[];
  userEdgeIds: Set<string>;
  isSelLink: (ids: string[]) => boolean;
  connectMode: boolean;
  hitStroke: number;
  onLinkClick: (ids: string[], e: ReactPointerEvent) => void;
  onUnionClick: (a: string, b: string, e: ReactPointerEvent) => void;
};

export function EdgeLayer({
  blood,
  bloodVerts,
  hopD,
  unions,
  customs,
  userEdgeIds,
  isSelLink,
  connectMode,
  hitStroke,
  onLinkClick,
  onUnionClick,
}: Props) {
  return (
    <g id="lEdges">
      {blood.map((p, pi) => {
        const isU = p.ids?.some((id) => userEdgeIds.has(id));
        const col = isSelLink(p.ids)
          ? '#1b6cd6'
          : isU
            ? UEDIT
            : COL.blood;
        const d = hopD(p.pts, bloodVerts, pi);
        return (
          <g
            key={`blood-${pi}`}
            className="link edge"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (p.ids?.length) onLinkClick(p.ids, e);
            }}
          >
            <path
              d={d}
              fill="none"
              stroke={col}
              strokeWidth={2.3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={hitStroke}
            />
          </g>
        );
      })}
      {unions.map((u) => {
        const lineCol =
          u.type === 'divorced' ? UEDIT : u.isUser ? UEDIT : COL.marriage;
        const pillCol = u.type === 'romance' ? COL.romance : lineCol;
        const sq = isSelLink([u.edgeId]);
        const lc = sq ? '#1b6cd6' : lineCol;
        const pc = sq ? '#1b6cd6' : pillCol;
        return (
          <g
            key={u.edgeId}
            className="link edge"
            style={{ cursor: connectMode ? 'crosshair' : undefined }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onUnionClick(u.a, u.b, e);
            }}
          >
            <polyline
              points={u.pts}
              fill="none"
              stroke="transparent"
              strokeWidth={hitStroke}
            />
            <polyline
              points={u.pts}
              fill="none"
              stroke={lc}
              strokeWidth={2.3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {u.type === 'divorced' && (
              <DivorcePill x={u.rx} y={u.ry} color={pc} />
            )}
            {u.type === 'romance' && (
              <HeartPill x={u.rx} y={u.ry} color={pc} />
            )}
            {u.type === 'marriage' && (
              <RingPill x={u.rx} y={u.ry} color={pc} />
            )}
          </g>
        );
      })}
      {customs.map((c) => {
        const sq = isSelLink([c.edgeId]);
        const col = sq ? '#1b6cd6' : UEDIT;
        const pts = ptsStr(c.pts);
        return (
          <g
            key={c.edgeId}
            className="link edge"
            onPointerDown={(e) => {
              e.stopPropagation();
              onLinkClick([c.edgeId], e);
            }}
          >
            <polyline
              points={pts}
              fill="none"
              stroke={col}
              strokeWidth={2.3}
              strokeDasharray="7 5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={pts}
              fill="none"
              stroke="transparent"
              strokeWidth={hitStroke}
            />
          </g>
        );
      })}
    </g>
  );
}
