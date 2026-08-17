import { useRef } from 'react';
import type { WhiteboardApi } from '../hooks/useWhiteboard.ts';

type Props = {
  wb: WhiteboardApi;
  svgRef: React.RefObject<SVGSVGElement | null>;
};

export function Toolbar({ wb, svgRef }: Props) {
  const loadRef = useRef<HTMLInputElement>(null);
  const hiddenCount = wb.hiddenPacks.size;
  const ageCount = wb.hiAges.size;

  const svgSize = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 800, h: r?.height ?? 600 };
  };

  return (
    <div id="tools">
      <button
        id="btnConnect"
        className={wb.connectMode ? 'on' : ''}
        onClick={() => wb.setConnectMode(!wb.connectMode)}
      >
        ＋ Connect
      </button>
      <div className="grp">
        <button
          id="btnAdd"
          onClick={() => {
            const r = svgRef.current?.getBoundingClientRect();
            if (!r) return;
            const { tx, ty, k } = wb.viewport;
            const wx = (r.left + r.width / 2 - r.left - tx) / k;
            const wy = (r.top + r.height / 2 - r.top - ty) / k;
            wb.addSim(Math.round(wx), Math.round(wy));
          }}
        >
          ＋ Add sim
        </button>
        <button id="btnDel" onClick={wb.deleteSelected}>
          🗑 Delete
        </button>
      </div>
      <div className="grp">
        <button
          id="tSeed"
          className={wb.show.seed ? 'on' : ''}
          onClick={() => wb.toggleShow('seed')}
        >
          Family links
        </button>
        <button
          id="tGroups"
          className={wb.show.groups ? 'on' : ''}
          onClick={() => wb.toggleShow('groups')}
        >
          Household boxes
        </button>
        <button
          id="tWorlds"
          className={wb.show.worlds ? 'on' : ''}
          onClick={() => wb.toggleShow('worlds')}
        >
          World boxes
        </button>
      </div>
      <button
        id="btnGames"
        className={hiddenCount > 0 ? 'on' : ''}
        onClick={() => {
          wb.setAgesOpen(false);
          wb.setGamesOpen(!wb.gamesOpen);
        }}
      >
        🎮 Games{hiddenCount ? ` (${hiddenCount} hidden)` : ''}
      </button>
      <button
        id="btnAges"
        className={ageCount > 0 ? 'on' : ''}
        onClick={() => {
          wb.setGamesOpen(false);
          wb.setAgesOpen(!wb.agesOpen);
        }}
      >
        🎯 Highlight age{ageCount ? ` (${ageCount})` : ''}
      </button>
      <input
        id="search"
        type="search"
        placeholder="find a sim…"
        onInput={(e) => {
          const { w, h } = svgSize();
          wb.searchSim(e.currentTarget.value, w, h);
        }}
      />
      <div className="grp">
        <button
          id="tSnap"
          className={wb.snap ? 'on' : ''}
          onClick={() => wb.setSnap((s) => !s)}
        >
          ⧉ Snap
        </button>
        <button
          id="zoomout"
          title="zoom out"
          onClick={() => {
            const r = svgRef.current?.getBoundingClientRect();
            if (!r) return;
            wb.zoomAt(0.8, r.left + r.width / 2, r.top + r.height / 2, r);
          }}
        >
          －
        </button>
        <button
          id="zoomin"
          title="zoom in"
          onClick={() => {
            const r = svgRef.current?.getBoundingClientRect();
            if (!r) return;
            wb.zoomAt(1.25, r.left + r.width / 2, r.top + r.height / 2, r);
          }}
        >
          ＋
        </button>
        <button
          id="fit"
          onClick={() => {
            const { w, h } = svgSize();
            wb.fit(w, h);
          }}
        >
          Fit
        </button>
        <button id="reset" onClick={wb.resetView}>
          Reset
        </button>
      </div>
      <div className="grp">
        <button id="save" onClick={wb.saveJson}>
          ↓ Save .json
        </button>
        <label className="chip">
          ↑ Load
          <input
            ref={loadRef}
            id="load"
            type="file"
            accept=".json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const { w, h } = svgSize();
              wb.loadJson(f, w, h);
              e.target.value = '';
            }}
          />
        </label>
        <button
          id="png"
          onClick={() => {
            if (svgRef.current) wb.exportPng(svgRef.current);
          }}
        >
          ↓ PNG
        </button>
      </div>
    </div>
  );
}
