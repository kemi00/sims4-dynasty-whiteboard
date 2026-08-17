export const COL = {
  blood: '#3f4756',
  marriage: '#3f4756',
  romance: '#e0365f',
  custom: '#2b7de0',
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
/** Half-width of the widest relationship pill (the ⚮ capsule is 38 wide). */
export const PILL_HALF_W = 19;
/** Breathing room between a pill edge and the tag edge it sits next to. */
export const PILL_CLEAR = 4;
/**
 * Smallest horizontal gap between two tags that still lets the pill sit
 * between them. Below this the union connector wraps around the outside.
 */
export const UNION_MIN_GAP = (PILL_HALF_W + PILL_CLEAR) * 2;
