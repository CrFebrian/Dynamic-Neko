import type { ReactNode } from 'react';
import type { IslandStyle } from '../types.ts';

export interface SimControls {
  mic: boolean;
  fullscreen: boolean;
  music: boolean;
  onMic: (on: boolean) => void;
  onFullscreen: (on: boolean) => void;
  onMusic: (on: boolean) => void;
}

interface Props {
  style: IslandStyle;
  beep: boolean;
  meetingMode: boolean;
  watchMode: boolean;
  recording: boolean;
  /** Hanya terisi saat berjalan di browser (tanpa Windows). */
  sim: SimControls | null;
  onStyle: (s: IslandStyle) => void;
  onBeep: (on: boolean) => void;
  onMeetingMode: (on: boolean) => void;
  onWatchMode: (on: boolean) => void;
  onRecording: (on: boolean) => void;
  onQuit: () => void;
}

function Switch(props: { on: boolean; onChange: (on: boolean) => void; label: string; hint?: ReactNode }) {
  return (
    <button className="set" role="switch" aria-checked={props.on} onClick={() => props.onChange(!props.on)}>
      <span>
        {props.label}
        {props.hint && <small>{props.hint}</small>}
      </span>
      <i className="sw" />
    </button>
  );
}

export function SettingsTab(p: Props) {
  return (
    <>
      <div className="sec">Gaya</div>
      <div className="seg" role="group" aria-label="Gaya island">
        <button aria-pressed={p.style === 'dynamic'} onClick={() => p.onStyle('dynamic')}>
          Dynamic
        </button>
        <button aria-pressed={p.style === 'notch'} onClick={() => p.onStyle('notch')}>
          Notch
        </button>
      </div>
      <p className="note">Geser island ke kiri atau kanan dengan menyeret pill atau bagian atas panel.</p>

      <div className="sec">Fokus</div>
      <Switch
        on={p.meetingMode}
        onChange={p.onMeetingMode}
        label="Mode rapat otomatis"
        hint="Saat mikrofon dipakai: pengingat dan bunyi ditahan, pill jadi indikator"
      />
      <Switch
        on={p.watchMode}
        onChange={p.onWatchMode}
        label="Mode nonton otomatis"
        hint="Saat ada aplikasi layar penuh: island bersembunyi dan pengingat ditahan"
      />
      <Switch
        on={p.recording}
        onChange={p.onRecording}
        label="Penanda rekam layar"
        hint="Windows tidak memberi tahu saat layar direkam, jadi nyalakan sendiri"
      />

      <div className="sec">Suara</div>
      <Switch
        on={p.beep}
        onChange={p.onBeep}
        label="Bunyi saat sesi selesai"
        hint="Bip singkat ketika timer atau istirahat mata berakhir"
      />

      {p.sim && (
        <>
          <div className="sec">Simulasi (hanya di browser)</div>
          <Switch on={p.sim.mic} onChange={p.sim.onMic} label="Simulasi mikrofon aktif" />
          <Switch on={p.sim.fullscreen} onChange={p.sim.onFullscreen} label="Simulasi aplikasi layar penuh" />
          <Switch on={p.sim.music} onChange={p.sim.onMusic} label="Simulasi musik" />
        </>
      )}

      <div className="sec">Aplikasi</div>
      <button className="btn" onClick={p.onQuit}>
        Keluar dari Yomi Island
      </button>
      <p className="note">Bisa juga lewat ikon Yomi Island di tray (pojok kanan bawah, mungkin di balik tanda ^).</p>
    </>
  );
}
