import { finiteNum, isObj, safeParse } from '../../lib/json.ts';

export const RELEASES_API = 'https://api.github.com/repos/CrFebrian/Dynamic-Neko/releases/latest';
/** Satu-satunya halaman rilis yang dibuka dari aplikasi (diizinkan juga oleh Rust). */
export const RELEASES_PAGE = 'https://github.com/CrFebrian/Dynamic-Neko/releases/latest';
export const CHECK_INTERVAL_MS = 12 * 3_600_000;

/** "v1.2.3" / "1.2" -> [1,2,3] / [1,2,0]. Akhiran -pre atau +build menandai pra-rilis dan ditolak. */
export function parseVersion(v: string): [number, number, number] | null {
  const m = /^v?(\d{1,6})(?:\.(\d{1,6}))?(?:\.(\d{1,6}))?$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)] : null;
}

/** true bila `latest` lebih baru dari `current`. Versi yang tidak bisa dibaca dianggap tidak lebih baru. */
export function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/** Respons GitHub "latest release". Draft dan pra-rilis diabaikan. Mengembalikan nomor versi (tanpa "v"). */
export function parseRelease(json: unknown): string | null {
  if (!isObj(json) || json.draft === true || json.prerelease === true) return null;
  const tag = typeof json.tag_name === 'string' ? json.tag_name : '';
  const v = parseVersion(tag);
  return v ? v.join('.') : null;
}

export interface UpdateInfo {
  /** Kapan terakhir berhasil memeriksa (epoch ms). */
  checkedAt: number;
  /** Versi rilis terbaru; null bila belum ada rilis. */
  latest: string | null;
  /** Versi terbaru yang sudah diumumkan lewat pill. */
  notified: string | null;
}

export function parseUpdateInfo(text: string | null): UpdateInfo | null {
  const raw = safeParse(text);
  if (!isObj(raw)) return null;
  const at = finiteNum(raw.checkedAt);
  if (at === null || at <= 0) return null;
  const ver = (v: unknown): string | null => (typeof v === 'string' && parseVersion(v) ? parseVersion(v)!.join('.') : null);
  return { checkedAt: at, latest: ver(raw.latest), notified: ver(raw.notified) };
}

export const serializeUpdateInfo = (i: UpdateInfo): string => JSON.stringify(i);

/** Periksa lagi bila belum pernah, sudah lewat 12 jam, atau jam laptop mundur (checkedAt di masa depan). */
export function shouldCheck(info: UpdateInfo | null, now: number, force = false): boolean {
  if (force || info === null) return true;
  const age = now - info.checkedAt;
  return age < 0 || age >= CHECK_INTERVAL_MS;
}

/** Perlu diumumkan di pill: ada versi baru yang belum pernah diumumkan. */
export const shouldNotify = (info: UpdateInfo | null, current: string): info is UpdateInfo & { latest: string } =>
  info !== null && info.latest !== null && isNewer(info.latest, current) && info.notified !== info.latest;

export function statusText(info: UpdateInfo | null, current: string): string {
  if (info === null) return 'Belum pernah diperiksa.';
  if (info.latest === null) return 'Belum ada rilis di GitHub.';
  return isNewer(info.latest, current) ? `Versi ${info.latest} tersedia.` : 'Yomi Island sudah versi terbaru.';
}
