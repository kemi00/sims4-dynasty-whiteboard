import { useEffect, useState } from 'react';
import { AGES, LIFE_STATES } from '../lib/constants.ts';
import type { Group, SimNode, World } from '../types/whiteboard.ts';

type Props = {
  node: SimNode;
  worlds: World[];
  groups: Group[];
  nodes: SimNode[];
  left: number;
  top: number;
  onSave: (patch: { first: string; sur: string; age: string; state: string }) => void;
  onMove: (world: string, houseGid: string | '__new', newName?: string) => void;
  onClose: () => void;
};

export function SimEditor({
  node: n,
  worlds,
  groups,
  nodes,
  left,
  top,
  onSave,
  onMove,
  onClose,
}: Props) {
  const [name, setName] = useState(`${n.first} ${n.sur}`);
  const [age, setAge] = useState(n.age);
  const [state, setState] = useState(n.state || 'Sim');
  const [moveOpen, setMoveOpen] = useState(false);
  const [world, setWorld] = useState(n.oworld || n.world || worlds[0]?.name || '');
  const [house, setHouse] = useState('');
  const [newName, setNewName] = useState('');

  const mid =
    n.onb && n.onb !== '-'
      ? n.onb
      : n.oplay === 'NPC'
        ? 'NPC'
        : n.oplay !== 'Resident'
          ? 'Townie'
          : '—';

  const houseOptions = (() => {
    const seen = new Set<string>();
    const opts: { gid: string; hh: string }[] = [];
    groups.forEach((g) => {
      if (
        g.world === world &&
        g.gid !== n.gid &&
        !seen.has(g.gid) &&
        nodes.some((x) => x.gid === g.gid)
      ) {
        seen.add(g.gid);
        opts.push({ gid: g.gid, hh: g.hh });
      }
    });
    return opts;
  })();

  useEffect(() => {
    if (moveOpen && !house && houseOptions.length) {
      setHouse(houseOptions[0]!.gid);
    }
  }, [moveOpen, world, houseOptions, house]);

  return (
    <div
      id="editor"
      className="editor"
      style={{ display: 'block', left, top }}
    >
      <button className="edx" title="close" onClick={onClose}>
        ✕
      </button>
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <label>Age / life stage</label>
      <select value={age} onChange={(e) => setAge(e.target.value)}>
        {AGES.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
        {!AGES.includes(age as (typeof AGES)[number]) && (
          <option value={age}>{age}</option>
        )}
      </select>
      <label>Life state</label>
      <select value={state} onChange={(e) => setState(e.target.value)}>
        {LIFE_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        {!LIFE_STATES.includes(state as (typeof LIFE_STATES)[number]) && (
          <option value={state}>{state}</option>
        )}
      </select>
      <label>Game pack</label>
      <div className="ro">{n.pack || '—'}</div>
      <label>Original household</label>
      <div className="ro">
        {n.oworld || '—'} · {mid} · {n.ohh || '—'}
      </div>
      <button className="movebtn" onClick={() => setMoveOpen(!moveOpen)}>
        ↪ Move to a new household
      </button>
      {moveOpen && (
        <div id="edMove">
          <label>World</label>
          <select
            value={world}
            onChange={(e) => {
              setWorld(e.target.value);
              setHouse('');
            }}
          >
            {worlds.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
          <label>Household</label>
          <select
            value={house}
            onChange={(e) => setHouse(e.target.value)}
          >
            {houseOptions.map((o) => (
              <option key={o.gid} value={o.gid}>
                {o.hh}
              </option>
            ))}
            <option value="__new">➕ Create a new household…</option>
          </select>
          {house === '__new' && (
            <input
              placeholder="New household name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ marginTop: 6 }}
            />
          )}
          <button
            className="movego"
            onClick={() =>
              onMove(world, house as string | '__new', newName)
            }
          >
            Move {n.first} here
          </button>
        </div>
      )}
      <div className="row">
        <button
          onClick={() => {
            const parts = name.trim().split(' ');
            const first = parts.shift() || name;
            const sur = parts.join(' ');
            onSave({ first, sur, age, state });
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
