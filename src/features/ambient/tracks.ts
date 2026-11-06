import { LOFI_TRACKS, type LofiId } from './lofi.ts';

/** Lagu berupa file di public/music (dibundel ke aplikasi). Tambah lagu baru: taruh file-nya, lalu tambah satu baris di sini. */
export interface FileTrack {
  id: string;
  label: string;
  artist: string;
  /** Nama file di public/music. Format yang aman di WebView2: ogg (Vorbis/Opus) atau mp3. */
  file: string;
}

export const FILE_TRACKS: readonly FileTrack[] = [
  { id: 'an-ode-to', label: 'An Ode To', artist: 'Kenji Peach', file: 'an-ode-to.ogg' },
];

export type AmbientKind = LofiId | string;

export interface TrackInfo {
  id: string;
  label: string;
  /** Pencipta; kosong untuk musik sintetis bawaan. */
  artist: string | null;
}

/** Semua pilihan di Suara latar: lagu file dulu, lalu musik sintetis bawaan. */
export const ALL_TRACKS: readonly TrackInfo[] = [
  ...FILE_TRACKS.map((t) => ({ id: t.id, label: t.label, artist: t.artist })),
  ...LOFI_TRACKS.map((t) => ({ id: t.id, label: t.label, artist: null })),
];

export const fileTrack = (id: string): FileTrack | undefined => FILE_TRACKS.find((t) => t.id === id);
export const trackInfo = (id: string): TrackInfo | undefined => ALL_TRACKS.find((t) => t.id === id);
