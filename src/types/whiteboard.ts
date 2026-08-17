/** A sim card on the whiteboard. */
export interface SimNode {
  id: string;
  gid: string;
  first: string;
  sur: string;
  age: string;
  state: string;
  gender: string;
  hh: string;
  world: string;
  nb: string;
  color: string;
  townie: boolean;
  oworld: string;
  onb: string;
  ohh: string;
  oplay: string;
  pack: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Drag offset from the auto-layout base position. Persisted; x/y are derived. */
  ox?: number;
  oy?: number;
  /** Pet only — Cat, Dog, or Horse. */
  species?: string;
  /** Pet only — breed name shown on the card detail line. */
  breed?: string;
  /** Present on user-added sims (editor). */
  added?: boolean;
}

export type EdgeType =
  | 'marriage'
  | 'romance'
  | 'divorced'
  | 'parent'
  | 'sibling'
  | 'custom';

export interface Edge {
  id: string;
  a: string;
  b: string;
  type: EdgeType;
}

export interface Group {
  gid: string;
  hh: string;
  world: string;
  nb: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface World {
  name: string;
  color: string;
}

export interface WhiteboardData {
  nodes: SimNode[];
  edges: Edge[];
  groups: Group[];
  worlds: World[];
}

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'link'; ids: string[] }
  | null;

export interface ShowToggles {
  seed: boolean;
  groups: boolean;
  worlds: boolean;
}

/** Axis-aligned obstacle rectangle for routing. */
export interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
  id: string;
}

/** 2D point as [x, y] tuple (path vertices). */
export type Point = [number, number];

export interface Viewport {
  tx: number;
  ty: number;
  k: number;
}

/** Connect-mode source: a sim id or a selected couple. */
export type ConnSrc = string | { union: [string, string] } | null;

/** Node-bounds box used by snapHousehold. */
export interface HhBox {
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

/** Drawn household box extent (includes title band). */
export interface HhBoxDraw {
  l: number;
  t: number;
  r: number;
  b: number;
}

export interface UnionGeom {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  rx: number;
  ry: number;
  pts: string;
}

/** Vertical segment in a blood-line polyline (for hop rendering). */
export interface BloodVert {
  x: number;
  y1: number;
  y2: number;
  pi: number;
}

/** A parent/sibling blood-line polyline. */
export interface BloodPath {
  ids: string[];
  pts: Point[];
}

/** Render data for a spouse union (marriage / romance / divorced). */
export interface UnionRender {
  edgeId: string;
  type: 'marriage' | 'romance' | 'divorced';
  a: string;
  b: string;
  pts: string;
  rx: number;
  ry: number;
  isUser: boolean;
}

/** Render data for a custom link. */
export interface CustomRender {
  edgeId: string;
  a: string;
  b: string;
  pts: Point[];
  isUser: boolean;
}

export interface EdgeRenderData {
  blood: BloodPath[];
  unions: UnionRender[];
  customs: CustomRender[];
  rects: Rect[];
}

export interface BuildRectsResult {
  rects: Rect[];
  rbands: Record<number, Rect[]>;
}

export interface Guides {
  gx: number[];
  gy: number[];
}
