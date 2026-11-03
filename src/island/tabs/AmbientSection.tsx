import { useState, useSyncExternalStore } from 'react';
import { ambient } from '../../features/ambient/ambient.ts';
import { NOISE_KINDS, NOISE_LABEL, type NoiseKind } from '../../features/ambient/noise.ts';

export function AmbientSection() {
  const kind = useSyncExternalStore(ambient.subscribe, () => ambient.kind);
  const volume = useSyncExternalStore(ambient.subscribe, () => ambient.volume);
  const [err, setErr] = useState<string | null>(null);

  const pick = (k: NoiseKind) => {
    setErr(null);
    if (kind === k) {
      ambient.stop();
      return;
    }
    ambient.play(k).catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Audio tidak bisa dimulai.'));
  };

  return (
    <>
      <div className="sec">Suara latar</div>
      <div className="chips">
        {NOISE_KINDS.map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => pick(k)}>
            {NOISE_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="row tight" style={{ marginTop: 8 }}>
        <label htmlFor="amb-vol" className="note" style={{ margin: 0 }}>
          Volume
        </label>
        <input id="amb-vol" type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => ambient.setVolume(Number(e.target.value) / 100)} style={{ flex: 1 }} />
      </div>
      <p className="note">{err ?? (kind ? 'Tekan lagi untuk berhenti. Suara tetap jalan saat panel ditutup.' : 'Derau dibuat langsung di laptop, tanpa file audio.')}</p>
    </>
  );
}
