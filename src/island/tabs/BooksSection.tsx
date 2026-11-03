import { useState, type FormEvent } from 'react';
import {
  addBook,
  MAX_BOOK_TITLE,
  MAX_BOOKS,
  MAX_PAGES,
  parseBooks,
  percent,
  removeBook,
  serializeBooks,
  setPage,
  type Book,
} from '../../features/books/books.ts';
import { useStored } from './useStored.ts';

const STEPS = [-10, -1, 1, 10] as const;

export function BooksSection() {
  const [books, setBooks] = useStored<Book[]>('books', parseBooks, serializeBooks);
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = addBook(books, title, Number(total));
    if (!next) {
      setErr(books.length >= MAX_BOOKS ? `Maksimal ${MAX_BOOKS} buku.` : 'Isi judul dan jumlah halaman (1 sampai 99999).');
      return;
    }
    setErr(null);
    setBooks(next);
    setTitle('');
    setTotal('');
  };

  return (
    <>
      <div className="sec">Buku yang dibaca</div>
      {books.length === 0 && <p className="note first">Belum ada buku. Tambahkan untuk memantau progres halaman.</p>}
      <ul className="bk">
        {books.map((b) => (
          <li key={b.id}>
            <div className="row sp">
              <span className="t">{b.title}</span>
              <button className="xbtn sm" aria-label={`Hapus: ${b.title}`} onClick={() => setBooks(removeBook(books, b.id))}>
                ×
              </button>
            </div>
            <div className="prog">
              <span className="mono">
                {b.page}/{b.total}
              </span>
              <div className="prbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent(b)}>
                <i style={{ width: `${percent(b)}%` }} />
              </div>
              <span className="mono">{percent(b)}%</span>
            </div>
            <div className="chips">
              {STEPS.map((s) => (
                <button key={s} className="chip" onClick={() => setBooks(setPage(books, b.id, b.page + s))}>
                  {s > 0 ? `+${s}` : s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <form className="add" onSubmit={submit}>
        <input type="text" value={title} maxLength={MAX_BOOK_TITLE} placeholder="Judul buku…" aria-label="Judul buku" onChange={(e) => setTitle(e.target.value)} />
        <input type="number" value={total} min={1} max={MAX_PAGES} placeholder="Hal." aria-label="Jumlah halaman" style={{ width: 72 }} onChange={(e) => setTotal(e.target.value)} />
        <button className="btn pri" type="submit">
          Tambah
        </button>
      </form>
      {err && <p className="note">{err}</p>}
    </>
  );
}
