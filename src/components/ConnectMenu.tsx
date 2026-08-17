type Props = {
  aName: string;
  bName: string;
  left: number;
  top: number;
  onConfirm: (type: string) => void;
  onCancel: () => void;
};

const OPTIONS: [string, string][] = [
  ['marriage', '⚭ Marriage'],
  ['romance', '❤ Romance / partners'],
  ['divorced', '⚮ Divorced'],
  ['parent', '┳ parent → child'],
  ['childof', '┻ child of'],
  ['sibling', '⊓ Siblings'],
  ['custom', '➖ Other link'],
];

function labelFor(ty: string, aName: string, bName: string, lab: string) {
  if (ty === 'parent') return `┳ ${aName} is the parent of ${bName}`;
  if (ty === 'childof') return `┻ ${aName} is the child of ${bName}`;
  return lab;
}

export function ConnectMenu({
  aName,
  bName,
  left,
  top,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      id="menu"
      className="menu"
      style={{ display: 'block', left, top }}
    >
      <div style={{ fontSize: 10, color: '#889', padding: '2px 4px' }}>
        {aName} ↔ {bName}
      </div>
      {OPTIONS.map(([ty, lab]) => (
        <button key={ty} onClick={() => onConfirm(ty)}>
          {labelFor(ty, aName, bName, lab)}
        </button>
      ))}
      <button style={{ color: '#b00' }} onClick={onCancel}>
        ✕ cancel
      </button>
    </div>
  );
}
