import { AGES_H } from '../lib/constants.ts';
import type { SimNode } from '../types/whiteboard.ts';

type Props = {
  nodes: SimNode[];
  hiAges: Set<string>;
  packVis: (n: SimNode) => boolean;
  anchorRect: DOMRect | null;
  onToggle: (age: string) => void;
  onClear: () => void;
};

export function AgesPanel({
  nodes,
  hiAges,
  packVis,
  anchorRect,
  onToggle,
  onClear,
}: Props) {
  if (!anchorRect) return null;
  let L = anchorRect.left;
  if (L + 266 > window.innerWidth) L = window.innerWidth - 266;

  const cnt = (a: string) => nodes.filter((n) => n.age === a).length;
  const total = nodes.length;
  const shown = nodes.filter(packVis).length;

  return (
    <div
      id="ages"
      className="gpanel"
      style={{
        display: 'block',
        left: Math.max(6, L),
        top: anchorRect.bottom + 6,
      }}
    >
      <div className="gph">
        <b>Highlight age / life-stage</b>
        <span>
          <button onClick={onClear}>Clear</button>
        </span>
      </div>
      <div style={{ margin: '0 4px 9px', fontSize: 12, color: '#3b4757' }}>
        <b>{total}</b> sims total
        {shown !== total && (
          <>
            {' '}
            · <b>{shown}</b> shown
          </>
        )}
      </div>
      <div className="agechips">
        {AGES_H.map((a) => (
          <button
            key={a}
            data-age={a}
            className={hiAges.has(a) ? 'on' : ''}
            onClick={() => onToggle(a)}
          >
            {a}{' '}
            <b style={{ opacity: 0.6 }}>{cnt(a)}</b>
          </button>
        ))}
      </div>
      <div
        style={{
          fontSize: 10,
          color: '#8a7f63',
          margin: '8px 4px 2px',
        }}
      >
        Highlighted sims glow gold; the rest dim. Pick several to compare.
      </div>
    </div>
  );
}
