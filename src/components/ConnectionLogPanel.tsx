import { ArrowsDownUp, X } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { CONNECTION_LOG_PANEL_W } from '../lib/constants.ts';
import { panelPosition } from '../lib/chrome.ts';
import { useCompactChrome } from '../hooks/useCompactChrome.ts';
import {
  relDisplay,
  sortConnectionLog,
  type ConnectionLogEntry,
  type LogPart,
} from '../lib/connectionLog.ts';

type Props = {
  entries: ConnectionLogEntry[];
  anchorRect: DOMRect | null;
  selectedSimId: string | null;
  isSelLink: (ids: string[]) => boolean;
  onPick: (entry: ConnectionLogEntry) => void;
  onFocusSim: (id: string) => void;
  onClose: () => void;
};

function LogParts({
  parts,
  createdAt,
  onFocusSim,
}: {
  parts: LogPart[];
  createdAt?: string;
  onFocusSim: (id: string) => void;
}) {
  return parts.map((part, i) => {
    if (part.kind === 'time') {
      return (
        <time
          key={i}
          className="connection-log__time"
          dateTime={createdAt}
        >
          {part.value}
        </time>
      );
    }
    if (part.kind === 'break') {
      return <br key={i} />;
    }
    if (part.kind === 'sim') {
      return (
        <button
          key={i}
          type="button"
          className="connection-log__sim"
          title={`Show ${part.name} on the board`}
          onClick={(e) => {
            e.stopPropagation();
            onFocusSim(part.id);
          }}
        >
          {part.name}
        </button>
      );
    }
    if (part.kind === 'rel') {
      return (
        <strong key={i} className="connection-log__rel">
          {relDisplay(part.mark, part.label)}
        </strong>
      );
    }
    return <span key={i}>{part.value}</span>;
  });
}

export function ConnectionLogPanel({
  entries,
  anchorRect,
  selectedSimId,
  isSelLink,
  onPick,
  onFocusSim,
  onClose,
}: Props) {
  const compact = useCompactChrome();
  const pos = panelPosition(anchorRect, CONNECTION_LOG_PANEL_W);
  const [newestFirst, setNewestFirst] = useState(true);
  const sorted = useMemo(
    () => sortConnectionLog(entries, newestFirst),
    [entries, newestFirst],
  );
  if (!pos) return null;

  const sortLabel = newestFirst
    ? 'Newest first. Click for oldest first.'
    : 'Oldest first. Click for newest first.';

  return (
    <div
      id="connection-log"
      className={
        compact
          ? 'gpanel connection-log gpanel--sheet'
          : 'gpanel connection-log'
      }
      style={{ display: 'block', ...pos }}
    >
      <div className="gph">
        <b>Your connections</b>
        <span>
          <button
            type="button"
            title={sortLabel}
            aria-label={sortLabel}
            aria-pressed={newestFirst}
            disabled={entries.length < 2}
            onClick={() => setNewestFirst((on) => !on)}
          >
            <ArrowsDownUp aria-hidden="true" />
          </button>
          <button type="button" aria-label="Close connection log" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="connection-log__empty">
          Links you add with Connect, and household moves from the editor, show
          up here. Deleting a link or a sim removes its line. Canon family
          links stay off this list.
        </p>
      ) : (
        <ul className="connection-log__list">
          {sorted.map((entry) => {
            const selected = entry.edgeIds.length
              ? isSelLink(entry.edgeIds)
              : !!entry.simId && entry.simId === selectedSimId;
            return (
              <li key={entry.id}>
                <div
                  className={
                    selected
                      ? 'connection-log__item connection-log__item--on'
                      : 'connection-log__item'
                  }
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onPick(entry)}
                >
                  <LogParts
                    parts={entry.parts}
                    createdAt={entry.createdAt}
                    onFocusSim={onFocusSim}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
