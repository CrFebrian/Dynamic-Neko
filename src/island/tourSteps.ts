import type { Mascot } from '../mascot/types.ts';

/** Bagian panel yang disorot selama langkah tur berlangsung. */
export type Highlight = 'pill' | 'head' | 'tabs' | 'nav';

export interface TourStep {
  id: string;
  title: string;
  text: string;
  highlight: Highlight;
  mascot: Mascot;
}

export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'hai', title: 'Hai, ini Yomi Island', text: 'Pill kecil di tepi atas layar: baterai di kiri, neko di tengah, jam di kanan. Ekspresi neko berubah sesuai yang sedang terjadi.', highlight: 'pill', mascot: 'excited' },
  { id: 'buka', title: 'Klik untuk membuka', text: 'Klik pill untuk membuka panel. Panel menutup sendiri saat kursor keluar, atau tekan × atau Esc.', highlight: 'head', mascot: 'idle' },
  { id: 'tab', title: 'Fitur ada di tab bawah', text: 'Hari ini (task), Baca (timer dan buku), Anime (jadwal tayang dan manga), Musik (kontrol dan volume), Santai (istirahat mata, suara latar, timer game).', highlight: 'tabs', mascot: 'reading' },
  { id: 'geser', title: 'Geser sesukamu', text: 'Seret pill atau bagian atas panel ke kiri atau kanan. Posisi island diingat dan menyesuaikan ukuran layar.', highlight: 'head', mascot: 'music' },
  { id: 'atur', title: 'Pengaturan ada di sini', text: 'Ikon pengaturan di bar bawah membuka jendela Pengaturan: tema, isi pill, notifikasi, dan pembaruan. Panah di kedua sisinya memindah tab.', highlight: 'nav', mascot: 'idle' },
];

export const isLastStep = (i: number): boolean => i >= TOUR_STEPS.length - 1;
