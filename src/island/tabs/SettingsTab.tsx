import type { IslandStyle } from '../types.ts';

interface Props {
  style: IslandStyle;
  beep: boolean;
  onStyle: (s: IslandStyle) => void;
  onBeep: (on: boolean) => void;
  onQuit: () => void;
}

export function SettingsTab({ style, beep, onStyle, onBeep, onQuit }: Props) {
  return (
    <>
      <div className="sec">Gaya</div>
      <div className="seg" role="group" aria-label="Gaya island">
        <button aria-pressed={style === 'dynamic'} onClick={() => onStyle('dynamic')}>
          Dynamic
        </button>
        <button aria-pressed={style === 'notch'} onClick={() => onStyle('notch')}>
          Notch
        </button>
      </div>
      <div className="sec">Suara</div>
      <button className="set" role="switch" aria-checked={beep} onClick={() => onBeep(!beep)}>
        <span>
          Bunyi saat sesi selesai
          <small>Bip singkat ketika timer atau istirahat mata berakhir</small>
        </span>
        <i className="sw" />
      </button>
      <div className="sec">Aplikasi</div>
      <button className="btn" onClick={onQuit}>
        Keluar dari Yomi Island
      </button>
      <p className="note">Bisa juga lewat ikon Yomi Island di tray (pojok kanan bawah, mungkin di balik tanda ^).</p>
    </>
  );
}
