// Interactive Language Practice Modal for PAHAM
// Supports Tone Pairs, Hanzi Recognition, Grammar Formulas, and FSRS Review Updates

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Volume2,
  RefreshCw,
  Award,
  Zap
} from 'lucide-react';
import { UniversalExercise, ExerciseAttemptResult } from '../core/types';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { PahamMascot } from '../../components/mascot/PahamMascot';

interface LanguagePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageId: string;
  level?: string;
  exerciseType?: string;
  onCompleted?: () => void;
}

export const LanguagePracticeModal: React.FC<LanguagePracticeModalProps> = ({
  isOpen,
  onClose,
  languageId,
  level,
  exerciseType,
  onCompleted,
}) => {
  const [exercises, setExercises] = useState<UniversalExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptResult, setAttemptResult] = useState<ExerciseAttemptResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [scoreCount, setScoreCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const pool = languageLearningEngine.exercises.getExercises(
        languageId,
        level,
        undefined,
        exerciseType as any
      );
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      setExercises(shuffled.length > 0 ? shuffled : pool);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAttemptResult(null);
      setScoreCount(0);
      setIsFinished(false);
      setShowHint(false);
      setStartTime(Date.now());
    }
  }, [isOpen, languageId, level, exerciseType]);

  if (!isOpen) return null;

  const currentExercise = exercises[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (attemptResult) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || !currentExercise || attemptResult) return;
    setIsEvaluating(true);

    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const result = languageLearningEngine.exercises.evaluateAttempt(
      currentExercise.id,
      selectedOption,
      timeSpent
    );

    setAttemptResult(result);
    if (result.isCorrect) {
      setScoreCount(prev => prev + 1);
    }

    // Record FSRS Spaced Repetition Rating
    const fsrsRating = result.isCorrect ? (timeSpent < 6 ? 4 : 3) : 1;
    languageLearningEngine.reviews.recordReview(
      'user_active',
      languageId,
      currentExercise.skillType === 'CHARACTERS' ? 'CHARACTER' : 'VOCABULARY',
      currentExercise.id,
      fsrsRating,
      currentExercise.proficiencyLevel
    );

    // Record Skill Competency Evidence
    const compId = currentExercise.metadata?.competencyId;
    if (compId) {
      languageLearningEngine.skills.recordEvidence(compId, result.isCorrect);
    }

    setIsEvaluating(false);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAttemptResult(null);
      setShowHint(false);
      setStartTime(Date.now());
    } else {
      setIsFinished(true);
      if (onCompleted) onCompleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-50 border border-moss-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-moss-100 bg-paper-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{languageId === 'zh-CN' ? '🇨🇳' : '🇬🇧'}</span>
            <div>
              <h3 className="text-sm font-bold text-ink-900">
                {languageId === 'zh-CN' ? 'Latihan Bahasa Mandarin' : 'English Practice Session'}
              </h3>
              <p className="text-[11px] text-ink-500 font-mono">
                {currentExercise?.proficiencyLevel || 'Level 1'} • Soal {currentIndex + 1} dari {exercises.length || 1}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-500 hover:text-ink-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isFinished ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-serif font-bold text-ink-900">Sesi Latihan Selesai!</h4>
              <p className="text-xs text-ink-600 max-w-sm mx-auto">
                Skor Anda: <strong className="text-emerald-700 text-sm font-mono">{scoreCount} / {exercises.length}</strong> ({Math.round((scoreCount / Math.max(1, exercises.length)) * 100)}%). Seluruh hasil latihan otomatis disinkronkan ke FSRS Memory Engine!
              </p>

              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-moss-900 hover:bg-moss-950 text-white font-bold text-xs shadow-md transition"
              >
                Selesai & Kembali ke Hub
              </button>
            </div>
          ) : currentExercise ? (
            <div className="space-y-4">
              
              {/* Instruction */}
              <div className="text-xs font-serif text-ink-700 font-medium">
                {currentExercise.instruction}
              </div>

              {/* Character visual if Hanzi */}
              {currentExercise.characterVisual && (
                <div className="py-6 px-4 bg-paper-100 border border-moss-200 rounded-xl text-center">
                  <span className="text-6xl font-serif text-ink-900 font-bold tracking-widest">
                    {currentExercise.characterVisual}
                  </span>
                </div>
              )}

              {/* Prompt */}
              <div className="p-4 bg-paper-100/70 border border-moss-100 rounded-xl">
                <p className="text-sm font-semibold text-ink-900 leading-relaxed font-sans">
                  {currentExercise.prompt}
                </p>
                {currentExercise.contextSentence && (
                  <p className="text-xs text-ink-600 italic mt-2 border-t border-moss-100 pt-2 font-serif">
                    "{currentExercise.contextSentence}"
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentExercise.options?.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  let btnStyle = 'bg-paper-50 border-moss-200 text-ink-800 hover:border-moss-400';

                  if (attemptResult) {
                    if (opt === currentExercise.correctAnswer) {
                      btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected && !attemptResult.isCorrect) {
                      btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                    } else {
                      btnStyle = 'bg-paper-100 opacity-60 border-paper-200 text-ink-400';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-moss-100 border-moss-600 text-moss-950 font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={Boolean(attemptResult)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {attemptResult && opt === currentExercise.correctAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Hint Toggle */}
              {!attemptResult && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-[11px] text-moss-800 hover:text-moss-950 flex items-center gap-1 font-medium transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Sembunyikan Petunjuk' : 'Butuh Petunjuk Piko?'}</span>
                  </button>
                  {showHint && (
                    <p className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-serif">
                      💡 <strong>Petunjuk:</strong> {currentExercise.hint}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback Banner */}
              {attemptResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fadeIn ${
                  attemptResult.isCorrect 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {attemptResult.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{attemptResult.isCorrect ? 'Benar Sekali!' : 'Perlu Diperbaiki'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{attemptResult.feedbackText}</p>
                </div>
              )}

            </div>
          ) : (
            <div className="py-8 text-center text-xs text-ink-500">
              Belum ada soal latihan untuk kombinasi filter ini.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isFinished && (
          <div className="px-6 py-4 border-t border-moss-100 bg-paper-100 flex items-center justify-between">
            <div className="text-[11px] text-ink-500 font-mono">
              FSRS Memory Sync Active
            </div>

            <div>
              {!attemptResult ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption || isEvaluating}
                  className="px-5 py-2.5 rounded-xl bg-moss-900 hover:bg-moss-950 disabled:opacity-40 text-white font-bold text-xs shadow-md transition"
                >
                  Periksa Jawaban
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>{currentIndex + 1 < exercises.length ? 'Soal Berikutnya' : 'Lihat Hasil'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
