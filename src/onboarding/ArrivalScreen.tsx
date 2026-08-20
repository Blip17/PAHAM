// PAHAM Arrival Screen
// Personalized "landing" after the brand transition.
// Shown once (hasSeenArrival gate) before the main dashboard.

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { UserProfile } from '../core/types';

interface ArrivalScreenProps {
  profile: UserProfile;
  onEnter: () => void;
}

export const ArrivalScreen: React.FC<ArrivalScreenProps> = ({ profile, onEnter }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const displayName = profile.displayName || profile.name;
  const studyMins = profile.dailyTimeTargetMinutes ?? 25;

  // Simple study time description
  const studyTimeDesc =
    studyMins <= 15
      ? `${studyMins} menit yang paling berguna hari ini`
      : studyMins <= 30
      ? `${studyMins} menit yang efektif untuk dimulai`
      : `${studyMins} menit sesi belajar yang sudah siap`;

  return (
    <div
      className="
        min-h-screen bg-paper-100
        flex flex-col items-center justify-center
        px-8 sm:px-12
        selection:bg-moss-100 selection:text-moss-950
      "
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="max-w-md w-full space-y-10">

        {/* Wordmark */}
        <div
          className="arrival-line"
          style={{ animationDelay: '0.0s', animationFillMode: 'both' }}
        >
          <span
            className="font-serif font-bold text-ink-950"
            style={{ fontSize: '1.75rem', letterSpacing: '-0.03em' }}
          >
            Paham
          </span>
        </div>

        {/* Greeting */}
        <div className="space-y-4">
          <h1
            className="arrival-line font-serif text-4xl sm:text-5xl text-ink-950 font-normal leading-tight"
            style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
          >
            Selamat datang,
            <br />
            {displayName}.
          </h1>

          <p
            className="arrival-line font-sans text-sm text-ink-600 leading-relaxed"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            Ruang belajarmu sudah siap.
          </p>
        </div>

        {/* Context card — study time */}
        <div
          className="arrival-line"
          style={{ animationDelay: '0.45s', animationFillMode: 'both' }}
        >
          <div className="border-l-2 border-ink-200 pl-4 space-y-1">
            <span className="block text-[10px] font-mono uppercase tracking-widest text-ink-400">
              Hari ini
            </span>
            <p className="font-sans text-sm text-ink-800">
              Kamu sudah punya {studyTimeDesc}.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          className="arrival-line"
          style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
        >
          <button
            type="button"
            onClick={onEnter}
            className="
              group flex items-center gap-3
              font-sans text-sm font-medium text-ink-950
              hover:text-ink-700 transition-colors
            "
          >
            Mulai belajar
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Grade context */}
        <div
          className="arrival-line pt-4 border-t border-paper-300"
          style={{ animationDelay: '0.75s', animationFillMode: 'both' }}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-ink-400">
            {profile.grade && <span>{profile.grade}</span>}
            {profile.schoolName && <span>·</span>}
            {profile.schoolName && <span>{profile.schoolName}</span>}
            {profile.curriculum && <span>·</span>}
            {profile.curriculum && <span>{profile.curriculum}</span>}
          </div>
        </div>

      </div>
    </div>
  );
};
