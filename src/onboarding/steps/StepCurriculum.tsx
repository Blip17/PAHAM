// Step 4 — Curriculum
// Adapts options to Indonesia vs. International selection.

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { EducationSystem } from '../../core/types';

interface StepCurriculumProps {
  educationSystem: EducationSystem;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const INDONESIA_OPTIONS = [
  { id: 'Kurikulum Merdeka', label: 'Kurikulum Merdeka', desc: 'Kurikulum terbaru dari Kemdikbud (2022–sekarang)' },
  { id: 'Kurikulum 2013', label: 'Kurikulum 2013 (K13)', desc: 'Kurikulum berbasis kompetensi sebelumnya' },
  { id: 'Lainnya', label: 'Kurikulum lainnya', desc: 'Pesantren, sekolah khusus, atau kurikulum campuran' },
  { id: 'Belum tahu', label: 'Belum tahu', desc: 'Paham akan menyesuaikan berdasarkan materimu nanti' },
];

const INTERNATIONAL_OPTIONS = [
  { id: 'IB', label: 'IB (International Baccalaureate)', desc: 'MYP, DP, atau PYP' },
  { id: 'Cambridge', label: 'Cambridge (IGCSE / A-Level)', desc: 'IGCSE, O-Level, A-Level' },
  { id: 'American', label: 'Kurikulum Amerika', desc: 'Common Core atau kurikulum negara bagian' },
  { id: 'Australian', label: 'Kurikulum Australia', desc: 'Australian Curriculum' },
  { id: 'Lainnya', label: 'Kurikulum lain / Tidak tercantum', desc: '' },
];

export const StepCurriculum: React.FC<StepCurriculumProps> = ({
  educationSystem, value, onChange, onNext,
}) => {
  const [customValue, setCustomValue] = useState('');
  const options = educationSystem === 'indonesia' ? INDONESIA_OPTIONS : INTERNATIONAL_OPTIONS;
  const showCustom = value === 'Lainnya';

  const handleNext = () => {
    if (!value) return;
    if (value === 'Lainnya' && customValue.trim()) {
      onChange(customValue.trim());
    }
    onNext();
  };

  const canContinue = value !== '' && (value !== 'Lainnya' || customValue.trim() !== '');

  return (
    <div className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 4 — Kurikulum
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          {educationSystem === 'indonesia'
            ? 'Kamu mengikuti kurikulum mana?'
            : 'Which curriculum do you follow?'}
        </h2>
        {educationSystem === 'indonesia' && (
          <p className="text-sm text-ink-500 font-sans">
            Ini menentukan cara Paham menyusun materi dan soal latihanmu.
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2" role="radiogroup">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.id)}
              className={`
                w-full text-left px-5 py-4 rounded border
                transition-all duration-150
                flex items-center gap-4
                ${isSelected
                  ? 'bg-paper-50 border-ink-800 shadow-subtle'
                  : 'bg-paper-50 border-paper-300 hover:border-paper-400 hover:bg-white'
                }
              `}
            >
              <div
                className={`
                  w-3.5 h-3.5 rounded-full border-2 shrink-0
                  transition-all duration-150
                  ${isSelected ? 'border-ink-900 bg-ink-900' : 'border-ink-300'}
                `}
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink-950 font-sans">{opt.label}</span>
                {opt.desc && (
                  <span className="block text-xs text-ink-500 font-sans mt-0.5">{opt.desc}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom input for "Lainnya" */}
      {showCustom && (
        <div className="space-y-1.5">
          <label
            htmlFor="curriculum-custom"
            className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
          >
            Nama kurikulum
          </label>
          <input
            id="curriculum-custom"
            type="text"
            placeholder="Tulis nama kurikulummu…"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="
              w-full bg-paper-50 border border-paper-300 rounded
              px-4 py-3 text-sm text-ink-950
              placeholder:text-ink-300
              focus:outline-none focus:border-ink-700 focus:bg-white
              transition-colors duration-150 font-sans
            "
            autoFocus
          />
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-40"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
