/** Sampul pengganti bila pemutar tidak menyediakan gambar: warna (hueFromText di lib/media) + huruf awal. */
/** Huruf awal judul (atau artis) untuk ditampilkan di sampul pengganti; "♪" bila tidak ada huruf/angka. */
export function coverInitial(title: string, artist: string): string {
  for (const src of [title, artist]) {
    const m = /[\p{L}\p{N}]/u.exec(src);
    if (m) return m[0].toUpperCase();
  }
  return '♪';
}
