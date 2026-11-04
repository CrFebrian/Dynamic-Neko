/**
 * Kontrol jendela island. Di browser biasa (npm run dev) semua fungsi di sini
 * tidak melakukan apa-apa, jadi UI tetap bisa dikembangkan tanpa Tauri.
 *
 * Jendela menempel di tepi atas monitor. Posisi horizontalnya berupa fraksi
 * lebar monitor (titik tengah jendela), dibatasi agar tidak keluar layar.
 */
import { inTauri } from '../lib/env.ts';
import { dragX, EDGE_MARGIN, fractionFromX, xFromFraction } from '../lib/placement.ts';

export type WindowMode = 'collapsed' | 'expanded';

/** Ukuran jendela dalam piksel logis. */
export const WINDOW_SIZE: Record<WindowMode, { w: number; h: number }> = {
  collapsed: { w: 360, h: 84 },
  expanded: { w: 460, h: 440 },
};

type WindowApi = typeof import('@tauri-apps/api/window');

async function activeMonitor(api: WindowApi) {
  return (await api.currentMonitor()) ?? (await api.primaryMonitor());
}

export async function layoutWindow(mode: WindowMode, fraction = 0.5): Promise<void> {
  if (!inTauri()) return;
  const api = await import('@tauri-apps/api/window');
  const { LogicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');

  const win = api.getCurrentWindow();
  const monitor = await activeMonitor(api);
  if (!monitor) return;

  const { w, h } = WINDOW_SIZE[mode];
  const scale = monitor.scaleFactor;
  const widthPx = Math.round(w * scale);
  const margin = Math.round(EDGE_MARGIN * scale);
  const x = xFromFraction(fraction, monitor.position.x, monitor.size.width, widthPx, margin);

  await win.setSize(new LogicalSize(w, h));
  await win.setPosition(new PhysicalPosition(x, monitor.position.y));
  await win.show();
}

export async function setWindowVisible(visible: boolean): Promise<void> {
  if (!inTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const win = getCurrentWindow();
  if (visible) await win.show();
  else await win.hide();
}

export interface DragSession {
  /** Geser jendela sejauh `deltaCssPx` dari posisi awal (dibatasi ke dalam monitor). */
  moveTo(deltaCssPx: number): void;
  /** Selesai menyeret. Mengembalikan fraksi posisi baru untuk disimpan. */
  end(): number;
}

/** Mulai sesi seret horizontal. Mengembalikan null di luar Tauri atau bila monitor tidak terbaca. */
export async function beginDrag(): Promise<DragSession | null> {
  if (!inTauri()) return null;
  const api = await import('@tauri-apps/api/window');
  const { PhysicalPosition } = await import('@tauri-apps/api/dpi');

  const win = api.getCurrentWindow();
  const [monitor, pos, size] = await Promise.all([activeMonitor(api), win.outerPosition(), win.outerSize()]);
  if (!monitor) return null;

  const scale = monitor.scaleFactor;
  const margin = Math.round(EDGE_MARGIN * scale);
  const monX = monitor.position.x;
  const monW = monitor.size.width;

  let lastX = pos.x;
  let pending: number | null = null;
  let frame = 0;

  const apply = () => {
    frame = 0;
    if (pending === null) return;
    const x = dragX(pos.x, pending, scale, monX, monW, size.width, margin);
    pending = null;
    lastX = x;
    win.setPosition(new PhysicalPosition(x, pos.y)).catch((err: unknown) => console.error('Gagal menggeser:', err));
  };

  return {
    moveTo(deltaCssPx: number) {
      pending = deltaCssPx;
      if (frame === 0) frame = requestAnimationFrame(apply);
    },
    end() {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        apply();
      }
      return fractionFromX(lastX, monX, monW, size.width);
    },
  };
}

export async function quitApp(): Promise<void> {
  if (!inTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('quit_app');
}

/** Buka jendela Pengaturan (di browser: jendela popup dengan ?view=settings). */
export async function openSettings(): Promise<void> {
  if (!inTauri()) {
    window.open(`${window.location.pathname}?view=settings`, 'yomi-settings', 'popup,width=900,height=640');
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_settings');
}
