import { useState, type FormEvent } from 'react';
import { left } from '../../lib/time.ts';
import {
  addTimer,
  MAX_NAME,
  MAX_TIMERS,
  nextReset,
  parseTimers,
  serializeTimers,
  sortTimers,
  type GachaTimer,
} from '../../features/gacha/gacha.ts';
import { useStored } from './useStored.ts';

export function GachaSection({ now }: { now: number }) {
  const [timers, setTimers] = useStored<GachaTimer[]>('gachaTimers', parseTimers, serializeTimers);
  const [name, setName] = useState('');
  const [hm, setHm] = useState('04:00');
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = addTimer(timers, name, hm);
    if (!next) {
      setErr(timers.length >= MAX_TIMERS ? `Maksimal ${MAX_TIMERS} timer.` : 'Isi nama dan jam reset.');
      return;
    }
    setErr(null);
    setTimers(next);
    setName('');
  };

  return (
    <>
      <div className="sec">Reset harian game</div>
      {timers.length === 0 && <p className="note first">Tambahkan game dan jam resetnya (waktu lokal laptop ini).</p>}
      <ul className="tl">
        {sortTimers(timers, now).map((t) => (
          <li key={t.id}>
            <span className="t">{t.name}</span>
            <span className="cd">reset {left(nextReset(now, t.hour, t.minute) - now)} lagi</span>
            <button className="xbtn sm" aria-label={`Hapus: ${t.name}`} onClick={() => setTimers(timers.filter((x) => x.id !== t.id))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={submit}>
        <input type="text" value={name} maxLength={MAX_NAME} placeholder="Nama game…" aria-label="Nama game" onChange={(e) => setName(e.target.value)} />
        <input type="time" value={hm} aria-label="Jam reset" onChange={(e) => setHm(e.target.value)} />
        <button className="btn pri" type="submit">
          Tambah
        </button>
      </form>
      {err && <p className="note">{err}</p>}
    </>
  );
}
