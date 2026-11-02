import type Database from '@tauri-apps/plugin-sql';
import type { Task, TaskTag } from '../features/tasks/tasks.ts';
import type { DayRecord } from '../features/reading/streak.ts';
import type { Store } from './store.ts';

const SCHEMA: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS tasks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     due INTEGER,
     done INTEGER NOT NULL DEFAULT 0,
     tag TEXT NOT NULL DEFAULT 'task',
     created_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reading_days (
     day TEXT PRIMARY KEY,
     pages INTEGER NOT NULL DEFAULT 0,
     goal INTEGER NOT NULL DEFAULT 20,
     sessions INTEGER NOT NULL DEFAULT 0
   )`,
];

interface TaskRow { id: number; title: string; due: number | null; done: number; tag: string }
interface KvRow { value: string }
interface DayRow { day: string; pages: number; goal: number; sessions: number }

const TAGS: readonly string[] = ['task', 'agenda', 'baca', 'anime'];
const toTag = (v: string): TaskTag => (TAGS.includes(v) ? (v as TaskTag) : 'task');
const toTask = (r: TaskRow): Task => ({ id: r.id, title: r.title, due: r.due, done: r.done === 1, tag: toTag(r.tag) });

/** Penyimpanan SQLite lewat tauri-plugin-sql. Berkas: yomi.db di folder konfigurasi aplikasi. */
export class SqliteStore implements Store {
  private db: Promise<Database>;

  constructor() {
    this.db = SqliteStore.open();
  }

  private static async open(): Promise<Database> {
    const mod = await import('@tauri-apps/plugin-sql');
    const db = await mod.default.load('sqlite:yomi.db');
    for (const sql of SCHEMA) await db.execute(sql);
    return db;
  }

  async loadTasks(): Promise<Task[]> {
    const db = await this.db;
    const rows = await db.select<TaskRow[]>('SELECT id, title, due, done, tag FROM tasks ORDER BY id');
    return rows.map(toTask);
  }

  async addTask(title: string, due: number | null, tag: TaskTag): Promise<Task> {
    const db = await this.db;
    const r = await db.execute('INSERT INTO tasks (title, due, done, tag, created_at) VALUES ($1, $2, 0, $3, $4)', [
      title,
      due,
      tag,
      Date.now(),
    ]);
    if (r.lastInsertId === undefined) throw new Error('INSERT task tidak mengembalikan id');
    return { id: r.lastInsertId, title, due, done: false, tag };
  }

  async setDone(id: number, done: boolean): Promise<void> {
    const db = await this.db;
    await db.execute('UPDATE tasks SET done = $1 WHERE id = $2', [done ? 1 : 0, id]);
  }

  async removeTask(id: number): Promise<void> {
    const db = await this.db;
    await db.execute('DELETE FROM tasks WHERE id = $1', [id]);
  }

  async getSetting(key: string): Promise<string | null> {
    const db = await this.db;
    const rows = await db.select<KvRow[]>('SELECT value FROM kv WHERE key = $1', [key]);
    return rows[0]?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.db;
    await db.execute('INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
      key,
      value,
    ]);
  }

  async loadDay(day: string): Promise<DayRecord | null> {
    const db = await this.db;
    const rows = await db.select<DayRow[]>('SELECT day, pages, goal, sessions FROM reading_days WHERE day = $1', [day]);
    return rows[0] ?? null;
  }

  async saveDay(rec: DayRecord): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT INTO reading_days (day, pages, goal, sessions) VALUES ($1, $2, $3, $4)
       ON CONFLICT(day) DO UPDATE SET pages = excluded.pages, goal = excluded.goal, sessions = excluded.sessions`,
      [rec.day, rec.pages, rec.goal, rec.sessions],
    );
  }

  async loadRecentDays(limit: number): Promise<DayRecord[]> {
    const db = await this.db;
    return db.select<DayRow[]>('SELECT day, pages, goal, sessions FROM reading_days ORDER BY day DESC LIMIT $1', [
      Math.max(0, Math.floor(limit)),
    ]);
  }
}
