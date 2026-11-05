import { inTauri } from './env.ts';

const EVENT = 'settings-changed';

/** Beri tahu jendela lain bahwa pengaturan berubah. Di browser, penyimpanan lokal yang mengabarkan. */
export async function notifySettingsChanged(): Promise<void> {
  if (!inTauri()) return;
  const { emit } = await import('@tauri-apps/api/event');
  await emit(EVENT);
}

/** Dengarkan perubahan pengaturan dari jendela lain. Mengembalikan fungsi untuk berhenti. */
export function onSettingsChanged(cb: () => void): () => void {
  if (!inTauri()) {
    const h = () => cb();
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }
  let un: (() => void) | null = null;
  let stopped = false;
  void import('@tauri-apps/api/event').then(async ({ listen }) => {
    const u = await listen(EVENT, () => cb());
    if (stopped) u();
    else un = u;
  });
  return () => {
    stopped = true;
    un?.();
  };
}

const TOUR_EVENT = 'start-tour';
const TOUR_KEY = 'yomi-start-tour';

/** Minta island menampilkan tur pengenalan (dipanggil dari jendela Pengaturan). */
export async function requestTour(): Promise<void> {
  if (!inTauri()) {
    try {
      localStorage.setItem(TOUR_KEY, String(Date.now()));
    } catch {
      /* penyimpanan diblokir: tur tidak bisa diminta dari tab lain */
    }
    return;
  }
  const { emit } = await import('@tauri-apps/api/event');
  await emit(TOUR_EVENT);
}

/** Dengarkan permintaan tur. Mengembalikan fungsi untuk berhenti. */
export function onTourRequested(cb: () => void): () => void {
  if (!inTauri()) {
    const h = (e: StorageEvent) => {
      if (e.key === TOUR_KEY) cb();
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }
  let un: (() => void) | null = null;
  let stopped = false;
  void import('@tauri-apps/api/event').then(async ({ listen }) => {
    const u = await listen(TOUR_EVENT, () => cb());
    if (stopped) u();
    else un = u;
  });
  return () => {
    stopped = true;
    un?.();
  };
}
