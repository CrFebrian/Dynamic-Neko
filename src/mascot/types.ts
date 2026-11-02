export type Mascot = 'idle' | 'sleep' | 'excited' | 'reading' | 'music' | 'shock' | 'sad';

export const MASCOT_LABEL: Record<Mascot, string> = {
  idle: 'santai',
  sleep: 'tidur',
  excited: 'semangat',
  reading: 'membaca',
  music: 'mendengar musik',
  shock: 'kaget',
  sad: 'sedih',
};
