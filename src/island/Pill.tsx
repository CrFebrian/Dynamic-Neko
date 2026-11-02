import type { KeyboardEvent } from 'react';
import { Neko } from '../mascot/Neko.tsx';
import type { PillView } from './pillState.ts';

interface PillProps {
  view: PillView;
  onOpen: () => void;
}

export function Pill({ view, onOpen }: PillProps) {
  const cls = ['pill', view.hidden ? 'hid' : '', view.idle ? 'idle' : ''].filter(Boolean).join(' ');

  const open = () => {
    if (!view.hidden) onOpen();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  return (
    <div
      className={cls}
      role="button"
      tabIndex={view.hidden ? -1 : 0}
      aria-expanded={false}
      aria-label={view.hidden ? 'Island disembunyikan (mode nonton)' : 'Buka Yomi Island'}
      onClick={open}
      onKeyDown={onKey}
    >
      {!view.hidden && (
        <span className="mini">
          <Neko state={view.mascot} />
        </span>
      )}
      {!view.hidden && !view.idle && (
        <>
          {view.dot && <i className={`dot ${view.dot}`} />}
          <span className="ptxt">{view.text}</span>
          {view.eq && (
            <span className="eq" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </>
      )}
    </div>
  );
}
