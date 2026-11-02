import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pill } from '../island/Pill.tsx';
import { Panel, type IslandStyle } from '../island/Panel.tsx';
import { pillState, type PillInput } from '../island/pillState.ts';
import type { Task } from '../features/tasks/tasks.ts';
import { layoutWindow, quitApp } from './window.ts';

const STYLE_KEY = 'yomi.style';

function loadStyle(): IslandStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'notch' ? 'notch' : 'dynamic';
  } catch {
    return 'dynamic';
  }
}

function seedTasks(now: number): Task[] {
  const m = 60_000;
  return [
    { id: 1, title: 'Rapat tim · Google Meet', due: now + 38 * m, done: false, tag: 'agenda' },
    { id: 2, title: 'Baca bab 4 Perpustakaan di Ujung Bulan', due: now + 95 * m, done: false, tag: 'baca' },
    { id: 3, title: 'Kumpulkan laporan kuliah', due: now + 240 * m, done: false, tag: 'task' },
  ];
}

export function App() {
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [style, setStyle] = useState<IslandStyle>(loadStyle);
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks(Date.now()));
  const nextId = useRef(100);

  // Detak 1 detik untuk hitung mundur.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Ukuran dan posisi jendela mengikuti keadaan island.
  useEffect(() => {
    layoutWindow(expanded ? 'expanded' : 'collapsed').catch((err: unknown) => {
      console.error('Gagal mengatur jendela:', err);
    });
  }, [expanded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const changeStyle = useCallback((s: IslandStyle) => {
    setStyle(s);
    try {
      localStorage.setItem(STYLE_KEY, s);
    } catch {
      /* penyimpanan tidak tersedia: abaikan */
    }
  }, []);

  const view = useMemo(() => {
    const input: PillInput = {
      now,
      fullscreen: false,
      eye: { active: false, secondsLeft: 0 },
      mic: { active: false, meetingMode: true, held: 0 },
      recording: { active: false, seconds: 0 },
      alert: null,
      timer: { running: false, label: 'Baca', secondsLeft: 0 },
      music: { playing: false, title: '' },
      tasks,
    };
    return pillState(input);
  }, [now, tasks]);

  const addTask = (title: string, due: number | null) => {
    nextId.current += 1;
    setTasks((prev) => [...prev, { id: nextId.current, title, due, done: false, tag: 'task' }]);
  };

  return (
    <div
      className={`root ${style}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) setExpanded(false);
      }}
    >
      {expanded ? (
        <Panel
          now={now}
          view={view}
          tasks={tasks}
          style={style}
          onClose={() => setExpanded(false)}
          onToggleTask={(id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))}
          onDeleteTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
          onAddTask={addTask}
          onStyle={changeStyle}
          onQuit={() => void quitApp()}
        />
      ) : (
        <Pill view={view} onOpen={() => setExpanded(true)} />
      )}
    </div>
  );
}
