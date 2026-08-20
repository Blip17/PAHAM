// PAHAM Brand Transition Animation
// Signature institutional transition: "information → structure → understanding"
// Pure CSS keyframes + React state — no animation library.
// Respects prefers-reduced-motion.

import React, { useEffect, useState, useRef } from 'react';

interface BrandTransitionProps {
  onComplete: () => void;
}

// Text fragments that represent academic material
// They appear scattered, then align to a grid, then dissolve into the wordmark
const FRAGMENTS = [
  { text: 'Matematika', row: 0, col: 0 },
  { text: 'Bab 3', row: 0, col: 1 },
  { text: 'Ulangan Harian', row: 1, col: 0 },
  { text: 'Bahasa Indonesia', row: 1, col: 1 },
  { text: 'Catatan Guru', row: 2, col: 0 },
  { text: 'IPA · Fisika', row: 2, col: 1 },
];

type TransitionPhase =
  | 'mount'        // 0–150ms: background settles
  | 'fragments'    // 150–600ms: text fragments appear
  | 'exit'         // 600–900ms: fragments fade out
  | 'wordmark'     // 900–1300ms: PAHAM wordmark enters
  | 'settle'       // 1300–1600ms: wordmark moves up
  | 'done';        // 1600ms+: trigger completion

export const BrandTransition: React.FC<BrandTransitionProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<TransitionPhase>('mount');
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion: just show wordmark briefly then complete
      setPhase('wordmark');
      const t = setTimeout(() => onCompleteRef.current(), 400);
      return () => clearTimeout(t);
    }

    // Full animation sequence
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('fragments'), 150));
    timers.push(setTimeout(() => setPhase('exit'), 700));
    timers.push(setTimeout(() => setPhase('wordmark'), 950));
    timers.push(setTimeout(() => setPhase('settle'), 1350));
    timers.push(setTimeout(() => {
      setPhase('done');
      onCompleteRef.current();
    }, 1750));

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  const showFragments = phase === 'fragments' || phase === 'exit';
  const fragmentsExiting = phase === 'exit';
  const showWordmark = phase === 'wordmark' || phase === 'settle' || phase === 'done';
  const wordmarkSettling = phase === 'settle' || phase === 'done';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#F7F4EC' }}
      aria-live="polite"
      aria-label="Menyiapkan Paham…"
      role="status"
    >
      {/* ── Typographic fragment grid ── */}
      {showFragments && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:gap-x-16 sm:gap-y-6 px-8">
            {FRAGMENTS.map((frag, i) => (
              <div
                key={frag.text}
                className={fragmentsExiting ? 'brand-fragment-exit' : 'brand-fragment'}
                style={{
                  animationDelay: fragmentsExiting
                    ? `${i * 0.04}s`
                    : `${0.15 + i * 0.07}s`,
                  animationFillMode: 'both',
                }}
              >
                <span
                  className="block font-sans text-ink-400 select-none"
                  style={{
                    fontSize: i % 3 === 0 ? '13px' : i % 3 === 1 ? '11px' : '12px',
                    letterSpacing: '0.01em',
                    fontWeight: 400,
                  }}
                >
                  {frag.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAHAM wordmark ── */}
      {showWordmark && (
        <div
          className={wordmarkSettling ? 'brand-wordmark-settle' : 'brand-wordmark-enter'}
          aria-hidden="true"
        >
          <span
            className="block font-serif font-bold text-ink-950 select-none"
            style={{
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            Paham
          </span>
        </div>
      )}

      {/* Thin bottom rule — appears with wordmark */}
      {showWordmark && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-paper-300"
          style={{
            opacity: wordmarkSettling ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        />
      )}
    </div>
  );
};
