export type TabKey = 'today' | 'read' | 'anime' | 'music' | 'chill';

export interface Activity {
  /** Istirahat mata sedang berjalan. */
  eyeBreak: boolean;
  /** Penanda rekam layar menyala. */
  recording: boolean;
  /** Timer baca/rehat berjalan. */
  timerRunning: boolean;
  /** Ada musik yang sedang diputar. */
  musicPlaying: boolean;
}

/**
 * Tab yang dibuka lebih dulu saat panel dibuka: yang sedang berlangsung diprioritaskan.
 * Urutan: istirahat mata/rekam (Santai) > timer (Baca) > musik (Musik). Tidak ada aktivitas = Hari ini.
 */
export function priorityTab(a: Activity): TabKey {
  if (a.eyeBreak || a.recording) return 'chill';
  if (a.timerRunning) return 'read';
  if (a.musicPlaying) return 'music';
  return 'today';
}
