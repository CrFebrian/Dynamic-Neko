import { useState, type FormEvent } from 'react';
import { Neko } from '../mascot/Neko.tsx';
import { left } from '../lib/time.ts';
import { cleanTitle, MAX_TITLE, nextTask, parseDueTime, pendingCount, sortTasks, type Task } from '../features/tasks/tasks.ts';
import type { PillView } from './pillState.ts';

export type IslandStyle = 'dynamic' | 'notch';
type TabKey = 'today' | 'read' | 'anime' | 'music' | 'chill' | 'set';

const TABS: ReadonlyArray<{ key: TabKey; label: string; phase: string }> = [
  { key: 'today', label: 'Hari ini', phase: '' },
  { key: 'read', label: 'Baca', phase: 'Tahap 1' },
  { key: 'anime', label: 'Anime', phase: 'Tahap 3' },
  { key: 'music', label: 'Musik', phase: 'Tahap 2' },
  { key: 'chill', label: 'Santai', phase: 'Tahap 3' },
  { key: 'set', label: 'Atur', phase: '' },
];

interface PanelProps {
  now: number;
  view: PillView;
  tasks: readonly Task[];
  style: IslandStyle;
  onClose: () => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (title: string, due: number | null) => void;
  onStyle: (s: IslandStyle) => void;
  onQuit: () => void;
}

function bubble(now: number, tasks: readonly Task[]): string {
  const n = pendingCount(tasks);
  if (n === 0) return 'Nyaa~ semua task beres. Waktunya baca santai.';
  const t = nextTask(tasks);
  if (!t || t.due === null) return `Nyaa~ ${n} task hari ini.`;
  const d = t.due - now;
  return `Nyaa~ ${n} task hari ini. Berikutnya "${t.title}" ${d < 0 ? left(d) : `dalam ${left(d)}`}.`;
}

export function Panel(p: PanelProps) {
  const [tab, setTab] = useState<TabKey>('today');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanTitle(title);
    if (!clean) return;
    p.onAddTask(clean, parseDueTime(time, p.now));
    setTitle('');
    setTime('');
  };

  const next = nextTask(p.tasks);
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="panel" role="dialog" aria-label="Yomi Island">
      <div className="phead">
        <div className="big">
          <Neko state={p.view.hidden ? 'idle' : p.view.mascot} />
        </div>
        <div className="bub">{bubble(p.now, p.tasks)}</div>
        <button className="xbtn" onClick={p.onClose} aria-label="Tutup">
          ×
        </button>
      </div>

      <div className="pbody">
        {tab === 'today' && (
          <>
            <div className="hero">
              <b>{next ? next.title : 'Semua task beres'}</b>
              {next && next.due !== null && (
                <span className="mono">{next.due < p.now ? left(next.due - p.now) : `dalam ${left(next.due - p.now)}`}</span>
              )}
            </div>
            <ul className="tl">
              {sortTasks(p.tasks).map((t) => (
                <li key={t.id} className={t.done ? 'done' : ''}>
                  <button
                    className="chk"
                    role="checkbox"
                    aria-checked={t.done}
                    aria-label={`Selesai: ${t.title}`}
                    onClick={() => p.onToggleTask(t.id)}
                  >
                    {t.done ? '✓' : ''}
                  </button>
                  <span className="t">{t.title}</span>
                  {t.due !== null && !t.done && (
                    <span className={`cd${t.due < p.now ? ' late' : ''}`}>{left(t.due - p.now)}</span>
                  )}
                  <button className="xbtn sm" onClick={() => p.onDeleteTask(t.id)} aria-label={`Hapus: ${t.title}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form className="add" onSubmit={submit}>
              <input
                type="text"
                value={title}
                maxLength={MAX_TITLE}
                placeholder="Tambah task…"
                aria-label="Judul task"
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input type="time" value={time} aria-label="Jam" onChange={(e) => setTime(e.target.value)} />
              <button className="btn pri" type="submit">
                Tambah
              </button>
            </form>
          </>
        )}

        {tab === 'set' && (
          <>
            <div className="sec">Gaya</div>
            <div className="seg" role="group" aria-label="Gaya island">
              <button aria-pressed={p.style === 'dynamic'} onClick={() => p.onStyle('dynamic')}>
                Dynamic
              </button>
              <button aria-pressed={p.style === 'notch'} onClick={() => p.onStyle('notch')}>
                Notch
              </button>
            </div>
            <div className="sec">Aplikasi</div>
            <button className="btn" onClick={p.onQuit}>
              Keluar dari Yomi Island
            </button>
            <p className="note">Jendela tidak punya tombol tutup dan tidak muncul di taskbar, jadi gunakan tombol ini untuk keluar.</p>
          </>
        )}

        {tab !== 'today' && tab !== 'set' && (
          <p className="note">
            {current?.label} dikerjakan di {current?.phase}. Tampilan lengkapnya sudah ada di prototipe.
          </p>
        )}
      </div>

      <nav className="tabs" aria-label="Menu">
        {TABS.map((t) => (
          <button key={t.key} aria-current={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
