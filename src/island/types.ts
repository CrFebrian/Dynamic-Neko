export type IslandStyle = 'dynamic' | 'notch';

/** Kontrol simulasi, hanya ada saat berjalan di browser (tanpa Windows). */
export interface SimControls {
  mic: boolean;
  fullscreen: boolean;
  music: boolean;
  onMic: (on: boolean) => void;
  onFullscreen: (on: boolean) => void;
  onMusic: (on: boolean) => void;
}
