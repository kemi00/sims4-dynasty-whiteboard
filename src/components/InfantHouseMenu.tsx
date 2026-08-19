import { useFitMenuInStage } from '../hooks/useFitMenuInStage.ts';

export type InfantHouseChoice = {
  gid: string;
  label: string;
};

type Props = {
  left: number;
  top: number;
  options: InfantHouseChoice[];
  onPick: (gid: string) => void;
  onCancel: () => void;
};

export function InfantHouseMenu({
  left,
  top,
  options,
  onPick,
  onCancel,
}: Props) {
  const { compact, ref, style } = useFitMenuInStage(left, top);
  return (
    <div
      ref={ref}
      id="menu"
      className={compact ? 'menu menu--sheet' : 'menu'}
      role="dialog"
      aria-label="Where will the infant live?"
      style={style}
    >
      <div style={{ fontSize: 10, color: '#889', padding: '2px 4px' }}>
        Where will the infant live?
      </div>
      {options.map((o) => (
        <button key={o.gid} type="button" onClick={() => onPick(o.gid)}>
          {o.label}
        </button>
      ))}
      <button type="button" style={{ color: '#b00' }} onClick={onCancel}>
        ✕ cancel
      </button>
    </div>
  );
}
