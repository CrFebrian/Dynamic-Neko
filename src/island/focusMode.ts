export interface FocusInput {
  micActive: boolean;
  meetingMode: boolean;
  fullscreen: boolean;
  watchMode: boolean;
}

/** Sedang rapat: mic dipakai dan mode rapat aktif. */
export const isMeeting = (i: FocusInput): boolean => i.micActive && i.meetingMode;

/** Sedang menonton: aplikasi layar penuh dan mode nonton aktif. */
export const isWatching = (i: FocusInput): boolean => i.fullscreen && i.watchMode;

/** Pengingat (alert, bunyi, istirahat mata) ditahan selama rapat atau menonton. */
export const isSuppressed = (i: FocusInput): boolean => isMeeting(i) || isWatching(i);

export function releaseMessage(held: number): string | null {
  return held > 0 ? `${held} pengingat ditahan selama tadi` : null;
}
