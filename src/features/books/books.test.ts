import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addBook, MAX_BOOKS, parseBooks, percent, removeBook, serializeBooks, setPage } from './books.ts';

test('addBook: validasi', () => {
  assert.equal(addBook([], '', 100), null);
  assert.equal(addBook([], 'X', 0), null);
  assert.equal(addBook([], 'X', 1.5), null);
  assert.equal(addBook([], 'X', 1_000_000), null);
  const l = addBook([], 'Novel', 200)!;
  assert.deepEqual(l[0], { id: 1, title: 'Novel', page: 0, total: 200 });
});
test('setPage dijepit 0..total, percent', () => {
  let l = addBook([], 'N', 200)!;
  l = setPage(l, 1, 500);
  assert.equal(l[0].page, 200);
  l = setPage(l, 1, -5);
  assert.equal(l[0].page, 0);
  l = setPage(l, 1, 50.9);
  assert.equal(percent(l[0]), 25);
  assert.deepEqual(setPage(l, 99, 5), l);
});
test('removeBook', () => {
  const l = addBook(addBook([], 'A', 10)!, 'B', 10)!;
  assert.deepEqual(removeBook(l, 1).map((b) => b.title), ['B']);
});
test('parseBooks: rusak, duplikat, halaman melebihi total, batas', () => {
  assert.deepEqual(parseBooks(null), []);
  assert.deepEqual(parseBooks('{'), []);
  const r = parseBooks(JSON.stringify([{ id: 1, title: 'A', page: 999, total: 100 }, { id: 1, title: 'B', page: 1, total: 5 }, { id: 2, title: 'C', page: 1, total: 0 }, null]));
  assert.deepEqual(r, [{ id: 1, title: 'A', page: 100, total: 100 }]);
  assert.deepEqual(parseBooks(serializeBooks(r)), r);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, title: 't', page: 0, total: 5 }));
  assert.equal(parseBooks(JSON.stringify(many)).length, MAX_BOOKS);
});
