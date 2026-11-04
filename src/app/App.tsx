import { useCallback, useEffect, useRef, useState } from 'react';
import { Pill } from '../island/Pill.tsx';
import { Panel } from '../island/Panel.tsx';
import type { SimControls } from '../island/types.ts';
import { pillState, type PillInput } from '../island/pillState.ts';
import { isSuppressed, isWatching, releaseMessage } from '../island/focusMode.ts';
import type { Mascot } from '../mascot/types.ts';
import type { Task } from '../features/tasks/tasks.ts';
import { mergeFreshAnime, parseWatchlist, serializeWatchlist, type WatchItem } from '../features/anime/anime.ts';
import { refreshStale } from '../features/anime/animeApi.ts';
import { mergeFresh, parseMangaList, serializeMangaList, type MangaItem } from '../features/manga/manga.ts';
import { refreshManga } from '../features/manga/mangaApi.ts';
import { parseTimers, type GachaTimer } from '../features/gacha/gacha.ts';
import { animeKey, animeText, dueAnime, dueGacha, gachaText, joinTexts, mangaText } from '../features/notify/due.ts';
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
import { inTauri } from '../lib/env.ts';
import { formatTrack } from '../lib/media.ts';
import { hm } from '../lib/time.ts';
import { useTheme } from '../ui/useTheme.ts';
import { onSettingsChanged } from '../lib/bus.ts';
import { DEFAULT_SETTINGS, GOAL_MAX, GOAL_MIN, loadSettings, type Settings } from '../lib/settings.ts';
import {
  EMPTY_SNAPSHOT,
  fetchSnapshot,
  type BatteryInfo,
  mediaControl,
  type MediaAction,
  type MediaInfo,
  type SystemSnapshot,
} from '../lib/system.ts';
import { useWindowDrag } from './useWindowDrag.ts';
import { layoutWindow, openSettings, setWindowVisible } from './window.ts';

/** Harus sama dengan durasi animasi .panel.closing di tabs.css. */
const CLOSE_MS = 220;
const ALERT_MS = 7000;
const DEFAULT_GOAL = DEFAULT_SETTINGS.goal;
const REMOTE_REFRESH_MS = 30 * 60_000;
const DEMO_BATTERY: BatteryInfo = { percent: 76, charging: false };

/** Data contoh untuk simulasi musik di browser. */
const DEMO_MEDIA: MediaInfo = {
  title: 'Langit Setelah Hujan',
  artist: 'Hoshi Ensemble',
  playing: true,
  positionSec: 12,
  durationSec: 196,
};

const logErr = (what: string) => (err: unknown) => console.error(what, err);
const clampGoal = (n: number): number => Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(n)));
const freshDay = (key: string, goal: number): DayRecord => ({ day: key, pages: 0, goal, sessions: 0 });

type Alert = NonNullable<PillInput['alert']>;

export function App() {
  const store = getStore();
  const native = inTauri();

  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cfg, setCfg] = useState<Settings>(DEFAULT_SETTINGS);
  const style = cfg.style;
  const beepOn = cfg.beep;
  const meetingMode = cfg.meetingMode;
  const watchMode = cfg.watchMode;
  useTheme(cfg.theme);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timer, setTimerState] = useState<TimerState>(() => createTimer('baca'));
  const [eye, setEyeState] = useState<EyeState>(() => createEye(DEFAULT_SETTINGS.eyeInterval, Date.now()));
  const [alert, setAlert] = useState<Alert | null>(null);
  const [day, setDayState] = useState<DayRecord>(() => freshDay(dayKey(Date.now()), DEFAULT_GOAL));
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [recStart, setRecStart] = useState<number | null>(null);
  const [held, setHeld] = useState(0);
  const [snap, setSnap] = useState<SystemSnapshot>(EMPTY_SNAPSHOT);
  const [snapAt, setSnapAt] = useState(() => Date.now());
  const [simState, setSimState] = useState({ mic: false, fullscreen: false, music: false });

  // Ref = sumber kebenaran untuk callback yang berjalan di luar render (interval, timeout).
  const timerRef = useRef(timer);
  const eyeRef = useRef(eye);
  const dayRef = useRef(day);
  const beepRef = useRef(beepOn);
  const goalRef = useRef(DEFAULT_GOAL);
  const fracRef = useRef(0.5);
  const expandedRef = useRef(false);
  const closingRef = useRef(false);
  const busyRef = useRef(false);
  const hiddenRef = useRef(false);
  const suppressedRef = useRef(false);
  const heldRef = useRef(0);
  const cfgRef = useRef(cfg);
  const listsRef = useRef<{ anime: WatchItem[]; manga: MangaItem[]; gacha: GachaTimer[] }>({ anime: [], manga: [], gacha: [] });
  const seenRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef(Date.now());
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
  cfgRef.current = cfg;
  beepRef.current = cfg.beep;

  // Keadaan sistem: dari Windows (Tauri), atau simulasi di browser.
  const system: SystemSnapshot = native
    ? snap
    : {
        fullscreen: simState.fullscreen,
        micActive: simState.mic,
        media: simState.music ? DEMO_MEDIA : null,
        battery: DEMO_BATTERY,
      };
  const focus = { micActive: system.micActive, meetingMode, fullscreen: system.fullscreen, watchMode };
  const suppressed = isSuppressed(focus);
  const hiddenByWatch = isWatching(focus);
  suppressedRef.current = suppressed;

  /** Tampilkan pengingat di pill. Ditahan (dihitung saja) selama rapat atau menonton. */
  const showAlert = useCallback((mascot: Mascot, text: string, ms = ALERT_MS) => {
    if (suppressedRef.current) {
      heldRef.current += 1;
      setHeld(heldRef.current);
      return;
    }
    setAlert({ mascot, text, until: Date.now() + ms });
  }, []);
  const ring = useCallback(() => {
    if (beepRef.current && !suppressedRef.current) beep();
  }, []);

  const updateDay = useCallback(
    (patch: Partial<DayRecord>) => {
      const next = { ...dayRef.current, ...patch };
      setDay(next);
      store.saveDay(next).catch(logErr('Gagal menyimpan hari baca:'));
    },
    [store, setDay],
  );

  /** Terapkan pengaturan dari penyimpanan. Dipakai saat mulai dan saat jendela Pengaturan mengubah sesuatu. */
  const applySettings = useCallback(
    (s: Settings) => {
      setCfg(s);
      beepRef.current = s.beep;
      if (eyeRef.current.intervalMin !== s.eyeInterval) setEye(setEyeInterval(eyeRef.current, s.eyeInterval, Date.now()));
      if (goalRef.current !== s.goal) {
        goalRef.current = s.goal;
        updateDay({ goal: s.goal });
      }
    },
    [setEye, updateDay],
  );

  /** Muat ulang daftar anime, manga, dan timer game untuk notifikasi. */
  const reloadLists = useCallback(async () => {
    try {
      const [a, m, g] = await Promise.all([
        store.getSetting('animeWatch'),
        store.getSetting('mangaWatch'),
        store.getSetting('gachaTimers'),
      ]);
      listsRef.current = { anime: parseWatchlist(a), manga: parseMangaList(m), gacha: parseTimers(g) };
    } catch (err) {
      console.error('Gagal memuat daftar pantauan:', err);
    }
  }, [store]);

  // Muat data tersimpan sekali saat mulai, lalu tampilkan jendela di posisi tersimpan.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saved, s, pf, recent] = await Promise.all([
          store.loadTasks(),
          loadSettings(store),
          store.getSetting('posFraction'),
          store.loadRecentDays(400),
        ]);
        if (cancelled) return;
        setTasks(saved);
        setCfg(s);
        beepRef.current = s.beep;
        const frac = pf === null ? 0.5 : Number(pf);
        fracRef.current = Number.isFinite(frac) ? Math.min(1, Math.max(0, frac)) : 0.5;
        setEye(createEye(s.eyeInterval, Date.now()));
        goalRef.current = s.goal;
        setHistory(recent);
        const today = dayKey(Date.now());
        setDay(recent.find((r) => r.day === today) ?? freshDay(today, goalRef.current));
        await reloadLists();
      } catch (err) {
        console.error('Gagal memuat data tersimpan:', err);
      }
      if (cancelled) return;
      layoutWindow('collapsed', fracRef.current).catch(logErr('Gagal mengatur jendela:'));
    })();
    return () => {
      cancelled = true;
    };
  }, [store, setEye, setDay, reloadLists]);

  // Jendela Pengaturan mengubah sesuatu: muat ulang. Ganti bahasa manga = acuan bab diulang (tanpa notifikasi palsu).
  useEffect(() => {
    return onSettingsChanged(() => {
      void (async () => {
        try {
          const prevLang = cfgRef.current.mangaLang;
          const s = await loadSettings(store);
          if (s.mangaLang !== prevLang) {
            const list = parseMangaList(await store.getSetting('mangaWatch')).map((m) => ({ ...m, chapter: null, publishAt: null }));
            await store.setSetting('mangaWatch', serializeMangaList(list));
          }
          applySettings(s);
          await reloadLists();
        } catch (err) {
          console.error('Gagal menerapkan pengaturan:', err);
        }
      })();
    });
  }, [store, applySettings, reloadLists]);

  // Daftar pantauan bisa diubah dari tab di panel: segarkan tiap menit.
  useEffect(() => {
    const id = window.setInterval(() => void reloadLists(), 60_000);
    return () => window.clearInterval(id);
  }, [reloadLists]);

  // Baca keadaan sistem tiap detik (hanya di dalam Tauri).
  useEffect(() => {
    if (!native) return;
    let stop = false;
    let busy = false;
    let warned = false;
    const poll = async () => {
      if (busy || stop) return;
      busy = true;
      try {
        const s = await fetchSnapshot();
        if (!stop) {
          setSnap(s);
          setSnapAt(Date.now());
        }
      } catch (err) {
        if (!warned) {
          warned = true;
          console.error('Gagal membaca keadaan sistem:', err);
        }
      } finally {
        busy = false;
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), 1000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [native]);

  // Pergantian hari: arsipkan hari lama, mulai hari baru.
  const today = dayKey(now);
  useEffect(() => {
    const old = dayRef.current;
    if (old.day === today) return;
    setHistory((h) => [...h.filter((d) => d.day !== old.day), old]);
    setDay(freshDay(today, goalRef.current));
  }, [today, setDay]);

  // Selesai rapat/menonton: laporkan berapa pengingat yang tertahan.
  const wasSuppressed = useRef(false);
  useEffect(() => {
    if (wasSuppressed.current && !suppressed) {
      const msg = releaseMessage(heldRef.current);
      heldRef.current = 0;
      setHeld(0);
      if (msg) setAlert({ mascot: 'idle', text: msg, until: Date.now() + ALERT_MS });
    }
    wasSuppressed.current = suppressed;
  }, [suppressed]);

  const cancelCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Mode nonton: sembunyikan jendela seluruhnya agar tidak menutupi aplikasi layar penuh.
  useEffect(() => {
    if (hiddenByWatch === hiddenRef.current) return;
    hiddenRef.current = hiddenByWatch;
    if (hiddenByWatch) {
      cancelCloseTimer();
      closingRef.current = false;
      setClosing(false);
      setExpanded(false);
      setWindowVisible(false).catch(logErr('Gagal menyembunyikan jendela:'));
    } else {
      layoutWindow('collapsed', fracRef.current).catch(logErr('Gagal menampilkan jendela:'));
    }
  }, [hiddenByWatch, cancelCloseTimer]);

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
      const ne = eyeTick(e, t, suppressedRef.current);
      if (ne !== e) {
        setEye(ne);
        if (e.activeUntil === null && ne.activeUntil !== null) ring();
        if (e.activeUntil !== null && ne.activeUntil === null) showAlert('excited', 'Mata sudah segar. Lanjut!', 4000);
      }

      // Notifikasi jadwal: episode anime tayang dan reset harian game.
      const c = cfgRef.current;
      const l = listsRef.current;
      const prev = lastCheckRef.current;
      lastCheckRef.current = t;
      const texts: string[] = [];
      if (c.notifyAnime) {
        for (const a of dueAnime(l.anime, t, seenRef.current)) {
          seenRef.current.add(animeKey(a));
          texts.push(animeText(a));
        }
      }
      if (c.notifyGacha) for (const g of dueGacha(l.gacha, prev, t)) texts.push(gachaText(g));
      if (texts.length > 0) {
        showAlert('excited', joinTexts(texts));
        ring();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [handleTimerDone, setEye, showAlert, ring]);

  // Perbarui jadwal anime yang lewat dan bab manga terbaru, lalu umumkan yang baru. Satu permintaan pada satu waktu.
  const refreshRemote = useCallback(async () => {
    const c = cfgRef.current;
    try {
      const l = listsRef.current;
      const freshA = await refreshStale(l.anime, Date.now());
      if (freshA.length > 0) {
        const cur = parseWatchlist(await store.getSetting('animeWatch'));
        const merged = mergeFreshAnime(cur, freshA);
        await store.setSetting('animeWatch', serializeWatchlist(merged));
        listsRef.current = { ...listsRef.current, anime: merged };
      }
      if (l.manga.length > 0) {
        const { fresh, updated } = await refreshManga(l.manga, c.mangaLang);
        if (fresh.length > 0) {
          const cur = parseMangaList(await store.getSetting('mangaWatch'));
          const merged = mergeFresh(cur, fresh);
          await store.setSetting('mangaWatch', serializeMangaList(merged));
          listsRef.current = { ...listsRef.current, manga: merged };
        }
        if (c.notifyManga && updated.length > 0) {
          showAlert('excited', joinTexts(updated.map((m) => mangaText(m.title, m.chapter))));
          ring();
        }
      }
    } catch (err) {
      console.error('Gagal memperbarui anime/manga:', err);
    }
  }, [store, showAlert, ring]);

  useEffect(() => {
    const first = window.setTimeout(() => void refreshRemote(), 15_000);
    const id = window.setInterval(() => void refreshRemote(), REMOTE_REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [refreshRemote]);

  // Buka panel: ubah ukuran jendela dulu, baru tampilkan panel (agar tidak terpotong).
  const openPanel = useCallback(async () => {
    if (busyRef.current || expandedRef.current || hiddenRef.current) return;
    busyRef.current = true;
    try {
      await layoutWindow('expanded', fracRef.current);
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
      closeTimer.current = null;
      setExpanded(false);
      setClosing(false);
      closingRef.current = false;
      layoutWindow('collapsed', fracRef.current).catch(logErr('Gagal memperkecil jendela:'));
    }, CLOSE_MS);
  }, []);

  useEffect(() => cancelCloseTimer, [cancelCloseTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePanel]);

  // Posisi horizontal: simpan setelah selesai menyeret.
  const onDragSettled = useCallback(
    (fraction: number) => {
      fracRef.current = fraction;
      store.setSetting('posFraction', fraction.toFixed(4)).catch(logErr('Gagal menyimpan posisi:'));
    },
    [store],
  );
  const drag = useWindowDrag(onDragSettled);

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
    setCfg((c) => ({ ...c, goal }));
    store.setSetting('goal', String(goal)).catch(logErr('Gagal menyimpan target:'));
  };

  const eyeInterval = (min: number) => {
    setEye(setEyeInterval(eyeRef.current, min, Date.now()));
    setCfg((c) => ({ ...c, eyeInterval: min }));
    store.setSetting('eyeInterval', String(min)).catch(logErr('Gagal menyimpan pengaturan mata:'));
  };
  const eyeNow = () => {
    setEye(triggerEyeNow(eyeRef.current, Date.now()));
    ring();
  };

  const onOpenSettings = () => {
    openSettings().catch(logErr('Gagal membuka pengaturan:'));
    closePanel();
  };

  const onMedia = (a: MediaAction) => {
    mediaControl(a).catch(logErr('Gagal mengirim perintah ke pemutar:'));
  };

  const sim: SimControls | null = native
    ? null
    : {
        ...simState,
        onMic: (on) => setSimState((s) => ({ ...s, mic: on })),
        onFullscreen: (on) => setSimState((s) => ({ ...s, fullscreen: on })),
        onMusic: (on) => setSimState((s) => ({ ...s, music: on })),
      };

  const view = pillState({
    now,
    fullscreen: hiddenByWatch,
    eye: { active: eyeActive(eye, now), secondsLeft: eyeSecondsLeft(eye, now) },
    mic: { active: system.micActive, meetingMode, held },
    recording: { active: recStart !== null, seconds: recStart === null ? 0 : Math.max(0, Math.floor((now - recStart) / 1000)) },
    alert,
    timer: {
      running: timer.running,
      label: MODES[timer.mode].label,
      secondsLeft: Math.ceil(remaining(timer, now) / 1000),
    },
    music: { playing: system.media?.playing === true, title: system.media ? formatTrack(system.media) : '' },
    tasks,
  });

  const streak = computeStreak([...history.filter((d) => d.day !== day.day), day], today);

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
          drag={drag}
          recording={recStart !== null}
          tasks={tasks}
          timer={timer}
          day={day}
          streak={streak}
          eye={eye}
          media={system.media}
          mediaAt={snapAt}
          sim={sim}
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
          onMedia={onMedia}
          onRecording={(on) => setRecStart(on ? Date.now() : null)}
          onOpenSettings={onOpenSettings}
        />
      ) : (
        <Pill
          view={view}
          onOpen={() => void openPanel()}
          drag={drag}
          clock={cfg.showClock ? hm(now) : null}
          battery={cfg.showBattery ? system.battery : null}
        />
      )}
    </div>
  );
}
