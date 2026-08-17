import { memo } from 'react';
import { COL, OCC, UEDIT } from '../lib/constants.ts';
import { isUserE } from '../lib/utils.ts';
import type { SimNode } from '../types/whiteboard.ts';

type Props = {
  node: SimNode;
  selected: boolean;
  connectHighlight: boolean;
  hiAges: Set<string>;
  onPointerDown: (e: React.PointerEvent, n: SimNode) => void;
};

export const SimNodeView = memo(function SimNodeView({
  node: n,
  selected,
  connectHighlight,
  hiAges,
  onPointerDown,
}: Props) {
  const added = !!n.added;
  const fill = added ? '#f4efff' : n.townie ? '#f6f4ef' : '#ffffff';
  const bcol = added ? UEDIT : n.color;
  const hasBadge = n.state && n.state !== 'Sim' && OCC[n.state];
  const ageClass =
    hiAges.size > 0 ? (hiAges.has(n.age) ? 'agehl' : 'agedim') : '';

  return (
    <g
      className={`node ${ageClass} ${selected ? 'sel' : ''}`}
      data-id={n.id}
      transform={`translate(${n.x},${n.y})`}
      onPointerDown={(e) => onPointerDown(e, n)}
    >
      <rect
        x={0}
        y={0}
        width={n.w}
        height={n.h}
        rx={11}
        fill={fill}
        stroke={connectHighlight ? '#1b6cd6' : bcol}
        strokeWidth={2.4}
        strokeDasharray={added ? '5 3' : undefined}
        style={{ cursor: 'grab' }}
      />
      <rect
        x={0}
        y={0}
        width={7}
        height={n.h}
        fill={bcol}
        clipPath="url(#tagclip)"
      />
      <text x={16} y={21} fontSize={13} fontWeight={700} fill="#1b2b3a">
        {n.first} {n.sur}
      </text>
      <text x={16} y={37} fontSize={10.5} fill="#5b6472">
        {n.age}
        {n.gender && n.gender !== '-' ? ` · ${n.gender}` : ''}
      </text>
      {hasBadge && (
        <>
          <circle
            cx={n.w - 15}
            cy={15}
            r={10}
            fill="#fff"
            stroke={n.color}
            strokeWidth={1.4}
          />
          <text
            x={n.w - 15}
            y={19}
            fontSize={11}
            textAnchor="middle"
          >
            {OCC[n.state]}
          </text>
        </>
      )}
      {added && !hasBadge && (
        <>
          <circle
            cx={n.w - 15}
            cy={15}
            r={10}
            fill={UEDIT}
            stroke="#fff"
            strokeWidth={1.4}
          />
          <text
            x={n.w - 15}
            y={19.5}
            fontSize={13}
            fontWeight={700}
            textAnchor="middle"
            fill="#fff"
          >
            ＋
          </text>
        </>
      )}
    </g>
  );
});

export { COL, isUserE };
