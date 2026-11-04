import { useEffect } from 'react';
import { resolveTheme, type ThemePref } from '../lib/theme.ts';

/** Pasang atribut data-theme pada <html>. Mode 'system' ikut berubah saat tema Windows berganti. */
export function useTheme(pref: ThemePref): void {
  useEffect(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: light)') : null;
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(pref, mq?.matches === true);
    };
    apply();
    mq?.addEventListener('change', apply);
    return () => mq?.removeEventListener('change', apply);
  }, [pref]);
}
