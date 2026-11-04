import type { KeyboardEvent } from 'react';
import { Neko } from '../mascot/Neko.tsx';
import type { WindowDrag } from '../app/useWindowDrag.ts';
import type { PillView } from './pillState.ts';
import type { BatteryInfo } from '../lib/system.ts';
import { BatteryIcon } from './BatteryIcon.tsx';

interface PillProps {
  view: PillView;
  onOpen: () => void;
  drag: WindowDrag;
  /** Teks jam ("09:57") atau null bila disembunyikan. Hanya tampil saat pill idle. */
  clock: string | null;
  battery: BatteryInfo | null;
}

export function Pill({ view, onOpen, drag, clock, battery }: PillProps) {
  const wide = view.idle && !view.hidden && (clock !== null || battery !== null);
  const cls = ['pill', view.hidden ? 'hid' : '', view.idle ? 'idle' : '', wide ? 'wide' : ''].filter(Boolean).join(' ');

  const onClick = () => {
    // Setelah menyeret, klik yang menyusul diabaikan.
    if (drag.wasDragged() || view.hidden) return;
    onOpen();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !view.hidden) {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={cls}
      role="button"
      tabIndex={view.hidden ? -1 : 0}
      aria-expanded={false}
      aria-label={view.hidden ? 'Island disembunyikan (mode nonton)' : 'Buka Yomi Island. Seret untuk menggeser.'}
      onClick={onClick}
      onKeyDown={onKey}
      {...drag.dragProps}
    >
      {wide && <span className="pl">{battery !== null && <BatteryIcon b={battery} />}</span>}
      {!view.hidden && (
        <span className="mini">
          <Neko state={view.mascot} />
        </span>
      )}
      {wide && <span className="pr">{clock !== null && <span className="clk mono">{clock}</span>}</span>}
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
