// Original PAHAM Mascot: "PIKO" (The Scholarly Ink-Spirit Owl)
// Vector-crafted, state-machine driven character with expressive eyes, feather tufts, scholar's monocle, and speech bubbles

import React, { useState, useEffect } from 'react';

export type MascotState = 
  | 'idle'
  | 'thinking'
  | 'recommending'
  | 'success'
  | 'encouraging'
  | 'warning'
  | 'celebrating'
  | 'sleeping'
  | 'curious';

export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface PahamMascotProps {
  state?: MascotState;
  size?: MascotSize;
  bubbleText?: string;
  bubblePosition?: 'top' | 'bottom' | 'left' | 'right';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PahamMascot: React.FC<PahamMascotProps> = ({
  state = 'idle',
  size = 'md',
  bubbleText,
  bubblePosition = 'top',
  interactive = true,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Periodic natural blinking when idle/curious
  useEffect(() => {
    if (state === 'sleeping') return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4200 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [state]);

  const sizePixels = {
    xs: 28,
    sm: 38,
    md: 52,
    lg: 76,
    xl: 104,
  }[size];

  // Colors
  const primaryInk = '#173626'; // Deep scholarly moss-ink
  const secondaryInk = '#26533C';
  const chestParchment = '#FDFCF7';
  const amberGaze = '#D48224';
  const goldAccents = '#B26A1A';
  const highlightMoss = '#4B9670';
  const terracottaAlert = '#B94726';

  // State-specific attributes
  const isHappy = state === 'success' || state === 'celebrating';
  const isThinking = state === 'thinking';
  const isSleeping = state === 'sleeping';
  const isAlert = state === 'warning';
  const isRecommending = state === 'recommending';
  const isCurious = state === 'curious' || isHovered;

  // Eye rendering
  const renderEyes = () => {
    if (isSleeping) {
      // Crescent closed eyes
      return (
        <g stroke={primaryInk} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M 28 38 Q 33 43 38 38" />
          <path d="M 44 38 Q 49 43 54 38" />
        </g>
      );
    }

    if (isHappy) {
      // Joyful ^ ^ curved eyes
      return (
        <g stroke={primaryInk} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M 28 39 Q 33 34 38 39" />
          <path d="M 44 39 Q 49 34 54 39" />
        </g>
      );
    }

    if (isBlinking) {
      // Quick blink line
      return (
        <g stroke={primaryInk} strokeWidth="2.2" strokeLinecap="round">
          <line x1="28" y1="38" x2="38" y2="38" />
          <line x1="44" y1="38" x2="54" y2="38" />
        </g>
      );
    }

    // Standard / Thinking / Curious open eyes
    const pupilOffsetY = isThinking ? -2 : isCurious ? 1 : 0;
    const pupilOffsetX = isRecommending ? 2 : isThinking ? 2 : 0;

    return (
      <g>
        {/* Left Eye */}
        <circle cx="33" cy="38" r="6.5" fill="#FFFFFF" stroke={primaryInk} strokeWidth="1.5" />
        <circle cx={33 + pupilOffsetX} cy={38 + pupilOffsetY} r={isCurious ? "4" : "3.2"} fill={isAlert ? terracottaAlert : amberGaze} />
        <circle cx={34 + pupilOffsetX} cy={36.5 + pupilOffsetY} r="1.2" fill="#FFFFFF" />

        {/* Right Eye + Scholar's Monocle Frame */}
        <circle cx="49" cy="38" r="6.5" fill="#FFFFFF" stroke={primaryInk} strokeWidth="1.5" />
        <circle cx={49 + pupilOffsetX} cy={38 + pupilOffsetY} r={isCurious ? "4" : "3.2"} fill={isAlert ? terracottaAlert : amberGaze} />
        <circle cx={50 + pupilOffsetX} cy={36.5 + pupilOffsetY} r="1.2" fill="#FFFFFF" />

        {/* Monocle Lens Frame & Cord */}
        <circle cx="49" cy="38" r="7.5" fill="none" stroke={goldAccents} strokeWidth="1.2" opacity="0.9" />
        <path d="M 56.5 38 Q 60 46 58 54" fill="none" stroke={goldAccents} strokeWidth="0.8" strokeDasharray="1.5,1.5" />
      </g>
    );
  };

  return (
    <div 
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={onClick}
    >
      {/* ── SPEECH BUBBLE ────────────────────────────────────── */}
      {bubbleText && (
        <div 
          className={`absolute z-20 px-3 py-1.5 rounded bg-paper-50 border border-moss-300 shadow-elevated text-xs font-serif text-ink-950 leading-tight whitespace-nowrap animate-fadeUp ${
            bubblePosition === 'top' ? '-top-10 left-1/2 -translate-x-1/2' :
            bubblePosition === 'bottom' ? '-bottom-10 left-1/2 -translate-x-1/2' :
            bubblePosition === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
            'left-full top-1/2 -translate-y-1/2 ml-2'
          }`}
        >
          <span>{bubbleText}</span>
          {/* Arrow Pointer */}
          <div 
            className={`absolute w-2 h-2 bg-paper-50 border-r border-b border-moss-300 rotate-45 ${
              bubblePosition === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-r-0 border-t' :
              bubblePosition === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              bubblePosition === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0' :
              'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0'
            }`}
          />
        </div>
      )}

      {/* ── VECTOR MASCOT SVG ────────────────────────────────── */}
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 82 82"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-200 ${
          interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : ''
        } ${state === 'idle' ? 'anim-pulse-soft' : ''}`}
        aria-label={`Paham Mascot (${state})`}
      >
        {/* Ambient Glow Aura */}
        <ellipse 
          cx="41" 
          cy="44" 
          rx="32" 
          ry="30" 
          fill={isAlert ? '#FDF0EB' : isHappy ? '#E5F3EB' : '#F7F4EC'} 
          opacity="0.6" 
        />

        {/* Floating "zZ" for sleeping state */}
        {isSleeping && (
          <g fill={secondaryInk} opacity="0.7" className="animate-fadeUp">
            <text x="56" y="22" fontSize="9" fontFamily="monospace" fontWeight="bold">z</text>
            <text x="64" y="15" fontSize="12" fontFamily="monospace" fontWeight="bold">Z</text>
          </g>
        )}

        {/* Sparkles for Celebrating / Success */}
        {isHappy && (
          <g fill={goldAccents} opacity="0.9" className="animate-scaleUp">
            <polygon points="18,20 20,15 22,20 27,22 22,24 20,29 18,24 13,22" transform="scale(0.6) translate(10,5)" />
            <polygon points="68,18 70,13 72,18 77,20 72,22 70,27 68,22 63,20" transform="scale(0.5) translate(60,10)" />
          </g>
        )}

        {/* Calligraphic Feather Ears / Laurels (Left & Right) */}
        {/* Left Ear Nib */}
        <path
          d="M 28 32 C 22 18, 16 22, 22 34 Z"
          fill={secondaryInk}
          stroke={primaryInk}
          strokeWidth="1.2"
        />
        {/* Right Ear Nib */}
        <path
          d="M 54 32 C 60 18, 66 22, 60 34 Z"
          fill={secondaryInk}
          stroke={primaryInk}
          strokeWidth="1.2"
        />

        {/* Main Body (Scholarly Owl Silhouette) */}
        <ellipse
          cx="41"
          cy="48"
          rx="22"
          ry="25"
          fill={primaryInk}
          stroke={primaryInk}
          strokeWidth="1.5"
        />

        {/* Head Contour */}
        <circle
          cx="41"
          cy="38"
          r="19"
          fill={primaryInk}
        />

        {/* Face Mask (Lighter academic plumage) */}
        <path
          d="M 27 34 Q 33 28 41 33 Q 49 28 55 34 Q 56 46 41 47 Q 26 46 27 34 Z"
          fill={chestParchment}
        />

        {/* Parchment Chest Heart / Lantern Core */}
        <path
          d="M 33 50 C 33 46, 49 46, 49 50 C 49 63, 33 63, 33 50 Z"
          fill={chestParchment}
          stroke={isThinking ? highlightMoss : '#E5E2D9'}
          strokeWidth="1.2"
        />

        {/* Chest Feather Quill Lines */}
        <line x1="41" y1="50" x2="41" y2="60" stroke={goldAccents} strokeWidth="1" opacity="0.6" />
        <line x1="38" y1="54" x2="41" y2="52" stroke={goldAccents} strokeWidth="0.8" opacity="0.5" />
        <line x1="44" y1="54" x2="41" y2="52" stroke={goldAccents} strokeWidth="0.8" opacity="0.5" />

        {/* Eyes & Scholar's Monocle */}
        {renderEyes()}

        {/* Academic Beak (Golden Nib Shape) */}
        <polygon
          points="39,42 43,42 41,47"
          fill={amberGaze}
          stroke={primaryInk}
          strokeWidth="0.8"
        />

        {/* Left Wing */}
        <path
          d="M 20 44 Q 14 54 22 64 Q 24 54 26 48 Z"
          fill={secondaryInk}
          stroke={primaryInk}
          strokeWidth="1"
        />

        {/* Right Wing (Points or raises when celebrating/recommending) */}
        <path
          d={
            isHappy ? "M 62 44 Q 72 32 68 24 Q 60 36 56 46 Z" :
            isRecommending ? "M 62 46 Q 74 44 70 38 Q 62 44 56 48 Z" :
            "M 62 44 Q 68 54 60 64 Q 58 54 56 48 Z"
          }
          fill={secondaryInk}
          stroke={primaryInk}
          strokeWidth="1"
        />

        {/* Little Perch Feet */}
        <ellipse cx="36" cy="73" rx="3" ry="1.8" fill={amberGaze} />
        <ellipse cx="46" cy="73" rx="3" ry="1.8" fill={amberGaze} />
      </svg>
    </div>
  );
};
