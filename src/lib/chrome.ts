import {
  CHROME_COMPACT_MAX_PX,
  CHROME_DROPDOWN_GAP_PX,
  CHROME_EDGE_PAD_PX,
} from './constants.ts';

export function isCompactChrome(width = window.innerWidth): boolean {
  return width <= CHROME_COMPACT_MAX_PX;
}

/** Dropdown coords on desktop; bottom-sheet classing is CSS-only on compact. */
export function panelPosition(
  anchorRect: DOMRect | null,
  widthPx: number,
): { left?: number; top?: number } | null {
  if (isCompactChrome()) return {};
  if (!anchorRect) return null;
  let left = anchorRect.left;
  if (left + widthPx > window.innerWidth) left = window.innerWidth - widthPx;
  return {
    left: Math.max(CHROME_EDGE_PAD_PX, left),
    top: anchorRect.bottom + CHROME_DROPDOWN_GAP_PX,
  };
}

/**
 * Viewport-fixed coords for a menu anchored to a control. Prefers lining up
 * with the control's right edge (same as `right: 0`), then slides so the
 * whole menu stays on screen — including when the app bar wraps and the
 * control sits on the left.
 */
export function dropdownPosition(
  anchor: DOMRect,
  widthPx: number,
  heightPx: number,
): { left: number; top: number } {
  const pad = CHROME_EDGE_PAD_PX;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(widthPx, Math.max(0, vw - pad * 2));
  const height = Math.min(heightPx, Math.max(0, vh - pad * 2));

  let left = anchor.right - width;
  left = Math.min(left, vw - width - pad);
  left = Math.max(pad, left);

  let top = anchor.bottom + CHROME_DROPDOWN_GAP_PX;
  if (height > 0 && top + height > vh - pad) {
    const above = anchor.top - height - CHROME_DROPDOWN_GAP_PX;
    top = above >= pad ? above : Math.max(pad, vh - height - pad);
  }
  return { left, top };
}
