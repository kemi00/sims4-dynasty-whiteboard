import {
  Funnel,
  GameController,
  Globe,
  Highlighter,
  House,
  IdentificationBadge,
  LinkSimple,
  MagnifyingGlass,
  Scroll,
  Trash,
  TreeStructure,
  UserPlus,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useCompactChrome } from '../hooks/useCompactChrome.ts';
import { useDropdownPosition } from '../hooks/useDropdownPosition.ts';
import type { WhiteboardApi } from '../hooks/useWhiteboard.ts';
import { OverflowMenu } from './OverflowMenu.tsx';
import { ToolButton } from './ToolButton.tsx';

type Props = {
  wb: WhiteboardApi;
  svgRef: RefObject<SVGSVGElement | null>;
  gamesBtnRef: RefObject<HTMLButtonElement | null>;
  agesBtnRef: RefObject<HTMLButtonElement | null>;
  playBtnRef: RefObject<HTMLButtonElement | null>;
  logBtnRef: RefObject<HTMLButtonElement | null>;
};

export function AppBar({
  wb,
  svgRef,
  gamesBtnRef,
  agesBtnRef,
  playBtnRef,
  logBtnRef,
}: Props) {
  const compact = useCompactChrome();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const compactSearchRef = useRef<HTMLInputElement>(null);
  const { popRef: filtersPopRef, style: filtersPopStyle } = useDropdownPosition(
    filtersOpen,
    filtersRef,
  );

  const hiddenCount = wb.hiddenPacks.size;
  const playHidden = wb.hiddenPlay.size;
  const ageCount = wb.hiAges.size + (wb.hiSingle ? 1 : 0);
  const filterCount = hiddenCount + playHidden + ageCount;

  const svgSize = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 800, h: r?.height ?? 600 };
  };

  const addNewSim = () => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    wb.addSim(r.width, r.height);
  };

  const search = (value: string) => {
    const { w, h } = svgSize();
    wb.searchSim(value, w, h);
  };

  useEffect(() => {
    if (!searchOpen || !compact) return;
    compactSearchRef.current?.focus();
  }, [searchOpen, compact]);

  useEffect(() => {
    if (!compact) setSearchOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointer = (ev: PointerEvent) => {
      if (!filtersRef.current?.contains(ev.target as Node)) {
        setFiltersOpen(false);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [filtersOpen]);

  const openGames = () => {
    setFiltersOpen(false);
    wb.setAgesOpen(false);
    wb.setPlayOpen(false);
    wb.setLogOpen(false);
    wb.setGamesOpen(!wb.gamesOpen);
  };
  const openPlay = () => {
    setFiltersOpen(false);
    wb.setGamesOpen(false);
    wb.setAgesOpen(false);
    wb.setLogOpen(false);
    wb.setPlayOpen(!wb.playOpen);
  };
  const openAges = () => {
    setFiltersOpen(false);
    wb.setGamesOpen(false);
    wb.setPlayOpen(false);
    wb.setLogOpen(false);
    wb.setAgesOpen(!wb.agesOpen);
  };
  const openLog = () => {
    setFiltersOpen(false);
    wb.setGamesOpen(false);
    wb.setPlayOpen(false);
    wb.setAgesOpen(false);
    wb.setLogOpen(!wb.logOpen);
  };

  return (
    <header className="appbar">
      <span className="brand">
        <svg className="plumbob" viewBox="0 0 20 30" aria-hidden="true">
          <path d="M10 0 L4 11 L10 15 L16 11 Z" fill="#7fe04f" />
          <path d="M4 11 L10 15 L10 30 Z" fill="#3fa61f" />
          <path d="M16 11 L10 15 L10 30 Z" fill="#57c22e" />
        </svg>
        <span className="brand__name">Family Trees Whiteboard</span>
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
      <ToolButton icon={UserPlus} label="Add a sim" onClick={addNewSim}>
        Add sim
      </ToolButton>
      <ToolButton
        icon={Trash}
        label="Delete the selected sim or link"
        tone="danger"
        disabled={!wb.sel}
        onClick={wb.deleteSelected}
      />
      <ToolButton
        id="btnLog"
        ref={logBtnRef}
        icon={Scroll}
        label={
          wb.connectionLog.length
            ? `Links and household moves you added. ${wb.connectionLog.length} on the list.`
            : 'Links and household moves you added'
        }
        pressed={wb.logOpen}
        count={wb.connectionLog.length}
        expanded={wb.logOpen}
        onClick={openLog}
      >
        Log
      </ToolButton>

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

      <span className="appbar__desktop-filters">
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
          onClick={openGames}
        >
          Games
        </ToolButton>
        <ToolButton
          id="btnPlay"
          ref={playBtnRef}
          icon={IdentificationBadge}
          label={
            playHidden
              ? `Playability. ${playHidden} hidden.`
              : 'Playability'
          }
          pressed={playHidden > 0}
          count={playHidden}
          expanded={wb.playOpen}
          onClick={openPlay}
        >
          Play
        </ToolButton>
        <ToolButton
          id="btnAges"
          ref={agesBtnRef}
          icon={Highlighter}
          label={
            ageCount
              ? `Highlight by age or status. ${ageCount} selected.`
              : 'Highlight by age or status'
          }
          pressed={ageCount > 0}
          count={ageCount}
          expanded={wb.agesOpen}
          onClick={openAges}
        >
          Ages
        </ToolButton>
      </span>

      <span className="appbar__spacer" />

      <span className="search search--bar">
        <MagnifyingGlass className="search__icon" aria-hidden="true" />
        <input
          id="search"
          type="search"
          aria-label="Find a sim"
          placeholder="Find a sim"
          onInput={(e) => search(e.currentTarget.value)}
        />
      </span>

      <span className="appbar__compact-only appbar__compact-tools">
        <ToolButton
          icon={MagnifyingGlass}
          label="Find a sim"
          pressed={searchOpen}
          onClick={() => setSearchOpen((o) => !o)}
        />
        <div className="overflow" ref={filtersRef}>
          <ToolButton
            icon={Funnel}
            label="Filters"
            pressed={filterCount > 0 || wb.gamesOpen || wb.playOpen || wb.agesOpen}
            count={filterCount}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
          />
          {filtersOpen && (
            <div
              ref={filtersPopRef}
              className="pop"
              role="menu"
              aria-label="Filters"
              style={filtersPopStyle}
            >
              <button type="button" role="menuitem" onClick={openGames}>
                <GameController aria-hidden="true" />
                Games
                {hiddenCount ? ` (${hiddenCount})` : ''}
              </button>
              <button type="button" role="menuitem" onClick={openPlay}>
                <IdentificationBadge aria-hidden="true" />
                Play
                {playHidden ? ` (${playHidden})` : ''}
              </button>
              <button type="button" role="menuitem" onClick={openAges}>
                <Highlighter aria-hidden="true" />
                Ages
                {ageCount ? ` (${ageCount})` : ''}
              </button>
            </div>
          )}
        </div>
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

      {compact && searchOpen && (
        <div className="search-overlay">
          <MagnifyingGlass className="search__icon" aria-hidden="true" />
          <input
            ref={compactSearchRef}
            type="search"
            aria-label="Find a sim"
            placeholder="Find a sim"
            onInput={(e) => search(e.currentTarget.value)}
          />
        </div>
      )}
    </header>
  );
}
