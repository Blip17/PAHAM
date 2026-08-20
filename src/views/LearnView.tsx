// PAHAM Study Studio — Focused Learning Environment
// Evidence-based cognitive learning rhythm: Retrieval Practice -> Concept Notes -> Elaboration -> Interleaved Check -> Metacognitive Calibration -> FSRS Spaced Review

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  CheckCircle2,
  Sparkles, 
  Clock, 
  Check, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Eye,
  Zap,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Layers,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';
import { Concept, Subject, Chapter, StudentConceptState, FSRSRating, StudyAssistantAction, ExpectedOutcome } from '../core/types';
import { ai, AnswerAnalysisResult } from '../services/ai/aiProvider';
import { fsrs } from '../core/fsrsEngine';
import { StudyAssistantDrawer } from '../components/study/StudyAssistantDrawer';

interface LearnViewProps {
  initialConceptId?: string;
  onFinishSession: () => void;
  onOpenTimer: (conceptTitle: string, minutes: number) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  initialConceptId,
  onFinishSession,
  onOpenTimer,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [studentState, setStudentState] = useState<StudentConceptState | null>(null);

  // 6-Step Cognitive Session Rhythm
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState<number>(0);
  
  // Step 1: Pre-Recall
  const [preRecallInput, setPreRecallInput] = useState<string>('');
  const [isPreRecallRevealed, setIsPreRecallRevealed] = useState<boolean>(false);

  // Step 3: Elaboration
  const [elaborationInput, setElaborationInput] = useState<string>('');
  const [isAnalyzingElaboration, setIsAnalyzingElaboration] = useState<boolean>(false);
  const [elaborationFeedback, setElaborationFeedback] = useState<AnswerAnalysisResult | null>(null);

  // Step 4: Interleaved Question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Step 5: Metacognitive Confidence Check
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  // Study Assistant Drawer State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantAction, setAssistantAction] = useState<StudyAssistantAction>('explain_simple');

  // Timer counter for Study Studio
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      const concs: Concept[] = await db.concepts.toArray();
      const subs = await db.subjects.toArray();
      const chaps = await db.chapters.toArray();

      setSubjects(subs);
      setChapters(chaps);

      let target = concs[0];
      if (initialConceptId) {
        const found = concs.find((c: Concept) => c.id === initialConceptId);
        if (found) target = found;
      }
      setSelectedConcept(target);

      if (target) {
        const state = await db.studentConceptStates.get(target.id);
        if (state) setStudentState(state);
      }
    }
    loadData();
  }, [initialConceptId]);

  const getSubject = (subId?: string) => subjects.find(s => s.id === subId);
  const getChapter = (chapId?: string) => chapters.find(c => c.id === chapId);

  const handleAnalyzeElaboration = async () => {
    if (!selectedConcept || !elaborationInput.trim()) return;
    setIsAnalyzingElaboration(true);

    const result = await ai.analyzeAnswer({
      questionPrompt: `Kenapa konsep ${selectedConcept.title} bekerja seperti itu dan bagaimana analoginya?`,
      expectedAnswer: `${selectedConcept.definition} Contoh: ${selectedConcept.example}`,
      studentAnswer: elaborationInput,
      concept: selectedConcept,
    });

    setElaborationFeedback(result);
    setIsAnalyzingElaboration(false);
  };

  const handleRateFSRS = async (rating: FSRSRating) => {
    if (!selectedConcept) return;

    let card = studentState?.fsrs || fsrs.createEmptyCard(selectedConcept.id);
    const { updatedCard } = fsrs.processReview(card, rating);

    const newAttempts = (studentState?.recentAttemptsCount || 0) + 1;
    const newCorrect = (studentState?.recentCorrectCount || 0) + (rating >= 3 ? 1 : 0);

    const updatedState: StudentConceptState = {
      conceptId: selectedConcept.id,
      masteryScore: rating >= 3 ? Math.min(0.95, (studentState?.masteryScore || 0.5) + 0.15) : Math.max(0.2, (studentState?.masteryScore || 0.5) - 0.1),
      fsrs: updatedCard,
      recentAttemptsCount: newAttempts,
      recentCorrectCount: newCorrect,
      commonMistakes: rating === 1 ? (studentState?.commonMistakes || []) : [],
      lastStudied: new Date().toISOString(),
      priorityScore: rating === 1 ? 90 : 30,
      recommendedMode: rating >= 3 ? 'recall' : 'practice',
    };

    await db.studentConceptStates.put(updatedState);
    await db.learningEvents.add({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'LEARN_STEP_COMPLETED',
      conceptId: selectedConcept.id,
      metadata: { rating, stability: updatedCard.stability, confidence: confidenceLevel },
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });

    onFinishSession();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!selectedConcept) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif">
        Menyiapkan meja belajar PAHAM Study Studio...
      </div>
    );
  }

  const currentSubject = getSubject(selectedConcept.subjectId);
  const currentChapter = getChapter(selectedConcept.chapterId);

  const stepsList = [
    { num: 1, label: 'Recall', desc: 'Uji ingatan awal' },
    { num: 2, label: 'Intisari', desc: 'Catatan & definisi' },
    { num: 3, label: 'Elaborasi', desc: 'Feynman teach-back' },
    { num: 4, label: 'Latihan', desc: 'Soal aplikasi' },
    { num: 5, label: 'Kalibrasi', desc: 'Tingkat keyakinan' },
    { num: 6, label: 'Jadwal FSRS', desc: 'Simpan memori' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* ── TOP QUIET STATUS BAR ──────────────────────────────── */}
      <header className="paper-sheet p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-b-moss-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
            {currentSubject?.name || 'Mata Pelajaran'} · {currentChapter?.title || 'Bab 1'}
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-ink-950 mt-0.5">
            {selectedConcept.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 font-mono text-xs text-ink-700 bg-paper-100 px-3 py-1.5 rounded border border-paper-200">
            <Clock className="w-3.5 h-3.5 text-moss-700" />
            <span>{formatTimer(sessionSecondsElapsed)}</span>
          </div>

          <span className="text-xs font-mono text-ink-600 bg-paper-100 px-2.5 py-1.5 rounded border border-paper-200">
            0{currentStep} / 06
          </span>
        </div>
      </header>

      {/* ── 3-ZONE ASYMMETRICAL STUDY CANVAS ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT (3 COLS): VERTICAL COGNITIVE PATH ───────────── */}
        <aside className="hidden lg:block lg:col-span-3 paper-sheet p-4 space-y-4 sticky top-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block border-b border-paper-200 pb-2">
            Alur Sesi Belajar
          </span>

          <div className="space-y-3 relative pl-3 border-l-2 border-moss-700/30">
            {stepsList.map((s) => {
              const isCurrent = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <div 
                  key={s.num}
                  className={`text-xs transition space-y-0.5 ${
                    isCurrent ? 'font-semibold text-moss-900' : isDone ? 'text-ink-500 opacity-60' : 'text-ink-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-moss-700 animate-pulse' : isDone ? 'bg-moss-800' : 'bg-paper-300'}`} />
                    <span className="font-mono uppercase text-[10px]">0{s.num} · {s.label}</span>
                  </div>
                  <p className="text-[11px] font-serif pl-3.5 text-ink-600">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER (6 COLS): MAIN ACTIVE RETRIEVAL CANVAS ───── */}
        <main className="lg:col-span-6 space-y-6">

          {/* STEP 1: PRE-CHECK RETRIEVAL */}
          {currentStep === 1 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50 border-moss-800/60 shadow-sm">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>01 · RETRIEVAL PRACTICE</span>
                <span>Jangan Buka Catatan</span>
              </div>

              <div className="space-y-2">
                <span className="badge-moss text-xs">Uji Ingatan Awal</span>
                <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium leading-snug">
                  Tanpa melihat catatan, apa yang kamu ingat tentang {selectedConcept.title}?
                </h2>
                <p className="text-xs sm:text-sm text-ink-700 font-serif leading-relaxed">
                  Mengambil memori secara aktif (active retrieval) jauh lebih efektif dibanding sekadar membaca ulang catatan.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Tuliskan apa pun yang kamu ingat (rumus, kata kunci, atau pengertian singkat)..."
                  value={preRecallInput}
                  onChange={(e) => setPreRecallInput(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded p-3 text-xs sm:text-sm text-ink-900 focus:border-moss-700 font-sans"
                />

                {!isPreRecallRevealed ? (
                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPreRecallRevealed(true)}
                      className="btn-ghost text-xs text-ink-500"
                    >
                      Belum ingat? Langsung buka catatan →
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreRecallRevealed(true)}
                      disabled={!preRecallInput.trim()}
                      className="btn-primary text-xs py-2 px-4 shadow-subtle disabled:opacity-50"
                    >
                      Bandingkan dengan Catatan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-moss-50 rounded border border-moss-300 space-y-2 text-xs animate-fadeUp">
                    <span className="font-semibold text-moss-900 font-mono text-[11px] block uppercase">
                      Catatan Sekolah Asli:
                    </span>
                    <p className="font-serif italic text-ink-900 text-sm leading-relaxed">
                      "{selectedConcept.definition}"
                    </p>
                    <p className="text-[11px] text-ink-600 font-serif pt-1 border-t border-moss-200">
                      Bandingkan ingatanmu tadi dengan catatan di atas. Bagian mana yang sudah tepat dan apa yang terlewat?
                    </p>
                  </div>
                )}
              </div>

              {isPreRecallRevealed && (
                <div className="pt-4 border-t border-paper-200 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
                  >
                    Lanjut ke Intisari Konsep
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONCEPT FOUNDATION */}
          {currentStep === 2 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>02 · INTISARI MATERI SEKOLAH</span>
                <span>Tingkat {selectedConcept.difficultyLevel}/5</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-paper-100 rounded border border-paper-300 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold block">Definisi Inti</span>
                  <p className="font-serif text-ink-950 text-base sm:text-lg leading-relaxed">
                    {selectedConcept.definition}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-ink-800 uppercase tracking-wider block">
                    Poin Kunci & Pembeda Soal:
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-ink-700 font-serif">
                    {selectedConcept.keyPoints.map((kp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-moss-700 mt-2 shrink-0" />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
                  <span className="font-mono text-[10px] uppercase text-moss-800 font-semibold block">Contoh Kasus / Soal</span>
                  <p className="font-serif italic text-ink-900 text-sm">"{selectedConcept.example}"</p>
                </div>

                {/* AI Assistant Help */}
                <div className="p-3 bg-paper-100 rounded border border-paper-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-ink-600 font-serif flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-moss-800" />
                    Perlu penjelasan lebih sederhana?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssistantAction('explain_simple');
                        setIsAssistantOpen(true);
                      }}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      Jelaskan Sederhana
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssistantAction('give_example');
                        setIsAssistantOpen(true);
                      }}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      Contoh Lain
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
                >
                  Coba Jelaskan Sendiri
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ELABORATION / TEACH-BACK */}
          {currentStep === 3 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>03 · ELABORASI & ANALOGI</span>
                <span>Feynman Technique</span>
              </div>

              <div className="space-y-2">
                <span className="badge-moss text-xs">Uji Pemahaman Mendalam</span>
                <h2 className="text-xl font-serif text-ink-950 font-medium">
                  Bagaimana kamu menjelaskannya ke teman sebangkumu?
                </h2>
                <p className="text-xs sm:text-sm text-ink-700 font-serif leading-relaxed">
                  Jelaskan dengan kalimatmu sendiri atau berikan analogi sederhana agar konsep ini melekat kuat.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={4}
                  placeholder={`Misal: "${selectedConcept.title} itu seperti..."`}
                  value={elaborationInput}
                  onChange={(e) => setElaborationInput(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded p-3 text-xs sm:text-sm text-ink-900 focus:border-moss-700 font-sans"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAnalyzeElaboration}
                    disabled={!elaborationInput.trim() || isAnalyzingElaboration}
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-moss-800" />
                    {isAnalyzingElaboration ? 'Memeriksa...' : 'Cek Kualitas Penjelasan'}
                  </button>
                </div>

                {elaborationFeedback && (
                  <div className="p-4 bg-paper-100 rounded border border-moss-300 space-y-2 text-xs animate-fadeUp">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-900">Umpan Balik:</span>
                      <span className={elaborationFeedback.isCorrect ? 'badge-moss' : 'badge-amber'}>
                        Skor: {Math.round(elaborationFeedback.score * 100)}%
                      </span>
                    </div>
                    <p className="font-serif text-ink-700 leading-relaxed">{elaborationFeedback.feedbackText}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
                >
                  Lanjut ke Latihan Soal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: INTERLEAVED APPLICATION QUESTION */}
          {currentStep === 4 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>04 · LATIHAN APLIKASI</span>
                <span>Soal Latihan Interleaved</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-paper-100 rounded border border-paper-300 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold block">Soal Pemahaman</span>
                  <p className="font-serif text-ink-950 text-sm sm:text-base font-medium">
                    Manakah pernyataan di bawah ini yang paling tepat menggambarkan penerapan dari <strong>{selectedConcept.title}</strong>?
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'opt-a', text: `${selectedConcept.example} (Aplikasi Konsep yang Tepat)`, isCorrect: true },
                    { id: 'opt-b', text: `Hanya membaca definisi tanpa menghubungkannya dengan konteks soal.`, isCorrect: false },
                    { id: 'opt-c', text: `Menghafal rumus secara mekanis tanpa memahami arti variabelnya.`, isCorrect: false },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (!isAnswerRevealed) setSelectedOptionId(opt.id);
                      }}
                      className={`w-full p-3 text-left rounded border text-xs sm:text-sm transition flex items-start justify-between gap-2 ${
                        selectedOptionId === opt.id 
                          ? isAnswerRevealed 
                            ? opt.isCorrect ? 'bg-moss-100 border-moss-600 font-medium' : 'bg-terracotta-100 border-terracotta-600'
                            : 'bg-paper-200 border-moss-800 font-medium'
                          : 'bg-paper-100 border-paper-200 hover:bg-paper-150'
                      }`}
                    >
                      <span className="font-serif">{opt.text}</span>
                      {isAnswerRevealed && opt.isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-moss-800 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>

                {!isAnswerRevealed ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!selectedOptionId}
                      onClick={() => setIsAnswerRevealed(true)}
                      className="btn-primary text-xs py-2 px-4 shadow-subtle disabled:opacity-50"
                    >
                      Periksa Jawaban
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-paper-100 rounded border border-moss-300 text-xs space-y-1 animate-fadeUp font-serif">
                    <span className="font-semibold text-ink-950 font-mono text-[10px] uppercase block">Pembahasan Singkat:</span>
                    <p className="text-ink-800 leading-relaxed">
                      Pilihan A tepat karena mencerminkan aplikasi nyata konsep secara kontekstual di soal sekolah.
                    </p>
                  </div>
                )}
              </div>

              {isAnswerRevealed && (
                <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-ghost text-xs py-2 px-3"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
                  >
                    Kalibrasi Keyakinan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: METACOGNITIVE CONFIDENCE CHECK */}
          {currentStep === 5 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>05 · KALIBRASI METACOGNITIVE</span>
                <span>Seberapa Yakin Kamu?</span>
              </div>

              <div className="space-y-3 text-center">
                <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium">
                  Seberapa yakin kamu jika soal {selectedConcept.title} muncul di ulangan?
                </h2>
                <p className="text-xs text-ink-600 font-serif max-w-md mx-auto">
                  Kalibrasi keyakinan membantu PAHAM menghitung stabilitas memori FSRS dan menjadwalkan tanggal review berikutnya.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { lvl: 'low' as const, label: 'Masih Ragu', desc: 'Perlu latihan lagi' },
                  { lvl: 'medium' as const, label: 'Cukup Paham', desc: 'Bisa jawab jika tenang' },
                  { lvl: 'high' as const, label: 'Sangat Yakin', desc: 'Siap soal variasi' },
                ].map((c) => (
                  <button
                    key={c.lvl}
                    onClick={() => setConfidenceLevel(c.lvl)}
                    className={`p-4 rounded border text-center transition space-y-1 ${
                      confidenceLevel === c.lvl 
                        ? 'bg-moss-900 text-paper-50 border-moss-900 font-medium shadow-subtle' 
                        : 'bg-paper-100 border-paper-300 text-ink-900 hover:bg-paper-200'
                    }`}
                  >
                    <span className="text-xs font-serif font-semibold block">{c.label}</span>
                    <span className={`text-[10px] block ${confidenceLevel === c.lvl ? 'text-moss-200' : 'text-ink-500'}`}>
                      {c.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Kembali
                </button>
                <button
                  disabled={!confidenceLevel}
                  onClick={() => setCurrentStep(6)}
                  className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                >
                  Simpan ke Jadwal Memori
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: FSRS SPACED REVIEW SCHEDULING */}
          {currentStep === 6 && (
            <div className="paper-sheet p-6 sm:p-8 space-y-6 bg-paper-50 border-moss-800/80 shadow-md">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
                <span>06 · FSRS SPACED REPETITION</span>
                <span>Jadwal Memori Terprogram</span>
              </div>

              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-full bg-moss-100 text-moss-900 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif text-ink-950 font-medium">
                  Sesi Belajar Selesai!
                </h2>
                <p className="text-xs sm:text-sm text-ink-600 font-serif max-w-sm mx-auto">
                  Nilai tingkat kemudahan ingatanmu untuk memprogram interval review berikutnya.
                </p>
              </div>

              {/* 4-Button Refined FSRS Ratings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[
                  { r: 1 as FSRSRating, label: 'Ulangi', time: 'Besok', desc: 'Lupa total' },
                  { r: 2 as FSRSRating, label: 'Sulit', time: '2 hari', desc: 'Ingat sedikit' },
                  { r: 3 as FSRSRating, label: 'Paham', time: '4 hari', desc: 'Cukup lancar' },
                  { r: 4 as FSRSRating, label: 'Sangat Mudah', time: '1 pekan', desc: 'Tanpa ragu' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => handleRateFSRS(item.r)}
                    className="p-3.5 rounded border border-paper-300 bg-paper-100 hover:border-moss-700 hover:bg-paper-200 text-center transition space-y-1 group"
                  >
                    <span className="text-xs font-semibold text-ink-950 block">{item.label}</span>
                    <span className="text-[11px] font-mono text-moss-800 font-bold block">{item.time}</span>
                    <span className="text-[10px] text-ink-500 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ── RIGHT (3 COLS): LIVE EXPECTED OUTCOMES CHECKLIST ── */}
        <aside className="hidden lg:block lg:col-span-3 paper-sheet p-4 space-y-4 sticky top-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block border-b border-paper-200 pb-2">
            Target Hasil Sesi Ini
          </span>

          <div className="space-y-3 text-xs font-serif text-ink-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStep >= 2 ? 'text-moss-700 fill-moss-100' : 'text-paper-300'}`} />
              <span className={currentStep >= 2 ? 'font-medium text-ink-950' : 'text-ink-500'}>
                Uji ingatan awal tanpa membuka buku
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStep >= 3 ? 'text-moss-700 fill-moss-100' : 'text-paper-300'}`} />
              <span className={currentStep >= 3 ? 'font-medium text-ink-950' : 'text-ink-500'}>
                Pahami intisari & poin pembeda soal
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStep >= 4 ? 'text-moss-700 fill-moss-100' : 'text-paper-300'}`} />
              <span className={currentStep >= 4 ? 'font-medium text-ink-950' : 'text-ink-500'}>
                Jelaskan konsep dengan analogi sendiri
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStep >= 5 ? 'text-moss-700 fill-moss-100' : 'text-paper-300'}`} />
              <span className={currentStep >= 5 ? 'font-medium text-ink-950' : 'text-ink-500'}>
                Selesaikan 1 butir soal aplikasi
              </span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStep >= 6 ? 'text-moss-700 fill-moss-100' : 'text-paper-300'}`} />
              <span className={currentStep >= 6 ? 'font-medium text-ink-950' : 'text-ink-500'}>
                Jadwalkan review FSRS ke memori
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-paper-200 text-[11px] font-mono text-ink-500">
            Kesiapan: {studentState ? Math.round(studentState.masteryScore * 100) : 50}%
          </div>
        </aside>

      </div>

      {/* Study Assistant Drawer */}
      <StudyAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        concept={selectedConcept}
        initialAction={assistantAction}
      />

    </div>
  );
};
