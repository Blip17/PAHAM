// PAHAM Entry View — Brand Introduction + Auth Entry
// Premium split layout: editorial brand identity left, auth panel right.
// Mobile: stacked — brand above, auth below.

import React, { useEffect, useState } from 'react';

interface EntryViewProps {
  onStartAuth: (mode: 'login' | 'register') => void;
}

// Thin editorial lines that suggest organised information
const EditorialComposition: React.FC = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const lines = [
    { width: '72%', delay: '0.1s' },
    { width: '55%', delay: '0.25s' },
    { width: '80%', delay: '0.4s' },
    { width: '45%', delay: '0.55s' },
    { width: '66%', delay: '0.7s' },
    { width: '38%', delay: '0.85s' },
  ];

  return (
    <div
      className="space-y-2.5 mt-8"
      aria-hidden="true"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="editorial-line"
          style={
            {
              '--line-width': line.width,
              animationDelay: visible ? line.delay : '99s',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export const EntryView: React.FC<EntryViewProps> = ({ onStartAuth }) => {
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    // Stagger the content entrance so it feels settled, not instant
    const t = setTimeout(() => setContentVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col lg:flex-row selection:bg-moss-100 selection:text-moss-950">

      {/* ── LEFT — Brand identity ─────────────────────────── */}
      <div
        className="
          lg:w-[52%] lg:min-h-screen
          flex flex-col justify-center
          px-8 sm:px-12 lg:px-16 xl:px-24
          pt-16 pb-10 lg:py-0
          border-b lg:border-b-0 lg:border-r border-paper-300
        "
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Wordmark */}
        <div className="mb-8">
          <span
            className="block font-serif text-5xl sm:text-6xl font-bold tracking-tight text-ink-950 leading-none"
            style={{ letterSpacing: '-0.035em' }}
          >
            Paham
          </span>
        </div>

        {/* Primary statement */}
        <div className="space-y-3 max-w-sm">
          <p className="font-serif text-xl sm:text-2xl text-ink-800 font-normal leading-snug">
            Bukan cuma belajar.
            <br />
            Beneran paham.
          </p>
          <p className="font-sans text-sm text-ink-500 leading-relaxed">
            Tempat semua materi sekolahmu, latihanmu,
            dan progres belajarmu bertemu — dalam satu
            sistem yang mengenalmu.
          </p>
        </div>

        {/* Editorial composition — thin lines suggesting ordered information */}
        <EditorialComposition />

        {/* Bottom label */}
        <div className="mt-auto pt-10 lg:pt-16">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
            Untuk pelajar Indonesia
          </span>
        </div>
      </div>

      {/* ── RIGHT — Auth entry panel ──────────────────────── */}
      <div
        className="
          lg:w-[48%] lg:min-h-screen
          flex flex-col justify-center
          px-8 sm:px-12 lg:px-16 xl:px-20
          py-12 lg:py-0
        "
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.55s ease 0.1s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        }}
      >
        <div className="max-w-sm w-full mx-auto lg:mx-0">

          {/* Section label */}
          <span className="block text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-8">
            Masuk ke Paham
          </span>

          {/* Primary action */}
          <div className="space-y-3">
            <button
              onClick={() => onStartAuth('register')}
              className="
                w-full py-3.5 px-5
                bg-ink-900 text-paper-50
                font-sans font-medium text-sm
                rounded border border-ink-950
                transition-all duration-150
                hover:bg-ink-800
                active:bg-ink-950
                flex items-center justify-between
              "
            >
              <span>Buat akun baru</span>
              <span className="text-ink-400 font-mono text-xs">→</span>
            </button>

            <button
              onClick={() => onStartAuth('login')}
              className="
                w-full py-3.5 px-5
                bg-paper-50 text-ink-800
                font-sans font-medium text-sm
                rounded border border-paper-300
                transition-all duration-150
                hover:bg-paper-100 hover:border-paper-400
                active:bg-paper-200
                flex items-center justify-between
              "
            >
              <span>Masuk dengan akun yang ada</span>
              <span className="text-ink-400 font-mono text-xs">→</span>
            </button>
          </div>

          {/* Divider + context */}
          <div className="mt-10 pt-8 border-t border-paper-300">
            <p className="text-xs text-ink-500 font-sans leading-relaxed">
              Akun dan progres belajarmu tersinkronisasi aman dan tetap dapat diakses secara luring.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
