import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { border, unionGeom } from '../lib/geometry.ts';
import { isUserE } from '../lib/utils.ts';
import type { WhiteboardApi } from '../hooks/useWhiteboard.ts';
import type { SimNode } from '../types/whiteboard.ts';
import { ConnectMenu } from './ConnectMenu.tsx';
import { EdgeLayer } from './EdgeLayer.tsx';
import { GroupLayer } from './GroupLayer.tsx';
import { Hint } from './Hint.tsx';
import { Legend } from './Legend.tsx';
import { SimEditor } from './SimEditor.tsx';
import { SimNodeView } from './SimNode.tsx';
import { WorldLayer } from './WorldLayer.tsx';

type Props = {
  wb: WhiteboardApi;
  svgRef: React.RefObject<SVGSVGElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
};

export function WhiteboardStage({ wb, svgRef, stageRef }: Props) {
  const [guides, setGuides] = useState<{ gx: number[]; gy: number[] } | null>(
    null,
  );
  const [tempLine, setTempLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [editorPos, setEditorPos] = useState({ left: 0, top: 0 });

  const panRef = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);
  const dragRef = useRef<{
    n: SimNode;
    dx: number;
    dy: number;
  } | null>(null);
  const movedRef = useRef(false);
  const lastClickRef = useRef<{ id: string; t: number } | null>(null);
  const hhDragRef = useRef<{
    gid: string;
    sx: number;
    sy: number;
    base: Record<string, { x: number; y: number }>;
  } | null>(null);
  const worldDragRef = useRef<{
    world: string;
    sx: number;
    sy: number;
    base: Record<string, { x: number; y: number }>;
  } | null>(null);

  const { tx, ty, k } = wb.viewport;

  const toWorld = useCallback(
    (sx: number, sy: number) => {
      const r = svgRef.current!.getBoundingClientRect();
      return [(sx - r.left - tx) / k, (sy - r.top - ty) / k] as [number, number];
    },
    [tx, ty, k, svgRef],
  );

  const positionEditor = useCallback(() => {
    if (!wb.editNodeId || !wb.byid[wb.editNodeId]) return;
    const n = wb.byid[wb.editNodeId]!;
    const r = svgRef.current!.getBoundingClientRect();
    const sr = stageRef.current!.getBoundingClientRect();
    const ew = 252;
    const eh = 200;
    const nx = tx + n.x * k;
    const ny = ty + n.y * k;
    const nw = n.w * k;
    let left = nx + nw + 12;
    let top = ny;
    if (left + ew > r.width - 8) left = nx - ew - 12;
    if (top + eh > r.height - 8) top = r.height - eh - 8;
    if (top < 8) top = 8;
    setEditorPos({ left: left + r.left - sr.left, top: top + r.top - sr.top });
  }, [wb.editNodeId, wb.byid, tx, ty, k, svgRef, stageRef]);

  useEffect(() => {
    positionEditor();
  }, [positionEditor, wb.viewport, wb.editNodeId]);

  // Drop the rubber-band line as soon as the link is confirmed, cancelled, or
  // the type menu takes over; otherwise it stays frozen on the last cursor spot.
  useEffect(() => {
    if (!wb.connSrc || wb.connectMenu) setTempLine(null);
  }, [wb.connSrc, wb.connectMenu]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      let dy = ev.deltaY;
      if (ev.deltaMode === 1) dy *= 16;
      else if (ev.deltaMode === 2) dy *= 400;
      const step = ev.ctrlKey ? 0.01 : 0.0032;
      dy = Math.max(-80, Math.min(80, dy));
      const r = svgRef.current!.getBoundingClientRect();
      wb.zoomAt(Math.exp(-dy * step), ev.clientX, ev.clientY, r);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [stageRef, svgRef, wb]);

  // Fit once, as soon as the stage has been laid out. Later resizes must not
  // refit, or they would throw away whatever the user has zoomed or panned to.
  const didFit = useRef(false);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || didFit.current) return;
    const tryFit = () => {
      if (didFit.current) return;
      const r = svgRef.current?.getBoundingClientRect();
      if (!r?.width || !r.height) return;
      didFit.current = true;
      wb.fit(r.width, r.height);
    };
    tryFit();
    if (didFit.current) return;
    const ro = new ResizeObserver(tryFit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef, svgRef, wb.fit]);

  const userEdgeIds = useRef(new Set<string>());
  userEdgeIds.current = new Set(wb.edges.filter(isUserE).map((e) => e.id));

  const updateTemp = useCallback(
    (clientX: number, clientY: number) => {
      const [wx, wy] = toWorld(clientX, clientY);
      const cs = wb.connSrc;
      if (!cs) {
        setTempLine(null);
        return;
      }
      if (typeof cs === 'object' && 'union' in cs) {
        const A = wb.byid[cs.union[0]];
        const B = wb.byid[cs.union[1]];
        if (!A || !B) return;
        const g0 = unionGeom(A, B);
        setTempLine({ x1: g0.rx, y1: g0.ry, x2: wx, y2: wy });
        return;
      }
      const s = wb.byid[cs];
      if (!s) return;
      const p = border(s, wx, wy);
      setTempLine({ x1: p[0], y1: p[1], x2: wx, y2: wy });
    },
    [toWorld, wb],
  );

  const onSvgPointerDown = (ev: ReactPointerEvent) => {
    if (
      (ev.target as Element).closest('.node') ||
      (ev.target as Element).closest('.edge') ||
      (ev.target as Element).closest('.hhandle') ||
      (ev.target as Element).closest('.whandle')
    )
      return;
    if (wb.connectMode) {
      wb.cancelConnect();
      return;
    }
    wb.clearSel();
    panRef.current = {
      x: ev.clientX,
      y: ev.clientY,
      tx,
      ty,
    };
    svgRef.current!.setPointerCapture(ev.pointerId);
  };

  const onSvgPointerMove = (ev: ReactPointerEvent) => {
    if (worldDragRef.current) {
      const d = worldDragRef.current;
      const [wx, wy] = toWorld(ev.clientX, ev.clientY);
      const dx = wx - d.sx;
      const dy = wy - d.sy;
      wb.moveNodesByWorld(d.world, dx, dy, d.base);
      return;
    }
    if (hhDragRef.current) {
      const d = hhDragRef.current;
      const [wx, wy] = toWorld(ev.clientX, ev.clientY);
      const dx = wx - d.sx;
      const dy = wy - d.sy;
      wb.moveNodesByGid(d.gid, dx, dy, d.base);
      const gg = wb.snapHousehold(d.gid);
      if (gg) setGuides(gg);
      return;
    }
    if (dragRef.current) {
      const d = dragRef.current;
      const [wx, wy] = toWorld(ev.clientX, ev.clientY);
      wb.setFastRoute(true);
      wb.updateNode(d.n.id, {
        x: wx - d.dx,
        y: wy - d.dy,
      });
      movedRef.current = true;
      const updated = wb.byid[d.n.id];
      if (updated) {
        setGuides(wb.guidesFor(updated));
      }
      return;
    }
    if (panRef.current) {
      const p = panRef.current;
      wb.setViewport({
        k,
        tx: p.tx + (ev.clientX - p.x),
        ty: p.ty + (ev.clientY - p.y),
      });
    }
    if (wb.connSrc) updateTemp(ev.clientX, ev.clientY);
  };

  const onSvgPointerUp = () => {
    if (hhDragRef.current || worldDragRef.current) {
      setGuides(null);
      hhDragRef.current = null;
      worldDragRef.current = null;
    }
    if (dragRef.current) {
      const n = dragRef.current.n;
      const wasMoved = movedRef.current;
      dragRef.current = null;
      wb.setFastRoute(false);
      setGuides(null);
      if (wasMoved) {
        const cur = wb.byid[n.id];
        if (cur) wb.snapNodeAction(cur);
        return;
      }
      const now = performance.now();
      if (
        lastClickRef.current?.id === n.id &&
        now - lastClickRef.current.t < 380
      ) {
        lastClickRef.current = null;
        wb.setEditNodeId(n.id);
        positionEditor();
      } else {
        lastClickRef.current = { id: n.id, t: now };
        wb.selectNode(n.id);
      }
      return;
    }
    panRef.current = null;
  };

  const onNodePointerDown = (ev: ReactPointerEvent, n: SimNode) => {
    ev.stopPropagation();
    if (wb.connectMode) {
      const sr = stageRef.current!.getBoundingClientRect();
      wb.handleConnectClick(n, ev.clientX, ev.clientY, sr);
      return;
    }
    const [wx, wy] = toWorld(ev.clientX, ev.clientY);
    dragRef.current = { n, dx: wx - n.x, dy: wy - n.y };
    movedRef.current = false;
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
  };

  const sortedNodes = [...wb.visibleNodes];
  if (wb.sel?.type === 'node') {
    const selId = wb.sel.id;
    const idx = sortedNodes.findIndex((n) => n.id === selId);
    if (idx >= 0) {
      const [n] = sortedNodes.splice(idx, 1);
      sortedNodes.push(n!);
    }
  }

  const editNode = wb.editNodeId ? wb.byid[wb.editNodeId] : null;
  const menu = wb.connectMenu;
  const connHighlight =
    typeof wb.connSrc === 'string' ? wb.connSrc : null;

  return (
    <div id="stage" ref={stageRef}>
      <svg
        id="svg"
        ref={svgRef}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerLeave={onSvgPointerUp}
      >
        <defs>
          <clipPath id="tagclip">
            <rect x={0} y={0} width={200} height={52} rx={11} />
          </clipPath>
        </defs>
        <g
          id="scene"
          data-vp={JSON.stringify(wb.viewport)}
          transform={`translate(${tx},${ty}) scale(${k})`}
        >
          <WorldLayer
            nodes={wb.nodes}
            groups={wb.groups}
            worlds={wb.worlds}
            show={wb.show.worlds}
            packVis={wb.packVis}
            onWorldDragStart={(world, sx, sy, base) => {
              worldDragRef.current = { world, sx, sy, base };
            }}
          />
          <GroupLayer
            groups={wb.groups}
            nodes={wb.nodes}
            show={wb.show.groups}
            packVis={wb.packVis}
            onHouseholdDragStart={(gid, sx, sy, base) => {
              hhDragRef.current = { gid, sx, sy, base };
            }}
          />
          <EdgeLayer
            blood={wb.edgeData.blood}
            bloodVerts={wb.bloodVerts}
            hopD={wb.hopD}
            unions={wb.edgeData.unions}
            customs={wb.edgeData.customs}
            userEdgeIds={userEdgeIds.current}
            isSelLink={wb.isSelLink}
            connectMode={wb.connectMode}
            onLinkClick={(ids) => wb.selectLink(ids)}
            onUnionClick={(a, b) => {
              if (wb.connectMode) wb.handleConnectUnion(a, b);
              else wb.selectLink([wb.edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))?.id ?? '']);
            }}
          />
          <g id="lTemp">
            {tempLine && (
              <line
                x1={tempLine.x1}
                y1={tempLine.y1}
                x2={tempLine.x2}
                y2={tempLine.y2}
                stroke="#1b6cd6"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            {guides && wb.snap && (
              <>
                {guides.gx.map((x, i) => (
                  <line
                    key={`gx-${i}`}
                    x1={x}
                    y1={-1e6}
                    x2={x}
                    y2={1e6}
                    stroke="#1b6cd6"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                ))}
                {guides.gy.map((y, i) => (
                  <line
                    key={`gy-${i}`}
                    x1={-1e6}
                    y1={y}
                    x2={1e6}
                    y2={y}
                    stroke="#1b6cd6"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                ))}
              </>
            )}
          </g>
          <g id="lNodes">
            {sortedNodes.map((n) => (
              <SimNodeView
                key={n.id}
                node={n}
                selected={wb.sel?.type === 'node' && wb.sel.id === n.id}
                connectHighlight={connHighlight === n.id}
                hiAges={wb.hiAges}
                onPointerDown={onNodePointerDown}
              />
            ))}
          </g>
        </g>
      </svg>
      {wb.status && (
        <div id="status" style={{ display: 'block' }}>
          {wb.status}
        </div>
      )}
      {menu && (
        <ConnectMenu
          aName={wb.byid[menu.a]?.first ?? ''}
          bName={wb.byid[menu.b]?.first ?? ''}
          left={menu.x}
          top={menu.y}
          onConfirm={(type) => {
            if (type === 'parent')
              wb.confirmConnect('parent');
            else wb.confirmConnect(type);
          }}
          onCancel={() => {
            wb.setConnectMenu(null);
            wb.cancelConnect();
          }}
        />
      )}
      <Legend worlds={wb.worlds} />
      <Hint />
      {editNode && (
        <SimEditor
          node={editNode}
          worlds={wb.worlds}
          groups={wb.groups}
          nodes={wb.nodes}
          left={editorPos.left}
          top={editorPos.top}
          onSave={(patch) => {
            wb.updateNode(editNode.id, patch);
            wb.setEditNodeId(null);
          }}
          onMove={(world, houseGid, newName) => {
            wb.moveSimToHousehold(editNode.id, world, houseGid, newName);
          }}
          onClose={() => wb.setEditNodeId(null)}
        />
      )}
    </div>
  );
}
