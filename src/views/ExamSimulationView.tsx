// Exam Simulation View for PAHAM
// Serious timed exam simulation with diagnostic score reports, concept strength breakdown, and next-session prescription

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  Flag, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';
import { Exam, Question, ExamAttempt, Concept } from '../core/types';
import { StudyAssistantDrawer } from '../components/study/StudyAssistantDrawer';

interface ExamSimulationViewProps {
  initialExamId?: string;
  onFinishExam: () => void;
  onStartLearnConcept: (conceptId: string) => void;
}

type ExamState = 'briefing' | 'in_progress' | 'submitted';

export const ExamSimulationView: React.FC<ExamSimulationViewProps> = ({
  initialExamId,
  onFinishExam,
  onStartLearnConcept,
}) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examState, setExamState] = useState<ExamState>('briefing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Student Answers during simulation
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);

  // Result Analytics
  const [attemptResult, setAttemptResult] = useState<ExamAttempt | null>(null);
  const [previousReadiness, setPreviousReadiness] = useState<number>(0);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);

  // Study Assistant State (Active post-exam only)
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantConcept, setAssistantConcept] = useState<Concept | null>(null);

  useEffect(() => {
    async function loadExamData() {
      const allExams: Exam[] = await db.exams.toArray();
      const concepts: Concept[] = await db.concepts.toArray();
      setAllConcepts(concepts);

      let target = allExams[0];
      if (initialExamId) {
        const found = allExams.find((e: Exam) => e.id === initialExamId);
        if (found) target = found;
      }
      setSelectedExam(target);

      if (target) {
        setSecondsRemaining(target.durationMinutes * 60);
        // Use real stored readiness or default to 0 for new exams
        setPreviousReadiness(target.readinessScore ?? 0);
        // Load questions for covered chapters
        const qs: Question[] = await db.questions.toArray();
        const coveredQs = qs.filter((q: Question) => target.coveredChapterIds.includes(q.chapterId));
        setQuestions(coveredQs.length > 0 ? coveredQs : qs.slice(0, 15));
      }
    }
    loadExamData();
  }, [initialExamId]);

  // Exam Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (examState === 'in_progress' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examState, secondsRemaining]);

  const handleStartExam = () => {
    setExamState('in_progress');
    setCurrentIndex(0);
    setAnswers({});
    setFlaggedQuestions(new Set());
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleSelectOption = (optId: string) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmitExam = async () => {
    if (!selectedExam) return;

    let correctCount = 0;
    const conceptPerformances: Record<string, { total: number; correct: number }> = {};

    questions.forEach(q => {
      const selectedOptId = answers[q.id];
      const isCorrect = q.options?.find(o => o.id === selectedOptId)?.isCorrect || false;
      if (isCorrect) correctCount++;

      if (!conceptPerformances[q.conceptId]) {
        conceptPerformances[q.conceptId] = { total: 0, correct: 0 };
      }
      conceptPerformances[q.conceptId].total++;
      if (isCorrect) conceptPerformances[q.conceptId].correct++;
    });

    const scorePercentage = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    
    const strongConcepts: string[] = [];
    const weakConcepts: string[] = [];

    Object.entries(conceptPerformances).forEach(([cId, perf]) => {
      const rate = perf.correct / perf.total;
      if (rate >= 0.75) strongConcepts.push(cId);
      else weakConcepts.push(cId);
    });

    const newReadiness = Math.min(96, Math.max(40, Math.round((previousReadiness + scorePercentage) / 2)));

    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      examId: selectedExam.id,
      subjectId: selectedExam.subjectId,
      startedAt: new Date(Date.now() - (selectedExam.durationMinutes * 60 - secondsRemaining) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      durationSecondsUsed: selectedExam.durationMinutes * 60 - secondsRemaining,
      scorePercentage,
      totalQuestions: questions.length,
      correctAnswersCount: correctCount,
      strongConceptIds: strongConcepts,
      weakConceptIds: weakConcepts,
      commonMistakeSummaries: weakConcepts.length > 0
        ? weakConcepts.slice(0, 3).map(cId => {
            const concept = allConcepts.find(c => c.id === cId);
            return concept ? `Perlu memperkuat: ${concept.title}` : `Konsep ${cId} masih lemah`;
          })
        : [],
      recommendedFollowupMinutes: 12,
      answers: [],
    };

    await db.examAttempts.add(attempt);
    await db.exams.update(selectedExam.id, {
      readinessScore: newReadiness,
      completedAttempts: (selectedExam.completedAttempts || 0) + 1,
    });

    await db.learningEvents.add({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'EXAM_SUBMITTED',
      subjectId: selectedExam.subjectId,
      metadata: { score: scorePercentage, readiness: newReadiness },
    });

    setAttemptResult(attempt);
    setExamState('submitted');

    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    } catch {}
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!selectedExam) {
    return (
      <div className="py-20 text-center text-ink-500 font-serif">
        Pilih modul ujian untuk memulai simulasi.
      </div>
    );
  }

  // ----------------------------------------------------
  // 1. BRIEFING STATE
  // ----------------------------------------------------
  if (examState === 'briefing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-paper-300 pb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block mb-1">
            Simulasi Ujian Mandiri
          </span>
          <h1 className="text-3xl font-serif text-ink-950 font-medium">
            {selectedExam.title}
          </h1>
          <p className="text-xs text-ink-500 font-serif mt-1">
            Disusun berdasarkan arsip catatan guru, fotokopi, dan materi kelas yang telah kamu pelajari.
          </p>
        </header>

        <div className="paper-sheet p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center border-b border-paper-200 pb-5">
            <div className="p-3 bg-paper-100 rounded">
              <span className="text-[10px] font-mono uppercase text-ink-400 font-semibold block">Waktu Ujian</span>
              <span className="text-lg font-serif font-bold text-ink-900">{selectedExam.durationMinutes} Menit</span>
            </div>
            <div className="p-3 bg-paper-100 rounded">
              <span className="text-[10px] font-mono uppercase text-ink-400 font-semibold block">Jumlah Soal</span>
              <span className="text-lg font-serif font-bold text-ink-900">{questions.length} Soal</span>
            </div>
            <div className="p-3 bg-paper-100 rounded">
              <span className="text-[10px] font-mono uppercase text-ink-400 font-semibold block">Cakupan Materi</span>
              <span className="text-lg font-serif font-bold text-moss-900">{selectedExam.coveredChapterIds.length} Bab</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-ink-700 font-serif leading-relaxed">
            <h4 className="font-sans font-semibold text-ink-900 uppercase text-[11px] tracking-wider">
              Ketentuan Simulasi:
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Jawaban tidak akan langsung diperlihatkan selama ujian berlangsung.</li>
              <li>Kamu dapat menandai soal yang ragu untuk ditinjau kembali sebelum waktu habis.</li>
              <li>Hasil akhir akan mengukur <strong>Kesiapan Ujian (%)</strong> dan memberikan rekomendasi target belajar berikutnya.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-paper-200 flex justify-end">
            <button
              onClick={handleStartExam}
              className="btn-primary text-xs py-2.5 px-6 shadow-subtle text-sm"
            >
              <FileText className="w-4 h-4" />
              Mulai Ujian Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. IN-PROGRESS SIMULATION (SERIOUS & MINIMAL)
  // ----------------------------------------------------
  if (examState === 'in_progress') {
    const currentQ = questions[currentIndex];
    const isFlagged = flaggedQuestions.has(currentQ.id);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Minimal Exam Top Bar */}
        <div className="flex items-center justify-between border-b border-paper-300 pb-3">
          <div>
            <h2 className="font-serif text-base font-medium text-ink-900">
              {selectedExam.title}
            </h2>
            <span className="text-[11px] text-ink-500 font-mono">
              Soal {currentIndex + 1} dari {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold bg-paper-200 px-3 py-1 rounded text-ink-950">
              <Clock className="w-4 h-4 text-moss-800" />
              {formatTimer(secondsRemaining)}
            </div>

            <button
              onClick={handleSubmitExam}
              className="btn-primary text-xs py-1.5 px-3 bg-moss-900 hover:bg-moss-800"
            >
              Kumpulkan Ujian
            </button>
          </div>
        </div>

        {/* Dual Layout: Question Matrix (Left) & Question Paper (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Question Navigator Matrix (3 cols) */}
          <div className="lg:col-span-4 paper-sheet p-4 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 font-semibold block">
              Navigasi Soal
            </span>

            <div className="grid grid-cols-5 gap-2 font-mono text-xs">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = currentIndex === idx;
                const isFlg = flaggedQuestions.has(q.id);

                let btnClass = 'bg-paper-100 text-ink-700 border-paper-200';
                if (isCurrent) {
                  btnClass = 'bg-moss-900 text-paper-50 font-bold border-moss-950';
                } else if (isFlg) {
                  btnClass = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
                } else if (isAnswered) {
                  btnClass = 'bg-moss-100 text-moss-900 border-moss-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded border flex items-center justify-center transition text-xs relative ${btnClass}`}
                  >
                    {idx + 1}
                    {isFlg && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-paper-200 text-[10px] text-ink-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-moss-100 border border-moss-300 inline-block" />
                <span>Terjawab ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300 inline-block" />
                <span>Ditandai ({flaggedQuestions.size})</span>
              </div>
            </div>
          </div>

          {/* Question Paper Canvas (8 cols) */}
          <div className="lg:col-span-8 paper-sheet p-6 sm:p-7 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-paper-200">
              <span className="text-xs font-mono text-ink-500 uppercase">
                Nomor {currentIndex + 1}
              </span>
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition border ${
                  isFlagged 
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium' 
                    : 'bg-paper-100 border-paper-300 text-ink-600 hover:bg-paper-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}
              </button>
            </div>

            {/* Prompt */}
            <p className="text-sm sm:text-base font-serif text-ink-950 leading-relaxed whitespace-pre-line">
              {currentQ.prompt}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options?.map(opt => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-3.5 rounded border text-left text-xs sm:text-sm transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-moss-50 border-moss-800 text-ink-950 font-medium shadow-subtle'
                        : 'border-paper-300 hover:bg-paper-100 text-ink-800'
                    }`}
                  >
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn-ghost text-xs py-2 px-3 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="btn-secondary text-xs py-2 px-3 disabled:opacity-30"
              >
                Berikutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ----------------------------------------------------
  // 3. DIAGNOSTIC SCORE REPORT AFTER SUBMISSION
  // ----------------------------------------------------
  if (examState === 'submitted' && attemptResult) {
    const newReadiness = Math.min(98, Math.max(40, Math.round((previousReadiness + attemptResult.scorePercentage) / 2)));
    const strongConceptObjects = attemptResult.strongConceptIds
      .map(id => allConcepts.find(c => c.id === id))
      .filter(Boolean) as Concept[];
    const weakConceptObjects = attemptResult.weakConceptIds
      .map(id => allConcepts.find(c => c.id === id))
      .filter(Boolean) as Concept[];

    const topWeakConcepts = weakConceptObjects.slice(0, 3);
    const recommendedMinutes = topWeakConcepts.length > 0
      ? topWeakConcepts.length * 8
      : 10;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Score Hero Card */}
        <div className="paper-sheet p-8 space-y-5 text-center">
          <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
            Laporan Diagnostik Ujian
          </span>

          <div className="space-y-1">
            <div className="text-5xl sm:text-6xl font-serif font-bold text-ink-950">
              {attemptResult.scorePercentage}
            </div>
            <p className="text-sm text-ink-600 font-serif">
              {attemptResult.correctAnswersCount} dari {attemptResult.totalQuestions} soal terjawab dengan benar.
            </p>
          </div>

          {/* Readiness Comparison Delta */}
          <div className="max-w-md mx-auto bg-paper-100 p-4 rounded border border-paper-200 flex items-center justify-around text-xs">
            <div>
              <span className="text-ink-400 font-mono block text-[10px] uppercase">Kesiapan Sebelumnya</span>
              <span className="text-lg font-serif font-semibold text-ink-700">{previousReadiness}%</span>
            </div>
            <ArrowRight className="w-4 h-4 text-moss-700" />
            <div>
              <span className="text-moss-800 font-mono block text-[10px] uppercase font-bold">Kesiapan Baru</span>
              <span className="text-lg font-serif font-bold text-moss-900">
                {newReadiness}% SIAP
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-700 font-serif italic max-w-md mx-auto">
            {attemptResult.scorePercentage >= 75
              ? '"Kamu sudah cukup siap. Pertahankan dan perkuat konsep yang masih lemah sebelum hari ujian."'
              : '"Masih ada beberapa titik rawan yang perlu kamu perkuat. Fokuslah pada konsep-konsep di bawah ini."'}
          </p>
        </div>

        {/* Concept Breakdown: Strong vs Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Strong Concepts */}
          <div className="paper-sheet p-5 space-y-3 border-t-4 border-t-moss-700">
            <div className="flex items-center gap-2 text-moss-900 font-semibold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 text-moss-700" />
              Konsep Kuat / Stabil ({strongConceptObjects.length})
            </div>
            {strongConceptObjects.length > 0 ? (
              <ul className="space-y-2 text-xs text-ink-800 font-sans">
                {strongConceptObjects.slice(0, 5).map(c => (
                  <li key={c.id} className="p-2 bg-paper-100 rounded border border-paper-200">
                    ✓ {c.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-500 font-serif italic">
                {questions.length === 0
                  ? 'Tidak ada soal yang bisa dinilai dalam simulasi ini.'
                  : 'Belum ada konsep yang dikuasai penuh. Terus berlatih!'}
              </p>
            )}
          </div>

          {/* Weak Concepts (Need Reinforcement) */}
          <div className="paper-sheet p-5 space-y-3 border-t-4 border-t-terracotta-700">
            <div className="flex items-center gap-2 text-terracotta-900 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-terracotta-700" />
              Perlu Diperkuat ({weakConceptObjects.length})
            </div>
            {topWeakConcepts.length > 0 ? (
              <div className="space-y-2 text-xs">
                {topWeakConcepts.map(c => (
                  <div key={c.id} className="p-2.5 bg-terracotta-50 rounded border border-terracotta-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-ink-900 block">{c.title}</span>
                      <span className="text-[11px] text-terracotta-800 line-clamp-1">{c.definition?.slice(0, 80)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAssistantConcept(c);
                          setIsAssistantOpen(true);
                        }}
                        className="btn-secondary text-[10px] py-1 px-2 text-moss-900 border-moss-300 bg-moss-50/50 hover:bg-moss-100 flex items-center gap-1"
                        title="Bahas konsep ini dengan Teman Belajar"
                      >
                        <Sparkles className="w-3 h-3 text-moss-700" />
                        Bahas
                      </button>
                      <button
                        onClick={() => onStartLearnConcept(c.id)}
                        className="btn-primary text-[10px] py-1 px-2 bg-moss-900"
                      >
                        Belajar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-moss-700 font-serif italic">
                Semua konsep yang diuji sudah dikuasai. Luar biasa!
              </p>
            )}
          </div>

        </div>

        {/* Prescribed Next Action */}
        <div className="paper-sheet p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-moss-200 bg-moss-50/50">
          <div>
            <span className="text-[10px] font-mono uppercase text-moss-800 font-semibold block">
              Rencana Belajar Berikutnya
            </span>
            <p className="font-serif text-base text-ink-950 font-medium mt-0.5">
              {topWeakConcepts.length > 0
                ? `${recommendedMinutes} menit sesi review untuk memperkuat ${topWeakConcepts.map(c => c.title).join(', ')}.`
                : 'Pertahankan performa ini dengan sesi review ringan 10 menit besok.'}
            </p>
          </div>

          <button
            onClick={onFinishExam}
            className="btn-primary text-xs py-2 px-4 shrink-0 shadow-subtle"
          >
            Jadwalkan ke Rencana Harian
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Study Assistant Drawer for Post-Exam Diagnostics */}
        <StudyAssistantDrawer
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          concept={assistantConcept}
          initialAction="compare"
        />

      </div>
    );
  }

  return null;
};
