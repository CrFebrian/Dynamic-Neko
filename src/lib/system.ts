import { inTauri } from './env.ts';

export interface MediaInfo {
  title: string;
  artist: string;
  playing: boolean;
  positionSec: number;
  /** 0 bila pemutar tidak melaporkan durasi (mis. siaran langsung). */
  durationSec: number;
}

/** Keadaan sistem yang dibaca Rust dari Windows. */
export interface SystemSnapshot {
  /** Ada aplikasi layar penuh / mode presentasi. */
  fullscreen: boolean;
  /** Ada aplikasi yang sedang memakai mikrofon. */
  micActive: boolean;
  media: MediaInfo | null;
  /** null bila perangkat tidak punya baterai (PC desktop) atau tidak terbaca. */
  battery: BatteryInfo | null;
}

export interface BatteryInfo {
  /** 0..100. */
  percent: number;
  charging: boolean;
}

export type MediaAction = 'toggle' | 'next' | 'prev';

export const EMPTY_SNAPSHOT: SystemSnapshot = { fullscreen: false, micActive: false, media: null, battery: null };

const MAX_TEXT = 200;
const MAX_SECONDS = 7 * 86_400;
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const text = (v: unknown): string => (typeof v === 'string' ? v.slice(0, MAX_TEXT).trim() : '');
const secs = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(MAX_SECONDS, Math.max(0, v)) : 0;

/** Validasi data dari Rust sebelum dipakai UI: tipe salah atau berlebihan diabaikan. */
export function parseSnapshot(raw: unknown): SystemSnapshot {
  if (!isRec(raw)) return { ...EMPTY_SNAPSHOT };
  let media: MediaInfo | null = null;
  if (isRec(raw.media)) {
    const title = text(raw.media.title);
    const artist = text(raw.media.artist);
    if (title || artist) {
      media = {
        title,
        artist,
        playing: raw.media.playing === true,
        positionSec: secs(raw.media.positionSec),
        durationSec: secs(raw.media.durationSec),
      };
    }
  }
  let battery: BatteryInfo | null = null;
  if (isRec(raw.battery)) {
    const pct = raw.battery.percent;
    if (typeof pct === 'number' && Number.isInteger(pct) && pct >= 0 && pct <= 100) {
      battery = { percent: pct, charging: raw.battery.charging === true };
    }
  }
  return { fullscreen: raw.fullscreen === true, micActive: raw.micActive === true, media, battery };
}

export async function fetchSnapshot(): Promise<SystemSnapshot> {
  if (!inTauri()) return { ...EMPTY_SNAPSHOT };
  const { invoke } = await import('@tauri-apps/api/core');
  return parseSnapshot(await invoke('system_snapshot'));
}

export async function mediaControl(action: MediaAction): Promise<void> {
  if (!inTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('media_control', { action });
}
