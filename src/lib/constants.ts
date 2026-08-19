export const COL = {
  blood: '#3f4756',
  marriage: '#3f4756',
  romance: '#e0365f',
  custom: '#2b7de0',
} as const;

/** Same glyphs as Connect / the legend — used in the connection log too. */
export const LINK_MARK = {
  marriage: '⚭',
  romance: '❤',
  divorced: '\u26AE',
  parent: '┳',
  sibling: '⊓',
  custom: '➖',
} as const;

export const LINK_LABEL = {
  marriage: 'married',
  romance: 'partners',
  divorced: 'divorced',
  parent: 'child',
  sibling: 'sibling',
  custom: 'linked',
} as const;

export const OCC: Record<string, string> = {
  Vampire: '🧛',
  Spellcaster: '✨',
  Werewolf: '🐺',
  Mermaid: '🧜',
  Alien: '👽',
  Ghost: '👻',
  Servo: '🤖',
  PlantSim: '🌱',
  Skeleton: '💀',
  Fairy: '🧚',
  'Imaginary Friend': '🧸',
  Deceased: '🪦',
};

export const LIFE_STATES = [
  'Sim',
  'Deceased',
  'Vampire',
  'Spellcaster',
  'Werewolf',
  'Mermaid',
  'Fairy',
  'Alien',
  'Ghost',
  'Servo',
  'PlantSim',
  'Skeleton',
  'Imaginary Friend',
] as const;

export const AGES_H = [
  'Infant',
  'Toddler',
  'Child',
  'Teen',
  'Young Adult',
  'Adult',
  'Elder',
] as const;

/** Age options for the sim editor. */
export const AGES = [
  'Infant',
  'Toddler',
  'Child',
  'Teen',
  'Young Adult',
  'Adult',
  'Elder',
] as const;

export const GRID = 20;
export const ALIGN_TH = 13;
/** Only align to nodes within this distance (px) of the drag target. */
export const SNAP_RANGE = 280;
/** Extra stickiness so snap targets do not flip while dragging. */
export const SNAP_HYST = 10;

/** Card geometry — change CARD_H here and layout recalculates every position. */
export const CARD_MIN_W = 200;
export const CARD_H = 66;
export const CARD_TEXT_X = 16;
export const CARD_PAD_X = 14;
/** Approximate character width at the 10.5px detail font size. */
export const CARD_DETAIL_CH = 5.35;

export const SPECIES: Record<string, string> = {
  Cat: '🐱',
  Dog: '🐕',
  Horse: '🐴',
};

/** Pet species for the highlight panel — order matches SPECIES. */
export const SPECIES_H = ['Cat', 'Dog', 'Horse'] as const;

/** Playability values from the premade sims spreadsheet. */
export const PLAYABILITY = [
  'Resident',
  'Townie',
  'NPC',
  'Tenant',
  'CAS Default',
  'Scenario',
  'Legacy',
  'Game Library',
  'Event NPC',
  'Special',
] as const;

/** User-made link colour (id starts with "u"). */
export const UEDIT = '#7c3aed';

export const RGAP = 16;
export const BAND = 170;
export const STUB = 26;
export const MINDROP = 46;

/** Drop line length below a union pill before the parent-child trunk. */
export const PILL_DROP = 12;
/** Relationship pill height (rings / heart / divorce capsule). */
export const PILL_H = 24;
/** Half-width of the widest relationship pill (the ⚮ capsule is 38 wide). */
export const PILL_HALF_W = 19;
export const PILL_W = {
  marriage: 36,
  romance: 36,
  divorced: 38,
} as const;
/** Breathing room between a pill edge and the tag edge it sits next to. */
export const PILL_CLEAR = 4;
/**
 * Smallest horizontal gap between two tags that still lets the pill sit
 * between them. Below this the union connector wraps around the outside.
 */
export const UNION_MIN_GAP = (PILL_HALF_W + PILL_CLEAR) * 2;

/** Placeholder household name for a sim created with Add Sim, before they join a house. */
export const ADDED_HOUSEHOLD = '(added)';

/** Phone chrome / bottom sheets. Keep the CSS `@media` in App.css in sync. */
export const CHROME_COMPACT_MAX_PX = 640;

/** Inset from the viewport edge when clamping floating chrome. */
export const CHROME_EDGE_PAD_PX = 6;

/** Width of the connection-log panel (sentences need more room than pack lists). */
export const CONNECTION_LOG_PANEL_W = 440;

/** Gap between a toolbar control and the dropdown that belongs to it. */
export const CHROME_DROPDOWN_GAP_PX = 6;

/** Zoom used when framing a single sim (search, newly added card). */
export const FOCUS_SIM_K = 1.1;

/** Screen pixels before a pointer counts as a drag instead of a tap. */
export const DRAG_SLOP_PX = 10;

/** Coarse-pointer hold on a card opens the editor. */
export const LONG_PRESS_MS = 450;

/** How long a flash status (layer toggle, etc.) stays on screen. */
export const STATUS_FLASH_MS = 2800;

/** Transparent hit stroke in screen pixels, converted to world space by `/ k`. */
export const EDGE_HIT_SCREEN_PX = 16;
