import { COL, UEDIT } from '../lib/constants.ts';
import { ptsStr } from '../lib/utils.ts';
import type { BloodPath, BloodVert, UnionRender } from '../types/whiteboard.ts';

function RingPill({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <circle cx={x - 5.5} cy={y} r={6.6} fill="none" stroke={color} strokeWidth={2.3} />
      <circle cx={x + 5.5} cy={y} r={6.6} fill="none" stroke={color} strokeWidth={2.3} />
    </>
  );
}

function HeartPill({ x, y, color }: { x: number; y: number; color: string }) {
  const sc = 0.9;
  const cx0 = 12;
  const cy0 = 12.2;
  const d = `M${x},${y} m${-cx0 * sc},${-cy0 * sc} c0,-3.5 2.8,-6.3 6.3,-6.3 2.1,0 3.9,1 5.1,2.6 1.2,-1.6 3,-2.6 5.1,-2.6 3.5,0 6.3,2.8 6.3,6.3 0,7.5 -11.4,13.4 -11.4,13.4 s-11.4,-5.9 -11.4,-13.4 z`;
  return <path d={d} fill={color} />;
}

function DivorcePill({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <RingPill x={x} y={y} color={color} />
      <line x1={x - 9} y1={y - 9} x2={x + 9} y2={y + 9} stroke={color} strokeWidth={2} />
      <line x1={x + 9} y1={y - 9} x2={x - 9} y2={y + 9} stroke={color} strokeWidth={2} />
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
  onLinkClick: (ids: string[], e: React.PointerEvent) => void;
  onUnionClick: (a: string, b: string, e: React.PointerEvent) => void;
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
              strokeWidth={16}
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
              strokeWidth={16}
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
              strokeWidth={16}
            />
          </g>
        );
      })}
    </g>
  );
}
