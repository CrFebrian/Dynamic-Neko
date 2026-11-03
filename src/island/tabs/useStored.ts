import { useCallback, useEffect, useRef, useState } from 'react';
import { getStore } from '../../lib/store.ts';

/**
 * State yang tersimpan di tabel pengaturan (nilai teks). `parse` harus tahan data rusak.
 * Mengembalikan [nilai, setter, sudahDimuat].
 */
export function useStored<T>(key: string, parse: (s: string | null) => T, serialize: (v: T) => string): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(() => parse(null));
  const [loaded, setLoaded] = useState(false);
  const fns = useRef({ parse, serialize });
  fns.current = { parse, serialize };

  useEffect(() => {
    let alive = true;
    getStore()
      .getSetting(key)
      .then((s) => {
        if (!alive) return;
        setValue(fns.current.parse(s));
        setLoaded(true);
      })
      .catch((e: unknown) => {
        console.error(`Gagal memuat ${key}:`, e);
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const set = useCallback(
    (v: T) => {
      setValue(v);
      getStore()
        .setSetting(key, fns.current.serialize(v))
        .catch((e: unknown) => console.error(`Gagal menyimpan ${key}:`, e));
    },
    [key],
  );

  return [value, set, loaded];
}

export const parseFlag = (s: string | null): boolean => s === '1';
export const serializeFlag = (b: boolean): string => (b ? '1' : '0');
