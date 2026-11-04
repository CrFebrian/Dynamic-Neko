import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '../lib/env.ts';

export type View = 'island' | 'settings';

/** Di aplikasi, tampilan ditentukan label jendela. Di browser, dari ?view=settings. */
export function currentView(): View {
  if (inTauri()) {
    try {
      return getCurrentWindow().label === 'settings' ? 'settings' : 'island';
    } catch {
      return 'island';
    }
  }
  return new URLSearchParams(window.location.search).get('view') === 'settings' ? 'settings' : 'island';
}
