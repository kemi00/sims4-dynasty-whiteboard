import { useCompactChrome } from '../hooks/useCompactChrome.ts';

type Props = {
  aName: string;
  bName: string;
  left: number;
  top: number;
  /** Hide sibling option when both sims already share parents on the board. */
  hideSibling?: boolean;
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
  hideSibling,
  onConfirm,
  onCancel,
}: Props) {
  const compact = useCompactChrome();
  const options = hideSibling
    ? OPTIONS.filter(([ty]) => ty !== 'sibling')
    : OPTIONS;
  return (
    <div
      id="menu"
      className={compact ? 'menu menu--sheet' : 'menu'}
      style={
        compact
          ? { display: 'block' }
          : { display: 'block', left, top }
      }
    >
      <div style={{ fontSize: 10, color: '#889', padding: '2px 4px' }}>
        {aName} ↔ {bName}
      </div>
      {options.map(([ty, lab]) => (
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
