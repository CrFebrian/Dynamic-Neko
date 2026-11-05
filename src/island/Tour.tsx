import { useEffect, useRef, useState } from 'react';
import { Neko } from '../mascot/Neko.tsx';
import { isLastStep, TOUR_STEPS, type TourStep } from './tourSteps.ts';

/** Ilustrasi pill: baterai | neko | jam. Murni hiasan, tidak interaktif. */
function PillSketch() {
  return (
    <div className="tour-pill" aria-hidden="true">
      <span className="mono">76%</span>
      <span className="tour-pill-cat">
        <Neko state="idle" />
      </span>
      <span className="mono">09:41</span>
    </div>
  );
}

/**
 * Kartu tur di dalam panel. Tab/bar yang dijelaskan disorot oleh Panel lewat `data-hl`.
 * Esc dan klik "Lewati" sama-sama mengakhiri tur.
 */
export function Tour(props: { onStep: (s: TourStep) => void; onEnd: () => void }) {
  const [i, setI] = useState(0);
  const step = TOUR_STEPS[i];
  const nextRef = useRef<HTMLButtonElement>(null);
  const { onStep, onEnd } = props;

  useEffect(() => onStep(step), [step, onStep]);
  useEffect(() => nextRef.current?.focus(), [i]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEnd();
      } else if (e.key === 'ArrowRight') setI((n) => Math.min(TOUR_STEPS.length - 1, n + 1));
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [onEnd]);

  const last = isLastStep(i);
  return (
    <div className="tour" role="dialog" aria-modal="false" aria-label="Tur pengenalan" aria-live="polite">
      <div className="tour-card" key={step.id}>
        {step.highlight === 'pill' ? (
          <PillSketch />
        ) : (
          <div className="tour-cat" aria-hidden="true">
            <Neko state={step.mascot} />
          </div>
        )}
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-dots" role="presentation">
          {TOUR_STEPS.map((s, n) => (
            <i key={s.id} className={n === i ? 'on' : n < i ? 'past' : ''} />
          ))}
          <span className="tour-count">
            {i + 1}/{TOUR_STEPS.length}
          </span>
        </div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onEnd}>
            {last ? 'Tutup' : 'Lewati'}
          </button>
          <span className="grow" />
          {i > 0 && (
            <button className="btn sm" onClick={() => setI(i - 1)}>
              Kembali
            </button>
          )}
          <button ref={nextRef} className="btn sm pri" onClick={() => (last ? onEnd() : setI(i + 1))}>
            {last ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
