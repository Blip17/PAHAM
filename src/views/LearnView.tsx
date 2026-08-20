// Learn Canvas for PAHAM
// Evidence-based cognitive learning rhythm: Retrieval Practice -> Concept Notes -> Elaboration -> Interleaved Check -> Metacognitive Calibration -> FSRS Spaced Review

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  Check, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Eye,
  Zap,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';
import { Concept, Subject, Chapter, StudentConceptState, FSRSRating, StudyAssistantAction } from '../core/types';
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

  // 6-Step Cognitive Rhythm:
  // Step 1: Pre-Check Retrieval (Recall before reading)
  // Step 2: Source Notes & Foundation (Key points + example)
  // Step 3: Elaboration (Why it happens / Explain to a peer)
  // Step 4: Interleaved Practice Question (Identify strategy & apply)
  // Step 5: Metacognitive Confidence Calibration
  // Step 6: FSRS Spaced Review Scheduling
  const [currentStep, setCurrentStep] = useState<number>(1);
  
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
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Step 5: Metacognitive Confidence Check
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  // Study Assistant Drawer State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantAction, setAssistantAction] = useState<StudyAssistantAction>('explain_simple');

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

  if (!selectedConcept) {
    return (
      <div className="py-20 text-center text-ink-500 font-serif">
        Memuat materi belajar...
      </div>
    );
  }

  const currentSubject = getSubject(selectedConcept.subjectId);
  const currentChapter = getChapter(selectedConcept.chapterId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* ── Distraction-Free Study Header ─────────────────────── */}
      <header className="paper-sheet p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-b-moss-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
            {currentSubject?.name || 'Mata Pelajaran'} · {currentChapter?.title || 'Bab Pelajaran'}
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-ink-950 mt-0.5">
            {selectedConcept.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <span className="text-xs font-mono text-ink-500 bg-paper-100 px-2.5 py-1 rounded border border-paper-200">
            Langkah {currentStep} / 6
          </span>
          <button
            onClick={() => onOpenTimer(selectedConcept.title, 15)}
            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-ink-600"
          >
            <Clock className="w-3.5 h-3.5" />
            15m Target
          </button>
        </div>
      </header>

      {/* ── STEP 1: METHOD 01 — PRE-CHECK RETRIEVAL PRACTICE ──── */}
      {currentStep === 1 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>01 · RETRIEVAL PRACTICE (UJI INGATAN AWAL)</span>
            <span>Sebelum Membaca Ulang</span>
          </div>

          <div className="space-y-3">
            <span className="badge-moss text-xs">Aturan Belajar PAHAM</span>
            <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium leading-snug">
              Jangan langsung membaca catatanmu.
            </h2>
            <p className="text-sm text-ink-700 font-serif leading-relaxed">
              Tanpa melihat buku atau catatan guru, seberapa banyak yang masih kamu ingat tentang <strong>{selectedConcept.title}</strong>?
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Tuliskan apa yang kamu ingat (rumus, kata kunci, atau pengertian)..."
              value={preRecallInput}
              onChange={(e) => setPreRecallInput(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 rounded p-3 text-xs sm:text-sm text-ink-900 focus:bg-paper-100 focus:border-moss-700 font-sans"
            />

            {!isPreRecallRevealed ? (
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsPreRecallRevealed(true)}
                  className="btn-ghost text-xs text-ink-500"
                >
                  Belum ingat sama sekali? Langsung lihat catatan →
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreRecallRevealed(true)}
                  disabled={!preRecallInput.trim()}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  Bandingkan dengan Catatan Asli
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-moss-50 rounded border border-moss-300 space-y-2 text-xs">
                <span className="font-semibold text-moss-900 font-mono text-[11px] block uppercase">
                  Catatan Sekolah Asli:
                </span>
                <p className="font-serif italic text-ink-900 text-sm leading-relaxed">
                  "{selectedConcept.definition}"
                </p>
                <p className="text-[11px] text-ink-600 font-serif pt-1 border-t border-moss-200">
                  Perhatikan apakah ada bagian yang terlewat dari ingatanmu sebelumnya.
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

      {/* ── STEP 2: CONCEPT FOUNDATION & DUAL REPRESENTATION ─── */}
      {currentStep === 2 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>02 · INTISARI MATERI SEKOLAH</span>
            <span>Tingkat Kesulitan: Level {selectedConcept.difficultyLevel}/5</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-paper-50 rounded border border-paper-300 space-y-2">
              <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold block">Definisi Inti</span>
              <p className="font-serif text-ink-950 text-base sm:text-lg leading-relaxed">
                {selectedConcept.definition}
              </p>
            </div>

            {/* Key Pointers */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-ink-800 uppercase tracking-wider block">
                Poin Kunci & Pembeda Soal:
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-ink-700">
                {selectedConcept.keyPoints.map((kp: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-moss-700 mt-2 shrink-0" />
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Example Dual Representation */}
            <div className="p-3.5 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-mono text-[10px] uppercase text-moss-800 font-semibold block">Contoh Kasus / Soal</span>
              <p className="font-serif italic text-ink-900 text-sm">"{selectedConcept.example}"</p>
            </div>

            {/* Study Assistant Trigger Bar */}
            <div className="p-3 bg-paper-100 rounded border border-paper-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-ink-600 font-serif flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-moss-800" />
                Belum terlalu paham bagian ini?
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
                  Jelaskan Lebih Sederhana
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssistantAction('give_example');
                    setIsAssistantOpen(true);
                  }}
                  className="btn-secondary text-[11px] py-1 px-2.5"
                >
                  Beri Contoh Lain
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
              className="btn-primary text-xs py-2 px-4 shadow-subtle"
            >
              Coba Jelaskan Sendiri (Elaborasi)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: METHOD 06 — ELABORATION (EXPLAIN TO A PEER) ── */}
      {currentStep === 3 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>03 · ELABORASI & ANALOGI</span>
            <span>Feynman Technique</span>
          </div>

          <div className="space-y-2">
            <span className="badge-moss text-xs">Uji Pemahaman Mendalam</span>
            <h2 className="text-xl font-serif text-ink-950 font-medium">
              Bagaimana kamu menjelaskannya ke temanmu?
            </h2>
            <p className="text-xs sm:text-sm text-ink-700 font-serif leading-relaxed">
              Tuliskan penjelasan singkat dengan kalimatmu sendiri atau berikan contoh analogi sederhana.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              placeholder={`Contoh: "${selectedConcept.title} itu seperti..."`}
              value={elaborationInput}
              onChange={(e) => setElaborationInput(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 rounded p-3 text-xs sm:text-sm text-ink-900 focus:bg-paper-100 focus:border-moss-700 font-sans"
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
              <div className="p-4 bg-paper-100 rounded border border-moss-300 space-y-2 text-xs">
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
              className="btn-primary text-xs py-2 px-4 shadow-subtle"
            >
              Lanjut ke Latihan Soal
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: METHOD 03 & 04 — INTERLEAVED CHECK & FEEDBACK ── */}
      {currentStep === 4 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>04 · LATIHAN APLIKASI (INTERLEAVED)</span>
            <span>Strategi & Eksekusi</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-paper-50 rounded border border-paper-300 space-y-2">
              <span className="text-[10px] font-mono uppercase text-ink-500 font-semibold block">Soal Pemahaman</span>
              <p className="font-serif text-ink-950 text-sm sm:text-base font-medium">
                Manakah pernyataan di bawah ini yang paling tepat menggambarkan aplikasi dari <strong>{selectedConcept.title}</strong>?
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
                      ? 'bg-moss-100 border-moss-400 font-medium text-ink-950'
                      : 'bg-paper-50 border-paper-200 hover:bg-paper-100 text-ink-800'
                  }`}
                >
                  <span>{opt.text}</span>
                  {selectedOptionId === opt.id && <Check className="w-4 h-4 text-moss-800 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>

            {!isAnswerRevealed ? (
              <div className="flex justify-end pt-2">
                <button
                  disabled={!selectedOptionId}
                  onClick={() => setIsAnswerRevealed(true)}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  Kunci Jawaban & Ulas
                </button>
              </div>
            ) : (
              <div className="p-4 bg-moss-50 rounded border border-moss-300 text-xs space-y-1">
                <span className="font-semibold text-moss-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-moss-700" />
                  Jawaban Terverifikasi
                </span>
                <p className="font-serif text-ink-800 leading-relaxed">
                  Dalam ulangan atau ujian, soal sering kali tidak menanyakan teks definisi mentah, melainkan kemampuan membedakan contoh kasus nyata seperti di atas.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="btn-ghost text-xs py-2 px-3"
            >
              Kembali
            </button>
            <button
              disabled={!isAnswerRevealed}
              onClick={() => setCurrentStep(5)}
              className="btn-primary text-xs py-2 px-4 shadow-subtle disabled:opacity-50"
            >
              Cek Keyakinan Memori
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: METHOD 05 — METACOGNITIVE CALIBRATION ───── */}
      {currentStep === 5 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>05 · CEK METAKOGNITIF (KALIBRASI KEYAKINAN)</span>
            <span>Self-Monitoring</span>
          </div>

          <div className="space-y-3">
            <span className="badge-moss text-xs">Evaluasi Mandiri</span>
            <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium">
              Seberapa yakin kamu bisa menjawab soal ini besok tanpa melihat catatan?
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 font-serif leading-relaxed">
              Kalibrasi yang jujur membantu PAHAM menjadwalkan review pada waktu yang paling tepat.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <button
              onClick={() => setConfidenceLevel('low')}
              className={`p-4 rounded border text-center transition ${
                confidenceLevel === 'low' ? 'bg-terracotta-100 border-terracotta-400 font-bold text-terracotta-950' : 'bg-paper-50 border-paper-300 text-ink-800'
              }`}
            >
              <span className="block font-serif text-sm">Belum Yakin</span>
              <span className="text-[10px] text-ink-500 mt-1 block">Masih butuh bantuan</span>
            </button>
            <button
              onClick={() => setConfidenceLevel('medium')}
              className={`p-4 rounded border text-center transition ${
                confidenceLevel === 'medium' ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-paper-50 border-paper-300 text-ink-800'
              }`}
            >
              <span className="block font-serif text-sm">Lumayan Paham</span>
              <span className="text-[10px] text-ink-500 mt-1 block">Bisa dengan waktu</span>
            </button>
            <button
              onClick={() => setConfidenceLevel('high')}
              className={`p-4 rounded border text-center transition ${
                confidenceLevel === 'high' ? 'bg-moss-100 border-moss-400 font-bold text-moss-950' : 'bg-paper-50 border-paper-300 text-ink-800'
              }`}
            >
              <span className="block font-serif text-sm">Sangat Yakin</span>
              <span className="text-[10px] text-ink-500 mt-1 block">Siap diuji ujian</span>
            </button>
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
              className="btn-primary text-xs py-2 px-4 shadow-subtle disabled:opacity-50"
            >
              Tetapkan Jadwal FSRS
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 6: METHOD 02 — SPACED REPETITION (FSRS RATING) ── */}
      {currentStep === 6 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>06 · JADWAL PENGULANGAN MEMORI (FSRS)</span>
            <span>Simpan Status</span>
          </div>

          <div className="space-y-3">
            <span className="badge-moss text-xs">Selesai Belajar</span>
            <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium">
              Bagaimana tingkat kemudahan sesi ini?
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 font-serif leading-relaxed">
              PAHAM akan menghitung interval hari pengulangan berikutnya agar kamu tidak lupa sebelum ulangan:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <button
              onClick={() => handleRateFSRS(1)}
              className="p-3 rounded bg-paper-100 hover:bg-terracotta-100 border border-paper-300 text-xs text-center transition"
            >
              <span className="block font-medium text-terracotta-800 text-sm">Ulangi</span>
              <span className="text-[10px] text-ink-500">Besok (1 hari)</span>
            </button>
            <button
              onClick={() => handleRateFSRS(2)}
              className="p-3 rounded bg-paper-100 hover:bg-amber-100 border border-paper-300 text-xs text-center transition"
            >
              <span className="block font-medium text-amber-800 text-sm">Sulit</span>
              <span className="text-[10px] text-ink-500">2 hari lagi</span>
            </button>
            <button
              onClick={() => handleRateFSRS(3)}
              className="p-3 rounded bg-moss-50 hover:bg-moss-100 border border-moss-300 text-xs text-center transition"
            >
              <span className="block font-medium text-moss-900 text-sm">Paham</span>
              <span className="text-[10px] text-moss-700 font-bold">4 hari lagi</span>
            </button>
            <button
              onClick={() => handleRateFSRS(4)}
              className="p-3 rounded bg-paper-100 hover:bg-moss-100 border border-paper-300 text-xs text-center transition"
            >
              <span className="block font-medium text-moss-900 text-sm">Sangat Mudah</span>
              <span className="text-[10px] text-ink-500">7 hari lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* Grounded Study Assistant Drawer */}
      <StudyAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        concept={selectedConcept}
        initialAction={assistantAction}
      />

    </div>
  );
};
