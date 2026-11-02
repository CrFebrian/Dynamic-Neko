/** true bila berjalan di dalam jendela Tauri (bukan browser biasa). */
export const inTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
