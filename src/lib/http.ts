import type { FetchLike } from './json.ts';
import { inTauri } from './env.ts';

/**
 * fetch untuk permintaan keluar. Di aplikasi, lewat plugin HTTP Tauri (dikirim dari Rust,
 * hanya ke host yang diizinkan di capabilities, tidak terkena CORS). Di browser, fetch biasa.
 */
export const appFetch: FetchLike = async (url, init) => {
  if (inTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    return tauriFetch(url, init);
  }
  return fetch(url, init);
};

export const CLIENT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': 'YomiIsland/0.1 (personal desktop app)',
};
