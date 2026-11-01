import { useCallback, useEffect, useState } from 'react';
import { load, save } from '../game/storage';

export type ColorScheme = 'light' | 'dark';

export interface Prefs {
  theme?: ColorScheme;
  seenHelp?: boolean;
}

export const loadPrefs = () => load<Prefs>('prefs', {});
export const updatePrefs = (patch: Partial<Prefs>) => save('prefs', { ...loadPrefs(), ...patch });

const systemScheme = (): ColorScheme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/** Follows the system scheme until the player picks one explicitly. */
export function useTheme() {
  const [explicit, setExplicit] = useState<ColorScheme | undefined>(() => loadPrefs().theme);
  const [system, setSystem] = useState<ColorScheme>(systemScheme);
  const scheme = explicit ?? system;

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', scheme === 'dark' ? '#121316' : '#f6f4ef');
    });
  }, [scheme]);

  const toggle = useCallback(() => {
    const next: ColorScheme = scheme === 'dark' ? 'light' : 'dark';
    setExplicit(next);
    updatePrefs({ theme: next });
  }, [scheme]);

  return { scheme, toggle };
}
