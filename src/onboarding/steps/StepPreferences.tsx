// Step 7 — Learning Preferences + Study Time
// "Cara belajarmu?" + "Berapa lama?"

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LearningMethod, StudyTimeSlot } from '../../core/types';

interface StepPreferencesProps {
  learningMethods: LearningMethod[];
  studyTime: StudyTimeSlot;
  dailyMinutes: number;
  onChange: (methods: LearningMethod[], time: StudyTimeSlot, mins: number) => void;
  onNext: () => void;
}

interface MethodOption {
  id: LearningMethod;
  label: string;
  desc: string;
}

interface TimeOption {
  id: StudyTimeSlot;
  label: string;
  minutes: number;
}

const METHOD_OPTIONS: MethodOption[] = [
  { id: 'latihan_soal', label: 'Latihan soal', desc: 'Quiz dan soal pilihan ganda' },
  { id: 'simulasi_ujian', label: 'Simulasi ujian', desc: 'Ujian timed dengan skor dan diagnostik' },
  { id: 'penjelasan_singkat', label: 'Penjelasan singkat', desc: 'Rangkuman konsep yang cepat dibaca' },
  { id: 'langkah_demi_langkah', label: 'Langkah demi langkah', desc: 'Panduan yang mendetail dan terstruktur' },
  { id: 'flashcard', label: 'Flashcard', desc: 'Kartu kilat untuk menghafal konsep kunci' },
  { id: 'campuran', label: 'Campuran semua', desc: 'Biarkan Paham yang memilihkan untukmu' },
];

const TIME_OPTIONS: TimeOption[] = [
  { id: '10-15', label: '10–15 menit', minutes: 12 },
  { id: '20-30', label: '20–30 menit', minutes: 25 },
  { id: '30-60', label: '30–60 menit', minutes: 45 },
  { id: '60+', label: '1 jam lebih', minutes: 70 },
  { id: 'tidak_tentu', label: 'Tidak tentu', minutes: 25 },
];

export const StepPreferences: React.FC<StepPreferencesProps> = ({
  learningMethods, studyTime, dailyMinutes, onChange, onNext,
}) => {
  const methodSet = new Set(learningMethods);

  const toggleMethod = (id: LearningMethod) => {
    const next = new Set(methodSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      // "Campuran" is exclusive with others
      if (id === 'campuran') {
        next.clear();
      } else {
        next.delete('campuran');
      }
      next.add(id);
    }
    const timeOpt = TIME_OPTIONS.find(t => t.id === studyTime);
    onChange(Array.from(next) as LearningMethod[], studyTime, timeOpt?.minutes ?? dailyMinutes);
  };

  const handleTime = (timeId: StudyTimeSlot) => {
    const timeOpt = TIME_OPTIONS.find(t => t.id === timeId)!;
    onChange(learningMethods, timeId, timeOpt.minutes);
  };

  const canContinue = methodSet.size > 0 && studyTime !== undefined;

  return (
    <div className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 7 — Preferensi
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          Cara belajarmu?
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          Pilih semua yang cocok untukmu. Ini preferensi awal — Paham akan menyesuaikan
          berdasarkan performamu nanti.
        </p>
      </div>

      {/* Learning methods — checkbox rows */}
      <div className="space-y-2" role="group" aria-label="Metode belajar">
        {METHOD_OPTIONS.map((opt) => {
          const isSelected = methodSet.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleMethod(opt.id)}
              aria-pressed={isSelected}
              className={`
                w-full text-left px-4 py-3.5 rounded border
                flex items-center gap-4
                transition-all duration-100
                ${isSelected
                  ? 'bg-paper-50 border-ink-700'
                  : 'bg-paper-50 border-paper-200 hover:border-paper-400'
                }
              `}
            >
              {/* Checkbox indicator */}
              <div
                className={`
                  w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center
                  transition-all duration-100
                  ${isSelected ? 'border-ink-900 bg-ink-900' : 'border-ink-300'}
                `}
              >
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-paper-50" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink-950 font-sans">{opt.label}</span>
                <span className="block text-xs text-ink-500 font-sans mt-0.5">{opt.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-paper-200" />

      {/* Study time */}
      <div className="space-y-4">
        <div>
          <h3 className="font-sans text-sm font-semibold text-ink-900 mb-0.5">
            Biasanya punya waktu belajar berapa lama?
          </h3>
          <p className="text-xs text-ink-500 font-sans">
            Ini untuk merencanakan sesi harian yang realistis.
          </p>
        </div>

        <div className="space-y-2" role="radiogroup" aria-label="Waktu belajar">
          {TIME_OPTIONS.map((opt) => {
            const isSelected = studyTime === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleTime(opt.id)}
                className={`
                  w-full text-left px-4 py-3 rounded border
                  flex items-center gap-4 text-sm
                  transition-all duration-100
                  ${isSelected
                    ? 'bg-paper-50 border-ink-700'
                    : 'bg-paper-50 border-paper-200 hover:border-paper-400'
                  }
                `}
              >
                <div
                  className={`
                    w-3.5 h-3.5 rounded-full border-2 shrink-0
                    transition-all duration-100
                    ${isSelected ? 'border-ink-900 bg-ink-900' : 'border-ink-300'}
                  `}
                />
                <span className={`font-sans ${isSelected ? 'text-ink-950 font-medium' : 'text-ink-700'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-40"
        >
          Lihat ringkasan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
