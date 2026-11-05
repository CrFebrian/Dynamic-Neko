import { useEffect, useState, type ReactNode } from 'react';
import { MASCOT_LABEL, type Mascot } from './types.ts';

const eye = (cx: number, cy: number, rx: number, ry: number): ReactNode => (
  <ellipse className="eye" cx={cx} cy={cy} rx={rx} ry={ry} />
);

/** Lama transisi antar-ekspresi. Harus sama dengan animasi .cat .face di island.css. */
const FADE_MS = 240;

interface Face {
  eyes: ReactNode;
  extra: ReactNode;
  mouth: ReactNode;
  /** Kemiringan telinga kiri/kanan (derajat). */
  tilt: [number, number];
}

function face(state: Mascot): Face {
  let eyes: ReactNode = null;
  let extra: ReactNode = null;
  let mouth: ReactNode = <path className="thin" d="M21.4 31.8q1.3 1.7 2.6 0q1.3 1.7 2.6 0" />;
  let tilt: [number, number] = [0, 0];

  switch (state) {
    case 'sleep':
      eyes = <path className="ln" d="M12.5 25q4.5 3.6 9 0M26.5 25q4.5 3.6 9 0" />;
      extra = (
        <text className="z" x="44" y="12">
          z
        </text>
      );
      break;
    case 'excited':
      eyes = <path className="ln" d="M12.5 26.5l4.5-5.5l4.5 5.5M26.5 26.5l4.5-5.5l4.5 5.5" />;
      extra = <path className="fx" d="M46 8l1.3 3.2 3.2 1.3-3.2 1.3L46 17l-1.3-3.2-3.2-1.3 3.2-1.3z" />;
      break;
    case 'reading':
      eyes = (
        <>
          {eye(17, 26, 2, 2.2)}
          {eye(31, 26, 2, 2.2)}
          <circle className="thin" cx={17} cy={25} r={6.4} />
          <circle className="thin" cx={31} cy={25} r={6.4} />
          <path className="thin" d="M23.4 24.5h1.2" />
        </>
      );
      break;
    case 'music':
      eyes = <path className="ln" d="M12.5 25q4.5-4.4 9 0M26.5 25q4.5-4.4 9 0" />;
      extra = (
        <>
          <path className="band" d="M6.5 22Q24-6 41.5 22" />
          <rect className="cup" x={2.6} y={19} width={5.6} height={10} rx={2.4} />
          <rect className="cup" x={39.8} y={19} width={5.6} height={10} rx={2.4} />
        </>
      );
      break;
    case 'shock':
      eyes = (
        <>
          <circle className="thin" cx={17} cy={24} r={3.6} />
          <circle className="thin" cx={31} cy={24} r={3.6} />
          {eye(17, 24, 1.2, 1.2)}
          {eye(31, 24, 1.2, 1.2)}
        </>
      );
      mouth = <ellipse className="thin" cx={24} cy={33} rx={1.8} ry={2.2} />;
      extra = <path className="drop" d="M46 14q-2.8 4-2.8 5.8a2.8 2.8 0 0 0 5.6 0q0-1.8-2.8-5.8z" />;
      break;
    case 'sad':
      eyes = (
        <>
          {eye(17, 25, 2.3, 3.2)}
          {eye(31, 25, 2.3, 3.2)}
          <path className="thin" d="M11.5 20.5l9-3M36.5 20.5l-9-3" />
        </>
      );
      mouth = <path className="thin" d="M21 33q3-2.6 6 0" />;
      tilt = [-16, 16];
      break;
    case 'idle':
      eyes = (
        <>
          {eye(17, 24, 2.4, 3.6)}
          {eye(31, 24, 2.4, 3.6)}
        </>
      );
      break;
  }
  return { eyes, extra, mouth, tilt };
}

const FaceLayer = ({ state, leaving }: { state: Mascot; leaving?: boolean }) => {
  const f = face(state);
  return (
    <g className={`face${leaving ? ' out' : ''}`} aria-hidden={leaving ? true : undefined}>
      {f.eyes}
      {f.mouth}
      {f.extra}
    </g>
  );
};

/**
 * Maskot neko: kepala bergaris sakura, mata menyala. Saat ekspresi berganti, ekspresi lama memudar
 * dan yang baru muncul perlahan, sementara telinga bergerak halus ke kemiringan barunya.
 */
export function Neko({ state }: { state: Mascot }) {
  const [shown, setShown] = useState<{ cur: Mascot; prev: Mascot | null }>({ cur: state, prev: null });
  if (shown.cur !== state) setShown({ cur: state, prev: shown.cur });

  useEffect(() => {
    if (shown.prev === null) return;
    const id = window.setTimeout(() => setShown((s) => ({ ...s, prev: null })), FADE_MS);
    return () => window.clearTimeout(id);
  }, [shown.prev, shown.cur]);

  const [l, r] = face(state).tilt;

  return (
    <svg className={`cat s-${state}`} viewBox="-4 0 56 40" role="img" aria-label={`Maskot neko, ${MASCOT_LABEL[state]}`}>
      <g className="earL" style={{ transform: `rotate(${l}deg)` }}>
        <path className="ear" d="M8.5 17L9.5 3.5Q10 2 11.4 2.8L22 10.5Z" />
        <path className="inn" d="M11 13.5L11.4 6.8L17 10.8Z" />
      </g>
      <g className="earR" style={{ transform: `rotate(${r}deg)` }}>
        <path className="ear" d="M39.5 17L38.5 3.5Q38 2 36.6 2.8L26 10.5Z" />
        <path className="inn" d="M37 13.5L36.6 6.8L31 10.8Z" />
      </g>
      <ellipse className="head" cx={24} cy={24} rx={18.5} ry={14.5} />
      <path className="nose" d="M22.6 28.4h2.8l-1.4 1.7z" />
      <path className="wh" d="M5.5 27L-1 25.6M5.5 30L-1 31.4M42.5 27L49 25.6M42.5 30L49 31.4" />
      {shown.prev !== null && <FaceLayer key={`out-${shown.prev}`} state={shown.prev} leaving />}
      <FaceLayer key={`in-${state}`} state={state} />
    </svg>
  );
}
