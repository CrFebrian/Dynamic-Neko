import { useEffect, useState } from 'react';
import { lineAt } from '../../features/lyrics/lrc.ts';
import { fetchLyrics, type Lyrics } from '../../features/lyrics/lyricsApi.ts';
import { parseFlag, serializeFlag, useStored } from './useStored.ts';

interface Props {
  title: string;
  artist: string;
  durationSec: number;
  /** Posisi lagu saat ini (detik). */
  pos: number;
}

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'none' } | { kind: 'error'; msg: string } | { kind: 'ok'; lyrics: Lyrics };

export function LyricsBlock({ title, artist, durationSec, pos }: Props) {
  const [on, setOn] = useStored<boolean>('lyrics', parseFlag, serializeFlag);
  const [st, setSt] = useState<State>({ kind: 'idle' });
  const dur = Math.round(durationSec);

  useEffect(() => {
    if (!on) {
      setSt({ kind: 'idle' });
      return;
    }
    let alive = true;
    setSt({ kind: 'loading' });
    fetchLyrics(title, artist, dur)
      .then((l) => alive && setSt(l ? { kind: 'ok', lyrics: l } : { kind: 'none' }))
      .catch((e: unknown) => alive && setSt({ kind: 'error', msg: e instanceof Error ? e.message : 'Gagal memuat lirik.' }));
    return () => {
      alive = false;
    };
  }, [on, title, artist, dur]);

  let body: React.ReactNode = null;
  if (st.kind === 'loading') body = <p className="note">Mencari lirik…</p>;
  else if (st.kind === 'none') body = <p className="note">Lirik tidak ditemukan.</p>;
  else if (st.kind === 'error') body = <p className="note">{st.msg}</p>;
  else if (st.kind === 'ok') {
    const { synced, plain } = st.lyrics;
    if (synced.length > 0) {
      const i = lineAt(synced, pos);
      body = (
        <div className="lyr" aria-live="polite">
          <small>{synced[i - 1]?.text ?? ''}</small>
          <b>{i >= 0 ? synced[i].text || '♪' : '♪'}</b>
          <small>{synced[i + 1]?.text ?? ''}</small>
        </div>
      );
    } else {
      body = <pre className="lyr-plain">{plain}</pre>;
    }
  }

  return (
    <>
      <div className="row sp">
        <div className="sec" style={{ margin: 0 }}>
          Lirik
        </div>
        <button className="chip" aria-pressed={on} onClick={() => setOn(!on)}>
          {on ? 'Nyala' : 'Mati'}
        </button>
      </div>
      {on ? body : <p className="note">Mati. Bila dinyalakan, judul dan artis lagu dikirim ke LRCLIB untuk mencari lirik.</p>}
    </>
  );
}
