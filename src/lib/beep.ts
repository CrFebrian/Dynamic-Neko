let ctx: AudioContext | null = null;

/** Bunyi singkat saat sesi selesai. Gagal diam-diam bila audio diblokir. */
export function beep(): void {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.6);
  } catch {
    /* audio tidak tersedia */
  }
}
