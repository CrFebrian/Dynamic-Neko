import type { BatteryInfo } from '../lib/system.ts';

export function BatteryIcon({ b }: { b: BatteryInfo }) {
  const low = b.percent <= 20 && !b.charging;
  return (
    <span
      className={`bat${low ? ' low' : ''}${b.charging ? ' chg' : ''}`}
      role="img"
      aria-label={`Baterai ${b.percent} persen${b.charging ? ', sedang mengisi' : ''}`}
    >
      <span className="cell" aria-hidden="true">
        <i style={{ width: `${b.percent}%` }} />
      </span>
      <span className="pct mono" aria-hidden="true">
        {b.percent}%
      </span>
      {b.charging && (
        <svg viewBox="0 0 10 14" aria-hidden="true">
          <path d="M6 0 0 8h4l-1 6 7-9H6z" />
        </svg>
      )}
    </span>
  );
}
