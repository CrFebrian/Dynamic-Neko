import { eyeActive, eyeMinutesLeft, eyeSecondsLeft, type EyeState } from '../../features/eye/eyeRest.ts';

interface Props {
  now: number;
  eye: EyeState;
  onInterval: (min: number) => void;
  onNow: () => void;
}

const OPTIONS: ReadonlyArray<{ min: number; label: string }> = [
  { min: 0, label: 'Mati' },
  { min: 20, label: '20 mnt' },
  { min: 30, label: '30 mnt' },
  { min: 45, label: '45 mnt' },
];

export function ChillTab({ now, eye, onInterval, onNow }: Props) {
  const active = eyeActive(eye, now);
  const mins = eyeMinutesLeft(eye, now);

  return (
    <>
      <div className="sec">Istirahat mata 20-20-20</div>
      <p className="note first">Tiap beberapa menit, pandang sesuatu yang jauh selama 20 detik.</p>
      <div className="row sp wrap">
        <div className="chips">
          {OPTIONS.map((o) => (
            <button key={o.min} className="chip" aria-pressed={eye.intervalMin === o.min} onClick={() => onInterval(o.min)}>
              {o.label}
            </button>
          ))}
        </div>
        <button className="btn sm" onClick={onNow} disabled={active}>
          Coba sekarang
        </button>
      </div>
      <p className="note" aria-live="polite">
        {active
          ? `Sedang istirahat, ${eyeSecondsLeft(eye, now)} detik lagi.`
          : mins === null
            ? 'Pengingat mati.'
            : `Pengingat berikutnya dalam ${mins} mnt.`}
      </p>
      <div className="sec">Segera hadir</div>
      <p className="note first">Suara latar, timer game, dan kutipan harian dikerjakan di Tahap 3.</p>
    </>
  );
}
