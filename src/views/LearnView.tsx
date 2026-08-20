// Learn Canvas for PAHAM
// Active learning canvas with step-by-step recall and self-explanation (Not a chat interface)

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Clock,
  Check,
  AlertCircle
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

  // Active Learning Step (1: Definisi Dasar, 2: Contoh Nyata, 3: Active Recall / Self-Explanation, 4: Quick Application, 5: FSRS Rating)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selfExplanationInput, setSelfExplanationInput] = useState<string>('');
  const [isAnalyzingExplanation, setIsAnalyzingExplanation] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnswerAnalysisResult | null>(null);
  
  // Quick Application Check Question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Study Assistant Drawer ("Teman Belajar") State
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

  const handleAnalyzeExplanation = async () => {
    if (!selectedConcept || !selfExplanationInput.trim()) return;
    setIsAnalyzingExplanation(true);

    const result = await ai.analyzeAnswer({
      questionPrompt: `Jelaskan apa itu ${selectedConcept.title} dan bagaimana cara memahaminya?`,
      expectedAnswer: selectedConcept.definition,
      studentAnswer: selfExplanationInput,
      concept: selectedConcept,
    });

    setAnalysisResult(result);
    setIsAnalyzingExplanation(false);
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
      metadata: { rating, stability: updatedCard.stability },
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {}

    onFinishSession();
  };

  if (!selectedConcept) {
    return (
      <div className="py-20 text-center text-ink-500 font-serif">
        Pilih konsep untuk mulai belajar.
      </div>
    );
  }

  const subject = getSubject(selectedConcept.subjectId);
  const chapter = getChapter(selectedConcept.chapterId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Header & Context */}
      <div className="flex items-center justify-between border-b border-paper-300 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
            {subject?.name || 'Pelajaran'} · {chapter?.title.split('—')[0]}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium">
            {selectedConcept.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTimer(selectedConcept.title, 8)}
            className="btn-secondary text-xs py-1.5 px-3 font-mono"
            title="Buka timer belajar"
          >
            <Clock className="w-3.5 h-3.5 text-moss-800" />
            08:00
          </button>
          <span className="text-xs font-mono bg-paper-200 text-ink-700 px-2 py-1 rounded">
            Langkah 0{currentStep} / 04
          </span>
        </div>
      </div>

      {/* STEP 1: DEFINISI MATERI & SUMBER RUJUKAN */}
      {currentStep === 1 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>01 · PEMAHAMAN DASAR</span>
            {selectedConcept.sources.length > 0 && (
              <span className="text-moss-800">
                📄 {selectedConcept.sources[0].snippet ? 'Dari Catatan Guru' : 'Materi Terdaftar'}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl text-ink-950 font-medium leading-relaxed">
              "{selectedConcept.definition}"
            </h3>

            {/* Grounding Reference */}
            {selectedConcept.sources.length > 0 && (
              <div className="bg-paper-100 p-3.5 rounded border border-paper-200 text-xs text-ink-700 space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 font-semibold block">
                  Rujukan Catatan:
                </span>
                <p className="font-mono text-[11px] text-ink-800">
                  {selectedConcept.sources[0].snippet}
                </p>
                <span className="text-[10px] text-moss-800 block">
                  Halaman {selectedConcept.sources[0].pageNumber} · Catatan Guru
                </span>
              </div>
            )}

            {/* Key Pointers */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-ink-800 uppercase tracking-wider block">
                Poin Kunci yang Harus Diingat:
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

            {/* Contextual Study Assistant Bar */}
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
                    setAssistantAction('give_hint');
                    setIsAssistantOpen(true);
                  }}
                  className="btn-secondary text-[11px] py-1 px-2.5"
                >
                  Kasih Petunjuk
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-paper-200 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="btn-primary text-xs py-2 px-4"
            >
              Lihat Contoh Konkret
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTOH NYATA & ILUSTRASI */}
      {currentStep === 2 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>02 · CONTOH KONKRET</span>
            <span>Konteks Soal / Keseharian</span>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider block">
              Contoh Kasus:
            </span>
            <div className="p-4 rounded bg-moss-50 border border-moss-200 text-ink-900 text-sm sm:text-base font-serif leading-relaxed italic">
              "{selectedConcept.example}"
            </div>

            <p className="text-xs sm:text-sm text-ink-700 leading-relaxed font-sans">
              Dalam ulangan atau ujian, pertanyaan sering kali tidak menanyakan definisi secara mentah, melainkan menguji kemampuanmu mengidentifikasi contoh seperti di atas.
            </p>

            {/* Contextual Study Assistant Trigger */}
            <div className="p-3 bg-paper-100 rounded border border-paper-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-ink-600 font-serif flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-moss-800" />
                Mau contoh kasus lain?
              </span>
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

          <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="btn-ghost text-xs py-2 px-3"
            >
              Kembali
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="btn-primary text-xs py-2 px-4"
            >
              Coba Jelaskan Sendiri
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ACTIVE RECALL / SELF-EXPLANATION */}
      {currentStep === 3 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>03 · ACTIVE RECALL</span>
            <span>Uji Pemahaman Sendiri</span>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-lg text-ink-950 font-medium">
              Coba jelaskan dengan kata-katamu sendiri:
            </h3>
            <p className="text-xs sm:text-sm text-ink-600 font-serif">
              Apa inti dari <strong>{selectedConcept.title}</strong> dan bagaimana cara membedakannya agar tidak tertukar saat ulangan?
            </p>

            <textarea
              rows={4}
              value={selfExplanationInput}
              onChange={(e) => setSelfExplanationInput(e.target.value)}
              placeholder="Tulis penjelasan singkatmu di sini (misal: Penokohan adalah cara pengarang menggambarkan sifat...)"
              className="w-full bg-paper-100 border border-paper-300 rounded p-3 text-xs sm:text-sm text-ink-900 focus:bg-paper-50 focus:border-moss-700 leading-relaxed"
            />

            {!analysisResult && (
              <button
                onClick={handleAnalyzeExplanation}
                disabled={!selfExplanationInput.trim() || isAnalyzingExplanation}
                className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
              >
                {isAnalyzingExplanation ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">Menganalisis penjelasanmu...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-moss-200" />
                    Periksa Pemahamanku
                  </span>
                )}
              </button>
            )}

            {/* Smart Evaluation Feedback Box */}
            {analysisResult && (
              <div className={`p-4 rounded border text-xs sm:text-sm space-y-2 ${
                analysisResult.isCorrect 
                  ? 'bg-moss-50 border-moss-200 text-moss-950' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {analysisResult.isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-moss-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                  )}
                  <span>{analysisResult.isCorrect ? 'Pemahaman Tepat!' : 'Perlu Diperjelas'}</span>
                </div>
                <p className="leading-relaxed">{analysisResult.feedbackText}</p>
                {analysisResult.misconceptionIdentified && (
                  <p className="text-xs text-amber-900 font-medium">
                    ⚠ Catatan: {analysisResult.misconceptionIdentified}
                  </p>
                )}
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
              className="btn-primary text-xs py-2 px-4"
            >
              Lanjut ke Cek Cepat
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: QUICK APPLICATION CHECK & FSRS SCHEDULE RATING */}
      {currentStep === 4 && (
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono pb-2 border-b border-paper-200">
            <span>04 · PENERAPAN CEPAT & FSRS</span>
            <span>Simpan ke Memori Jangka Panjang</span>
          </div>

          {/* Quick Scenario Question */}
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold">
              Pertanyaan Penguji:
            </p>
            <p className="text-sm sm:text-base font-serif text-ink-950 leading-relaxed">
              Jika dalam sebuah cerita narator langsung menulis: <em>"Budi adalah anak yang sangat penyabar dan jarang marah,"</em> metode penggambaran watak tersebut adalah...
            </p>

            <div className="space-y-2">
              {[
                { id: 'opt-1', text: 'Metode Analitik (Penggambaran langsung oleh pengarang)', isCorrect: true },
                { id: 'opt-2', text: 'Metode Dramatik (Melalui dialog atau perilaku)', isCorrect: false },
                { id: 'opt-3', text: 'Bukan penokohan melainkan alur maju', isCorrect: false },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedOptionId(opt.id);
                    setIsAnswerRevealed(true);
                  }}
                  className={`w-full p-3 rounded border text-left text-xs sm:text-sm transition flex items-center justify-between ${
                    isAnswerRevealed
                      ? opt.isCorrect
                        ? 'bg-moss-100 border-moss-700 text-moss-950 font-medium'
                        : selectedOptionId === opt.id
                        ? 'bg-terracotta-100 border-terracotta-400 text-terracotta-900'
                        : 'border-paper-200 opacity-60'
                      : 'border-paper-300 hover:bg-paper-100 text-ink-800'
                  }`}
                >
                  <span>{opt.text}</span>
                  {isAnswerRevealed && opt.isCorrect && (
                    <Check className="w-4 h-4 text-moss-700 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {isAnswerRevealed && (
              <div className="p-3 bg-paper-100 rounded border border-paper-200 text-xs text-ink-700 leading-relaxed font-serif">
                Tepat sekali! Karena pengarang langsung menyebutkan sifat "penyabar" secara tersurat, ini adalah teknik <strong>analitik</strong>.
              </div>
            )}
          </div>

          {/* FSRS Memory Rating Buttons */}
          <div className="pt-6 border-t border-paper-200 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-600 block text-center">
              Seberapa mudah kamu mengingat materi ini?
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleRateFSRS(1)}
                className="p-2.5 rounded bg-paper-100 hover:bg-terracotta-100 border border-paper-300 text-xs text-center transition"
              >
                <span className="block font-medium text-terracotta-800">Ulangi</span>
                <span className="text-[10px] text-ink-400">Besok (1d)</span>
              </button>
              <button
                onClick={() => handleRateFSRS(2)}
                className="p-2.5 rounded bg-paper-100 hover:bg-amber-100 border border-paper-300 text-xs text-center transition"
              >
                <span className="block font-medium text-amber-800">Sulit</span>
                <span className="text-[10px] text-ink-400">2 hari (2d)</span>
              </button>
              <button
                onClick={() => handleRateFSRS(3)}
                className="p-2.5 rounded bg-moss-50 hover:bg-moss-100 border border-moss-300 text-xs text-center transition"
              >
                <span className="block font-medium text-moss-900">Paham</span>
                <span className="text-[10px] text-moss-700">4 hari (4d)</span>
              </button>
              <button
                onClick={() => handleRateFSRS(4)}
                className="p-2.5 rounded bg-paper-100 hover:bg-moss-100 border border-paper-300 text-xs text-center transition"
              >
                <span className="block font-medium text-moss-900">Sangat Mudah</span>
                <span className="text-[10px] text-ink-400">7 hari (7d)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grounded Study Assistant Panel */}
      <StudyAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        concept={selectedConcept}
        initialAction={assistantAction}
      />

    </div>
  );
};
