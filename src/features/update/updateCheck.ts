import { fetchJson, type FetchLike } from '../../lib/json.ts';
import { appFetch } from '../../lib/http.ts';
import { parseRelease, parseUpdateInfo, RELEASES_API, serializeUpdateInfo, shouldCheck, type UpdateInfo } from './update.ts';

export const UPDATE_KEY = 'updateInfo';

interface KV {
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export async function loadUpdateInfo(store: KV): Promise<UpdateInfo | null> {
  return parseUpdateInfo(await store.getSetting(UPDATE_KEY));
}

/**
 * Periksa rilis terbaru bila sudah waktunya (atau `force`). Melempar Error bila jaringan/GitHub bermasalah;
 * dalam kasus itu waktu pemeriksaan tidak diperbarui, jadi percobaan berikutnya tidak menunggu 12 jam.
 */
export async function checkForUpdate(
  store: KV,
  now: number,
  force = false,
  fetchImpl: FetchLike = appFetch,
): Promise<{ info: UpdateInfo; fetched: boolean }> {
  const prev = await loadUpdateInfo(store);
  if (!shouldCheck(prev, now, force)) return { info: prev as UpdateInfo, fetched: false };
  // 404 = repo privat atau belum ada rilis: dianggap "belum ada rilis", bukan error.
  const json = await fetchJson(fetchImpl, RELEASES_API, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  const info: UpdateInfo = { checkedAt: now, latest: parseRelease(json), notified: prev?.notified ?? null };
  await store.setSetting(UPDATE_KEY, serializeUpdateInfo(info));
  return { info, fetched: true };
}

export async function markNotified(store: KV, info: UpdateInfo & { latest: string }): Promise<void> {
  await store.setSetting(UPDATE_KEY, serializeUpdateInfo({ ...info, notified: info.latest }));
}
