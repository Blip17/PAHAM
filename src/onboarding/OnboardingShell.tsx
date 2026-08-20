// PAHAM Onboarding Shell
// Stable outer container for all 7 onboarding steps.
// Manages: step state, progress persistence, back/forward navigation,
// step exit/enter transitions, and profile accumulation.

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { db } from '../core/db';
import { UserProfile, GradeLevel, Semester, EducationSystem, LearningMethod, StudyTimeSlot } from '../core/types';
import { DEFAULT_INDONESIAN_SUBJECTS } from '../core/db';
import { StepName } from './steps/StepName';
import { StepSchool } from './steps/StepSchool';
import { StepEducationSystem } from './steps/StepEducationSystem';
import { StepCurriculum } from './steps/StepCurriculum';
import { StepGrade } from './steps/StepGrade';
import { StepSubjects } from './steps/StepSubjects';
import { StepPreferences } from './steps/StepPreferences';
import { OnboardingSummary } from './OnboardingSummary';

const TOTAL_STEPS = 7;
const STORAGE_KEY = 'paham_onboarding_draft';

// Accumulated data across all steps
export interface OnboardingDraft {
  displayName?: string;
  schoolName?: string;
  schoolCity?: string;
  schoolProvince?: string;
  educationSystem?: EducationSystem;
  curriculum?: string;
  grade?: GradeLevel;
  semester?: Semester;
  selectedSubjectIds?: string[];
  preferredLearningMethods?: LearningMethod[];
  availableStudyTime?: StudyTimeSlot;
  studyDays?: string[];
  dailyTimeTargetMinutes?: number;
}

interface OnboardingShellProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 8 = summary

export const OnboardingShell: React.FC<OnboardingShellProps> = ({
  initialProfile,
  onComplete,
}) => {
  // Restore draft from localStorage if resuming
  const savedDraftRaw = localStorage.getItem(STORAGE_KEY);
  const savedDraft: OnboardingDraft = savedDraftRaw ? JSON.parse(savedDraftRaw) : {};
  const savedStep = parseInt(localStorage.getItem('paham_onboarding_step') || '1', 10) as StepId;

  const [step, setStep] = useState<StepId>(savedStep <= TOTAL_STEPS ? savedStep : 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDir, setTransitionDir] = useState<'forward' | 'back'>('forward');

  const [draft, setDraft] = useState<OnboardingDraft>({
    displayName: initialProfile.displayName || initialProfile.name,
    ...savedDraft,
  });

  // Persist draft and step on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem('paham_onboarding_step', String(step));
  }, [step]);

  const updateDraft = useCallback((updates: Partial<OnboardingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const goForward = useCallback(() => {
    if (isTransitioning) return;
    setTransitionDir('forward');
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(prev => (prev < TOTAL_STEPS + 1 ? (prev + 1) as StepId : prev));
      setIsTransitioning(false);
    }, 220);
  }, [isTransitioning]);

  const goBack = useCallback(() => {
    if (isTransitioning || step === 1) return;
    setTransitionDir('back');
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(prev => (prev > 1 ? (prev - 1) as StepId : prev));
      setIsTransitioning(false);
    }, 220);
  }, [isTransitioning, step]);

  const handleFinish = async () => {
    // Merge accumulated draft into profile and save
    const now = new Date().toISOString();
    const finalGrade = draft.grade ?? initialProfile.grade;
    const finalSemester = draft.semester ?? initialProfile.semester;

    const updatedProfile: UserProfile = {
      ...initialProfile,
      name: draft.displayName ?? initialProfile.name,
      displayName: draft.displayName ?? initialProfile.name,
      schoolName: draft.schoolName || '',
      schoolCity: draft.schoolCity,
      schoolProvince: draft.schoolProvince,
      grade: finalGrade,
      semester: finalSemester,
      educationSystem: draft.educationSystem ?? 'indonesia',
      curriculum: draft.curriculum ?? 'Kurikulum Merdeka',
      preferredLearningMethods: draft.preferredLearningMethods ?? [],
      availableStudyTime: draft.availableStudyTime ?? '20-30',
      studyDays: draft.studyDays ?? [],
      dailyTimeTargetMinutes: draft.dailyTimeTargetMinutes ?? 25,
      onboardingCompleted: true,
      onboardingVersion: 1,
      hasSeenArrival: false,
      updatedAt: now,
    };

    await db.profiles.put(updatedProfile);

    // Handle subject selection — remove unselected from DB
    if (draft.selectedSubjectIds && draft.selectedSubjectIds.length > 0) {
      const allSubs = await db.subjects.toArray();
      if (allSubs.length === 0) {
        // Seed subjects first
        const subjectsToAdd = DEFAULT_INDONESIAN_SUBJECTS.filter(s =>
          draft.selectedSubjectIds!.includes(s.id)
        );
        await db.subjects.bulkAdd(subjectsToAdd);
      } else {
        // Remove unselected
        const selected = new Set(draft.selectedSubjectIds);
        for (const sub of allSubs) {
          if (!selected.has(sub.id)) {
            await db.subjects.delete(sub.id);
          }
        }
      }
    } else {
      // Default: seed all Indonesian subjects
      const existing = await db.subjects.count();
      if (existing === 0) {
        await db.subjects.bulkAdd(DEFAULT_INDONESIAN_SUBJECTS);
      }
    }

    // Update session
    localStorage.setItem('paham_session', JSON.stringify({
      profileId: updatedProfile.id,
      onboardingCompleted: true,
    }));

    // Clean up draft
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('paham_onboarding_step');

    onComplete(updatedProfile);
  };

  // Compute progress (step 8 = summary, counts as 100%)
  const progressPct = step >= TOTAL_STEPS + 1 ? 100 : Math.round(((step - 1) / TOTAL_STEPS) * 100);
  const isSummary = step === TOTAL_STEPS + 1;

  // Transition class for step content
  const contentClass = isTransitioning
    ? transitionDir === 'forward'
      ? 'anim-step-exit'
      : 'anim-step-exit'
    : 'anim-step-enter';

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col selection:bg-moss-100 selection:text-moss-950">

      {/* ── Top navigation bar ─────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-paper-300 bg-paper-50">
        <button
          onClick={goBack}
          disabled={step === 1 || isTransitioning}
          className="
            flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800
            font-sans transition-colors group
            disabled:opacity-0 disabled:pointer-events-none
          "
          aria-label="Kembali ke langkah sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Kembali
        </button>

        {/* Wordmark center */}
        <span
          className="font-serif text-lg font-bold tracking-tight text-ink-950"
          style={{ letterSpacing: '-0.03em' }}
        >
          Paham
        </span>

        {/* Step counter */}
        {!isSummary && (
          <span className="text-[10px] font-mono text-ink-400 tabular-nums">
            {String(step).padStart(2, '0')}&nbsp;/&nbsp;{String(TOTAL_STEPS).padStart(2, '0')}
          </span>
        )}
        {isSummary && (
          <span className="text-[10px] font-mono text-moss-700">Ringkasan</span>
        )}
      </header>

      {/* ── Progress bar ───────────────────────────────────────── */}
      <div className="h-[2px] bg-paper-300" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-ink-800 progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Step content ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12">
        <div
          key={step}
          className={`w-full max-w-lg ${contentClass}`}
        >
          {step === 1 && (
            <StepName
              value={draft.displayName ?? ''}
              onChange={(v) => updateDraft({ displayName: v })}
              onNext={goForward}
            />
          )}

          {step === 2 && (
            <StepSchool
              schoolName={draft.schoolName ?? ''}
              schoolCity={draft.schoolCity ?? ''}
              schoolProvince={draft.schoolProvince ?? ''}
              onChange={(updates) => updateDraft(updates)}
              onNext={goForward}
            />
          )}

          {step === 3 && (
            <StepEducationSystem
              value={draft.educationSystem}
              onChange={(v) => updateDraft({ educationSystem: v, curriculum: undefined })}
              onNext={goForward}
            />
          )}

          {step === 4 && (
            <StepCurriculum
              educationSystem={draft.educationSystem ?? 'indonesia'}
              value={draft.curriculum ?? ''}
              onChange={(v) => updateDraft({ curriculum: v })}
              onNext={goForward}
            />
          )}

          {step === 5 && (
            <StepGrade
              educationSystem={draft.educationSystem ?? 'indonesia'}
              value={draft.grade}
              semester={draft.semester}
              onChange={(g, s) => updateDraft({ grade: g, semester: s })}
              onNext={goForward}
            />
          )}

          {step === 6 && (
            <StepSubjects
              educationSystem={draft.educationSystem ?? 'indonesia'}
              grade={draft.grade ?? 'Kelas 10'}
              selectedIds={draft.selectedSubjectIds ?? DEFAULT_INDONESIAN_SUBJECTS.map(s => s.id)}
              onChange={(ids) => updateDraft({ selectedSubjectIds: ids })}
              onNext={goForward}
            />
          )}

          {step === 7 && (
            <StepPreferences
              learningMethods={draft.preferredLearningMethods ?? []}
              studyTime={draft.availableStudyTime ?? '20-30'}
              dailyMinutes={draft.dailyTimeTargetMinutes ?? 25}
              onChange={(methods, time, mins) => updateDraft({
                preferredLearningMethods: methods,
                availableStudyTime: time,
                dailyTimeTargetMinutes: mins,
              })}
              onNext={goForward}
            />
          )}

          {isSummary && (
            <OnboardingSummary
              draft={draft}
              onFinish={handleFinish}
              onEditStep={(s) => setStep(s as StepId)}
            />
          )}
        </div>
      </main>

    </div>
  );
};
