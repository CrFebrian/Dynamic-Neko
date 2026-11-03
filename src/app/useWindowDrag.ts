import { useCallback, useRef, type PointerEvent } from 'react';
import { beginDrag, type DragSession } from './window.ts';

/** Selisih piksel minimum sebelum gerakan dianggap menyeret (bukan klik). */
const THRESHOLD_PX = 4;

interface Active {
  id: number;
  startX: number;
  dragging: boolean;
  session: Promise<DragSession | null>;
}

export interface WindowDrag {
  dragProps: {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  };
  /** true bila gerakan terakhir adalah seretan. Dipakai untuk mengabaikan klik setelah menyeret. */
  wasDragged: () => boolean;
}

/** Seret jendela secara horizontal lewat elemen mana pun. Tombol dan input tidak memulai seretan. */
export function useWindowDrag(onSettled: (fraction: number) => void): WindowDrag {
  const active = useRef<Active | null>(null);
  const moved = useRef(false);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea')) return;
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    active.current = {
      id: e.pointerId,
      startX: e.screenX,
      dragging: false,
      session: beginDrag().catch((err: unknown) => {
        console.error('Gagal memulai seretan:', err);
        return null;
      }),
    };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const a = active.current;
    if (!a || e.pointerId !== a.id) return;
    const dx = e.screenX - a.startX;
    if (!a.dragging) {
      if (Math.abs(dx) < THRESHOLD_PX) return;
      a.dragging = true;
      moved.current = true;
    }
    void a.session.then((s) => s?.moveTo(dx));
  }, []);

  const finish = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const a = active.current;
      if (!a || e.pointerId !== a.id) return;
      active.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (a.dragging) {
        void a.session.then((s) => {
          if (s) onSettled(s.end());
        });
      }
    },
    [onSettled],
  );

  return {
    dragProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish },
    wasDragged: () => moved.current,
  };
}
