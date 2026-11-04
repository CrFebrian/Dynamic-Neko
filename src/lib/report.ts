export const REPO_NEW_ISSUE = 'https://github.com/CrFebrian/Dynamic-Neko/issues/new';
export const SAWERIA_URL = 'https://saweria.co/BrianCoding';
const MAX_URL = 6000;

/** Baris terakhir log, dibatasi jumlah baris dan karakter (yang paling baru dipertahankan). */
export function lastLines(log: string, lines: number, maxChars: number): string {
  if (lines <= 0) return '';
  const out = log.split(/\r?\n/).filter((l) => l.trim() !== '').slice(-lines).join('\n');
  return out.length > maxChars ? out.slice(out.length - maxChars) : out;
}

/** "Windows NT 10.0" dari user agent WebView. Windows 10 dan 11 sama-sama melapor 10.0. */
export function describeOs(ua: string): string {
  const m = /Windows NT (\d+(?:\.\d+)?)/.exec(ua);
  return m ? `Windows NT ${m[1]}` : 'Tidak diketahui';
}

/**
 * URL form laporan GitHub dengan kolom terisi (id kolom: version, os, log).
 * Panjang URL dibatasi; bila kepanjangan, catatan error dipotong dari bagian lama.
 */
export function issueUrl(o: { version: string; os: string; log: string }): string {
  const build = (log: string): string => {
    const q = [
      ['template', 'bug_report.yml'],
      ['title', '[Bug] '],
      ['version', o.version],
      ['os', o.os],
      ['log', log],
    ]
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return `${REPO_NEW_ISSUE}?${q}`;
  };
  let log = o.log;
  let url = build(log);
  while (url.length > MAX_URL && log.length > 0) {
    log = log.slice(Math.ceil(log.length / 4));
    url = build(log);
  }
  return url;
}
