import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pill } from '../island/Pill.tsx';
import { Panel } from '../island/Panel.tsx';
import type { IslandStyle } from '../island/types.ts';
import { pillState, type PillInput } from '../island/pillState.ts';
import type { Mascot } from '../mascot/types.ts';
import type { Task } from '../features/tasks/tasks.ts';
import {
  createTimer,
  finishTimer,
  isFinished,
  MODES,
  pauseTimer,
  remaining,
  resetTimer,
  startTimer,
  type TimerMode,
  type TimerState,
} from '../features/reading/timer.ts';
import { computeStreak, dayKey, type DayRecord } from '../features/reading/streak.ts';
import {
  createEye,
  eyeActive,
  eyeSecondsLeft,
  eyeTick,
  setEyeInterval,
  triggerEyeNow,
  type EyeState,
} from '../features/eye/eyeRest.ts';
import { getStore } from '../lib/store.ts';
import { beep } from '../lib/beep.ts';
import { layoutWindow, quitApp } from './window.ts';

/** Harus sama dengan durasi animasi .panel.closing di tabs.css. */
const CLOSE_MS = 220;
const ALERT_MS = 7000;
const DEFAULT_GOAL = 20;
const DEFAULT_EYE_MIN = 20;

const logErr = (what: string) => (err: unknown) => console.error(what, err);
const clampGoal = (n: number): number => (Number.isFinite(n) ? Math.min(500, Math.max(5, Math.round(n))) : DEFAULT_GOAL);
const freshDay = (key: string, goal: number): DayRecord => ({ day: key, pages: 0, goal, sessions: 0 });

type Alert = NonNullable<PillInput['alert']>;

export function App() {
  const store = getStore();

  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [style, setStyleState] = useState<IslandStyle>('dynamic');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timer, setTimerState] = useState<TimerState>(() => createTimer('baca'));
  const [eye, setEyeState] = useState<EyeState>(() => createEye(DEFAULT_EYE_MIN, Date.now()));
  const [alert, setAlert] = useState<Alert | null>(null);
  const [day, setDayState] = useState<DayRecord>(() => freshDay(dayKey(Date.now()), DEFAULT_GOAL));
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [beepOn, setBeepOn] = useState(true);

  // Ref = sumber kebenaran untuk callback yang berjalan di luar render (interval, timeout).
  const timerRef = useRef(timer);
  const eyeRef = useRef(eye);
  const dayRef = useRef(day);
  const beepRef = useRef(beepOn);
  const goalRef = useRef(DEFAULT_GOAL);
  const expandedRef = useRef(false);
  const closingRef = useRef(false);
  const busyRef = useRef(false);
  const closeTimer = useRef<number | null>(null);

  const setTimer = useCallback((next: TimerState) => {
    timerRef.current = next;
    setTimerState(next);
  }, []);
  const setEye = useCallback((next: EyeState) => {
    eyeRef.current = next;
    setEyeState(next);
  }, []);
  const setDay = useCallback((next: DayRecord) => {
    dayRef.current = next;
    setDayState(next);
  }, []);
  expandedRef.current = expanded;

  const showAlert = useCallback((mascot: Mascot, text: string, ms = ALERT_MS) => {
    setAlert({ mascot, text, until: Date.now() + ms });
  }, []);
  const ring = useCallback(() => {
    if (beepRef.current) beep();
  }, []);

  const updateDay = useCallback(
    (patch: Partial<DayRecord>) => {
      const next = { ...dayRef.current, ...patch };
      setDay(next);
      store.saveDay(next).catch(logErr('Gagal menyimpan hari baca:'));
    },
    [store, setDay],
  );

  // Muat data tersimpan sekali saat mulai.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saved, st, bp, ei, goal, recent] = await Promise.all([
          store.loadTasks(),
          store.getSetting('style'),
          store.getSetting('beep'),
          store.getSetting('eyeInterval'),
          store.getSetting('goal'),
          store.loadRecentDays(400),
        ]);
        if (cancelled) return;
        setTasks(saved);
        if (st === 'notch' || st === 'dynamic') setStyleState(st);
        if (bp !== null) {
          beepRef.current = bp !== '0';
          setBeepOn(bp !== '0');
        }
        const mins = ei === null ? DEFAULT_EYE_MIN : Number(ei);
        if (Number.isInteger(mins) && mins >= 0 && mins <= 240) setEye(createEye(mins, Date.now()));
        goalRef.current = goal === null ? DEFAULT_GOAL : clampGoal(Number(goal));
        setHistory(recent);
        const today = dayKey(Date.now());
        setDay(recent.find((r) => r.day === today) ?? freshDay(today, goalRef.current));
      } catch (err) {
        console.error('Gagal memuat data tersimpan:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, setEye, setDay]);

  // Pergantian hari: arsipkan hari lama, mulai hari baru.
  const today = dayKey(now);
  useEffect(() => {
    const old = dayRef.current;
    if (old.day === today) return;
    setHistory((h) => [...h.filter((d) => d.day !== old.day), old]);
    setDay(freshDay(today, goalRef.current));
  }, [today, setDay]);

  const handleTimerDone = useCallback(
    (tm: TimerState) => {
      setTimer(finishTimer(tm));
      const label = MODES[tm.mode].label.toLowerCase();
      showAlert('excited', tm.mode === 'rehat' ? 'Rehat selesai. Lanjut baca?' : `Sesi ${label} selesai!`);
      ring();
      if (tm.mode !== 'rehat') updateDay({ sessions: dayRef.current.sessions + 1 });
    },
    [setTimer, showAlert, ring, updateDay],
  );

  // Detak 1 detik: hitung mundur, timer selesai, istirahat mata.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);

      const tm = timerRef.current;
      if (isFinished(tm, t)) handleTimerDone(tm);

      const e = eyeRef.current;
      const ne = eyeTick(e, t);
      if (ne !== e) {
        setEye(ne);
        if (e.activeUntil === null && ne.activeUntil !== null) ring();
        if (e.activeUntil !== null && ne.activeUntil === null) showAlert('excited', 'Mata sudah segar. Lanjut!', 4000);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [handleTimerDone, setEye, showAlert, ring]);

  // Buka panel: ubah ukuran jendela dulu, baru tampilkan panel (agar tidak terpotong).
  const openPanel = useCallback(async () => {
    if (busyRef.current || expandedRef.current) return;
    busyRef.current = true;
    try {
      await layoutWindow('expanded');
    } catch (err) {
      console.error('Gagal memperbesar jendela:', err);
    } finally {
      setExpanded(true);
      busyRef.current = false;
    }
  }, []);

  // Tutup panel: jalankan animasi keluar, lalu ganti ke pill, lalu perkecil jendela.
  const closePanel = useCallback(() => {
    if (!expandedRef.current || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setExpanded(false);
      setClosing(false);
      closingRef.current = false;
      layoutWindow('collapsed').catch(logErr('Gagal memperkecil jendela:'));
    }, CLOSE_MS);
  }, []);

  useEffect(() => {
    layoutWindow('collapsed').catch(logErr('Gagal mengatur jendela:'));
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePanel]);

  // --- aksi dari UI ---
  const addTask = useCallback(
    (title: string, due: number | null) => {
      store
        .addTask(title, due, 'task')
        .then((t) => setTasks((p) => [...p, t]))
        .catch(logErr('Gagal menambah task:'));
    },
    [store],
  );
  const toggleTask = (id: number) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const done = !t.done;
    setTasks((p) => p.map((x) => (x.id === id ? { ...x, done } : x)));
    store.setDone(id, done).catch(logErr('Gagal menyimpan status task:'));
  };
  const deleteTask = (id: number) => {
    setTasks((p) => p.filter((x) => x.id !== id));
    store.removeTask(id).catch(logErr('Gagal menghapus task:'));
  };

  const timerMode = (m: TimerMode) => setTimer(createTimer(m));
  const timerToggle = () => {
    const t = Date.now();
    const s = timerRef.current;
    setTimer(s.running ? pauseTimer(s, t) : startTimer(s, t));
  };
  const timerReset = () => setTimer(resetTimer(timerRef.current));

  const changePages = (delta: number) => {
    const d = dayRef.current;
    const pages = Math.max(0, Math.min(9999, d.pages + delta));
    updateDay({ pages });
    if (d.pages < d.goal && pages >= d.goal) showAlert('excited', 'Target halaman tercapai!');
  };
  const changeGoal = (delta: number) => {
    const goal = clampGoal(dayRef.current.goal + delta);
    goalRef.current = goal;
    updateDay({ goal });
    store.setSetting('goal', String(goal)).catch(logErr('Gagal menyimpan target:'));
  };

  const eyeInterval = (min: number) => {
    setEye(setEyeInterval(eyeRef.current, min, Date.now()));
    store.setSetting('eyeInterval', String(min)).catch(logErr('Gagal menyimpan pengaturan mata:'));
  };
  const eyeNow = () => {
    setEye(triggerEyeNow(eyeRef.current, Date.now()));
    ring();
  };

  const changeStyle = (s: IslandStyle) => {
    setStyleState(s);
    store.setSetting('style', s).catch(logErr('Gagal menyimpan gaya:'));
  };
  const changeBeep = (on: boolean) => {
    beepRef.current = on;
    setBeepOn(on);
    store.setSetting('beep', on ? '1' : '0').catch(logErr('Gagal menyimpan pengaturan suara:'));
  };

  const view = useMemo(
    () =>
      pillState({
        now,
        fullscreen: false,
        eye: { active: eyeActive(eye, now), secondsLeft: eyeSecondsLeft(eye, now) },
        mic: { active: false, meetingMode: true, held: 0 },
        recording: { active: false, seconds: 0 },
        alert,
        timer: {
          running: timer.running,
          label: MODES[timer.mode].label,
          secondsLeft: Math.ceil(remaining(timer, now) / 1000),
        },
        music: { playing: false, title: '' },
        tasks,
      }),
    [now, eye, alert, timer, tasks],
  );

  const streak = useMemo(
    () => computeStreak([...history.filter((d) => d.day !== day.day), day], today),
    [history, day, today],
  );

  return (
    <div
      className={`root ${style}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanel();
      }}
    >
      {expanded ? (
        <Panel
          now={now}
          view={view}
          closing={closing}
          style={style}
          beep={beepOn}
          tasks={tasks}
          timer={timer}
          day={day}
          streak={streak}
          eye={eye}
          onClose={closePanel}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onAddTask={addTask}
          onTimerMode={timerMode}
          onTimerToggle={timerToggle}
          onTimerReset={timerReset}
          onPages={changePages}
          onGoal={changeGoal}
          onEyeInterval={eyeInterval}
          onEyeNow={eyeNow}
          onStyle={changeStyle}
          onBeep={changeBeep}
          onQuit={() => void quitApp()}
        />
      ) : (
        <Pill view={view} onOpen={() => void openPanel()} />
      )}
    </div>
  );
}
