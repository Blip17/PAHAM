// PAHAM Recommendation Lab
// Real-time signal simulation laboratory testing deterministic heuristic rules

import React, { useState } from 'react';
import { 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  CheckCircle, 
  ArrowRight, 
  AlertTriangle, 
  Brain,
  Calendar,
  Layers
} from 'lucide-react';
import { companionEngine } from '../../learning/companion/recommendationEngine';
import { DEFAULT_INDONESIAN_SUBJECTS } from '../../core/db';
import { CompanionRecommendation } from '../../core/types';

export const RecommendationLabView: React.FC = () => {
  // Signal Controls
  const [accuracyPercent, setAccuracyPercent] = useState<number>(42);
  const [overdueCardsCount, setOverdueCardsCount] = useState<number>(6);
  const [daysInactive, setDaysInactive] = useState<number>(1);
  const [daysToExam, setDaysToExam] = useState<number>(2);
  const [repeatedMistakesCount, setRepeatedMistakesCount] = useState<number>(3);
  
  const [generatedRecs, setGeneratedRecs] = useState<CompanionRecommendation[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const handleRunEvaluation = () => {
    setIsEvaluating(true);

    // Construct synthetic signal payload
    const mockConcepts = [
      {
        id: 'rec-lab-c1',
        subjectId: 'sub-mat-wajib',
        chapterId: 'chap-1',
        title: 'Persamaan & Pertidaksamaan Nilai Mutlak',
        definition: 'Konsep jarak pada garis bilangan.',
        difficultyLevel: 3,
        createdAt: '2026-08-21',
      },
    ];

    const mockMistakes = Array.from({ length: repeatedMistakesCount }).map((_, i) => ({
      id: `mistake-${i}`,
      conceptId: 'rec-lab-c1',
      conceptTitle: 'Persamaan & Pertidaksamaan Nilai Mutlak',
      subjectId: 'sub-mat-wajib',
      questionPrompt: `Soal Uji ${i}`,
      userGivenAnswer: 'B',
      correctAnswer: 'A',
      misconceptionDescription: 'Kesalahan perhitungan dasar',
      dateOccurred: new Date().toISOString(),
      isResolved: false,
    }));

    const mockFlashcards = Array.from({ length: overdueCardsCount }).map((_, i) => ({
      id: `fc-${i}`,
      conceptId: 'rec-lab-c1',
      subjectId: 'sub-mat-wajib',
      chapterId: 'chap-1',
      front: `Soal ${i}`,
      back: `Jawaban ${i}`,
      cardType: 'BASIC' as const,
      fsrs: {
        conceptId: 'rec-lab-c1',
        due: '2026-08-10', // Overdue
        stability: 2,
        difficulty: 3,
        elapsed_days: 2,
        scheduled_days: 1,
        reps: 1,
        lapses: 0,
        state: 1 as const,
      },
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    }));

    const mockExams = daysToExam <= 7 ? [{
      id: 'exam-1',
      subjectId: 'sub-mat-wajib',
      title: 'Ujian Akhir Semester Matematika',
      examDate: new Date(Date.now() + daysToExam * 86400000).toISOString().slice(0, 10),
      totalQuestions: 20,
      durationMinutes: 60,
      coveredChapterIds: ['chap-1'],
      importance: 'high' as const,
      readinessScore: 85,
      completedAttempts: 0,
    }] : [];

    const recs = companionEngine.generateRecommendations({
      concepts: mockConcepts as any,
      subjects: DEFAULT_INDONESIAN_SUBJECTS,
      studentStates: new Map(),
      mistakes: mockMistakes,
      flashcards: mockFlashcards,
      exams: mockExams,
      goals: [],
      materials: [],
      learningEvents: daysInactive > 0 ? [{ id: 'evt-1', timestamp: new Date(Date.now() - daysInactive * 86400000).toISOString(), eventType: 'STUDY_SESSION_COMPLETED' }] : [],
      preferences: {
        enableHighPriority: true,
        enableMediumPriority: true,
        enableLowPriority: true,
        suppressedRuleIds: [],
        cornerCompanionVisible: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:30',
      },
      pastRecommendations: [],
      currentDate: new Date(),
    });

    setGeneratedRecs(recs);
    setIsEvaluating(false);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Recommendation Signal Laboratory
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Simulate shifting student signals (accuracy, mistake spikes, exam countdowns) and observe deterministic rule activations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Signal Sliders */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-800 pb-2">
            Learning Signal Controls
          </span>

          {/* Accuracy Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Rata-rata Akurasi Kuis:</span>
              <span className="text-emerald-400 font-bold">{accuracyPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={accuracyPercent}
              onChange={e => setAccuracyPercent(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Repeated Mistakes */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Kesalahan Berulang (Mistakes):</span>
              <span className="text-rose-400 font-bold">{repeatedMistakesCount} soal</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={repeatedMistakesCount}
              onChange={e => setRepeatedMistakesCount(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Overdue Flashcards */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">FSRS Overdue Flashcards:</span>
              <span className="text-amber-400 font-bold">{overdueCardsCount} kartu</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={overdueCardsCount}
              onChange={e => setOverdueCardsCount(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Days to Exam */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Hitung Mundur Ujian:</span>
              <span className="text-blue-400 font-bold">{daysToExam} hari lagi</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              value={daysToExam}
              onChange={e => setDaysToExam(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Days Inactive */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Jeda Tidak Belajar (Days Inactive):</span>
              <span className="text-purple-400 font-bold">{daysInactive} hari</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              value={daysInactive}
              onChange={e => setDaysInactive(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition mt-4"
          >
            <Sparkles className="w-4 h-4" />
            {isEvaluating ? 'Evaluating Signals...' : 'Evaluate & Generate Recommendations'}
          </button>
        </div>

        {/* Right: Evaluated Output Inspector */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Engine Output · Activated Rules ({generatedRecs.length})
            </span>
            <span className="text-[10px] text-zinc-500">Evaluated Deterministically</span>
          </div>

          <div className="space-y-3">
            {generatedRecs.length > 0 ? (
              generatedRecs.map((rec, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {rec.ruleId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.priority === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          PRIORITY: {rec.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100 font-sans mt-1.5">{rec.title}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">{rec.reason}</p>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Action Type: <strong className="text-zinc-300">{rec.actionType}</strong></span>
                    <span className="text-emerald-400 font-bold">Confidence: 96%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-xs text-zinc-500 font-sans">
                Klik tombol "Evaluate & Generate Recommendations" untuk melihat respons mesin kecerdasan.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
