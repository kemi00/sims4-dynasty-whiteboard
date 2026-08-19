import { simName } from '../lib/connectionLog.ts';
import type { SimNode } from '../types/whiteboard.ts';

type Props = {
  node: SimNode | undefined;
  onShowEveryone: () => void;
};

export function BloodlineBanner({ node, onShowEveryone }: Props) {
  const name = node ? simName(node) : 'this sim';
  return (
    <div
      className="bloodline-banner"
      role="status"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p>
        Tags not in {name}'s bloodline are dimmed. Ancestors and descendants
        stay. Esc also shows everyone.
      </p>
      <button type="button" onClick={onShowEveryone}>
        Show everyone
      </button>
    </div>
  );
}
