import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { estimatePosition, hueFromText } from '../../lib/media.ts';
import type { MediaAction, MediaInfo } from '../../lib/system.ts';
import { mmss } from '../../lib/time.ts';
import { LyricsBlock } from './LyricsBlock.tsx';

interface Props {
  now: number;
  media: MediaInfo | null;
  /** Waktu (epoch ms) snapshot media terakhir. */
  mediaAt: number;
  onControl: (a: MediaAction) => void;
  simulated: boolean;
  /** Volume utama 0..100; null bila tidak terbaca. */
  volume: number | null;
  onVolume: (percent: number) => void;
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);
const PLAY = 'M8 5v14l11-7z';
const PAUSE = 'M7 5h4v14H7zM13 5h4v14h-4z';
const PREV = 'M6 5h2v14H6zM20 5v14L9 12z';
const NEXT = 'M16 5h2v14h-2zM4 5v14l11-7z';
const SPK = 'M4 9v6h4l5 4V5L8 9zM16 9.2a4 4 0 0 1 0 5.6';
const SPK_MUTE = 'M4 9v6h4l5 4V5L8 9zM16.5 9.5l4 5M20.5 9.5l-4 5';

const SEND_MS = 70;

/** Penggeser volume. Selama digeser, nilai lokal ditampilkan agar tidak melompat oleh pembacaan sistem. */
function VolumeRow({ volume, onVolume }: { volume: number | null; onVolume: (p: number) => void }) {
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  if (volume === null) {
    return <p className="note">Volume sistem tidak terbaca di perangkat ini.</p>;
  }
  const shown = draft ?? volume;

  const change = (v: number) => {
    setDraft(v);
    const wait = SEND_MS - (Date.now() - last.current);
    if (wait <= 0) {
      last.current = Date.now();
      onVolume(v);
    } else {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        last.current = Date.now();
        onVolume(v);
      }, wait);
    }
  };
  const release = () => {
    if (draft !== null) onVolume(draft);
    window.setTimeout(() => setDraft(null), 400);
  };

  return (
    <div className="vol">
      <button
        className="volbtn"
        aria-label={shown === 0 ? 'Suarakan' : 'Bisukan'}
        onClick={() => change(shown === 0 ? 40 : 0)}
      >
        <Icon d={shown === 0 ? SPK_MUTE : SPK} />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={shown}
        aria-label="Volume"
        style={{ '--v': `${shown}%` } as CSSProperties}
        onChange={(e) => change(Number(e.currentTarget.value))}
        onPointerUp={release}
        onKeyUp={release}
      />
      <span className="mono">{shown}%</span>
    </div>
  );
}

export function MusicTab({ now, media, mediaAt, onControl, simulated, volume, onVolume }: Props) {
  if (!media) {
    return (
      <>
        <div className="sec">Sedang diputar</div>
        <p className="note first">
          Belum ada pemutar aktif. Putar lagu di Spotify, pemutar musik, atau browser, lalu kembali ke sini.
        </p>
        {simulated && <p className="note">Mode simulasi: nyalakan "Simulasi musik" di tab Santai.</p>}
        <VolumeRow volume={volume} onVolume={onVolume} />
      </>
    );
  }

  const pos = estimatePosition(media, mediaAt, now);
  const pct = media.durationSec > 0 ? Math.min(100, (pos / media.durationSec) * 100) : 0;
  const hue = hueFromText(`${media.title}${media.artist}`);

  return (
    <>
      <div className="mus">
        <div className="cover" style={{ '--h': hue } as CSSProperties} aria-hidden="true" />
        <div className="meta">
          <b>{media.title || 'Tanpa judul'}</b>
          <small>{media.artist || 'Artis tidak diketahui'}</small>
        </div>
      </div>

      {media.durationSec > 0 ? (
        <div className="prog">
          <span className="mono">{mmss(pos)}</span>
          <div className="prbar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="mono">{mmss(media.durationSec)}</span>
        </div>
      ) : (
        <p className="note">Pemutar ini tidak melaporkan durasi.</p>
      )}

      <div className="ctl">
        <button onClick={() => onControl('prev')} aria-label="Sebelumnya">
          <Icon d={PREV} />
        </button>
        <button className="pl" onClick={() => onControl('toggle')} aria-label={media.playing ? 'Jeda' : 'Putar'}>
          <Icon d={media.playing ? PAUSE : PLAY} />
        </button>
        <button onClick={() => onControl('next')} aria-label="Berikutnya">
          <Icon d={NEXT} />
        </button>
      </div>
      <VolumeRow volume={volume} onVolume={onVolume} />
      <LyricsBlock title={media.title} artist={media.artist} durationSec={media.durationSec} pos={pos} />
      {simulated && <p className="note">Data simulasi. Di aplikasi Windows, ini dibaca dari pemutar yang aktif.</p>}
    </>
  );
}
