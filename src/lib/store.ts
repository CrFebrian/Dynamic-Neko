import { cleanTitle, type Task, type TaskTag } from '../features/tasks/tasks.ts';
import type { DayRecord } from '../features/reading/streak.ts';
import { inTauri } from './env.ts';
import { SqliteStore } from './sqliteStore.ts';

/** Lapisan penyimpanan. Semua query memakai parameter, tidak ada penggabungan string. */
export interface Store {
  loadTasks(): Promise<Task[]>;
  addTask(title: string, due: number | null, tag: TaskTag): Promise<Task>;
  setDone(id: number, done: boolean): Promise<void>;
  removeTask(id: number): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  loadDay(day: string): Promise<DayRecord | null>;
  saveDay(rec: DayRecord): Promise<void>;
  loadRecentDays(limit: number): Promise<DayRecord[]>;
}

export const TAGS: readonly TaskTag[] = ['task', 'agenda', 'baca', 'anime'];
export const asTag = (v: unknown): TaskTag => (TAGS as readonly unknown[]).includes(v) ? (v as TaskTag) : 'task';

/** Penyimpanan di memori. Dipakai untuk test dan sebagai dasar LocalStore. */
export class MemoryStore implements Store {
  protected tasks: Task[] = [];
  protected nextId = 1;
  protected settings = new Map<string, string>();
  protected days = new Map<string, DayRecord>();

  async loadTasks(): Promise<Task[]> {
    return this.tasks.map((t) => ({ ...t }));
  }
  async addTask(title: string, due: number | null, tag: TaskTag): Promise<Task> {
    const t: Task = { id: this.nextId++, title, due, done: false, tag };
    this.tasks.push(t);
    this.persist();
    return { ...t };
  }
  async setDone(id: number, done: boolean): Promise<void> {
    const t = this.tasks.find((x) => x.id === id);
    if (t) t.done = done;
    this.persist();
  }
  async removeTask(id: number): Promise<void> {
    this.tasks = this.tasks.filter((x) => x.id !== id);
    this.persist();
  }
  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) ?? null;
  }
  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
    this.persist();
  }
  async loadDay(day: string): Promise<DayRecord | null> {
    const r = this.days.get(day);
    return r ? { ...r } : null;
  }
  async saveDay(rec: DayRecord): Promise<void> {
    this.days.set(rec.day, { ...rec });
    this.persist();
  }
  async loadRecentDays(limit: number): Promise<DayRecord[]> {
    return [...this.days.values()]
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, Math.max(0, limit))
      .map((r) => ({ ...r }));
  }
  protected persist(): void {}
}

const LS_KEY = 'yomi.store.v1';
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Untuk `npm run dev` di browser. Data dibaca ulang dengan validasi, karena localStorage bisa rusak. */
export class LocalStore extends MemoryStore {
  constructor() {
    super();
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const data: unknown = JSON.parse(raw);
      if (!isRec(data)) return;
      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          if (!isRec(t) || typeof t.id !== 'number' || typeof t.title !== 'string') continue;
          const title = cleanTitle(t.title);
          if (!title) continue;
          this.tasks.push({
            id: t.id,
            title,
            due: typeof t.due === 'number' ? t.due : null,
            done: t.done === true,
            tag: asTag(t.tag),
          });
          this.nextId = Math.max(this.nextId, t.id + 1);
        }
      }
      if (Array.isArray(data.settings)) {
        for (const e of data.settings) {
          if (Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string') this.settings.set(e[0], e[1]);
        }
      }
      if (Array.isArray(data.days)) {
        for (const d of data.days) {
          if (isRec(d) && typeof d.day === 'string' && typeof d.pages === 'number' && typeof d.goal === 'number' && typeof d.sessions === 'number') {
            this.days.set(d.day, { day: d.day, pages: d.pages, goal: d.goal, sessions: d.sessions });
          }
        }
      }
    } catch {
      /* data rusak atau penyimpanan tidak tersedia: mulai kosong */
    }
  }

  protected override persist(): void {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ tasks: this.tasks, settings: [...this.settings], days: [...this.days.values()] }),
      );
    } catch {
      /* abaikan */
    }
  }
}

export function createStore(): Store {
  return inTauri() ? new SqliteStore() : new LocalStore();
}

let instance: Store | null = null;
export function getStore(): Store {
  instance ??= createStore();
  return instance;
}
