import { IconContext } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import './App.css';
import { AgesPanel } from './components/AgesPanel.tsx';
import { AppBar } from './components/AppBar.tsx';
import { GamesPanel } from './components/GamesPanel.tsx';
import { WhiteboardStage } from './components/WhiteboardStage.tsx';
import { useWhiteboard } from './hooks/useWhiteboard.ts';

/** One icon size and weight for the whole app, set once. */
const ICONS = { size: 17, weight: 'regular' } as const;

export default function App() {
  const wb = useWhiteboard();
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gamesBtnRef = useRef<HTMLButtonElement>(null);
  const agesBtnRef = useRef<HTMLButtonElement>(null);
  const gamesPanelRef = useRef<HTMLDivElement>(null);
  const agesPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (wb.gamesOpen) wb.setGamesOpen(false);
        else if (wb.agesOpen) wb.setAgesOpen(false);
        else if (wb.editNodeId) wb.setEditNodeId(null);
        else if (wb.connectMenu) {
          wb.setConnectMenu(null);
          wb.cancelConnect();
        } else if (wb.connSrc) {
          wb.cancelConnect();
          wb.setStatus(
            'Cancelled that link — still in Connect. Click a sim, or Esc again to exit.',
          );
        } else if (wb.connectMode) wb.setConnectMode(false);
      }
      if (
        (ev.key === 'Delete' || ev.key === 'Backspace') &&
        wb.sel &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        ev.preventDefault();
        wb.deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wb]);

  useEffect(() => {
    const onPointer = (ev: PointerEvent) => {
      const t = ev.target as Node;
      if (
        wb.gamesOpen &&
        gamesPanelRef.current &&
        !gamesPanelRef.current.contains(t) &&
        !gamesBtnRef.current?.contains(t)
      ) {
        wb.setGamesOpen(false);
      }
      if (
        wb.agesOpen &&
        agesPanelRef.current &&
        !agesPanelRef.current.contains(t) &&
        !agesBtnRef.current?.contains(t)
      ) {
        wb.setAgesOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
  }, [wb.gamesOpen, wb.agesOpen, wb]);

  return (
    <IconContext.Provider value={ICONS}>
      <div id="app">
        <AppBar
          wb={wb}
          svgRef={svgRef}
          gamesBtnRef={gamesBtnRef}
          agesBtnRef={agesBtnRef}
        />
        <WhiteboardStage wb={wb} svgRef={svgRef} stageRef={stageRef} />
        {wb.gamesOpen && (
          <div ref={gamesPanelRef}>
            <GamesPanel
              packs={wb.packs}
              hiddenPacks={wb.hiddenPacks}
              nodes={wb.nodes}
              anchorRect={
                gamesBtnRef.current?.getBoundingClientRect() ?? null
              }
              onToggle={wb.togglePack}
              onAll={() => wb.setHiddenPacks(new Set())}
              onNone={() => wb.setHiddenPacks(new Set(wb.packs))}
              onClose={() => wb.setGamesOpen(false)}
            />
          </div>
        )}
        {wb.agesOpen && (
          <div ref={agesPanelRef}>
            <AgesPanel
              nodes={wb.nodes}
              hiAges={wb.hiAges}
              packVis={wb.packVis}
              anchorRect={agesBtnRef.current?.getBoundingClientRect() ?? null}
              onToggle={wb.toggleAge}
              onClear={() => wb.setHiAges(new Set())}
            />
          </div>
        )}
      </div>
    </IconContext.Provider>
  );
}
