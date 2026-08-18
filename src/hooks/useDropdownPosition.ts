import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { dropdownPosition } from '../lib/chrome.ts';
import { CHROME_EDGE_PAD_PX } from '../lib/constants.ts';

/** Keep a `.pop` menu inside the viewport, even if its trigger wrapped left. */
export function useDropdownPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
) {
  const popRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
  });

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ position: 'fixed', visibility: 'hidden' });
      return;
    }
    const place = () => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const maxWidth = window.innerWidth - CHROME_EDGE_PAD_PX * 2;
      pop.style.maxWidth = `${maxWidth}px`;
      const { left, top } = dropdownPosition(
        anchor.getBoundingClientRect(),
        pop.offsetWidth,
        pop.offsetHeight,
      );
      setStyle({
        position: 'fixed',
        left,
        top,
        maxWidth,
        visibility: 'visible',
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, anchorRef]);

  return { popRef, style };
}
