import { inTauri } from './env.ts';

/** Buka tautan di browser. Rust hanya mengizinkan URL di daftar putih. */
export async function openExternal(url: string): Promise<void> {
  if (!inTauri()) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_url', { url });
}

export async function openDataDir(): Promise<void> {
  if (!inTauri()) throw new Error('Folder data hanya tersedia di aplikasi Windows.');
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_data_dir');
}

/** Akhir error.log; kosong di browser atau bila belum ada. */
export async function readErrorLog(): Promise<string> {
  if (!inTauri()) return '';
  const { invoke } = await import('@tauri-apps/api/core');
  const r = await invoke('read_error_log');
  return typeof r === 'string' ? r : '';
}
