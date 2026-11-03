import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  countdownText,
  isStale,
  MAX_ANIME_TITLE,
  MAX_WATCH,
  parseWatchlist,
  serializeWatchlist,
  sortWatch,
  upsert,
  type WatchItem,
} from '../../features/anime/anime.ts';
import { fetchAnime } from '../../features/anime/animeApi.ts';
import { useStored } from './useStored.ts';

interface Props {
  now: number;
}

export function AnimeTab({ now }: Props) {
  const [items, setItems, loaded] = useStored<WatchItem[]>('animeWatch', parseWatchlist, serializeWatchlist);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Sekali per pembukaan tab: perbarui jadwal yang sudah lewat. Satu per satu agar tidak menembus batas AniList.
  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    (async () => {
      for (const it of itemsRef.current) {
        if (!alive) return;
        if (!isStale(it, Date.now())) continue;
        try {
          const fresh = await fetchAnime({ id: it.id });
          if (!alive) return;
          if (fresh) {
            const next = upsert(itemsRef.current, fresh);
            if (next) setItems(next);
          }
        } catch (e) {
          console.error('Gagal memperbarui anime:', e);
          return; // berhenti bila jaringan bermasalah
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || q.trim().length < 2) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await fetchAnime({ search: q });
      if (!found) {
        setMsg('Anime tidak ditemukan.');
      } else {
        const next = upsert(itemsRef.current, found);
        if (next === null) setMsg(`Daftar penuh (maksimal ${MAX_WATCH}).`);
        else {
          setItems(next);
          setQ('');
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menghubungi AniList.');
    } finally {
      setBusy(false);
    }
  };

  const sorted = sortWatch(items);

  return (
    <>
      <div className="sec">Jadwal tayang</div>
      {sorted.length === 0 ? (
        <p className="note first">Belum ada anime. Cari judul di bawah untuk melihat hitung mundur episode berikutnya.</p>
      ) : (
        <ul className="tl">
          {sorted.map((it) => (
            <li key={it.id}>
              <span className="t">{it.title}</span>
              <span className="cd">{countdownText(it, now)}</span>
              <button className="xbtn sm" aria-label={`Hapus: ${it.title}`} onClick={() => setItems(items.filter((x) => x.id !== it.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="add" onSubmit={add}>
        <input
          type="text"
          value={q}
          maxLength={MAX_ANIME_TITLE}
          placeholder="Cari judul anime…"
          aria-label="Judul anime"
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn pri" type="submit" disabled={busy}>
          {busy ? 'Mencari…' : 'Tambah'}
        </button>
      </form>
      <p className="note" aria-live="polite">
        {msg ?? 'Data dari AniList. Hanya judul yang kamu ketik dikirim ke sana.'}
      </p>
    </>
  );
}
