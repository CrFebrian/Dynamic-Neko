import { clampStr, finiteNum, isObj, safeParse } from '../../lib/json.ts';

export interface Book {
  id: number;
  title: string;
  page: number;
  total: number;
}

export const MAX_BOOKS = 15;
export const MAX_BOOK_TITLE = 60;
export const MAX_PAGES = 99999;

const clampPage = (n: number, total: number): number => Math.min(Math.max(0, Math.floor(n)), total);

export function parseBooks(text: string | null): Book[] {
  const raw = safeParse(text);
  if (!Array.isArray(raw)) return [];
  const out: Book[] = [];
  const ids = new Set<number>();
  for (const r of raw) {
    if (!isObj(r)) continue;
    const id = finiteNum(r.id);
    const total = finiteNum(r.total);
    const page = finiteNum(r.page);
    const title = clampStr(r.title, MAX_BOOK_TITLE);
    if (id === null || total === null || page === null || !title || ids.has(id)) continue;
    if (!Number.isInteger(total) || total < 1 || total > MAX_PAGES) continue;
    ids.add(id);
    out.push({ id, title, total, page: clampPage(page, total) });
    if (out.length >= MAX_BOOKS) break;
  }
  return out;
}

export const serializeBooks = (b: readonly Book[]): string => JSON.stringify(b.slice(0, MAX_BOOKS));

export function addBook(list: readonly Book[], title: string, total: number): Book[] | null {
  const t = clampStr(title, MAX_BOOK_TITLE);
  if (!t || !Number.isInteger(total) || total < 1 || total > MAX_PAGES || list.length >= MAX_BOOKS) return null;
  const id = list.reduce((mx, x) => Math.max(mx, x.id), 0) + 1;
  return [...list, { id, title: t, page: 0, total }];
}

export const setPage = (list: readonly Book[], id: number, page: number): Book[] =>
  list.map((b) => (b.id === id ? { ...b, page: clampPage(page, b.total) } : b));

export const removeBook = (list: readonly Book[], id: number): Book[] => list.filter((b) => b.id !== id);

export const percent = (b: Book): number => Math.round((b.page / b.total) * 100);
