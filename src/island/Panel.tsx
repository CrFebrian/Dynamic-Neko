import { useState, type ReactNode } from 'react';
import { IconAnime, IconChill, IconMusic, IconNext, IconPrev, IconRead, IconSettings, IconToday } from './icons.tsx';
import { Neko } from '../mascot/Neko.tsx';
import { left, mmss } from '../lib/time.ts';
import type { MediaAction, MediaInfo } from '../lib/system.ts';
import type { WindowDrag } from '../app/useWindowDrag.ts';
import { nextTask, pendingCount, type Task } from '../features/tasks/tasks.ts';
import { MODES, remaining, type TimerMode, type TimerState } from '../features/reading/timer.ts';
import type { DayRecord } from '../features/reading/streak.ts';
import { eyeActive, eyeSecondsLeft, type EyeState } from '../features/eye/eyeRest.ts';
import type { PillView } from './pillState.ts';
import type { SimControls } from './types.ts';
import { TodayTab } from './tabs/TodayTab.tsx';
import { ReadTab } from './tabs/ReadTab.tsx';
import { MusicTab } from './tabs/MusicTab.tsx';
import { AnimeTab } from './tabs/AnimeTab.tsx';
import { BooksSection } from './tabs/BooksSection.tsx';
import { ChillTab } from './tabs/ChillTab.tsx';

type TabKey = 'today' | 'read' | 'anime' | 'music' | 'chill';

const TABS: ReadonlyArray<{ key: TabKey; label: string; icon: ReactNode }> = [
  { key: 'today', label: 'Hari ini', icon: <IconToday /> },
  { key: 'read', label: 'Baca', icon: <IconRead /> },
  { key: 'anime', label: 'Anime', icon: <IconAnime /> },
  { key: 'music', label: 'Musik', icon: <IconMusic /> },
  { key: 'chill', label: 'Santai', icon: <IconChill /> },
];

export interface PanelProps {
  now: number;
  view: PillView;
  closing: boolean;
  drag: WindowDrag;
  recording: boolean;
  tasks: readonly Task[];
  timer: TimerState;
  day: DayRecord;
  streak: number;
  eye: EyeState;
  media: MediaInfo | null;
  mediaAt: number;
  sim: SimControls | null;
  onClose: () => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (title: string, due: number | null) => void;
  onTimerMode: (m: TimerMode) => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onPages: (delta: number) => void;
  onGoal: (delta: number) => void;
  onEyeInterval: (min: number) => void;
  onEyeNow: () => void;
  onMedia: (a: MediaAction) => void;
  onRecording: (on: boolean) => void;
  onOpenSettings: () => void;
}

function bubble(p: PanelProps): string {
  if (eyeActive(p.eye, p.now)) return `Pandang yang jauh dulu ya, ${eyeSecondsLeft(p.eye, p.now)} detik lagi.`;
  if (p.view.dot === 'mic') return 'Mode rapat. Pengingat kutahan dulu.';
  if (p.timer.running) {
    return `Sesi ${MODES[p.timer.mode].label.toLowerCase()} berjalan, sisa ${mmss(Math.ceil(remaining(p.timer, p.now) / 1000))}.`;
  }
  const n = pendingCount(p.tasks);
  if (n === 0) return 'Nyaa~ semua task beres. Waktunya baca santai.';
  const t = nextTask(p.tasks);
  if (!t || t.due === null) return `Nyaa~ ${n} task hari ini.`;
  const d = t.due - p.now;
  return `Nyaa~ ${n} task hari ini. Berikutnya "${t.title}" ${d < 0 ? left(d) : `dalam ${left(d)}`}.`;
}

export function Panel(p: PanelProps) {
  const [tab, setTab] = useState<TabKey>('today');
  const step = (d: number) => {
    const i = TABS.findIndex((t) => t.key === tab);
    setTab(TABS[(i + d + TABS.length) % TABS.length].key);
  };

  return (
    <div className={`panel${p.closing ? ' closing' : ''}`} role="dialog" aria-label="Yomi Island">
      <div className="phead" {...p.drag.dragProps}>
        <div className="big">
          <Neko state={p.view.hidden ? 'idle' : p.view.mascot} />
        </div>
        <div className="bub">{bubble(p)}</div>
        <button className="xbtn" onClick={p.onClose} aria-label="Tutup">
          ×
        </button>
      </div>

      <div className="pbody">
        <div className="tabview" key={tab}>
          {tab === 'today' && (
            <TodayTab now={p.now} tasks={p.tasks} onToggle={p.onToggleTask} onDelete={p.onDeleteTask} onAdd={p.onAddTask} />
          )}
          {tab === 'read' && (
            <ReadTab
              now={p.now}
              timer={p.timer}
              day={p.day}
              streak={p.streak}
              onMode={p.onTimerMode}
              onToggle={p.onTimerToggle}
              onReset={p.onTimerReset}
              onPages={p.onPages}
              onGoal={p.onGoal}
            />
          )}
          {tab === 'read' && <BooksSection />}
          {tab === 'music' && (
            <MusicTab now={p.now} media={p.media} mediaAt={p.mediaAt} onControl={p.onMedia} simulated={p.sim !== null} />
          )}
          {tab === 'chill' && <ChillTab now={p.now} eye={p.eye} onInterval={p.onEyeInterval} onNow={p.onEyeNow} recording={p.recording} onRecording={p.onRecording} sim={p.sim} />}
          {tab === 'anime' && <AnimeTab now={p.now} />}
        </div>
      </div>

      <nav className="tabs" aria-label="Menu">
        <button className="navbtn" aria-label="Tab sebelumnya" title="Sebelumnya" onClick={() => step(-1)}>
          <IconPrev />
        </button>
        <div className="tabgroup" role="tablist" aria-label="Tab">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              className="tabbtn"
              aria-selected={tab === t.key}
              aria-label={t.label}
              title={t.label}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              {tab === t.key && <span>{t.label}</span>}
            </button>
          ))}
        </div>
        <button className="navbtn" aria-label="Pengaturan" title="Pengaturan" onClick={p.onOpenSettings}>
          <IconSettings />
        </button>
        <button className="navbtn" aria-label="Tab berikutnya" title="Berikutnya" onClick={() => step(1)}>
          <IconNext />
        </button>
      </nav>
    </div>
  );
}
