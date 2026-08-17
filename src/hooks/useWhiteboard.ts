import { useCallback, useMemo, useRef, useState } from 'react';
import seedData from '../data/whiteboard.json';
import { AGES_H, UEDIT } from '../lib/constants.ts';
import { bbox, guidesFor, snapHousehold, snapNode } from '../lib/geometry.ts';
import { bloodVerts, computeEdgeRenderData, hopD } from '../lib/routing.ts';
import { worldColor } from '../lib/utils.ts';
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

export function useWhiteboard() {
  const data = seedData as WhiteboardData;
  const [nodes, setNodes] = useState<SimNode[]>(() =>
    data.nodes.map((n) => ({ ...n })),
  );
  const [edges, setEdges] = useState<Edge[]>(() =>
    data.edges.map((e) => ({ ...e })),
  );
  const [groups, setGroups] = useState<Group[]>(() =>
    data.groups.map((g) => ({ ...g })),
  );
  const [worlds] = useState<World[]>(data.worlds);
  const [hiddenPacks, setHiddenPacks] = useState<Set<string>>(new Set());
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
  const [status, setStatus] = useState('');
  const [fastRoute, setFastRoute] = useState(false);
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [agesOpen, setAgesOpen] = useState(false);
  const [connectMenu, setConnectMenu] = useState<{
    a: string;
    b: string;
    x: number;
    y: number;
  } | null>(null);
  const eidcRef = useRef(100000);

  const byid = useMemo(() => {
    const m: Record<string, SimNode> = {};
    nodes.forEach((n) => {
      m[n.id] = n;
    });
    return m;
  }, [nodes]);

  const packVis = useCallback(
    (n: SimNode) => !!n && !hiddenPacks.has(n.pack),
    [hiddenPacks],
  );

  const edgeData = useMemo(
    () =>
      computeEdgeRenderData({
        nodes,
        edges,
        groups,
        show,
        packVis,
        fastRoute,
      }),
    [nodes, edges, groups, show, packVis, fastRoute],
  );

  const bloodVertsMemo = useMemo(
    () => bloodVerts(edgeData.blood),
    [edgeData.blood],
  );

  const visibleNodes = useMemo(
    () => nodes.filter(packVis),
    [nodes, packVis],
  );

  const toggleShow = useCallback((key: keyof ShowToggles) => {
    setShow((s) => ({ ...s, [key]: !s[key] }));
  }, []);

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
    const id = 'u' + eidcRef.current++;
    setEdges((e) => [...e, { id, a, b, type }]);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!sel) return;
    if (sel.type === 'node') {
      setNodes((ns) => ns.filter((n) => n.id !== sel.id));
      setEdges((es) =>
        es.filter((e) => e.a !== sel.id && e.b !== sel.id),
      );
      if (editNodeId === sel.id) setEditNodeId(null);
    } else if (sel.type === 'link') {
      setEdges((es) => es.filter((e) => !sel.ids.includes(e.id)));
    }
    setSel(null);
  }, [sel, editNodeId]);

  const addSim = useCallback((wx: number, wy: number) => {
    const id = 'new' + eidcRef.current++;
    const n: SimNode = {
      id,
      gid: '',
      first: 'New',
      sur: 'Sim',
      age: 'Young Adult',
      state: 'Sim',
      gender: '-',
      hh: '(added)',
      world: '',
      nb: '-',
      color: '#9aa0a6',
      townie: false,
      oworld: '',
      onb: '-',
      ohh: '(added)',
      oplay: 'Resident',
      pack: '',
      x: Math.round(wx),
      y: Math.round(wy),
      w: 200,
      h: 52,
      added: true,
    };
    setNodes((ns) => [...ns, n]);
    setSel({ type: 'node', id });
  }, []);

  const updateNode = useCallback(
    (id: string, patch: Partial<SimNode>) => {
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      );
    },
    [],
  );

  const moveNodesByGid = useCallback(
    (gid: string, dx: number, dy: number, base: Record<string, { x: number; y: number }>) => {
      setNodes((ns) =>
        ns.map((n) => {
          const bb = base[n.id];
          if (n.gid === gid && bb) return { ...n, x: bb.x + dx, y: bb.y + dy };
          return n;
        }),
      );
    },
    [],
  );

  const moveNodesByWorld = useCallback(
    (world: string, dx: number, dy: number, base: Record<string, { x: number; y: number }>) => {
      setNodes((ns) =>
        ns.map((n) => {
          const bb = base[n.id];
          if (n.world === world && bb) return { ...n, x: bb.x + dx, y: bb.y + dy };
          return n;
        }),
      );
    },
    [],
  );

  const snapNodeAction = useCallback(
    (n: SimNode) => {
      if (!snap) return;
      const copy = { ...n };
      snapNode(copy, nodes);
      updateNode(n.id, { x: copy.x, y: copy.y });
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
    const [x0, y0, x1, y1] = bbox(nodes, packVis);
    const w = x1 - x0;
    const h = y1 - y0;
    const k = Math.min(svgWidth / (w + 120), svgHeight / (h + 120), 1.1);
    setViewport({
      k,
      tx: (svgWidth - w * k) / 2 - x0 * k,
      ty: (svgHeight - h * k) / 2 - y0 * k,
    });
  }, [nodes, packVis]);

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
          packVis(n) &&
          `${n.first} ${n.sur}`.toLowerCase().includes(query),
      );
      if (!hit) return;
      const k = 1.1;
      setViewport({
        k,
        tx: svgWidth / 2 - (hit.x + hit.w / 2) * k,
        ty: svgHeight / 2 - (hit.y + hit.h / 2) * k,
      });
      setSel({ type: 'node', id: hit.id });
    },
    [nodes, packVis],
  );

  const saveJson = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          { nodes, edges, groups, hiddenPacks: [...hiddenPacks] },
          null,
          1,
        ),
      ],
      { type: 'application/json' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sims4_whiteboard.json';
    a.click();
  }, [nodes, edges, groups, hiddenPacks]);

  const loadJson = useCallback(
    (file: File, svgWidth: number, svgHeight: number) => {
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const d = JSON.parse(rd.result as string);
          setNodes(d.nodes);
          setEdges(d.edges);
          if (d.groups) setGroups(d.groups);
          setHiddenPacks(new Set(d.hiddenPacks || []));
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
      const [x0, y0, x1, y1] = bbox(nodes, packVis);
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
          a.download = 'sims4_whiteboard.png';
          a.click();
        });
      };
      img.src =
        'data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(xml)));
    },
    [nodes, packVis],
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
          x: n.x + 280,
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
        };
        if (mem.length) {
          patch.x = Math.max(...mem.map((m) => m.x + m.w)) + 40;
          patch.y = Math.min(...mem.map((m) => m.y));
        }
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

  const packs = useMemo(
    () =>
      [...new Set(nodes.map((n) => n.pack).filter(Boolean))].sort((a, b) =>
        a === 'Base Game' ? -1 : b === 'Base Game' ? 1 : a.localeCompare(b),
      ),
    [nodes],
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
    show,
    viewport,
    sel,
    connectMode,
    connSrc,
    snap,
    hiAges,
    status,
    fastRoute,
    editNodeId,
    setEditNodeId,
    gamesOpen,
    setGamesOpen,
    agesOpen,
    setAgesOpen,
    connectMenu,
    setConnectMenu,
    byid,
    packVis,
    edgeData,
    bloodVerts: bloodVertsMemo,
    hopD,
    visibleNodes,
    packs,
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
    snapNodeAction,
    handleConnectClick,
    handleConnectUnion,
    confirmConnect,
    fit,
    resetView,
    zoomAt,
    searchSim,
    saveJson,
    loadJson,
    exportPng,
    togglePack,
    toggleAge,
    setHiAges,
    setHiddenPacks,
    moveSimToHousehold,
    isSelLink,
    setSnap,
    setStatus,
    setFastRoute,
    setViewport,
    guidesFor: (n: SimNode) => guidesFor(n, nodes),
    snapHousehold: (gid: string) => snapHousehold(gid, nodes, snap),
  };
}

export type WhiteboardApi = ReturnType<typeof useWhiteboard>;
