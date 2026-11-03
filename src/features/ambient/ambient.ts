import { fillNoise, type NoiseKind } from './noise.ts';

/** Mesin suara latar berbasis Web Audio. Tidak memakai file audio, jadi tidak ada urusan lisensi. */
type Listener = () => void;

const SECONDS = 4;

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<Listener>();
  kind: NoiseKind | null = null;
  volume = 0.4;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  /** Mulai (atau ganti) suara. Harus dipanggil dari gerakan pengguna agar browser mengizinkan audio. */
  async play(kind: NoiseKind): Promise<void> {
    this.stopSource();
    const ctx = (this.ctx ??= new AudioContext());
    if (ctx.state === 'suspended') await ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * SECONDS, ctx.sampleRate);
    fillNoise(buffer.getChannelData(0), kind);
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
