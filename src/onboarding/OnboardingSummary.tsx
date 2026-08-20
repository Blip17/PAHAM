// PAHAM Onboarding Summary
// Calm review screen showing the student's full profile before completion.
// Allows editing any step.

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { OnboardingDraft } from './OnboardingShell';
import { DEFAULT_INDONESIAN_SUBJECTS } from '../core/db';

interface OnboardingSummaryProps {
  draft: OnboardingDraft;
  onFinish: () => Promise<void>;
  onEditStep: (step: number) => void;
}

const SummaryRow: React.FC<{
  label: string;
  value: string;
  onEdit?: () => void;
}> = ({ label, value, onEdit }) => (
  <div className="flex items-start justify-between py-3.5 border-b border-paper-200 last:border-0 gap-4">
    <div className="flex-1 min-w-0">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-0.5">
        {label}
      </span>
      <span className="block text-sm font-sans text-ink-950 font-medium leading-snug">
        {value}
      </span>
    </div>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="text-[10px] font-mono text-ink-400 hover:text-ink-700 uppercase tracking-wider shrink-0 mt-3 transition-colors"
        aria-label={`Edit ${label}`}
      >
        Ubah
      </button>
    )}
  </div>
);

const STUDY_TIME_LABELS: Record<string, string> = {
  '10-15': '10–15 menit / hari',
  '20-30': '20–30 menit / hari',
  '30-60': '30–60 menit / hari',
  '60+': '1 jam lebih / hari',
  'tidak_tentu': 'Tidak tentu',
};

const METHOD_LABELS: Record<string, string> = {
  latihan_soal: 'Latihan soal',
  simulasi_ujian: 'Simulasi ujian',
  penjelasan_singkat: 'Penjelasan singkat',
  langkah_demi_langkah: 'Langkah demi langkah',
  flashcard: 'Flashcard',
  campuran: 'Campuran',
};

export const OnboardingSummary: React.FC<OnboardingSummaryProps> = ({
  draft, onFinish, onEditStep,
}) => {
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    await onFinish();
  };

  // Resolve subject names from IDs
  const allSubjects = DEFAULT_INDONESIAN_SUBJECTS;
  const selectedSubjects = (draft.selectedSubjectIds ?? [])
    .map(id => allSubjects.find(s => s.id === id)?.name)
    .filter(Boolean) as string[];

  const name = draft.displayName || '—';
  const school = [draft.schoolName, draft.schoolCity, draft.schoolProvince]
    .filter(Boolean)
    .join(', ') || 'Belum diisi';

  const system = draft.educationSystem === 'indonesia'
    ? `Indonesia · ${draft.curriculum || 'Kurikulum Merdeka'}`
    : `Internasional · ${draft.curriculum || ''}`;

  const gradeStr = draft.grade ?? '—';
  const semesterStr = draft.educationSystem === 'indonesia'
    ? ` · ${draft.semester ?? 'Semester 1'}`
    : '';

  const studyTimeStr = STUDY_TIME_LABELS[draft.availableStudyTime ?? '20-30'] ?? '—';
  const methodsStr = (draft.preferredLearningMethods ?? [])
    .map(m => METHOD_LABELS[m])
    .filter(Boolean)
    .join(', ') || '—';

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Ringkasan
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          Paham sudah siap
          {name !== '—' ? ` untuk ${name}` : ''}.
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          Periksa sebentar. Semua ini bisa kamu ubah kapan saja di Pengaturan.
        </p>
      </div>

      {/* Summary card */}
      <div className="paper-sheet rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-paper-200 bg-paper-100/50">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink-500">
            Profil Belajarmu
          </span>
        </div>
        <div className="px-5">
          <SummaryRow
            label="Nama panggilan"
            value={name}
            onEdit={() => onEditStep(1)}
          />
          <SummaryRow
            label="Sekolah"
            value={school}
            onEdit={() => onEditStep(2)}
          />
          <SummaryRow
            label="Sistem Pendidikan"
            value={system}
            onEdit={() => onEditStep(3)}
          />
          <SummaryRow
            label="Kelas"
            value={`${gradeStr}${semesterStr}`}
            onEdit={() => onEditStep(5)}
          />
          <SummaryRow
            label="Mata pelajaran"
            value={
              selectedSubjects.length > 0
                ? selectedSubjects.slice(0, 6).join(', ') +
                  (selectedSubjects.length > 6 ? ` +${selectedSubjects.length - 6} lainnya` : '')
                : 'Belum dipilih'
            }
            onEdit={() => onEditStep(6)}
          />
          <SummaryRow
            label="Cara belajar"
            value={methodsStr}
            onEdit={() => onEditStep(7)}
          />
          <SummaryRow
            label="Waktu belajar harian"
            value={studyTimeStr}
            onEdit={() => onEditStep(7)}
          />
        </div>
      </div>

      {/* Finish */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="
            w-full py-4 px-6
            bg-ink-900 text-paper-50
            font-sans font-medium text-sm
            rounded border border-ink-950
            transition-all duration-150
            hover:bg-ink-800
            active:bg-ink-950
            disabled:opacity-50
            flex items-center justify-between
          "
        >
          <span>{isFinishing ? 'Menyiapkan ruang belajarmu…' : 'Masuk ke Paham'}</span>
          {!isFinishing && <ArrowRight className="w-4 h-4 text-paper-300" />}
        </button>
        <p className="text-xs text-ink-400 font-sans text-center">
          Semua data disimpan di perangkat ini.
        </p>
      </div>

    </div>
  );
};
