import { useEffect, useState } from 'react';

export function Hint() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCollapsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (collapsed) {
    return (
      <button
        id="hintIcon"
        title="How to use"
        style={{ display: 'flex' }}
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(false);
        }}
      >
        ⓘ
      </button>
    );
  }

  return (
    <div id="hint">
      <button
        id="hintClose"
        title="close"
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(true);
        }}
      >
        ✕
      </button>
      <b>How to use</b>
      <br />• <b>Drag</b> a tag to move it. Drag empty space to pan.
      <br />• <b>＋ Connect</b>, then click two sims to link them (Marriage /
      Romance / Divorced / Parent→Child / Sibling). Links <b>you</b> add show
      in <b style={{ color: '#7c3aed' }}>violet</b>.
      <br />• Click a <b>⚭ / ❤</b> connection, then a sim, to make that sim
      the <b>child of both partners</b>.
      <br />• Click a tag or line, press <b>Delete</b> to remove.
      <br />• Double-click a tag to edit name/age.
      <br />• <b>Save .json</b> keeps your work; <b>Load</b> brings it back.
    </div>
  );
}
