/** Katalog pengaturan: satu sumber untuk judul, keterangan, kategori, dan pencarian. */

export type Cat = 'umum' | 'tentang' | 'tampilan' | 'isi' | 'musik' | 'hari' | 'anime' | 'fokus';

export interface CatInfo {
  key: Cat;
  label: string;
  desc: string;
}

export const GROUPS: ReadonlyArray<{ label: string; items: readonly CatInfo[] }> = [
  {
    label: 'Dasar',
    items: [
      { key: 'umum', label: 'Umum', desc: 'Perilaku island dan keluar dari aplikasi.' },
      { key: 'tentang', label: 'Tentang', desc: 'Dukungan dan laporan masalah.' },
    ],
  },
  {
    label: 'Island',
    items: [
      { key: 'tampilan', label: 'Tampilan', desc: 'Tema dan gaya island.' },
      { key: 'isi', label: 'Isi island', desc: 'Yang tampil di pill saat diam.' },
    ],
  },
  {
    label: 'Fitur',
    items: [
      { key: 'musik', label: 'Musik & Audio', desc: 'Lirik dan bunyi pengingat.' },
      { key: 'hari', label: 'Hari ini', desc: 'Target baca, istirahat mata, dan reset game.' },
      { key: 'anime', label: 'Anime & Manga', desc: 'Notifikasi dan bahasa bab.' },
      { key: 'fokus', label: 'Mode fokus', desc: 'Rapat dan menonton.' },
    ],
  },
];

export const CATS: readonly CatInfo[] = GROUPS.flatMap((g) => g.items);
export const catLabel = (k: Cat): string => CATS.find((c) => c.key === k)?.label ?? '';

export interface Entry {
  id: string;
  cat: Cat;
  title: string;
  hint: string;
  /** Kata tambahan untuk pencarian (sinonim, bahasa Inggris). */
  keywords: string;
}

const list: Entry[] = [
  { id: 'autoClose', cat: 'umum', title: 'Tutup otomatis saat kursor keluar', hint: 'Panel kembali jadi pill kecil sesaat setelah kursor meninggalkannya, tanpa menekan ×. Tidak menutup saat kamu sedang mengetik.', keywords: 'hover mouse pill collapse' },
  { id: 'autostart', cat: 'umum', title: 'Jalankan saat Windows mulai', hint: 'Yomi Island terbuka sendiri setelah kamu masuk ke Windows. Hanya untuk akun ini, tanpa hak administrator. Bisa dimatikan di sini atau di Pengaturan Windows > Aplikasi > Startup.', keywords: 'startup autostart boot login otomatis nyala sendiri' },
  { id: 'tourDone', cat: 'umum', title: 'Tur pengenalan', hint: 'Penjelasan singkat letak fitur di island. Tampil otomatis sekali saat pertama dipakai.', keywords: 'tutorial panduan bantuan intro mulai' },
  { id: 'updateCheck', cat: 'umum', title: 'Beri tahu saat ada versi baru', hint: 'Memeriksa GitHub Releases paling sering 12 jam sekali. Hanya mengirim permintaan biasa; tidak ada data pribadi yang dikirim.', keywords: 'update pembaruan versi rilis release unduh' },
  { id: 'quit', cat: 'umum', title: 'Keluar dari Yomi Island', hint: 'Island ditutup. Buka lagi dari menu Start.', keywords: 'quit exit tutup aplikasi' },
  { id: 'support', cat: 'tentang', title: 'Dukung Yomi Island', hint: 'Aplikasi ini gratis. Traktiran lewat Saweria membantu pengembangannya.', keywords: 'saweria donasi kopi sawer traktir' },
  { id: 'license', cat: 'tentang', title: 'Lisensi', hint: 'Gratis untuk pemakaian pribadi, tidak dijual.', keywords: 'versi version freeware' },
  { id: 'report', cat: 'tentang', title: 'Laporkan masalah', hint: 'Membuka form GitHub di browser, sudah terisi versi, Windows, dan error terakhir. Periksa dulu sebelum mengirim.', keywords: 'bug github issue lapor error' },
  { id: 'folder', cat: 'tentang', title: 'Folder log & pengaturan', hint: 'error.log berisi catatan error; lampirkan saat melapor. Di folder yang sama ada yomi.db (task, buku, pengaturan).', keywords: 'log error.log yomi.db data explorer' },
  { id: 'theme', cat: 'tampilan', title: 'Tema', hint: 'Gelap, terang, atau mengikuti pengaturan terang/gelap Windows.', keywords: 'dark light gelap terang mode warna' },
  { id: 'style', cat: 'tampilan', title: 'Gaya island', hint: 'Dynamic melayang di bawah tepi atas, Notch menempel ke tepi.', keywords: 'dynamic notch bentuk' },
  { id: 'showClock', cat: 'isi', title: 'Tampilkan jam', hint: 'Jam lokal (24 jam) di sisi kanan neko.', keywords: 'clock waktu' },
  { id: 'showBattery', cat: 'isi', title: 'Tampilkan baterai', hint: 'Persentase dan status mengisi di sisi kiri neko. Tidak tampil di PC tanpa baterai.', keywords: 'battery daya charge' },
  { id: 'beep', cat: 'musik', title: 'Bunyi saat pengingat', hint: 'Bip singkat saat timer, istirahat mata, atau notifikasi muncul.', keywords: 'suara sound beep bip' },
  { id: 'lyrics', cat: 'musik', title: 'Lirik berjalan', hint: 'Judul dan artis lagu yang diputar dikirim ke LRCLIB untuk mencari lirik.', keywords: 'lyrics lrclib lagu spotify' },
  { id: 'eyeInterval', cat: 'hari', title: 'Istirahat mata 20-20-20', hint: 'Tiap jeda ini, pandang yang jauh selama 20 detik.', keywords: 'mata eye break pengingat' },
  { id: 'goal', cat: 'hari', title: 'Target baca harian', hint: 'Jumlah halaman per hari, 5 sampai 500.', keywords: 'halaman buku streak baca' },
  { id: 'notifyGacha', cat: 'hari', title: 'Notifikasi reset harian game', hint: 'Muncul di pill saat jam reset timer game tiba.', keywords: 'gacha game daily reset' },
  { id: 'notifyAnime', cat: 'anime', title: 'Notifikasi episode anime tayang', hint: 'Muncul saat jadwal tayang anime di daftarmu tiba. Data dari AniList.', keywords: 'anilist episode jadwal' },
  { id: 'notifyManga', cat: 'anime', title: 'Notifikasi bab manga baru', hint: 'Dicek tiap 30 menit selama aplikasi berjalan. Data dari MangaDex.', keywords: 'mangadex chapter bab' },
  { id: 'mangaLang', cat: 'anime', title: 'Bahasa bab manga', hint: 'Mengganti bahasa mengulang acuan bab, jadi tidak ada notifikasi palsu.', keywords: 'bahasa language inggris indonesia' },
  { id: 'meetingMode', cat: 'fokus', title: 'Mode rapat otomatis', hint: 'Saat mikrofon dipakai: pengingat dan bunyi ditahan, pill jadi indikator rapat.', keywords: 'meeting mic mikrofon' },
  { id: 'watchMode', cat: 'fokus', title: 'Mode nonton otomatis', hint: 'Saat ada aplikasi layar penuh: island bersembunyi dan pengingat ditahan.', keywords: 'fullscreen layar penuh video game' },
];

export const ENTRIES: readonly Entry[] = list;
const byId = new Map(list.map((e) => [e.id, e]));

/** Ambil entri berdasarkan id; melempar bila id salah (kesalahan programmer, bukan input pengguna). */
export function entry(id: string): Entry {
  const e = byId.get(id);
  if (!e) throw new Error(`Entri pengaturan tidak ada: ${id}`);
  return e;
}

/** Cari pengaturan. Semua kata kueri harus cocok (judul, keterangan, kata kunci, atau nama kategori). */
export function searchSettings(query: string): Entry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return list.filter((e) => {
    const hay = `${e.title} ${e.hint} ${e.keywords} ${catLabel(e.cat)}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
