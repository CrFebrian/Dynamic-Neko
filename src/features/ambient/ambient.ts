import { fillNoise, type NoiseKind } from './noise.ts';
import { isLofi, renderLofi, type LofiId } from './lofi.ts';

export type AmbientKind = NoiseKind | LofiId;

/** Laju sampel musik lo-fi: cukup untuk nuansa hangat dan hemat waktu render. */
const LOFI_RATE = 22050;

/** Mesin suara latar berbasis Web Audio. Tidak memakai file audio, jadi tidak ada urusan lisensi. */
type Listener = () => void;

const SECONDS = 4;

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<Listener>();
  kind: AmbientKind | null = null;
  /** Lagu lo-fi sedang dirender (beberapa ratus milidetik pertama kali). */
  loading = false;
  private lofiCache = new Map<LofiId, AudioBuffer>();
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
    let buffer: AudioBuffer;
    if (isLofi(kind)) {
      let cached = this.lofiCache.get(kind);
      if (!cached) {
        this.loading = true;
        this.emit();
        // Beri kesempatan UI menggambar "Menyiapkan…" sebelum render yang memakan CPU.
        await new Promise<void>((r) => window.setTimeout(r, 30));
        try {
          const data = renderLofi(kind, LOFI_RATE);
          cached = ctx.createBuffer(1, data.length, LOFI_RATE);
          cached.copyToChannel(data, 0);
          this.lofiCache.set(kind, cached);
        } finally {
          if (mine === this.token) this.loading = false;
        }
      }
      buffer = cached;
    } else {
      buffer = ctx.createBuffer(1, ctx.sampleRate * SECONDS, ctx.sampleRate);
      fillNoise(buffer.getChannelData(0), kind);
    }
    if (mine !== this.token) {
      this.emit();
      return; // pengguna sudah memilih/menghentikan yang lain
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
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
