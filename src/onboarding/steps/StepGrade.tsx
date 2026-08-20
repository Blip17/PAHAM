// Step 5 — Grade / Year Level
// Labels adapt to education system. Pill selectors, not dropdowns.

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { GradeLevel, Semester, EducationSystem } from '../../core/types';

interface StepGradeProps {
  educationSystem: EducationSystem;
  value?: GradeLevel;
  semester?: Semester;
  onChange: (grade: GradeLevel, semester: Semester) => void;
  onNext: () => void;
}

interface GradeGroup {
  label: string;
  grades: { id: GradeLevel; short: string }[];
}

const INDONESIA_GROUPS: GradeGroup[] = [
  {
    label: 'SMP',
    grades: [
      { id: 'Kelas 7', short: '7' },
      { id: 'Kelas 8', short: '8' },
      { id: 'Kelas 9', short: '9' },
    ],
  },
  {
    label: 'SMA / SMK',
    grades: [
      { id: 'Kelas 10', short: '10' },
      { id: 'Kelas 11', short: '11' },
      { id: 'Kelas 12', short: '12' },
    ],
  },
];

const INTERNATIONAL_GROUPS: GradeGroup[] = [
  {
    label: 'Middle School (Grade 7–9)',
    grades: [
      { id: 'Kelas 7', short: '7' },
      { id: 'Kelas 8', short: '8' },
      { id: 'Kelas 9', short: '9' },
    ],
  },
  {
    label: 'High School (Grade 10–12)',
    grades: [
      { id: 'Kelas 10', short: '10' },
      { id: 'Kelas 11', short: '11' },
      { id: 'Kelas 12', short: '12' },
    ],
  },
];

export const StepGrade: React.FC<StepGradeProps> = ({
  educationSystem, value, semester = 'Semester 1', onChange, onNext,
}) => {
  const groups = educationSystem === 'indonesia' ? INDONESIA_GROUPS : INTERNATIONAL_GROUPS;
  const isIndonesia = educationSystem === 'indonesia';

  const handleGrade = (grade: GradeLevel) => {
    onChange(grade, semester);
  };

  const handleSemester = (s: Semester) => {
    onChange(value ?? 'Kelas 10', s);
  };

  return (
    <div className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 5 — {isIndonesia ? 'Kelas' : 'Year Level'}
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          {isIndonesia ? 'Kamu sekarang kelas berapa?' : 'Which year/grade are you in?'}
        </h2>
      </div>

      {/* Grade groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400 block">
              {group.label}
            </span>
            <div className="flex gap-2 flex-wrap">
              {group.grades.map((g) => {
                const isSelected = value === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGrade(g.id)}
                    aria-pressed={isSelected}
                    className={`
                      min-w-[3.5rem] py-3 px-4 rounded border text-sm font-mono font-medium
                      transition-all duration-150
                      ${isSelected
                        ? 'bg-ink-900 text-paper-50 border-ink-950'
                        : 'bg-paper-50 text-ink-700 border-paper-300 hover:border-paper-400 hover:bg-white'
                      }
                    `}
                  >
                    {isIndonesia ? g.short : `G${g.short}`}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Semester — Indonesia only */}
      {isIndonesia && (
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400 block">
            Semester
          </span>
          <div className="flex gap-2">
            {(['Semester 1', 'Semester 2'] as Semester[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSemester(s)}
                aria-pressed={semester === s}
                className={`
                  flex-1 py-3 px-4 rounded border text-sm font-sans font-medium
                  transition-all duration-150
                  ${semester === s
                    ? 'bg-ink-900 text-paper-50 border-ink-950'
                    : 'bg-paper-50 text-ink-700 border-paper-300 hover:border-paper-400 hover:bg-white'
                  }
                `}
              >
                {s === 'Semester 1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
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
