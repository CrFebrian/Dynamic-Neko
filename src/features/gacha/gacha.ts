import { clampStr, finiteNum, isObj, safeParse } from '../../lib/json.ts';

/** Timer harian: reset setiap hari pada jam:menit lokal (mis. daily game). */
export interface GachaTimer {
  id: number;
  name: string;
  hour: number;
  minute: number;
}

export const MAX_TIMERS = 12;
export const MAX_NAME = 30;

/** Kemunculan berikutnya (epoch ms) dari jam:menit lokal, selalu setelah `now`. */
export function nextReset(now: number, hour: number, minute: number): number {
  const d = new Date(now);
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0).getTime();
  if (t > now) return t;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, hour, minute, 0, 0).getTime();
}

export function parseTimers(text: string | null): GachaTimer[] {
  const raw = safeParse(text);
  if (!Array.isArray(raw)) return [];
  const out: GachaTimer[] = [];
  const ids = new Set<number>();
  for (const r of raw) {
    if (!isObj(r)) continue;
    const id = finiteNum(r.id);
    const hour = finiteNum(r.hour);
    const minute = finiteNum(r.minute);
    const name = clampStr(r.name, MAX_NAME);
    if (id === null || hour === null || minute === null || !name || ids.has(id)) continue;
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
    ids.add(id);
    out.push({ id, name, hour, minute });
    if (out.length >= MAX_TIMERS) break;
  }
  return out;
}

export const serializeTimers = (t: readonly GachaTimer[]): string => JSON.stringify(t.slice(0, MAX_TIMERS));

/** "HH:MM" -> {hour, minute}, null bila tidak valid. */
export function parseHm(v: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

export function addTimer(list: readonly GachaTimer[], name: string, hm: string): GachaTimer[] | null {
  const n = clampStr(name, MAX_NAME);
  const t = parseHm(hm);
  if (!n || !t || list.length >= MAX_TIMERS) return null;
  const id = list.reduce((mx, x) => Math.max(mx, x.id), 0) + 1;
  return [...list, { id, name: n, ...t }];
}

export const sortTimers = (list: readonly GachaTimer[], now: number): GachaTimer[] =>
  [...list].sort((a, b) => nextReset(now, a.hour, a.minute) - nextReset(now, b.hour, b.minute));
