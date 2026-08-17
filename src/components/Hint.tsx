import { Info, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

export function Hint() {
  const [collapsed, setCollapsed] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setCollapsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (collapsed) return;
    const onPointer = (ev: PointerEvent) => {
      if (hintRef.current?.contains(ev.target as Node)) return;
      setCollapsed(true);
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
  }, [collapsed]);

  if (collapsed) {
    return (
      <button
        id="hintIcon"
        type="button"
        title="How to use"
        aria-label="How to use"
        style={{ display: 'flex' }}
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(false);
        }}
      >
        <Info />
      </button>
    );
  }

  return (
    <div id="hint" ref={hintRef}>
      <button
        id="hintClose"
        type="button"
        title="Close"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(true);
        }}
      >
        <X />
      </button>
      <b>How to use</b>
      <br />• <b>Drag</b> a tag to move it. Drag empty space to pan.
      <br />• <b>Connect</b>, then click two sims to link them (Marriage /
      Romance / Divorced / Parent→Child / Sibling). Links <b>you</b> add show
      in <b style={{ color: '#7c3aed' }}>violet</b>.
      <br />• Click a <b>⚭ / ❤</b> connection, then a sim, to make that sim
      the <b>child of both partners</b>.
      <br />• Click a tag or line, press <b>Delete</b> to remove.
      <br />• Double-click a tag to edit name/age.
      <br />• <b>Save .json</b> keeps your work and <b>Load</b> brings it back,
      both under the <b>⋮</b> menu at the top right.
    </div>
  );
}
