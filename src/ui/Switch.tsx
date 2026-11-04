import type { ReactNode } from 'react';

export function Switch(props: { on: boolean; onChange: (on: boolean) => void; label: string; hint?: ReactNode }) {
  return (
    <button className="set" role="switch" aria-checked={props.on} onClick={() => props.onChange(!props.on)}>
      <span>
        {props.label}
        {props.hint && <small>{props.hint}</small>}
      </span>
      <i className="sw" />
    </button>
  );
}
