import type { SimNode } from '../types/whiteboard.ts';

type Props = {
  playabilities: string[];
  hiddenPlay: Set<string>;
  nodes: SimNode[];
  anchorRect: DOMRect | null;
  onToggle: (oplay: string, visible: boolean) => void;
  onAll: () => void;
  onNone: () => void;
};

export function PlayabilityPanel({
  playabilities,
  hiddenPlay,
  nodes,
  anchorRect,
  onToggle,
  onAll,
  onNone,
}: Props) {
  if (!anchorRect) return null;
  let L = anchorRect.left;
  if (L + 266 > window.innerWidth) L = window.innerWidth - 266;

  const cnt = (p: string) => nodes.filter((n) => n.oplay === p).length;

  return (
    <div
      id="playability"
      className="gpanel"
      style={{
        display: 'block',
        left: Math.max(6, L),
        top: anchorRect.bottom + 6,
      }}
    >
      <div className="gph">
        <b>Playability</b>
        <span>
          <button type="button" onClick={onAll}>
            All
          </button>
          <button type="button" onClick={onNone}>
            None
          </button>
        </span>
      </div>
      {playabilities.map((p) => {
        const on = !hiddenPlay.has(p);
        return (
          <label key={p} className="grow">
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => onToggle(p, e.target.checked)}
            />
            <span>{p}</span>
            <b>{cnt(p)}</b>
          </label>
        );
      })}
    </div>
  );
}
