import { useEffect, useState } from 'react';
import { CHROME_COMPACT_MAX_PX } from '../lib/constants.ts';
import { isCompactChrome } from '../lib/chrome.ts';

/** True when the window is at the phone chrome breakpoint. */
export function useCompactChrome(): boolean {
  const [compact, setCompact] = useState(isCompactChrome);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${CHROME_COMPACT_MAX_PX}px)`);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}
