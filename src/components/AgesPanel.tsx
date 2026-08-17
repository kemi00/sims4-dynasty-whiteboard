import { AGES_H, SPECIES, SPECIES_H } from '../lib/constants.ts';
import { isPet } from '../lib/utils.ts';
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

  const sims = nodes.filter((n) => !isPet(n));
  const pets = nodes.filter(isPet);
  const cntAge = (a: string) => sims.filter((n) => n.age === a).length;
  const cntSpecies = (s: string) =>
    pets.filter((n) => n.species === s).length;
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
        <b>Highlight age / life-stage / pets</b>
        <span>
          <button onClick={onClear}>Clear</button>
        </span>
      </div>
      <div style={{ margin: '0 4px 9px', fontSize: 12, color: '#3b4757' }}>
        <b>{sims.length}</b> sims
        {pets.length > 0 && (
          <>
            {' '}
            · <b>{pets.length}</b> pets
          </>
        )}
        {shown !== nodes.length && (
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
            <b style={{ opacity: 0.6 }}>{cntAge(a)}</b>
          </button>
        ))}
      </div>
      {pets.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6b7280',
              margin: '10px 4px 6px',
              letterSpacing: '0.02em',
            }}
          >
            Pets
          </div>
          <div className="agechips">
            {SPECIES_H.map((s) => (
              <button
                key={s}
                data-species={s}
                className={hiAges.has(s) ? 'on' : ''}
                onClick={() => onToggle(s)}
              >
                {SPECIES[s]} {s}{' '}
                <b style={{ opacity: 0.6 }}>{cntSpecies(s)}</b>
              </button>
            ))}
          </div>
        </>
      )}
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
