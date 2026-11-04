export type ThemePref = 'dark' | 'light' | 'system';
export type Theme = 'dark' | 'light';

export const THEME_LABEL: Record<ThemePref, string> = { dark: 'Gelap', light: 'Terang', system: 'Ikuti Windows' };
export const THEME_PREFS: readonly ThemePref[] = ['dark', 'light', 'system'];

/** Tema efektif. 'system' mengikuti pengaturan terang/gelap Windows. */
export const resolveTheme = (pref: ThemePref, systemPrefersLight: boolean): Theme =>
  pref === 'system' ? (systemPrefersLight ? 'light' : 'dark') : pref;
