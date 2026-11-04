import type { IslandStyle } from '../island/types.ts';
import type { ThemePref } from './theme.ts';

/** Semua pengaturan yang bisa diubah pengguna. Disimpan sebagai teks di tabel pengaturan. */
export interface Settings {
  style: IslandStyle;
  theme: ThemePref;
  /** Panel menutup sendiri saat kursor keluar. */
  autoClose: boolean;
  beep: boolean;
  meetingMode: boolean;
  watchMode: boolean;
  showClock: boolean;
  showBattery: boolean;
  /** Menit antar istirahat mata; 0 = mati. */
  eyeInterval: number;
  goal: number;
  notifyAnime: boolean;
  notifyManga: boolean;
  notifyGacha: boolean;
  mangaLang: 'en' | 'id';
  lyrics: boolean;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  style: 'dynamic',
  theme: 'dark',
  autoClose: true,
  beep: true,
  meetingMode: true,
  watchMode: true,
  showClock: true,
  showBattery: true,
  eyeInterval: 20,
  goal: 20,
  notifyAnime: true,
  notifyManga: true,
  notifyGacha: true,
  mangaLang: 'en',
  lyrics: false,
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
export const EYE_OPTIONS: readonly number[] = [0, 20, 30, 45];
export const GOAL_MIN = 5;
export const GOAL_MAX = 500;

const bool = (raw: string | null, def: boolean): boolean => (raw === '1' ? true : raw === '0' ? false : def);
const int = (raw: string | null, def: number, min: number, max: number): number => {
  if (raw === null || raw.trim() === '') return def;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : def;
};

/** Ubah satu nilai mentah menjadi nilai bertipe. Nilai rusak atau di luar batas kembali ke default. */
export function parseSetting<K extends SettingKey>(key: K, raw: string | null): Settings[K] {
  const d = DEFAULT_SETTINGS;
  let v: Settings[SettingKey];
  switch (key) {
    case 'style':
      v = raw === 'notch' || raw === 'dynamic' ? raw : d.style;
      break;
    case 'theme':
      v = raw === 'dark' || raw === 'light' || raw === 'system' ? raw : d.theme;
      break;
    case 'mangaLang':
      v = raw === 'id' || raw === 'en' ? raw : d.mangaLang;
      break;
    case 'eyeInterval':
      v = int(raw, d.eyeInterval, 0, 240);
      break;
    case 'goal':
      v = int(raw, d.goal, GOAL_MIN, GOAL_MAX);
      break;
    default:
      v = bool(raw, d[key] as boolean);
  }
  return v as Settings[K];
}

export function serializeSetting<K extends SettingKey>(key: K, value: Settings[K]): string {
  const v = value as unknown;
  return typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
}

export function parseSettings(get: (key: SettingKey) => string | null): Settings {
  const out = { ...DEFAULT_SETTINGS } as Record<SettingKey, unknown>;
  for (const k of SETTING_KEYS) out[k] = parseSetting(k, get(k));
  return out as unknown as Settings;
}

interface SettingStore {
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export async function loadSettings(store: SettingStore): Promise<Settings> {
  const raws = await Promise.all(SETTING_KEYS.map((k) => store.getSetting(k)));
  const map = new Map<SettingKey, string | null>(SETTING_KEYS.map((k, i) => [k, raws[i]]));
  return parseSettings((k) => map.get(k) ?? null);
}

export function saveSetting<K extends SettingKey>(store: SettingStore, key: K, value: Settings[K]): Promise<void> {
  return store.setSetting(key, serializeSetting(key, value));
}
