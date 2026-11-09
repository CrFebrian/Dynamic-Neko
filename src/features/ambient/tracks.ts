/**
 * Suara latar: tiga pilihan Lo-fi (malam, hujan, kafe). Tiap pilihan memutar daftar lagu berurutan
 * (file di public/music, dibundel ke aplikasi) lalu mengulang dari awal.
 * Ganti/tambah lagu: taruh file .ogg/.mp3 di public/music, lalu edit TRACKS dan SLOTS di sini.
 */
export interface FileTrack {
  id: string;
  title: string;
  artist: string;
  /** Nama file di public/music. Format yang aman di WebView2: ogg (Vorbis/Opus) atau mp3. */
  file: string;
}

export const TRACKS: readonly FileTrack[] = [
  { id: 'an-ode-to', title: 'An Ode To', artist: 'Kenji Peach', file: 'an-ode-to.ogg' },
  { id: 'tuesday-at-three', title: 'Tuesday at Three', artist: '', file: 'tuesday-at-three.ogg' },
  { id: 'chill-day', title: 'Chill Day', artist: 'LAKEY INSPIRED', file: 'chill-day.ogg' },
  { id: 'me-2', title: 'Me 2', artist: 'LAKEY INSPIRED', file: 'me-2.ogg' },
];

export type AmbientKind = 'malam' | 'hujan' | 'kafe';

export interface Slot {
  id: AmbientKind;
  label: string;
  /** Id lagu di TRACKS, diputar berurutan. */
  playlist: readonly string[];
}

export const SLOTS: readonly Slot[] = [
  { id: 'malam', label: 'Lo-fi malam', playlist: ['an-ode-to'] },
  { id: 'hujan', label: 'Lo-fi hujan', playlist: ['tuesday-at-three'] },
  { id: 'kafe', label: 'Lo-fi kafe', playlist: ['chill-day', 'me-2'] },
];

export const slot = (id: string): Slot | undefined => SLOTS.find((s) => s.id === id);
export const track = (id: string): FileTrack | undefined => TRACKS.find((t) => t.id === id);

/** Lagu ke-`index` pada pilihan `kind`; indeks melingkar. */
export function trackAt(kind: string, index: number): FileTrack | undefined {
  const s = slot(kind);
  if (!s || s.playlist.length === 0) return undefined;
  const n = s.playlist.length;
  return track(s.playlist[((index % n) + n) % n]!);
}
