/**
 * Kontrol jendela island. Di browser biasa (npm run dev) semua fungsi di sini
 * tidak melakukan apa-apa, jadi UI tetap bisa dikembangkan tanpa Tauri.
 *
 * Strategi Tahap 0: jendela selalu menempel di tengah-atas monitor dan
 * ukurannya mengikuti keadaan island (ringkas atau terbuka). Area transparan
 * di sekeliling island tidak menangkap klik karena memang tidak ada.
 * Click-through satu layar penuh dipertimbangkan di tahap berikutnya.
 */

export type WindowMode = 'collapsed' | 'expanded';

/** Ukuran jendela dalam piksel logis. */
export const WINDOW_SIZE: Record<WindowMode, { w: number; h: number }> = {
  collapsed: { w: 360, h: 84 },
  expanded: { w: 460, h: 440 },
};

export const inTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function layoutWindow(mode: WindowMode): Promise<void> {
  if (!inTauri()) return;
  const { getCurrentWindow, currentMonitor, primaryMonitor } = await import('@tauri-apps/api/window');
  const { LogicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');

  const win = getCurrentWindow();
  const monitor = (await currentMonitor()) ?? (await primaryMonitor());
  if (!monitor) return;

  const { w, h } = WINDOW_SIZE[mode];
  const scale = monitor.scaleFactor;
  const widthPx = Math.round(w * scale);
  const x = monitor.position.x + Math.round((monitor.size.width - widthPx) / 2);
  const y = monitor.position.y;

  await win.setSize(new LogicalSize(w, h));
  await win.setPosition(new PhysicalPosition(x, y));
  await win.show();
}

export async function quitApp(): Promise<void> {
  if (!inTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}
