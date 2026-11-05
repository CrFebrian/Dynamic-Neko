import { useState, useSyncExternalStore } from 'react';
import { ambient, type AmbientKind } from '../../features/ambient/ambient.ts';
import { LOFI_TRACKS } from '../../features/ambient/lofi.ts';
import { NOISE_KINDS, NOISE_LABEL } from '../../features/ambient/noise.ts';

export function AmbientSection() {
  const kind = useSyncExternalStore(ambient.subscribe, () => ambient.kind);
  const loading = useSyncExternalStore(ambient.subscribe, () => ambient.loading);
  const volume = useSyncExternalStore(ambient.subscribe, () => ambient.volume);
  const [err, setErr] = useState<string | null>(null);

  const pick = (k: AmbientKind) => {
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
      <p className="note first">Musik lo-fi</p>
      <div className="chips">
        {LOFI_TRACKS.map((t) => (
          <button key={t.id} className="chip" aria-pressed={kind === t.id} onClick={() => pick(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="note">Derau</p>
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
      <p className="note" aria-live="polite">
        {err ??
          (loading
            ? 'Menyiapkan musik…'
            : kind
              ? 'Tekan lagi untuk berhenti. Suara tetap jalan saat panel ditutup.'
              : 'Musik lo-fi dibuat langsung di laptop (karya asli, tanpa file audio dan tanpa hak cipta).')}
      </p>
    </>
  );
}
