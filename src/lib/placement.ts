/**
 * Penempatan jendela island secara horizontal. Semua nilai x dalam piksel fisik.
 * Posisi disimpan sebagai fraksi (0..1) dari lebar monitor, titik tengah jendela,
 * sehingga tetap proporsional saat resolusi atau monitor berubah.
 */

/** Jarak aman dari tepi layar, dalam piksel logis. */
export const EDGE_MARGIN = 8;

/** Batasi x agar jendela tidak keluar monitor. Layar yang lebih sempit dari jendela: jendela dipusatkan. */
export function clampX(x: number, monX: number, monW: number, winW: number, margin: number): number {
  const min = monX + margin;
  const max = monX + monW - winW - margin;
  if (max < min) return Math.round(monX + (monW - winW) / 2);
  return Math.round(Math.min(max, Math.max(min, x)));
}

/** Fraksi (titik tengah jendela) -> x kiri jendela. Nilai tidak valid dianggap tengah. */
export function xFromFraction(f: number, monX: number, monW: number, winW: number, margin: number): number {
  const c = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0.5;
  return clampX(monX + c * monW - winW / 2, monX, monW, winW, margin);
}

/** x kiri jendela -> fraksi titik tengah, dibatasi 0..1. */
export function fractionFromX(x: number, monX: number, monW: number, winW: number): number {
  if (monW <= 0) return 0.5;
  return Math.min(1, Math.max(0, (x + winW / 2 - monX) / monW));
}

/** x baru saat menyeret: awal + selisih piksel CSS * skala, lalu dibatasi. */
export function dragX(
  startX: number,
  deltaCssPx: number,
  scale: number,
  monX: number,
  monW: number,
  winW: number,
  margin: number,
): number {
  return clampX(startX + deltaCssPx * scale, monX, monW, winW, margin);
}
