import type { Mascot } from '../mascot/types.ts';
import type { Task } from '../features/tasks/tasks.ts';
import { nextTask } from '../features/tasks/tasks.ts';
import { left, mmss } from '../lib/time.ts';

export interface PillInput {
  /** Epoch ms saat ini. */
  now: number;
  fullscreen: boolean;
  eye: { active: boolean; secondsLeft: number };
  mic: { active: boolean; meetingMode: boolean; held: number };
  recording: { active: boolean; seconds: number };
  alert: { mascot: Mascot; text: string; until: number } | null;
  timer: { running: boolean; label: string; secondsLeft: number };
  music: { playing: boolean; title: string };
  tasks: readonly Task[];
}

export interface PillView {
  hidden: boolean;
  mascot: Mascot;
  /** true = hanya wajah maskot, tanpa teks. */
  idle: boolean;
  dot: 'mic' | 'rec' | null;
  eq: boolean;
  text: string;
}

const MIN = 60_000;

function view(p: Partial<PillView> & { mascot: Mascot }): PillView {
  return { hidden: false, idle: false, dot: null, eq: false, text: '', ...p };
}

/**
 * Menentukan isi pill kecil. Urutan prioritas (atas menang):
 * fullscreen > istirahat mata > rapat > rekam > alert > timer > musik > task.
 */
export function pillState(i: PillInput): PillView {
  if (i.fullscreen) return view({ hidden: true, mascot: 'sleep', idle: true });

  if (i.eye.active) {
    return view({ mascot: 'sleep', text: `Istirahat mata · ${i.eye.secondsLeft} dtk` });
  }
  if (i.mic.active && i.mic.meetingMode) {
    const held = i.mic.held > 0 ? ` · ${i.mic.held} ditahan` : '';
    return view({ mascot: 'idle', dot: 'mic', text: `Rapat · Mic aktif${held}` });
  }
  if (i.recording.active) {
    return view({ mascot: 'idle', dot: 'rec', text: `Merekam ${mmss(i.recording.seconds)}` });
  }
  if (i.alert && i.alert.until > i.now) {
    return view({ mascot: i.alert.mascot, text: i.alert.text });
  }
  if (i.timer.running) {
    return view({ mascot: 'reading', text: `${i.timer.label} · ${mmss(i.timer.secondsLeft)}` });
  }
  if (i.music.playing) {
    return view({ mascot: 'music', eq: true, text: i.music.title });
  }

  const t = nextTask(i.tasks);
  if (t && t.due !== null) {
    const d = t.due - i.now;
    const text = `${t.title} · ${left(d)}`;
    if (d < -10 * MIN) return view({ mascot: 'sad', text });
    if (d < 0) return view({ mascot: 'shock', text });
    if (d <= 15 * MIN) return view({ mascot: 'excited', text });
    if (d <= 120 * MIN) return view({ mascot: 'idle', text });
    return view({ mascot: 'idle', idle: true });
  }
  return view({ mascot: 'sleep', idle: true });
}
