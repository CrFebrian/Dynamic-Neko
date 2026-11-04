import { inTauri } from './env.ts';

/** Ubah argumen console.error jadi teks. Error memakai stack bila ada. */
export function formatArg(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack ?? `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}

/** Pembatas laju: paling banyak `max` kejadian dalam `windowMs`. */
export function createLimiter(max: number, windowMs: number): (now: number) => boolean {
  let times: number[] = [];
  return (now) => {
    times = times.filter((t) => now - t < windowMs);
    if (times.length >= max) return false;
    times.push(now);
    return true;
  };
}

/** Kirim error (console.error, error tak tertangani, promise ditolak) ke error.log lewat Rust. Hanya di aplikasi. */
export function installErrorLog(source: string): void {
  if (!inTauri()) return;
  const allow = createLimiter(30, 60_000);
  let last = '';
  const send = (raw: string): void => {
    const message = raw.slice(0, 2000);
    if (message === '' || message === last || !allow(Date.now())) return;
    last = message;
    void import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('log_error', { source, message }))
      .catch(() => {
        /* jangan memanggil console.error di sini agar tidak berputar */
      });
  };

  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    send(args.map(formatArg).join(' '));
  };
  window.addEventListener('error', (e) => send(`${e.message} (${e.filename}:${e.lineno})`));
  window.addEventListener('unhandledrejection', (e) => send(`Promise ditolak: ${formatArg(e.reason)}`));
}
