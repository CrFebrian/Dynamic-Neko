import { useState, useSyncExternalStore } from 'react';
import { ambient, type AmbientKind } from '../../features/ambient/ambient.ts';
import { SLOTS, slot } from '../../features/ambient/tracks.ts';

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

  const current = useSyncExternalStore(ambient.subscribe, () => ambient.current);
  const now = kind ? slot(kind) : undefined;
  const status = err
    ? err
    : loading
      ? 'Menyiapkan musik…'
      : now
        ? `${now.label}: ${current ? `${current.title}${current.artist ? ` — ${current.artist}` : ''}` : 'memutar'}. Tekan lagi untuk berhenti; musik tetap jalan saat panel ditutup.`
        : 'Pilih musik lo-fi untuk menemani.';

  return (
    <>
      <div className="sec">Suara latar</div>
      <div className="chips">
        {SLOTS.map((t) => (
          <button key={t.id} className="chip" aria-pressed={kind === t.id} onClick={() => pick(t.id)}>
            {t.label}
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
        {status}
      </p>
    </>
  );
}
