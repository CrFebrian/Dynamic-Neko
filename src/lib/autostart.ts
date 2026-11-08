import { inTauri } from './env.ts';

/** Apakah Yomi Island jalan saat Windows mulai. null = tidak bisa ditentukan (di browser). */
export async function getAutostart(): Promise<boolean | null> {
  if (!inTauri()) return null;
  const { invoke } = await import('@tauri-apps/api/core');
  const r = await invoke('get_autostart');
  return typeof r === 'boolean' ? r : null;
}

/** Nyalakan atau matikan. Melempar Error berisi alasan bila gagal. */
export async function setAutostart(enabled: boolean): Promise<void> {
  if (!inTauri()) throw new Error('Hanya tersedia di aplikasi Windows.');
  const { invoke } = await import('@tauri-apps/api/core');
  try {
    await invoke('set_autostart', { enabled });
  } catch (e) {
    // Tauri melempar string dari Result::Err.
    throw new Error(typeof e === 'string' ? e : e instanceof Error ? e.message : 'Gagal mengubah pengaturan startup.');
  }
}
