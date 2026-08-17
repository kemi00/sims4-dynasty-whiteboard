import type { SimNode } from '../types/whiteboard.ts';

type Props = {
  packs: string[];
  hiddenPacks: Set<string>;
  nodes: SimNode[];
  anchorRect: DOMRect | null;
  onToggle: (pack: string, visible: boolean) => void;
  onAll: () => void;
  onNone: () => void;
  onClose: () => void;
};

export function GamesPanel({
  packs,
  hiddenPacks,
  nodes,
  anchorRect,
  onToggle,
  onAll,
  onNone,
}: Props) {
  if (!anchorRect) return null;
  let L = anchorRect.left;
  if (L + 266 > window.innerWidth) L = window.innerWidth - 266;

  const colorOf = (p: string) =>
    nodes.find((x) => x.pack === p)?.color ?? '#9aa0a6';
  const cnt = (p: string) => nodes.filter((n) => n.pack === p).length;

  return (
    <div
      id="games"
      className="gpanel"
      style={{
        display: 'block',
        left: Math.max(6, L),
        top: anchorRect.bottom + 6,
      }}
    >
      <div className="gph">
        <b>Games / packs</b>
        <span>
          <button onClick={onAll}>All</button>
          <button onClick={onNone}>None</button>
        </span>
      </div>
      {packs.map((p) => {
        const on = !hiddenPacks.has(p);
        return (
          <label key={p} className="grow">
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => onToggle(p, e.target.checked)}
            />
            <i style={{ background: colorOf(p) }} />
            <span>{p}</span>
            <b>{cnt(p)}</b>
          </label>
        );
      })}
    </div>
  );
}
