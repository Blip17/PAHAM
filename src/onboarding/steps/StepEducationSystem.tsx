// Step 3 — Education System
// "Indonesia or International?"
// Editorial row selection — not card UI.

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EducationSystem } from '../../core/types';

interface StepEducationSystemProps {
  value?: EducationSystem;
  onChange: (v: EducationSystem) => void;
  onNext: () => void;
}

interface SystemOption {
  id: EducationSystem;
  label: string;
  sublabel: string;
  details: string;
}

const OPTIONS: SystemOption[] = [
  {
    id: 'indonesia',
    label: 'Indonesia',
    sublabel: 'Kurikulum nasional',
    details: 'Bahasa Indonesia · Materi sekolah negeri & swasta Indonesia',
  },
  {
    id: 'international',
    label: 'Internasional',
    sublabel: 'International curriculum',
    details: 'English-first or mixed · IB, Cambridge, American, dan lainnya',
  },
];

export const StepEducationSystem: React.FC<StepEducationSystemProps> = ({
  value, onChange, onNext,
}) => {
  const handleSelect = (id: EducationSystem) => {
    onChange(id);
  };

  const handleNext = () => {
    if (value) onNext();
  };

  return (
    <div className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 3 — Sistem Pendidikan
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          Kamu mengikuti sistem pendidikan yang mana?
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          Ini menentukan kurikulum, mata pelajaran, dan bahasa yang akan Paham gunakan.
        </p>
      </div>

      {/* Options — editorial rows, not generic cards */}
      <div className="space-y-2" role="radiogroup" aria-label="Sistem pendidikan">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id)}
              className={`
                w-full text-left p-5 rounded border
                transition-all duration-150
                flex items-start justify-between gap-4
                ${isSelected
                  ? 'bg-paper-50 border-ink-800 shadow-subtle'
                  : 'bg-paper-50 border-paper-300 hover:border-paper-400 hover:bg-white'
                }
              `}
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {/* Selection indicator */}
                  <div
                    className={`
                      w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5
                      transition-all duration-150
                      ${isSelected
                        ? 'border-ink-900 bg-ink-900'
                        : 'border-ink-300 bg-transparent'
                      }
                    `}
                  />
                  <span className="font-sans font-semibold text-base text-ink-950">
                    {opt.label}
                  </span>
                </div>
                <div className="pl-[26px] space-y-0.5">
                  <p className="text-xs font-mono text-ink-500">{opt.sublabel}</p>
                  <p className="text-xs text-ink-500 font-sans">{opt.details}</p>
                </div>
              </div>
              {isSelected && (
                <span className="text-ink-400 font-mono text-xs shrink-0 mt-1">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!value}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-40"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
