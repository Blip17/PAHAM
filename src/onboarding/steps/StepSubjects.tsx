// Step 6 — Subjects
// Multi-select with recommendations based on education system + grade.
// Students can add custom subjects.

import React, { useState } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
import { DEFAULT_INDONESIAN_SUBJECTS } from '../../core/db';
import { EducationSystem, GradeLevel } from '../../core/types';

interface StepSubjectsProps {
  educationSystem: EducationSystem;
  grade: GradeLevel;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onNext: () => void;
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

// International subjects (basic set — student can add more)
const INTERNATIONAL_SUBJECTS: SubjectOption[] = [
  { id: 'int-math', code: 'MTH', name: 'Mathematics' },
  { id: 'int-english', code: 'ENG', name: 'English Language' },
  { id: 'int-science', code: 'SCI', name: 'Science' },
  { id: 'int-bio', code: 'BIO', name: 'Biology' },
  { id: 'int-chem', code: 'CHM', name: 'Chemistry' },
  { id: 'int-phy', code: 'PHY', name: 'Physics' },
  { id: 'int-hist', code: 'HIS', name: 'History' },
  { id: 'int-geo', code: 'GEO', name: 'Geography' },
  { id: 'int-cs', code: 'CS', name: 'Computer Science' },
  { id: 'int-econ', code: 'ECN', name: 'Economics' },
];

export const StepSubjects: React.FC<StepSubjectsProps> = ({
  educationSystem, grade, selectedIds, onChange, onNext,
}) => {
  const baseOptions: SubjectOption[] =
    educationSystem === 'indonesia'
      ? DEFAULT_INDONESIAN_SUBJECTS.map(s => ({ id: s.id, code: s.code, name: s.name }))
      : INTERNATIONAL_SUBJECTS;

  const [customSubjects, setCustomSubjects] = useState<SubjectOption[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allOptions = [...baseOptions, ...customSubjects];
  const selectedSet = new Set(selectedIds);

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const selectAll = () => onChange(allOptions.map(o => o.id));
  const deselectAll = () => onChange(allOptions.length > 0 ? [allOptions[0].id] : []);

  const addCustom = () => {
    const name = customInput.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    const code = name.slice(0, 3).toUpperCase();
    const newSub: SubjectOption = { id, code, name };
    setCustomSubjects(prev => [...prev, newSub]);
    onChange([...selectedIds, id]);
    setCustomInput('');
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 6 — Mata Pelajaran
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          {educationSystem === 'indonesia'
            ? 'Pelajaran apa yang sedang kamu pelajari?'
            : 'Which subjects are you studying?'}
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          {educationSystem === 'indonesia'
            ? `Rekomendasi untuk ${grade} · Indonesia`
            : `Recommendations for ${grade}`}
          {' · '}
          {selectedSet.size} dipilih
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between text-xs border-b border-paper-200 pb-2">
        <span className="text-ink-400 font-mono text-[11px]">{allOptions.length} pelajaran</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-moss-700 hover:text-moss-900 font-medium font-sans transition-colors"
          >
            Pilih semua
          </button>
          <span className="text-ink-300">·</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-ink-500 hover:text-ink-800 font-sans transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {allOptions.map((sub) => {
          const isSelected = selectedSet.has(sub.id);
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => toggle(sub.id)}
              aria-pressed={isSelected}
              className={`
                p-3 rounded border text-left text-xs
                flex items-center justify-between gap-2
                transition-all duration-100
                ${isSelected
                  ? 'bg-paper-50 border-ink-700 text-ink-950'
                  : 'bg-paper-50 border-paper-200 text-ink-400 hover:border-paper-400 hover:text-ink-600'
                }
              `}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`
                  text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0
                  ${isSelected ? 'bg-ink-100 text-ink-800' : 'bg-paper-200 text-ink-500'}
                `}>
                  {sub.code}
                </span>
                <span className="truncate font-sans">{sub.name}</span>
              </div>
              {isSelected && (
                <span className="text-moss-700 shrink-0 text-[10px]">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add custom */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus
            placeholder="Nama mata pelajaran…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            className="
              flex-1 bg-paper-50 border border-paper-300 rounded
              px-4 py-2.5 text-sm text-ink-950
              placeholder:text-ink-300
              focus:outline-none focus:border-ink-700
              font-sans
            "
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="btn-secondary text-xs py-2.5 px-4 disabled:opacity-40"
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(false)}
            className="p-2.5 text-ink-400 hover:text-ink-700 transition-colors"
            aria-label="Tutup input"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 text-xs text-ink-500 hover:text-ink-800 font-sans transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah mata pelajaran lain
        </button>
      )}

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedSet.size === 0}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-40"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
