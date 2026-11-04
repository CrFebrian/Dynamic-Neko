import { useState, type FormEvent } from 'react';
import { dateId, left } from '../../lib/time.ts';
import {
  cleanTitle,
  MAX_TITLE,
  nextTask,
  parseDueTime,
  pendingCount,
  sortTasks,
  type Task,
} from '../../features/tasks/tasks.ts';

interface Props {
  now: number;
  tasks: readonly Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (title: string, due: number | null) => void;
}

export function TodayTab({ now, tasks, onToggle, onDelete, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanTitle(title);
    if (!clean) return;
    onAdd(clean, parseDueTime(time, now));
    setTitle('');
    setTime('');
  };

  const next = nextTask(tasks);
  const heroTitle = next
    ? next.title
    : tasks.length === 0
      ? 'Belum ada task'
      : pendingCount(tasks) > 0
        ? 'Tidak ada yang berjadwal'
        : 'Semua task beres';

  return (
    <>
      <div className="hero">
        <b>{heroTitle}</b>
        <div className="hr">
          <span className="date">{dateId(now)}</span>
          {next && next.due !== null && (
            <span className="mono">{next.due < now ? left(next.due - now) : `dalam ${left(next.due - now)}`}</span>
          )}
        </div>
      </div>
      <ul className="tl">
        {sortTasks(tasks).map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <button
              className="chk"
              role="checkbox"
              aria-checked={t.done}
              aria-label={`Selesai: ${t.title}`}
              onClick={() => onToggle(t.id)}
            >
              {t.done ? '✓' : ''}
            </button>
            <span className="t">{t.title}</span>
            {t.due !== null && !t.done && (
              <span className={`cd${t.due < now ? ' late' : ''}`}>{left(t.due - now)}</span>
            )}
            <button className="xbtn sm" onClick={() => onDelete(t.id)} aria-label={`Hapus: ${t.title}`}>
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
  );
}
