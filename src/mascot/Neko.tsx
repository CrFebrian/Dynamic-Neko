import { useEffect, useState, type ReactNode } from 'react';
import { MASCOT_LABEL, type Mascot } from './types.ts';
import '../styles/neko.css';

/**
 * Maskot neko final. Geometri sama dengan assets/mascot/svg (dibuat oleh
 * tools/neko_gen.py); animasi hidup di src/styles/neko.css.
 */

const S = '#ff9bbb';
const HEAD = '#0e0d14';
const PAPER = '#eadfca';
const DROP = '#9fd8ff';
const HOT = '#ff6f9c';

interface EyeProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  highlight?: boolean;
}

function Eye({ cx, cy, rx, ry, highlight = true }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx + 1} ry={ry + 1} fill={S} fillOpacity={0.16} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={S} />
      {highlight && <circle cx={cx - rx * 0.38} cy={cy - ry * 0.38} r={rx * 0.4} fill="#fff" fillOpacity={0.92} />}
    </>
  );
}

const arc = (d: string, w = 2.2): ReactNode => (
  <path d={d} fill="none" stroke={S} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const thin = (d: string, w = 1.3): ReactNode => arc(d, w);

const MOUTH_W = thin('M21.4 31.8q1.3 1.7 2.6 0q1.3 1.7 2.6 0');

const GLASSES = (
  <g fill="none" stroke={PAPER} strokeWidth={1.7} strokeLinecap="round">
    <circle cx={17} cy={25} r={6.8} fill="#fff" fillOpacity={0.05} />
    <circle cx={31} cy={25} r={6.8} fill="#fff" fillOpacity={0.05} />
    <path d="M23.7 24.6q.3-.9.6 0M10.3 24.4L5.8 23M37.7 24.4L42.2 23" />
  </g>
);

const HEADPHONES = (
  <>
    <path d="M6.5 22Q24-8 41.5 22" fill="none" stroke={PAPER} strokeWidth={2.5} strokeLinecap="round" />
    <rect x={2.6} y={19} width={5.8} height={10.4} rx={2.5} fill={S} />
    <rect x={39.6} y={19} width={5.8} height={10.4} rx={2.5} fill={S} />
  </>
);

const sparkle = (cx: number, cy: number, cls: string): ReactNode => (
  <path
    className={cls}
    fill={S}
    d={`M${cx} ${cy - 4.2}L${cx + 1.3} ${cy - 1.3}L${cx + 4.2} ${cy}L${cx + 1.3} ${cy + 1.3}L${cx} ${cy + 4.2}L${cx - 1.3} ${cy + 1.3}L${cx - 4.2} ${cy}L${cx - 1.3} ${cy - 1.3}Z`}
  />
);

const zed = (x: number, y: number, delay: number): ReactNode => (
  <path
    className="nk-z"
    style={{ animationDelay: `${delay}s` }}
    d={`M${x} ${y}h4l-4 5h4`}
    fill="none"
    stroke={S}
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const note = (x: number, y: number, delay: number): ReactNode => (
  <g className="nk-note" style={{ animationDelay: `${delay}s` }} transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={1.9} ry={1.4} transform="rotate(-20)" fill={S} />
    <path d="M1.6 -0.6V-7.2q2.6 .4 3 3" fill="none" stroke={S} strokeWidth={1.2} strokeLinecap="round" />
  </g>
);

const drop = (x: number, y: number, s: number, cls: string): ReactNode => (
  <path
    className={cls}
    fill={DROP}
    d={`M${x} ${y}q${-2.6 * s} ${3.6 * s} ${-2.6 * s} ${5.3 * s}a${2.6 * s} ${2.6 * s} 0 0 0 ${5.2 * s} 0q0 ${-1.7 * s} ${-2.6 * s} ${-5.3 * s}z`}
  />
);

/** Satu ekspresi neko. Ekspresi dipilih lewat `state`. */
function NekoArt({ state }: { state: Mascot }) {
  let eyes: ReactNode;
  let mouth: ReactNode = MOUTH_W;
  let over: ReactNode = null;
  let extra: ReactNode = null;
  let earL = 0;
  let earR = 0;
  let cheek = 0.3;
  let blink = true;

  switch (state) {
    case 'idle':
      eyes = (
        <>
          <Eye cx={17} cy={24} rx={2.7} ry={3.9} />
          <Eye cx={31} cy={24} rx={2.7} ry={3.9} />
        </>
      );
      break;
    case 'sleep':
      blink = false;
      cheek = 0.36;
      eyes = arc('M12.5 25q4.5 3.8 9 0M26.5 25q4.5 3.8 9 0');
      extra = (
        <>
          {zed(41, 11, 0)}
          {zed(41, 11, 1)}
          {zed(41, 11, 2)}
        </>
      );
      break;
    case 'excited':
      blink = false;
      cheek = 0.42;
      eyes = arc('M12.5 26.5l4.5-5.6l4.5 5.6M26.5 26.5l4.5-5.6l4.5 5.6', 2.3);
      mouth = <path d="M20.8 31.6q3.2 5 6.4 0z" fill={HOT} stroke={S} strokeWidth={1.1} strokeLinejoin="round" />;
      extra = (
        <>
          {sparkle(46.5, 7, 'nk-spark')}
          {sparkle(1.5, 8, 'nk-spark nk-spark-b')}
        </>
      );
      break;
    case 'reading':
      cheek = 0.24;
      mouth = thin('M22.4 31.8q1.6 1.4 3.2 0');
      eyes = (
        <>
          <g className="nk-sweep">
            <Eye cx={17} cy={25.4} rx={2.1} ry={2.5} />
            <Eye cx={31} cy={25.4} rx={2.1} ry={2.5} />
          </g>
          {GLASSES}
        </>
      );
      break;
    case 'music':
      blink = false;
      cheek = 0.36;
      eyes = arc('M12.5 25q4.5-4.6 9 0M26.5 25q4.5-4.6 9 0');
      over = HEADPHONES;
      extra = (
        <>
          {note(44, 14, 0)}
          {note(44, 14, 1.2)}
        </>
      );
      break;
    case 'shock':
      blink = false;
      cheek = 0.12;
      earL = -4;
      earR = 4;
      eyes = (
        <>
          <circle cx={17} cy={24} r={4.2} fill={HEAD} stroke={S} strokeWidth={1.4} />
          <circle cx={31} cy={24} r={4.2} fill={HEAD} stroke={S} strokeWidth={1.4} />
          <Eye cx={17} cy={24} rx={1.4} ry={1.4} highlight={false} />
          <Eye cx={31} cy={24} rx={1.4} ry={1.4} highlight={false} />
        </>
      );
      mouth = <ellipse cx={24} cy={33.2} rx={1.9} ry={2.4} fill={HOT} stroke={S} strokeWidth={1.1} />;
      extra = drop(46.5, 5, 1, 'nk-drop');
      break;
    case 'sad':
      cheek = 0.14;
      earL = -16;
      earR = 16;
      eyes = (
        <>
          <Eye cx={17} cy={25.4} rx={2.5} ry={3.5} />
          <Eye cx={31} cy={25.4} rx={2.5} ry={3.5} />
          {thin('M11.5 20.6l9-3M36.5 20.6l-9-3', 1.2)}
        </>
      );
      mouth = thin('M21 33.6q3-2.8 6 0');
      extra = drop(13.2, 29, 0.6, 'nk-tear');
      break;
  }

  const earStyle = { fill: HEAD, stroke: S, strokeWidth: 1.9, strokeLinejoin: 'round' as const };

  return (
    <svg
      className={`nk s-${state}`}
      viewBox="-4 -2 56 42"
      role="img"
      aria-label={`Maskot neko, ${MASCOT_LABEL[state]}`}
    >
      <g className={`nk-head nk-h-${state}`}>
        <g className={state === 'idle' ? 'nk-twitch' : undefined}>
          <g transform={`rotate(${earL} 13 14)`}>
            <path d="M8.5 17L9.5 3.5Q10 2 11.4 2.8L22 10.5Z" style={earStyle} />
            <path d="M11 13.5L11.4 6.8L17 10.8Z" fill={S} fillOpacity={0.4} />
          </g>
        </g>
        <g transform={`rotate(${earR} 35 14)`}>
          <path d="M39.5 17L38.5 3.5Q38 2 36.6 2.8L26 10.5Z" style={earStyle} />
          <path d="M37 13.5L36.6 6.8L31 10.8Z" fill={S} fillOpacity={0.4} />
        </g>
        <ellipse cx={24} cy={24} rx={18.5} ry={14.5} fill={HEAD} stroke={S} strokeOpacity={0.9} strokeWidth={1.9} />
        <path
          d="M21.6 10.6l-.7 3M24 10.2v3.4M26.4 10.6l.7 3"
          fill="none"
          stroke={S}
          strokeOpacity={0.6}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        <ellipse cx={10.6} cy={29.6} rx={2.6} ry={1.5} fill={S} fillOpacity={cheek} />
        <ellipse cx={37.4} cy={29.6} rx={2.6} ry={1.5} fill={S} fillOpacity={cheek} />
        <g className={blink ? 'nk-blink' : undefined}>{eyes}</g>
        <path d="M22.6 28.4h2.8l-1.4 1.7z" fill={S} />
        {mouth}
        <path
          d="M5.5 27L-1.5 25.4M5.5 30L-1.5 31.8M42.5 27L49.5 25.4M42.5 30L49.5 31.8"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.34}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        {over}
      </g>
      {extra}
    </svg>
  );
}

/** Lama transisi antar-ekspresi. Harus sama dengan animasi .nk-in / .nk-out di neko.css. */
const FADE_MS = 240;

/**
 * Maskot neko dengan transisi halus: saat ekspresi berganti, ekspresi lama memudar keluar
 * sementara yang baru muncul, jadi tidak ada lompatan mendadak.
 */
export function Neko({ state }: { state: Mascot }) {
  const [shown, setShown] = useState<{ cur: Mascot; prev: Mascot | null }>({ cur: state, prev: null });
  if (shown.cur !== state) setShown({ cur: state, prev: shown.cur });

  useEffect(() => {
    if (shown.prev === null) return;
    const id = window.setTimeout(() => setShown((s) => ({ ...s, prev: null })), FADE_MS);
    return () => window.clearTimeout(id);
  }, [shown.prev, shown.cur]);

  return (
    <span className="nk-stack">
      {shown.prev !== null && (
        <span key={`out-${shown.prev}`} className="nk-layer nk-out" aria-hidden="true">
          <NekoArt state={shown.prev} />
        </span>
      )}
      <span key={`in-${state}`} className={shown.prev !== null ? 'nk-layer nk-in' : 'nk-layer'}>
        <NekoArt state={state} />
      </span>
    </span>
  );
}
