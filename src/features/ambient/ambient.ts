import { slot, trackAt, type AmbientKind, type FileTrack } from './tracks.ts';

export type { AmbientKind };

type Listener = () => void;

/**
 * Mesin suara latar. Lagu di-stream lewat elemen <audio> (hanya buffer kecil di memori),
 * bukan didekode utuh ke Web Audio yang memakan puluhan MB per lagu.
 * Satu pilihan memutar daftar lagunya berurutan lalu mengulang.
 */
class AmbientEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  kind: AmbientKind | null = null;
  /** Lagu yang sedang diputar. */
  current: FileTrack | null = null;
  /** Lagu sedang dimuat sebelum bunyi. */
  loading = false;
  private index = 0;
  /** Nomor permintaan terbaru: permintaan lama yang selesai belakangan dibuang. */
  private token = 0;
  volume = 0.4;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private el(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = 'auto';
    a.onplaying = () => {
      if (this.loading) {
        this.loading = false;
        this.emit();
      }
    };
    a.onended = () => this.next();
    a.onerror = () => {
      console.error('Gagal memutar lagu:', this.current?.file, a.error);
      this.stop();
    };
    this.audio = a;
    return a;
  }

  /** Mulai (atau ganti) pilihan. Harus dipanggil dari gerakan pengguna agar audio diizinkan. */
  async play(kind: AmbientKind): Promise<void> {
    const mine = ++this.token;
    this.index = 0;
    await this.start(kind, mine);
  }

  private async start(kind: AmbientKind, mine: number): Promise<void> {
    const tr = trackAt(kind, this.index);
    if (!tr) throw new Error(`Pilihan suara latar tidak dikenal: ${kind}`);
    const a = this.el();
    const total = slot(kind)?.playlist.length ?? 1;
    a.loop = total === 1; // satu lagu: ulang langsung, tanpa memuat ulang
    a.volume = this.volume;
    a.src = `/music/${tr.file}`;
    this.kind = kind;
    this.current = tr;
    this.loading = true;
    this.emit();
    try {
      await a.play();
    } catch (e) {
      if (mine === this.token) this.stop();
      // AbortError = diganti/dihentikan pengguna sebelum sempat bunyi; bukan kegagalan.
      if (e instanceof DOMException && e.name === 'AbortError') return;
      throw e instanceof Error ? e : new Error('Audio tidak bisa dimulai.');
    }
    if (mine !== this.token) return;
    this.loading = false;
    this.emit();
  }

  private next(): void {
    if (this.kind === null) return;
    const total = slot(this.kind)?.playlist.length ?? 1;
    this.index = (this.index + 1) % total;
    const mine = ++this.token;
    this.start(this.kind, mine).catch((e: unknown) => {
      console.error('Gagal memutar lagu berikutnya:', e);
      if (mine === this.token) this.stop();
    });
  }

  stop(): void {
    this.token++;
    this.loading = false;
    const a = this.audio;
    if (a) {
      a.pause();
      a.removeAttribute('src'); // lepaskan buffer
      a.load();
    }
    this.kind = null;
    this.current = null;
    this.emit();
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.audio) this.audio.volume = this.volume;
    this.emit();
  }
}

export const ambient = new AmbientEngine();
