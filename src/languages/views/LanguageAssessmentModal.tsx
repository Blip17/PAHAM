// Diagnostic Placement Assessment Modal for PAHAM Language Architecture
// Evaluates student across multi-level CEFR or GF0025 skill benchmarks

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  GraduationCap,
  Award,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { UniversalExercise, AssessmentDiagnosticResult } from '../core/types';
import { languageLearningEngine } from '../core/LanguageLearningEngine';

interface LanguageAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageId: string;
  onAssessmentCompleted?: (result: AssessmentDiagnosticResult) => void;
}

export const LanguageAssessmentModal: React.FC<LanguageAssessmentModalProps> = ({
  isOpen,
  onClose,
  languageId,
  onAssessmentCompleted,
}) => {
  const isMandarin = languageId === 'zh-CN';
  const langName = isMandarin ? 'Bahasa Mandarin' : 'Bahasa Inggris';

  const [questions, setQuestions] = useState<UniversalExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ exerciseId: string; userAnswer: string; isCorrect: boolean }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<AssessmentDiagnosticResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      const diagQuestions = languageLearningEngine.assessments.generateDiagnosticTest(languageId);
      setQuestions(diagQuestions);
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setDiagnosticResult(null);
    }
  }, [isOpen, languageId]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (option: string) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption || !currentQ) return;

    const isCorrect = Array.isArray(currentQ.correctAnswer)
      ? currentQ.correctAnswer.includes(selectedOption)
      : selectedOption.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    const newAnswers = [
      ...userAnswers,
      { exerciseId: currentQ.id, userAnswer: selectedOption, isCorrect },
    ];
    setUserAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Evaluate Diagnostic Benchmark
      const result = languageLearningEngine.assessments.evaluateDiagnostic(
        languageId,
        'user_active',
        newAnswers
      );
      setDiagnosticResult(result);
      if (onAssessmentCompleted) onAssessmentCompleted(result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-50 border border-moss-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-moss-100 bg-paper-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-moss-800" />
            <div>
              <h3 className="text-sm font-bold text-ink-900">
                Tes Penempatan Diagnostik {langName}
              </h3>
              <p className="text-[11px] text-ink-500 font-mono">
                {isMandarin ? 'Standar GF0025-2021' : 'Standar CEFR'} • Multi-Level Assessment
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
          {diagnosticResult ? (
            <div className="space-y-5">
              
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-base font-serif font-bold text-emerald-950">
                  Rekomendasi Level Memulai
                </h4>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-mono font-bold text-base shadow-sm">
                  {diagnosticResult.recommendedLevel}
                </div>
                <p className="text-xs text-emerald-900 font-sans max-w-md mx-auto pt-1">
                  Skor Akurasi: <strong>{diagnosticResult.totalScore} / {diagnosticResult.totalQuestions}</strong> ({Math.round((diagnosticResult.totalScore / Math.max(1, diagnosticResult.totalQuestions)) * 100)}%)
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200 space-y-1.5">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Domain Kuat:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-ink-700 space-y-1">
                    {diagnosticResult.strengths.length > 0
                      ? diagnosticResult.strengths.map((s, i) => <li key={i}>{s}</li>)
                      : <li>Semua domain masih berada pada level pemula.</li>}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200 space-y-1.5">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Area Perlu Penguatan:
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-ink-700 space-y-1">
                    {diagnosticResult.weaknesses.length > 0
                      ? diagnosticResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)
                      : <li>Pertahankan pemahaman yang seimbang.</li>}
                  </ul>
                </div>
              </div>

              {/* Study Path Recommendations */}
              <div className="p-4 rounded-xl bg-paper-100 border border-moss-200 space-y-2 text-xs">
                <span className="font-bold text-ink-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-moss-800" /> Rencana Belajar Personal:
                </span>
                <ul className="space-y-1 text-[11px] text-ink-700">
                  {diagnosticResult.studyPathRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-moss-800 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-moss-900 hover:bg-moss-950 text-white font-bold text-xs shadow-md transition"
              >
                Terapkan Level & Mulai Belajar
              </button>

            </div>
          ) : currentQ ? (
            <div className="space-y-4">
              
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-ink-500 font-mono">
                  <span>Soal {currentIndex + 1} dari {questions.length}</span>
                  <span>Tingkat: {currentQ.proficiencyLevel}</span>
                </div>
                <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-moss-700 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Character visual if Hanzi */}
              {currentQ.characterVisual && (
                <div className="py-4 px-4 bg-paper-100 border border-moss-200 rounded-xl text-center">
                  <span className="text-5xl font-serif text-ink-900 font-bold">
                    {currentQ.characterVisual}
                  </span>
                </div>
              )}

              {/* Prompt */}
              <div className="p-4 bg-paper-100/80 border border-moss-100 rounded-xl">
                <p className="text-sm font-semibold text-ink-900 leading-relaxed font-sans">
                  {currentQ.prompt}
                </p>
                {currentQ.contextSentence && (
                  <p className="text-xs text-ink-600 italic mt-2 border-t border-moss-100 pt-2 font-serif">
                    "{currentQ.contextSentence}"
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-moss-100 border-moss-600 text-moss-950 font-bold shadow-sm'
                          : 'bg-paper-50 border-moss-200 text-ink-800 hover:border-moss-400'
                      }`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-xs text-ink-500">
              Menyiapkan tes penempatan diagnostik...
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!diagnosticResult && (
          <div className="px-6 py-4 border-t border-moss-100 bg-paper-100 flex items-center justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="px-5 py-2.5 rounded-xl bg-moss-900 hover:bg-moss-950 disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>{currentIndex + 1 < questions.length ? 'Lanjut' : 'Selesaikan Tes'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
