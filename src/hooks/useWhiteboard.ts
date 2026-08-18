import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import seedData from '../data/whiteboard.json';
import { AGES_H, FOCUS_SIM_K, STATUS_FLASH_MS, UEDIT } from '../lib/constants.ts';
import {
  bbox,
  dominantWorldInViewport,
  snapHouseholdDelta,
  snapPosition,
  type SnapSticky,
} from '../lib/geometry.ts';
import { computeLayout, layoutBases, OTHER_WORLD } from '../lib/layout.ts';
import { bloodVerts, computeEdgeRenderData, hopD } from '../lib/routing.ts';
import { fileStamp, migrateWhiteboardData, partneredIdSet, sanitizeEdges, siblingsShareParents, worldColor } from '../lib/utils.ts';
import type {
  ConnSrc,
  Edge,
  Group,
  Selection,
  ShowToggles,
  SimNode,
  Viewport,
  WhiteboardData,
  World,
} from '../types/whiteboard.ts';

const INITIAL_VIEW: Viewport = { tx: 40, ty: 40, k: 0.72 };

const LAYER_STATUS: Record<keyof ShowToggles, { on: string; off: string }> = {
  seed: {
    on: 'Family links on — parent, sibling, and partner lines',
    off: 'Family links off — cards stay, relationship lines hide',
  },
  groups: {
    on: 'Household boxes on — dashed boxes around each house',
    off: 'Household boxes off — house outlines hide',
  },
  worlds: {
    on: 'World boxes on — coloured frames around each world',
    off: 'World boxes off — world frames hide',
  },
};

/** Strip derived geometry — only semantic fields and drag offsets are persisted. */
function toCore(n: SimNode): SimNode {
  const { x, y, w, h, ...rest } = n;
  return { ...rest, ox: rest.ox ?? 0, oy: rest.oy ?? 0, x: 0, y: 0, w: 0, h: 0 };
}

export function useWhiteboard() {
  const data = seedData as WhiteboardData;
  const [nodesCore, setNodesCore] = useState<SimNode[]>(() =>
    data.nodes.map((n) => toCore(n)),
  );
  const [edges, setEdges] = useState<Edge[]>(() =>
    sanitizeEdges(data.edges.map((e) => ({ ...e }))),
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    data.groups.map((g) => ({ ...g })),
  );
  const [worlds] = useState<World[]>(data.worlds);
  const [hiddenPacks, setHiddenPacks] = useState<Set<string>>(new Set());
  const [hiddenPlay, setHiddenPlay] = useState<Set<string>>(new Set());
  const [show, setShow] = useState<ShowToggles>({
    seed: true,
    groups: true,
    worlds: true,
  });
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEW);
  const [sel, setSel] = useState<Selection>(null);
  const [connectMode, setConnectModeState] = useState(false);
  const [connSrc, setConnSrc] = useState<ConnSrc>(null);
  const [snap, setSnap] = useState(true);
  const [hiAges, setHiAges] = useState<Set<string>>(new Set());
  const [hiSingle, setHiSingle] = useState(false);
  const [status, setStatus] = useState('');
  const [fastRoute, setFastRoute] = useState(false);
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [agesOpen, setAgesOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const [connectMenu, setConnectMenu] = useState<{
    a: string;
    b: string;
    x: number;
    y: number;
  } | null>(null);
  const eidcRef = useRef(100000);
  const statusFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectModeRef = useRef(connectMode);
  connectModeRef.current = connectMode;
  const pendingFocusRef = useRef<{
    id: string;
    svgWidth: number;
    svgHeight: number;
  } | null>(null);

  /** Positions and card sizes are derived on every render from layout rules. */
  const nodes = useMemo(
    () => computeLayout(nodesCore, worlds, edges),
    [nodesCore, worlds, edges],
  );

  const byid = useMemo(() => {
    const m: Record<string, SimNode> = {};
    nodes.forEach((n) => {
      m[n.id] = n;
    });
    return m;
  }, [nodes]);

  const frameSim = useCallback(
    (n: SimNode, svgWidth: number, svgHeight: number) => {
      const k = FOCUS_SIM_K;
      setViewport({
        k,
        tx: svgWidth / 2 - (n.x + n.w / 2) * k,
        ty: svgHeight / 2 - (n.y + n.h / 2) * k,
      });
    },
    [],
  );

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const n = byid[pending.id];
    if (!n) return;
    pendingFocusRef.current = null;
    frameSim(n, pending.svgWidth, pending.svgHeight);
  }, [byid, frameSim]);

  const packVis = useCallback(
    (n: SimNode) => !!n && !hiddenPacks.has(n.pack),
    [hiddenPacks],
  );

  const playVis = useCallback(
    (n: SimNode) => !!n && !hiddenPlay.has(n.oplay),
    [hiddenPlay],
  );

  /** Combined pack + playability visibility for canvas rendering. */
  const nodeVis = useCallback(
    (n: SimNode) => packVis(n) && playVis(n),
    [packVis, playVis],
  );

  const edgeData = useMemo(
    () =>
      computeEdgeRenderData({
        nodes,
        edges,
        groups,
        show,
        packVis: nodeVis,
        fastRoute,
      }),
    [nodes, edges, groups, show, nodeVis, fastRoute],
  );

  const bloodVertsMemo = useMemo(
    () => bloodVerts(edgeData.blood),
    [edgeData.blood],
  );

  const visibleNodes = useMemo(
    () => nodes.filter(nodeVis),
    [nodes, nodeVis],
  );

  const liveWorlds = useMemo(
    () => new Set(visibleNodes.map((n) => n.world)),
    [visibleNodes],
  );

  const partneredIds = useMemo(() => partneredIdSet(edges), [edges]);

  const flashStatus = useCallback((msg: string) => {
    if (statusFlashRef.current != null) clearTimeout(statusFlashRef.current);
    setStatus(msg);
    statusFlashRef.current = setTimeout(() => {
      statusFlashRef.current = null;
      setStatus((cur) => {
        if (cur !== msg) return cur;
        return connectModeRef.current
          ? 'Connect: click the FIRST sim'
          : '';
      });
    }, STATUS_FLASH_MS);
  }, []);

  const toggleShow = useCallback(
    (key: keyof ShowToggles) => {
      const on = !show[key];
      setShow((s) => ({ ...s, [key]: !s[key] }));
      flashStatus(on ? LAYER_STATUS[key].on : LAYER_STATUS[key].off);
    },
    [show, flashStatus],
  );

  const setConnectMode = useCallback(
    (on: boolean) => {
      setConnectModeState(on);
      setConnSrc(null);
      setConnectMenu(null);
      if (on && sel?.type === 'node' && byid[sel.id]) {
        setConnSrc(sel.id);
        setStatus(
          `First sim: ${byid[sel.id]!.first} — now click the SECOND sim (Esc to cancel)`,
        );
      } else {
        setStatus(on ? 'Connect: click the FIRST sim' : '');
      }
    },
    [sel, byid],
  );

  const cancelConnect = useCallback(() => {
    setConnSrc(null);
    setConnectMenu(null);
    setStatus(
      connectMode ? 'Connect: click the FIRST sim' : '',
    );
  }, [connectMode]);

  const selectNode = useCallback((id: string) => {
    setSel({ type: 'node', id });
  }, []);

  const selectLink = useCallback((ids: string[]) => {
    setSel({ type: 'link', ids });
  }, []);

  const clearSel = useCallback(() => setSel(null), []);

  const addEdge = useCallback((a: string, b: string, type: Edge['type']) => {
    setEdges((e) => {
      if (type === 'sibling' && siblingsShareParents(a, b, e)) return e;
      const id = 'u' + eidcRef.current++;
      return sanitizeEdges([...e, { id, a, b, type }]);
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!sel) return;
    if (sel.type === 'node') {
      setNodesCore((ns) => ns.filter((n) => n.id !== sel.id));
      setEdges((es) =>
        es.filter((e) => e.a !== sel.id && e.b !== sel.id),
      );
      if (editNodeId === sel.id) setEditNodeId(null);
    } else if (sel.type === 'link') {
      setEdges((es) => es.filter((e) => !sel.ids.includes(e.id)));
    }
    setSel(null);
  }, [sel, editNodeId]);

  const addSim = useCallback((svgWidth: number, svgHeight: number) => {
    const id = 'new' + eidcRef.current++;
    const world =
      dominantWorldInViewport(
        nodes,
        groups,
        nodeVis,
        viewport,
        svgWidth,
        svgHeight,
      ) ?? OTHER_WORLD;
    const hh = '(added)';
    const gid = `${world}||${hh}`;
    const color = worldColor(world, worlds);
    const neighbour =
      nodes.find((n) => n.world === world && n.nb && n.nb !== '-')?.nb ?? '-';
    const n: SimNode = {
      id,
      gid,
      first: 'New',
      sur: 'Sim',
      age: 'Young Adult',
      state: 'Sim',
      gender: '-',
      hh,
      world,
      nb: neighbour,
      color,
      townie: false,
      oworld: world,
      onb: neighbour,
      ohh: hh,
      oplay: 'Resident',
      pack: '',
      ox: 0,
      oy: 0,
      x: 0,
      y: 0,
      w: 200,
      h: 66,
      added: true,
    };
    setGroups((gs) => {
      if (gs.some((g) => g.gid === gid)) return gs;
      return [
        ...gs,
        {
          gid,
          hh,
          world,
          nb: neighbour,
          color,
          x: 0,
          y: 0,
          w: 0,
          h: 0,
        },
      ];
    });
    setNodesCore((ns) => [...ns, toCore(n)]);
    setSel({ type: 'node', id });
    pendingFocusRef.current = { id, svgWidth, svgHeight };
  }, [worlds, nodes, groups, nodeVis, viewport]);

  const updateNode = useCallback((id: string, patch: Partial<SimNode>) => {
    setNodesCore((ns) =>
      ns.map((n) => {
        if (n.id !== id) return n;
        const next: SimNode = { ...n, ...patch };
        if (patch.x !== undefined || patch.y !== undefined) {
          const base = layoutBases(ns, worlds, edges).get(id);
          if (base) {
            const absX =
              patch.x !== undefined ? patch.x : base.x + (n.ox ?? 0);
            const absY =
              patch.y !== undefined ? patch.y : base.y + (n.oy ?? 0);
            next.ox = absX - base.x;
            next.oy = absY - base.y;
          }
        }
        return toCore(next);
      }),
    );
  }, [worlds, edges]);

  const moveNodesByGid = useCallback(
    (
      gid: string,
      dx: number,
      dy: number,
      base: Record<string, { ox: number; oy: number }>,
    ) => {
      setNodesCore((ns) =>
        ns.map((n) => {
          const bb = base[n.id];
          if (n.gid === gid && bb)
            return { ...n, ox: bb.ox + dx, oy: bb.oy + dy };
          return n;
        }),
      );
    },
    [],
  );

  const moveNodesByWorld = useCallback(
    (
      world: string,
      dx: number,
      dy: number,
      base: Record<string, { ox: number; oy: number }>,
    ) => {
      setNodesCore((ns) =>
        ns.map((n) => {
          const bb = base[n.id];
          if (n.world === world && bb)
            return { ...n, ox: bb.ox + dx, oy: bb.oy + dy };
          return n;
        }),
      );
    },
    [],
  );

  const snapDragPosition = useCallback(
    (n: SimNode, rawX: number, rawY: number, sticky: SnapSticky = { x: null, y: null }) =>
      snapPosition(rawX, rawY, n.w, n.h, nodes, n.id, snap, sticky),
    [snap, nodes],
  );

  const snapHouseholdDrag = useCallback(
    (gid: string, dx: number, dy: number) =>
      snapHouseholdDelta(gid, nodes, dx, dy, snap),
    [snap, nodes],
  );

  const snapNodeAction = useCallback(
    (n: SimNode) => {
      if (!snap) return;
      const { x, y } = snapPosition(n.x, n.y, n.w, n.h, nodes, n.id, true);
      updateNode(n.id, { x, y });
    },
    [snap, nodes, updateNode],
  );

  const makeChildOfCouple = useCallback(
    (pa: string, pb: string, childId: string) => {
      if (childId === pa || childId === pb) {
        cancelConnect();
        return;
      }
      setEdges((es) => {
        const next = [...es];
        [pa, pb].forEach((p) => {
          if (
            !next.some(
              (e) => e.type === 'parent' && e.a === p && e.b === childId,
            )
          ) {
            next.push({
              id: 'u' + eidcRef.current++,
              a: p,
              b: childId,
              type: 'parent',
            });
          }
        });
        return next;
      });
      setStatus(
        `Linked ✓ — ${byid[childId]?.first ?? 'Sim'} is now a child of ${byid[pa]?.first ?? ''} ＋ ${byid[pb]?.first ?? ''}. Click a sim for the next link`,
      );
      setConnSrc(null);
      setConnectMenu(null);
    },
    [byid, cancelConnect],
  );

  const handleConnectClick = useCallback(
    (n: SimNode, clientX: number, clientY: number, stageRect: DOMRect) => {
      if (connSrc && typeof connSrc === 'object' && 'union' in connSrc) {
        makeChildOfCouple(connSrc.union[0], connSrc.union[1], n.id);
        return;
      }
      if (!connSrc) {
        setConnSrc(n.id);
        setStatus(
          'Connect: now click the SECOND sim — or click a ⚭/❤ to make this sim their child (Esc to cancel)',
        );
        return;
      }
      if (connSrc === n.id) return;
      setConnectMenu({
        a: connSrc as string,
        b: n.id,
        x: clientX - stageRect.left,
        y: clientY - stageRect.top,
      });
    },
    [connSrc, makeChildOfCouple],
  );

  const handleConnectUnion = useCallback(
    (ea: string, eb: string) => {
      if (!byid[ea] || !byid[eb]) return;
      if (connSrc && typeof connSrc === 'string') {
        makeChildOfCouple(ea, eb, connSrc);
        return;
      }
      setConnSrc({ union: [ea, eb] });
      setStatus(
        `Couple selected: ${byid[ea]!.first} ＋ ${byid[eb]!.first} — now click their CHILD (Esc to cancel)`,
      );
    },
    [byid, connSrc, makeChildOfCouple],
  );

  const confirmConnect = useCallback(
    (type: string) => {
      if (!connectMenu) return;
      const { a, b } = connectMenu;
      if (type === 'childof') addEdge(b, a, 'parent');
      else addEdge(a, b, type as Edge['type']);
      setConnectMenu(null);
      setStatus('Linked ✓ — click a sim for the next link');
      setConnSrc(null);
    },
    [connectMenu, addEdge],
  );

  const fit = useCallback((svgWidth: number, svgHeight: number) => {
    const [x0, y0, x1, y1] = bbox(nodes, nodeVis);
    const w = x1 - x0;
    const h = y1 - y0;
    const k = Math.min(svgWidth / (w + 120), svgHeight / (h + 120), 1.1);
    setViewport({
      k,
      tx: (svgWidth - w * k) / 2 - x0 * k,
      ty: (svgHeight - h * k) / 2 - y0 * k,
    });
  }, [nodes, nodeVis]);

  /**
   * Frame a single world. Two differences from `fit`: the zoom cap is above 1 so
   * picking a small world magnifies it rather than just recentring the board,
   * and `insetRight` keeps the result clear of the legend panel, which would
   * otherwise cover the right edge of the very world that was just clicked.
   */
  const zoomToWorld = useCallback(
    (
      world: string,
      svgWidth: number,
      svgHeight: number,
      insetRight: number = 0,
    ) => {
      const inWorld = (n: SimNode) => nodeVis(n) && n.world === world;
      if (!nodes.some(inWorld)) return;
      const [x0, y0, x1, y1] = bbox(nodes, inWorld);
      const w = x1 - x0;
      const h = y1 - y0;
      const pad = 80;
      const availW = Math.max(svgWidth - insetRight, 240);
      const k = Math.min(
        availW / (w + pad * 2),
        svgHeight / (h + pad * 2),
        1.4,
      );
      setViewport({
        k,
        tx: (availW - w * k) / 2 - x0 * k,
        ty: (svgHeight - h * k) / 2 - y0 * k,
      });
    },
    [nodes, nodeVis],
  );

  const resetView = useCallback(() => setViewport(INITIAL_VIEW), []);

  const zoomAt = useCallback(
    (f: number, cx: number, cy: number, svgRect: DOMRect) => {
      setViewport((v) => {
        const nk = Math.min(4, Math.max(0.06, v.k * f));
        if (nk === v.k) return v;
        const mx = cx - svgRect.left;
        const my = cy - svgRect.top;
        return {
          k: nk,
          tx: mx - (mx - v.tx) * (nk / v.k),
          ty: my - (my - v.ty) * (nk / v.k),
        };
      });
    },
    [],
  );

  const searchSim = useCallback(
    (q: string, svgWidth: number, svgHeight: number) => {
      const query = q.toLowerCase().trim();
      if (!query) return;
      const hit = nodes.find(
        (n) =>
          nodeVis(n) &&
          `${n.first} ${n.sur}`.toLowerCase().includes(query),
      );
      if (!hit) return;
      frameSim(hit, svgWidth, svgHeight);
      setSel({ type: 'node', id: hit.id });
    },
    [nodes, nodeVis, frameSim],
  );

  const saveJson = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            nodes: nodesCore.map(toCore),
            edges,
            groups,
            hiddenPacks: [...hiddenPacks],
            hiddenPlay: [...hiddenPlay],
          },
          null,
          1,
        ),
      ],
      { type: 'application/json' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sims4_family_trees_${fileStamp()}.json`;
    a.click();
  }, [nodesCore, edges, groups, hiddenPacks, hiddenPlay]);

  const loadJson = useCallback(
    (file: File, svgWidth: number, svgHeight: number) => {
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const d = migrateWhiteboardData(JSON.parse(rd.result as string));
          setNodesCore((d.nodes as SimNode[]).map(toCore));
          setEdges(sanitizeEdges(d.edges));
          if (d.groups) setGroups(d.groups);
          setHiddenPacks(new Set(d.hiddenPacks || []));
          setHiddenPlay(new Set(d.hiddenPlay || []));
          setSel(null);
          setEditNodeId(null);
          setTimeout(() => fit(svgWidth, svgHeight), 0);
        } catch {
          alert('Bad file');
        }
      };
      rd.readAsText(file);
    },
    [fit],
  );

  const exportPng = useCallback(
    (svgEl: SVGSVGElement) => {
      const [x0, y0, x1, y1] = bbox(nodes, nodeVis);
      const pad = 40;
      const W = x1 - x0 + pad * 2;
      const H = y1 - y0 + pad * 2;
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      const sc = clone.querySelector('#scene');
      if (!sc) return;
      sc.setAttribute(
        'transform',
        `translate(${-x0 + pad},${-y0 + pad})`,
      );
      clone.setAttribute('width', String(W));
      clone.setAttribute('height', String(H));
      clone.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const bg = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      bg.setAttribute('x', '0');
      bg.setAttribute('y', '0');
      bg.setAttribute('width', String(W));
      bg.setAttribute('height', String(H));
      bg.setAttribute('fill', '#f4f1e8');
      sc.parentNode?.insertBefore(bg, sc);
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const s = 2;
        c.width = W * s;
        c.height = H * s;
        const ctx = c.getContext('2d')!;
        ctx.scale(s, s);
        ctx.drawImage(img, 0, 0);
        c.toBlob((b) => {
          if (!b) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = `sims4_family_trees_${fileStamp()}.png`;
          a.click();
        });
      };
      img.src =
        'data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(xml)));
    },
    [nodes, nodeVis],
  );

  const togglePack = useCallback((pack: string, visible: boolean) => {
    setHiddenPacks((s) => {
      const next = new Set(s);
      if (visible) next.delete(pack);
      else next.add(pack);
      return next;
    });
  }, []);

  const toggleAge = useCallback((age: string) => {
    setHiAges((s) => {
      const next = new Set(s);
      if (next.has(age)) next.delete(age);
      else next.add(age);
      return next;
    });
  }, []);

  const toggleSingle = useCallback(() => {
    setHiSingle((on) => !on);
  }, []);

  const moveSimToHousehold = useCallback(
    (
      nodeId: string,
      world: string,
      houseGid: string | '__new',
      newName?: string,
    ) => {
      const n = byid[nodeId];
      if (!n) return;
      if (houseGid === '__new') {
        const name = (newName || '').trim();
        if (!name) return;
        const gid = world + '||' + name;
        setGroups((gs) => {
          if (gs.find((g) => g.gid === gid)) return gs;
          return [
            ...gs,
            {
              gid,
              hh: name,
              world,
              nb: '-',
              color: worldColor(world, worlds),
              x: 0,
              y: 0,
              w: 0,
              h: 0,
            },
          ];
        });
        const patch: Partial<SimNode> = {
          gid,
          hh: name,
          world,
          color: worldColor(world, worlds),
          ox: 0,
          oy: 0,
        };
        if (n.added) {
          patch.oworld = world;
          patch.ohh = name;
          patch.onb = '-';
          patch.oplay = 'Resident';
          patch.townie = false;
        }
        updateNode(nodeId, patch);
      } else {
        const g = groups.find((x) => x.gid === houseGid);
        if (!g) return;
        const mem = nodes.filter((x) => x.gid === g.gid && x.id !== nodeId);
        const patch: Partial<SimNode> = {
          gid: g.gid,
          hh: g.hh,
          world: g.world,
          color: g.color,
          ox: 0,
          oy: 0,
        };
        if (n.added) {
          patch.oworld = g.world;
          patch.ohh = g.hh;
          patch.oplay = 'Resident';
          patch.townie = false;
          const m0 = mem.find((m) => m.onb && m.onb !== '-');
          if (m0) patch.onb = m0.onb;
        }
        updateNode(nodeId, patch);
      }
      setEditNodeId(null);
    },
    [byid, groups, nodes, updateNode, worlds],
  );

  const togglePlay = useCallback((oplay: string, visible: boolean) => {
    setHiddenPlay((s) => {
      const next = new Set(s);
      if (visible) next.delete(oplay);
      else next.add(oplay);
      return next;
    });
  }, []);

  const packs = useMemo(
    () =>
      [...new Set(nodes.map((n) => n.pack).filter(Boolean))].sort((a, b) =>
        a === 'Base Game' ? -1 : b === 'Base Game' ? 1 : a.localeCompare(b),
      ),
    [nodes],
  );

  const playabilities = useMemo(
    () =>
      [...new Set(nodesCore.map((n) => n.oplay).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [nodesCore],
  );

  const isSelLink = useCallback(
    (ids: string[]) =>
      sel?.type === 'link' && ids.some((i) => sel.ids.includes(i)),
    [sel],
  );

  return {
    nodes,
    edges,
    groups,
    worlds,
    hiddenPacks,
    hiddenPlay,
    show,
    viewport,
    sel,
    connectMode,
    connSrc,
    snap,
    hiAges,
    hiSingle,
    partneredIds,
    status,
    fastRoute,
    editNodeId,
    setEditNodeId,
    gamesOpen,
    setGamesOpen,
    agesOpen,
    setAgesOpen,
    playOpen,
    setPlayOpen,
    connectMenu,
    setConnectMenu,
    byid,
    packVis,
    playVis,
    nodeVis,
    edgeData,
    bloodVerts: bloodVertsMemo,
    hopD,
    visibleNodes,
    liveWorlds,
    packs,
    playabilities,
    UEDIT,
    AGES_H,
    toggleShow,
    setConnectMode,
    cancelConnect,
    selectNode,
    selectLink,
    clearSel,
    addEdge,
    deleteSelected,
    addSim,
    updateNode,
    moveNodesByGid,
    moveNodesByWorld,
    snapDragPosition,
    snapHouseholdDrag,
    snapNodeAction,
    handleConnectClick,
    handleConnectUnion,
    confirmConnect,
    fit,
    zoomToWorld,
    resetView,
    zoomAt,
    searchSim,
    saveJson,
    loadJson,
    exportPng,
    togglePack,
    togglePlay,
    setHiddenPlay,
    toggleAge,
    toggleSingle,
    setHiAges,
    setHiSingle,
    setHiddenPacks,
    moveSimToHousehold,
    isSelLink,
    setSnap,
    setStatus,
    setFastRoute,
    setViewport,
  };
}

export type WhiteboardApi = ReturnType<typeof useWhiteboard>;
