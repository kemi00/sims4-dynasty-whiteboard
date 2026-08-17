import {
  GameController,
  Globe,
  Highlighter,
  House,
  LinkSimple,
  MagnifyingGlass,
  Trash,
  TreeStructure,
  UserPlus,
} from '@phosphor-icons/react';
import type { WhiteboardApi } from '../hooks/useWhiteboard.ts';
import { OverflowMenu } from './OverflowMenu.tsx';
import { ToolButton } from './ToolButton.tsx';

type Props = {
  wb: WhiteboardApi;
  svgRef: React.RefObject<SVGSVGElement | null>;
  gamesBtnRef: React.RefObject<HTMLButtonElement | null>;
  agesBtnRef: React.RefObject<HTMLButtonElement | null>;
};

export function AppBar({ wb, svgRef, gamesBtnRef, agesBtnRef }: Props) {
  const hiddenCount = wb.hiddenPacks.size;
  const ageCount = wb.hiAges.size;

  const svgSize = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 800, h: r?.height ?? 600 };
  };

  const addAtCentre = () => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const { tx, ty, k } = wb.viewport;
    wb.addSim(
      Math.round((r.width / 2 - tx) / k),
      Math.round((r.height / 2 - ty) / k),
    );
  };

  return (
    <header className="appbar">
      <span className="brand">
        <svg className="plumbob" viewBox="0 0 20 30" aria-hidden="true">
          <path d="M10 0 L4 11 L10 15 L16 11 Z" fill="#7fe04f" />
          <path d="M4 11 L10 15 L10 30 Z" fill="#3fa61f" />
          <path d="M16 11 L10 15 L10 30 Z" fill="#57c22e" />
        </svg>
        <span className="brand__name">Dynasty Whiteboard</span>
      </span>

      <span className="appbar__rule" aria-hidden="true" />

      <ToolButton
        icon={LinkSimple}
        label={
          wb.connectMode
            ? 'Connect mode is on. Click a sim, or click here to leave.'
            : 'Connect two sims'
        }
        tone="primary"
        pressed={wb.connectMode}
        onClick={() => wb.setConnectMode(!wb.connectMode)}
      >
        Connect
      </ToolButton>
      <ToolButton icon={UserPlus} label="Add a sim" onClick={addAtCentre}>
        Add sim
      </ToolButton>
      <ToolButton
        icon={Trash}
        label="Delete the selected sim or link"
        tone="danger"
        disabled={!wb.sel}
        onClick={wb.deleteSelected}
      />

      <span className="appbar__rule" aria-hidden="true" />

      <span className="segment" role="group" aria-label="Canvas layers">
        <ToolButton
          icon={TreeStructure}
          label="Family links"
          pressed={wb.show.seed}
          onClick={() => wb.toggleShow('seed')}
        />
        <ToolButton
          icon={House}
          label="Household boxes"
          pressed={wb.show.groups}
          onClick={() => wb.toggleShow('groups')}
        />
        <ToolButton
          icon={Globe}
          label="World boxes"
          pressed={wb.show.worlds}
          onClick={() => wb.toggleShow('worlds')}
        />
      </span>

      <ToolButton
        id="btnGames"
        ref={gamesBtnRef}
        icon={GameController}
        label={
          hiddenCount
            ? `Games and packs. ${hiddenCount} hidden.`
            : 'Games and packs'
        }
        pressed={hiddenCount > 0}
        count={hiddenCount}
        expanded={wb.gamesOpen}
        onClick={() => {
          wb.setAgesOpen(false);
          wb.setGamesOpen(!wb.gamesOpen);
        }}
      >
        Games
      </ToolButton>
      <ToolButton
        id="btnAges"
        ref={agesBtnRef}
        icon={Highlighter}
        label={
          ageCount
            ? `Highlight by age. ${ageCount} selected.`
            : 'Highlight by age'
        }
        pressed={ageCount > 0}
        count={ageCount}
        expanded={wb.agesOpen}
        onClick={() => {
          wb.setGamesOpen(false);
          wb.setAgesOpen(!wb.agesOpen);
        }}
      >
        Ages
      </ToolButton>

      <span className="appbar__spacer" />

      <span className="search">
        <MagnifyingGlass className="search__icon" aria-hidden="true" />
        <input
          id="search"
          type="search"
          aria-label="Find a sim"
          placeholder="Find a sim"
          onInput={(e) => {
            const { w, h } = svgSize();
            wb.searchSim(e.currentTarget.value, w, h);
          }}
        />
      </span>

      <OverflowMenu
        onSave={wb.saveJson}
        onLoad={(f) => {
          const { w, h } = svgSize();
          wb.loadJson(f, w, h);
        }}
        onExportPng={() => {
          if (svgRef.current) wb.exportPng(svgRef.current);
        }}
      />
    </header>
  );
}
