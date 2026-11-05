import { useState, type FormEvent } from 'react';
import {
  agoText,
  MAX_MANGA,
  MAX_MANGA_TITLE,
  parseMangaList,
  serializeMangaList,
  sortManga,
  upsertManga,
  type MangaItem,
} from '../../features/manga/manga.ts';
import { fetchMangaByTitle } from '../../features/manga/mangaApi.ts';
import { parseSetting, serializeSetting } from '../../lib/settings.ts';
import { useStored } from './useStored.ts';

interface Props {
  now: number;
}

export function MangaSection({ now }: Props) {
  const [items, setItems] = useStored<MangaItem[]>('mangaWatch', parseMangaList, serializeMangaList);
  const [lang] = useStored('mangaLang', (s) => parseSetting('mangaLang', s), (v) => serializeSetting('mangaLang', v));
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || q.trim().length < 2) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await fetchMangaByTitle(q, lang);
      if (!found) setMsg('Manga tidak ditemukan.');
      else {
        const next = upsertManga(items, found);
        if (next === null) setMsg(`Daftar penuh (maksimal ${MAX_MANGA}).`);
        else {
          setItems(next);
          setQ('');
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menghubungi MangaDex.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sec">Update manga</div>
      {items.length === 0 ? (
        <p className="note first">Belum ada manga. Cari judul untuk dipantau bab terbarunya.</p>
      ) : (
        <ul className="tl">
          {sortManga(items).map((m) => (
            <li key={m.id}>
              <span className="t">{m.title}</span>
              <span className="cd">{m.chapter === null ? 'belum ada bab' : `Bab ${m.chapter} · ${agoText(m.publishAt, now)}`}</span>
              <button className="xbtn sm" aria-label={`Hapus: ${m.title}`} onClick={() => setItems(items.filter((x) => x.id !== m.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="add" onSubmit={add}>
        <input type="text" value={q} maxLength={MAX_MANGA_TITLE} placeholder="Cari judul manga…" aria-label="Judul manga" onChange={(e) => setQ(e.target.value)} />
        <button className="btn pri" type="submit" disabled={busy}>
          {busy ? 'Mencari…' : 'Tambah'}
        </button>
      </form>
      {msg && (
        <p className="note" role="alert">
          {msg}
        </p>
      )}
    </>
  );
}
