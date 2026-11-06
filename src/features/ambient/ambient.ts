import { isLofi, renderLofi } from './lofi.ts';
import { fileTrack, type AmbientKind } from './tracks.ts';

export type { AmbientKind };

/** Laju sampel musik lo-fi: cukup untuk nuansa hangat dan hemat waktu render. */
const LOFI_RATE = 22050;

/** Mesin suara latar berbasis Web Audio: lagu file (public/music) dan musik lo-fi sintetis. */
type Listener = () => void;

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<Listener>();
  kind: AmbientKind | null = null;
  /** Lagu sedang dimuat atau dirender (hanya pertama kali; setelahnya dari cache). */
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

  /** Mulai (atau ganti) suara. Harus dipanggil dari gerakan pengguna agar browser mengizinkan audio. */
  async play(kind: AmbientKind): Promise<void> {
    const mine = ++this.token;
    this.stopSource();
    this.kind = null;
    const ctx = (this.ctx ??= new AudioContext());
    if (ctx.state === 'suspended') await ctx.resume();
    let cached = this.cache.get(kind);
    if (!cached) {
      this.loading = true;
      this.emit();
      try {
        cached = await this.load(ctx, kind);
        this.cache.set(kind, cached);
      } finally {
        if (mine === this.token) this.loading = false;
      }
    }
    if (mine !== this.token) {
      this.emit();
      return; // pengguna sudah memilih/menghentikan yang lain
    }
    const src = ctx.createBufferSource();
    src.buffer = cached;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = this.volume;
    src.connect(gain).connect(ctx.destination);
    src.start();
    this.src = src;
    this.gain = gain;
    this.kind = kind;
    this.emit();
  }

  /** Siapkan buffer: dekode file atau render musik sintetis. */
  private async load(ctx: AudioContext, kind: AmbientKind): Promise<AudioBuffer> {
    const ft = fileTrack(kind);
    if (ft) {
      const res = await fetch(`/music/${ft.file}`);
      if (!res.ok) throw new Error(`Lagu "${ft.label}" tidak bisa dimuat (HTTP ${res.status}).`);
      return ctx.decodeAudioData(await res.arrayBuffer());
    }
    if (isLofi(kind)) {
      // Beri kesempatan UI menggambar "Menyiapkan…" sebelum render yang memakan CPU.
      await new Promise<void>((r) => window.setTimeout(r, 30));
      const data = renderLofi(kind, LOFI_RATE);
      const buf = ctx.createBuffer(1, data.length, LOFI_RATE);
      buf.getChannelData(0).set(data);
      return buf;
    }
    throw new Error(`Suara latar tidak dikenal: ${kind}`);
  }

  stop(): void {
    this.token++;
    this.loading = false;
    this.stopSource();
    this.kind = null;
    this.emit();
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.gain) this.gain.gain.value = this.volume;
    this.emit();
  }

  private stopSource(): void {
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
