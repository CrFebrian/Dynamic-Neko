import { useState } from 'react';
import { Neko } from '../mascot/Neko.tsx';
import { left, mmss } from '../lib/time.ts';
import { nextTask, pendingCount, type Task } from '../features/tasks/tasks.ts';
import { MODES, remaining, type TimerMode, type TimerState } from '../features/reading/timer.ts';
import type { DayRecord } from '../features/reading/streak.ts';
import { eyeActive, eyeSecondsLeft, type EyeState } from '../features/eye/eyeRest.ts';
import type { PillView } from './pillState.ts';
import type { IslandStyle } from './types.ts';
import { TodayTab } from './tabs/TodayTab.tsx';
import { ReadTab } from './tabs/ReadTab.tsx';
import { ChillTab } from './tabs/ChillTab.tsx';
import { SettingsTab } from './tabs/SettingsTab.tsx';

type TabKey = 'today' | 'read' | 'anime' | 'music' | 'chill' | 'set';

const TABS: ReadonlyArray<{ key: TabKey; label: string; phase?: string }> = [
  { key: 'today', label: 'Hari ini' },
  { key: 'read', label: 'Baca' },
  { key: 'anime', label: 'Anime', phase: 'Tahap 3' },
  { key: 'music', label: 'Musik', phase: 'Tahap 2' },
  { key: 'chill', label: 'Santai' },
  { key: 'set', label: 'Atur' },
];

export interface PanelProps {
  now: number;
  view: PillView;
  closing: boolean;
  style: IslandStyle;
  beep: boolean;
  tasks: readonly Task[];
  timer: TimerState;
  day: DayRecord;
  streak: number;
  eye: EyeState;
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
  onStyle: (s: IslandStyle) => void;
  onBeep: (on: boolean) => void;
  onQuit: () => void;
}

function bubble(p: PanelProps): string {
  if (eyeActive(p.eye, p.now)) return `Pandang yang jauh dulu ya, ${eyeSecondsLeft(p.eye, p.now)} detik lagi.`;
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
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className={`panel${p.closing ? ' closing' : ''}`} role="dialog" aria-label="Yomi Island">
      <div className="phead">
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
          {tab === 'chill' && <ChillTab now={p.now} eye={p.eye} onInterval={p.onEyeInterval} onNow={p.onEyeNow} />}
          {tab === 'set' && (
            <SettingsTab style={p.style} beep={p.beep} onStyle={p.onStyle} onBeep={p.onBeep} onQuit={p.onQuit} />
          )}
          {(tab === 'anime' || tab === 'music') && (
            <p className="note first">
              {current?.label} dikerjakan di {current?.phase}. Tampilan lengkapnya sudah ada di prototipe.
            </p>
          )}
        </div>
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
