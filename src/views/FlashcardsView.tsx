// Flashcards View for PAHAM
// First-class Spaced Repetition Flashcard runner powered by FSRS engine and grounded in student school materials

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  Eye,
  Filter,
  Flame,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';
import { Flashcard, FlashcardMode, FSRSRating, Subject, Concept } from '../core/types';
import { flashcardService } from '../learning/flashcards/flashcardService';

interface FlashcardsViewProps {
  initialConceptId?: string;
  onStartLearnConcept?: (conceptId: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  initialConceptId,
  onStartLearnConcept,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<FlashcardMode>('DUE');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [reviewedInSession, setReviewedInSession] = useState<number>(0);
  const [lastRatedInterval, setLastRatedInterval] = useState<string | null>(null);

  // Load cards and subjects
  useEffect(() => {
    async function loadFlashcards() {
      setIsLoading(true);
      const subs = await db.subjects.toArray();
      const concs = await db.concepts.toArray();
      setSubjects(subs);
      setAllConcepts(concs);

      const loaded = await flashcardService.getCardsByMode(
        selectedMode,
        initialConceptId,
        selectedSubjectId === 'all' ? undefined : selectedSubjectId
      );

      setCards(loaded);
      setCurrentIndex(0);
      setIsRevealed(false);
      setShowHint(false);
      setSessionCompleted(false);
      setIsLoading(false);
    }
    loadFlashcards();
  }, [selectedMode, selectedSubjectId, initialConceptId]);

  const currentCard = cards[currentIndex];

  const handleRate = async (rating: FSRSRating) => {
    if (!currentCard) return;

    const { intervalDays } = await flashcardService.rateFlashcard(currentCard, rating);
    const intervalLabel = flashcardService.formatIntervalLabel(rating, intervalDays);
    setLastRatedInterval(intervalLabel);

    setReviewedInSession(prev => prev + 1);

    if (currentIndex < cards.length - 1) {
      setIsRevealed(false);
      setShowHint(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      setSessionCompleted(true);
    }
  };

  const handleRestart = async () => {
    const loaded = await flashcardService.getCardsByMode(selectedMode, initialConceptId, selectedSubjectId === 'all' ? undefined : selectedSubjectId);
    setCards(loaded);
    setCurrentIndex(0);
    setIsRevealed(false);
    setShowHint(false);
    setSessionCompleted(false);
    setReviewedInSession(0);
    setLastRatedInterval(null);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif">
        Menyiapkan tumpukan kartu flashcard...
      </div>
    );
  }

  // Count queues
  const dueCount = cards.filter(c => new Date(c.fsrs.due) <= new Date()).length;
  const currentConcept = allConcepts.find(c => c.id === currentCard?.conceptId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* ── Editorial Header & Mode Switcher ─────────────────── */}
      <header className="border-b border-paper-300 pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Spaced Repetition Flashcards
            </span>
            <h1 className="text-3xl font-serif text-ink-950 font-normal mt-0.5">
              Flashcard Belajar
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-paper-100 border border-paper-300 rounded px-2.5 py-1.5 text-xs text-ink-900 font-medium"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Queue Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setSelectedMode('DUE')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              selectedMode === 'DUE' ? 'bg-moss-900 text-paper-50 font-bold' : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Jatuh Tempo (Due)
          </button>
          <button
            onClick={() => setSelectedMode('WEAK')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              selectedMode === 'WEAK' ? 'bg-moss-900 text-paper-50 font-bold' : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Perlu Penguatan (Weak)
          </button>
          <button
            onClick={() => setSelectedMode('NEW')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              selectedMode === 'NEW' ? 'bg-moss-900 text-paper-50 font-bold' : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Kartu Baru (New)
          </button>
          <button
            onClick={() => setSelectedMode('TOPIC')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              selectedMode === 'TOPIC' ? 'bg-moss-900 text-paper-50 font-bold' : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Semua Kartu ({cards.length})
          </button>
        </div>
      </header>

      {/* ── FLASHCARD RUNNER ─────────────────────────────────── */}
      {!sessionCompleted && currentCard ? (
        <div className="space-y-5">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-mono text-ink-500">
            <span className="font-semibold text-moss-900">
              KARTU {currentIndex + 1} / {cards.length}
            </span>
            <span>
              {currentCard.conceptTitle || 'Konsep Belajar'}
            </span>
          </div>

          <div className="w-full h-1 bg-paper-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-moss-700 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Large Hero Flashcard Surface */}
          <div
            onClick={() => {
              if (!isRevealed) setIsRevealed(true);
            }}
            className={`paper-sheet p-8 sm:p-12 min-h-[320px] flex flex-col justify-between border-2 cursor-pointer transition-all duration-300 select-none relative ${
              isRevealed 
                ? 'border-moss-700 bg-paper-50 shadow-md' 
                : 'border-paper-300 bg-paper-50 hover:border-paper-400 shadow-sm'
            }`}
          >
            {/* Top Card Badge */}
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-500">
              <span className="uppercase tracking-wider">
                {isRevealed ? 'JAWABAN (BACK)' : 'PERTANYAAN (FRONT)'}
              </span>
              {currentCard.sourceReferences && currentCard.sourceReferences[0] && (
                <span className="flex items-center gap-1 text-ink-600">
                  <BookOpen className="w-3.5 h-3.5" />
                  {currentCard.sourceReferences[0].materialTitle} (Hal {currentCard.sourceReferences[0].pageNumber})
                </span>
              )}
            </div>

            {/* Central Content */}
            <div className="py-6 space-y-4 text-center">
              {!isRevealed ? (
                <h2 className="text-xl sm:text-2xl font-serif text-ink-950 font-medium leading-relaxed max-w-lg mx-auto">
                  {currentCard.front}
                </h2>
              ) : (
                <div className="space-y-3 max-w-lg mx-auto animate-fadeIn">
                  <p className="text-lg sm:text-xl font-serif text-ink-950 font-normal leading-relaxed whitespace-pre-line border-b border-paper-200 pb-3">
                    {currentCard.back}
                  </p>
                  {currentConcept?.example && (
                    <p className="text-xs text-ink-600 font-serif italic">
                      Contoh: "{currentConcept.example}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Card Action / Hint */}
            <div className="flex items-center justify-between pt-4 border-t border-paper-200 text-xs">
              {!isRevealed ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(!showHint);
                    }}
                    className="text-ink-500 hover:text-moss-800 font-mono text-[11px] flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHint ? currentCard.hint : 'Lihat Petunjuk'}
                  </button>
                  <span className="text-ink-400 font-mono text-[11px]">
                    Ketuk kartu untuk melihat jawaban →
                  </span>
                </>
              ) : (
                <span className="text-moss-800 font-mono text-[11px] mx-auto">
                  Pilih tingkat kemudahan mengingat di bawah untuk menjadwalkan FSRS:
                </span>
              )}
            </div>
          </div>

          {/* FSRS Rating Buttons (Shown on Reveal) */}
          {isRevealed && (
            <div className="space-y-2 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleRate(1)}
                  className="p-3 rounded bg-paper-100 hover:bg-terracotta-100 border border-paper-300 text-center transition"
                >
                  <span className="block font-medium text-terracotta-900 text-xs sm:text-sm">Ulangi</span>
                  <span className="text-[10px] text-ink-500 font-mono">Besok (1d)</span>
                </button>
                <button
                  onClick={() => handleRate(2)}
                  className="p-3 rounded bg-paper-100 hover:bg-amber-100 border border-paper-300 text-center transition"
                >
                  <span className="block font-medium text-amber-900 text-xs sm:text-sm">Sulit</span>
                  <span className="text-[10px] text-ink-500 font-mono">2 hari lagi</span>
                </button>
                <button
                  onClick={() => handleRate(3)}
                  className="p-3 rounded bg-moss-50 hover:bg-moss-100 border border-moss-300 text-center transition"
                >
                  <span className="block font-medium text-moss-900 text-xs sm:text-sm font-bold">Paham</span>
                  <span className="text-[10px] text-moss-700 font-mono font-semibold">4 hari lagi</span>
                </button>
                <button
                  onClick={() => handleRate(4)}
                  className="p-3 rounded bg-paper-100 hover:bg-moss-100 border border-paper-300 text-center transition"
                >
                  <span className="block font-medium text-moss-900 text-xs sm:text-sm">Sangat Mudah</span>
                  <span className="text-[10px] text-ink-500 font-mono">7 hari lagi</span>
                </button>
              </div>
            </div>
          )}

        </div>
      ) : sessionCompleted ? (
        /* ── SESSION COMPLETED SUMMARY ────────────────────────── */
        <div className="paper-sheet p-8 sm:p-10 text-center space-y-5 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-moss-100 text-moss-900 flex items-center justify-center mx-auto border border-moss-300">
            <CheckCircle2 className="w-6 h-6 text-moss-800" />
          </div>
          
          <div>
            <h2 className="text-2xl font-serif text-ink-950 font-medium">
              Sesi Flashcard Selesai!
            </h2>
            <p className="text-sm text-ink-600 font-serif mt-1">
              Kamu telah mereview {reviewedInSession} kartu. Jadwal memori FSRS telah diperbarui secara otomatis.
            </p>
          </div>

          {lastRatedInterval && (
            <div className="p-3 bg-paper-100 rounded border border-paper-200 text-xs font-mono text-ink-700 max-w-xs mx-auto">
              Jadwal Review Berikutnya: {lastRatedInterval}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Review Ulang
            </button>

            {onStartLearnConcept && currentCard && (
              <button
                onClick={() => onStartLearnConcept(currentCard.conceptId)}
                className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
              >
                <span>Buka Modul Belajar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── EMPTY STATE ─────────────────────────────────────── */
        <div className="paper-sheet p-10 text-center space-y-4 font-serif text-ink-600">
          <Layers className="w-10 h-10 text-ink-400 mx-auto" />
          <div>
            <h3 className="text-lg text-ink-900 font-medium">Tidak ada kartu pada filter ini.</h3>
            <p className="text-xs text-ink-500 mt-1">
              Semua review jatuh tempo sudah selesai untuk saat ini.
            </p>
          </div>
          <button
            onClick={() => setSelectedMode('TOPIC')}
            className="btn-secondary text-xs py-2 px-4"
          >
            Lihat Semua Kartu Materi
          </button>
        </div>
      )}

    </div>
  );
};
