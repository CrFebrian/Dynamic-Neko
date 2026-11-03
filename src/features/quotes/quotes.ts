/** Kutipan buatan sendiri (bukan kutipan orang lain), jadi bebas hak cipta. */
export const QUOTES: readonly string[] = [
  'Satu bab hari ini lebih baik dari seratus rencana besok.',
  'Buku yang belum dibuka tetap sepi. Buka satu halaman saja.',
  'Istirahat itu bagian dari maraton, bukan penghalangnya.',
  'Episode favoritmu akan tetap ada setelah tugasmu selesai.',
  'Pelan tidak apa-apa, asal halamannya bertambah.',
  'Fokus 25 menit, lalu hadiahi dirimu dengan secangkir teh.',
  'Cerita yang bagus butuh pembaca yang tidak terburu-buru.',
  'Hari yang berat pun bisa ditutup dengan satu bab ringan.',
  'Targetmu kecil? Bagus. Yang kecil lebih mudah dijaga setiap hari.',
  'Mata yang beristirahat membaca lebih lama.',
  'Catat satu hal yang kamu selesaikan hari ini.',
  'Streak itu kebiasaan, bukan tekanan.',
];

/** Indeks deterministik dari kunci hari, jadi kutipan sama sepanjang hari. */
export function quoteIndex(dayKey: string, count = QUOTES.length): number {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % count;
}

export const quoteOfDay = (dayKey: string): string => QUOTES[quoteIndex(dayKey)];
