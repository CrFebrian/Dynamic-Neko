import { MODES, remaining, type TimerMode, type TimerState } from '../../features/reading/timer.ts';
import type { DayRecord } from '../../features/reading/streak.ts';
import { mmss } from '../../lib/time.ts';

interface Props {
  now: number;
  timer: TimerState;
  day: DayRecord;
  streak: number;
  onMode: (m: TimerMode) => void;
  onToggle: () => void;
  onReset: () => void;
  onPages: (delta: number) => void;
  onGoal: (delta: number) => void;
}

const R = 49;
const C = 2 * Math.PI * R;

export function ReadTab({ now, timer, day, streak, onMode, onToggle, onReset, onPages, onGoal }: Props) {
  const rem = remaining(timer, now);
  const offset = C * (1 - Math.min(1, Math.max(0, rem / timer.totalMs)));
  const pct = day.goal > 0 ? Math.min(100, (day.pages / day.goal) * 100) : 0;

  return (
    <>
      <div className="ringbox">
        <div className="ring">
          <svg viewBox="0 0 112 112" aria-hidden="true">
            <circle className="bg" cx="56" cy="56" r={R} />
            <circle className="fg" cx="56" cy="56" r={R} strokeDasharray={C.toFixed(1)} strokeDashoffset={offset.toFixed(1)} />
          </svg>
          <div className="n mono" role="timer" aria-label="Sisa waktu">
            {mmss(Math.ceil(rem / 1000))}
          </div>
        </div>
        <div className="ctrl">
          <div className="chips">
            {(Object.keys(MODES) as TimerMode[]).map((k) => (
              <button key={k} className="chip" aria-pressed={timer.mode === k} onClick={() => onMode(k)}>
                {MODES[k].label} {MODES[k].minutes}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn pri grow" onClick={onToggle}>
              {timer.running ? 'Jeda' : 'Mulai'}
            </button>
            <button className="btn" onClick={onReset}>
              Ulang
            </button>
          </div>
        </div>
      </div>

      <div className="sec">Target halaman hari ini</div>
      <div className="row sp">
        <span className="stat">
          <b className="mono">
            {day.pages} / {day.goal}
          </b>{' '}
          halaman · streak <b>{streak} hari</b> · sesi <b>{day.sessions}</b>
        </span>
        <span className="row tight">
          <button className="btn sm" onClick={() => onPages(-1)} aria-label="Kurang satu halaman">
            −
          </button>
          <button className="btn sm" onClick={() => onPages(5)} aria-label="Tambah lima halaman">
            +5
          </button>
        </span>
      </div>
      <div className="prbar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="row sp goal">
        <span className="stat">Ubah target</span>
        <span className="row tight">
          <button className="btn sm" onClick={() => onGoal(-5)} aria-label="Kurangi target lima halaman">
            −5
          </button>
          <button className="btn sm" onClick={() => onGoal(5)} aria-label="Tambah target lima halaman">
            +5
          </button>
        </span>
      </div>
    </>
  );
}
