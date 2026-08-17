import type { World } from '../types/whiteboard.ts';

export function Legend({ worlds }: { worlds: World[] }) {
  return (
    <div id="legend">
      <h3>Worlds</h3>
      {worlds.map((w) => (
        <div key={w.name} className="lg">
          <i style={{ background: w.color }} />
          {w.name}
        </div>
      ))}
      <h3 style={{ marginTop: 8 }}>Links</h3>
      <div className="lg">
        <span style={{ fontSize: 13, lineHeight: 1, color: '#3f4756' }}>⊥</span>{' '}
        parent → child
      </div>
      <div className="lg">
        <span style={{ fontSize: 12, lineHeight: 1 }}>⊓</span> siblings
      </div>
      <div className="lg">
        <span style={{ fontSize: 13, lineHeight: 1, color: '#e0365f' }}>❤</span>{' '}
        romance / partners (dating, engaged, affair)
      </div>
      <div className="lg">
        <span style={{ fontSize: 13, lineHeight: 1 }}>⚭</span> married
      </div>
      <div className="lg">
        <span style={{ fontSize: 13, lineHeight: 1, color: '#7c3aed' }}>⚮</span>{' '}
        divorced
      </div>
      <div
        className="lg"
        style={{ marginTop: 6, alignItems: 'flex-start' }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#7c3aed',
            flex: '0 0 auto',
            marginTop: 1,
          }}
        />
        <span>
          <b style={{ color: '#7c3aed' }}>violet</b> = links you added/changed
          <br />
          <span style={{ color: '#8a7f63' }}>
            (canon links keep their colours)
          </span>
        </span>
      </div>
    </div>
  );
}
