import { slot, trackAt, type AmbientKind, type FileTrack } from './tracks.ts';

export type { AmbientKind };

/** Banyak lagu terdekode yang disimpan di memori (lagu lain didekode ulang saat dibutuhkan). */
const CACHE_MAX = 2;

type Listener = () => void;

/** Mesin suara latar berbasis Web Audio: memutar daftar lagu satu pilihan, berurutan dan berulang. */
class AmbientEngine {
  private ctx: AudioContext | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<Listener>();
  kind: AmbientKind | null = null;
  /** Lagu yang sedang diputar. */
  current: FileTrack | null = null;
  /** Lagu sedang dimuat/didekode. */
  loading = false;
  private cache = new Map<string, AudioBuffer>();
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

  /** Mulai (atau ganti) pilihan. Harus dipanggil dari gerakan pengguna agar audio diizinkan. */
  async play(kind: AmbientKind): Promise<void> {
    const mine = ++this.token;
    this.stopSource();
    this.kind = null;
    this.current = null;
    const ctx = (this.ctx ??= new AudioContext());
    if (ctx.state === 'suspended') await ctx.resume();
    await this.playIndex(ctx, kind, 0, mine);
  }

  private async playIndex(ctx: AudioContext, kind: AmbientKind, index: number, mine: number): Promise<void> {
    const tr = trackAt(kind, index);
    if (!tr) throw new Error(`Pilihan suara latar tidak dikenal: ${kind}`);
    let buf = this.cache.get(tr.id);
    if (!buf) {
      this.loading = true;
      this.emit();
      try {
        buf = await this.load(ctx, tr);
      } finally {
        if (mine === this.token) this.loading = false;
      }
      this.remember(tr.id, buf);
    }
    if (mine !== this.token) {
      this.emit();
      return; // pengguna sudah memilih/menghentikan yang lain
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = this.volume;
    src.connect(gain).connect(ctx.destination);
    const total = slot(kind)?.playlist.length ?? 1;
    src.onended = () => {
      if (mine !== this.token) return; // dihentikan/diganti oleh pengguna
      this.playIndex(ctx, kind, (index + 1) % total, mine).catch((e: unknown) => {
        console.error('Gagal memutar lagu berikutnya:', e);
        if (mine === this.token) this.stop();
      });
    };
    src.start();
    this.src = src;
    this.gain = gain;
    this.kind = kind;
    this.current = tr;
    this.emit();
  }

  private remember(id: string, buf: AudioBuffer): void {
    this.cache.delete(id);
    this.cache.set(id, buf);
    while (this.cache.size > CACHE_MAX) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
  }

  private async load(ctx: AudioContext, tr: FileTrack): Promise<AudioBuffer> {
    const res = await fetch(`/music/${tr.file}`);
    if (!res.ok) throw new Error(`Lagu "${tr.title}" tidak bisa dimuat (HTTP ${res.status}).`);
    return ctx.decodeAudioData(await res.arrayBuffer());
  }

  stop(): void {
    this.token++;
    this.loading = false;
    this.stopSource();
    this.kind = null;
    this.current = null;
    this.emit();
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.gain) this.gain.gain.value = this.volume;
    this.emit();
  }

  private stopSource(): void {
    if (this.src) this.src.onended = null;
    try {
      this.src?.stop();
    } catch {
      /* sudah berhenti */
    }
    this.src?.disconnect();
    this.gain?.disconnect();
    this.src = null;
    this.gain = null;
  }
}

export const ambient = new AmbientEngine();
