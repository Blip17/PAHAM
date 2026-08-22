// Redesigned Adaptive Placement Assessment Modal for PAHAM Language Architecture
// Multidimensional skill-based diagnostic profile with confidence signals, school readiness, and FSRS seeding

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
  BookOpen,
  HelpCircle,
  Zap,
  Layers,
  Check,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { 
  AdaptivePlacementSession, 
  PlacementQuestion, 
  ConfidenceRating, 
  PlacementDiagnosticReport 
} from '../placement/types';
import { PahamMascot } from '../../components/mascot/PahamMascot';

interface LanguageAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageId: string;
  onAssessmentCompleted?: (report: PlacementDiagnosticReport) => void;
}

export const LanguageAssessmentModal: React.FC<LanguageAssessmentModalProps> = ({
  isOpen,
  onClose,
  languageId,
  onAssessmentCompleted,
}) => {
  const isMandarin = languageId === 'zh-CN';
  const langName = isMandarin ? 'Bahasa Mandarin' : 'Bahasa Inggris';

  const [session, setSession] = useState<AdaptivePlacementSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceRating>(3);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [diagnosticReport, setDiagnosticReport] = useState<PlacementDiagnosticReport | null>(null);
  const [previousReport, setPreviousReport] = useState<PlacementDiagnosticReport | null>(null);
  const [isApplyingBridge, setIsApplyingBridge] = useState(false);
  const [bridgeApplied, setBridgeApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function initSession() {
        const prev = await languageLearningEngine.assessments.storage.getLatestReport('user_active', languageId);
        setPreviousReport(prev);

        const newSession = languageLearningEngine.assessments.adaptive.createSession('user_active', languageId);
        setSession(newSession);

        const firstQ = languageLearningEngine.assessments.adaptive.selectNextQuestion(newSession);
        setCurrentQuestion(firstQ);

        setSelectedOption(null);
        setConfidence(3);
        setDiagnosticReport(null);
        setBridgeApplied(false);
        setStartTime(Date.now());
      }
      initSession();
    }
  }, [isOpen, languageId]);

  if (!isOpen) return null;

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
  };

  const handleNextQuestion = async () => {
    if (!session || !currentQuestion || !selectedOption) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Record answer in adaptive session
    const { isSessionComplete } = languageLearningEngine.assessments.adaptive.recordAnswer(
      session,
      currentQuestion.id,
      selectedOption,
      confidence,
      timeSpent
    );

    setSelectedOption(null);
    setConfidence(3);
    setStartTime(Date.now());

    if (isSessionComplete) {
      // Generate comprehensive diagnostic report
      const report = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session, previousReport || undefined);
      await languageLearningEngine.assessments.storage.saveReport(report);
      setDiagnosticReport(report);
      if (onAssessmentCompleted) onAssessmentCompleted(report);
    } else {
      const nextQ = languageLearningEngine.assessments.adaptive.selectNextQuestion(session);
      if (!nextQ) {
        // Fallback finish
        const report = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session, previousReport || undefined);
        await languageLearningEngine.assessments.storage.saveReport(report);
        setDiagnosticReport(report);
        if (onAssessmentCompleted) onAssessmentCompleted(report);
      } else {
        setCurrentQuestion(nextQ);
      }
    }
  };

  const handleApplyLearningPath = async () => {
    if (!diagnosticReport) return;
    setIsApplyingBridge(true);
    await languageLearningEngine.assessments.bridge.applyPlacementResults(diagnosticReport);
    setIsApplyingBridge(false);
    setBridgeApplied(true);
  };

  const confidenceOptions: { rating: ConfidenceRating; label: string; emoji: string }[] = [
    { rating: 1, label: 'Sangat Ragu', emoji: '😟' },
    { rating: 2, label: 'Ragu', emoji: '😕' },
    { rating: 3, label: 'Cukup Yakin', emoji: '😐' },
    { rating: 4, label: 'Yakin', emoji: '🙂' },
    { rating: 5, label: 'Sangat Yakin', emoji: '🤩' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-50 border border-moss-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-moss-100 bg-paper-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-moss-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <span>Tes Penempatan Adaptif {langName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-900 text-white">
                  {isMandarin ? 'GF0025-2021' : 'CEFR Multi-Skill'}
                </span>
              </h3>
              <p className="text-[11px] text-ink-500 font-sans">
                Diagnostik kompetensi adaptif berbasis bukti & keyakinan (confidence signals)
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-paper-50">
          {diagnosticReport ? (
            /* ── End-of-Test Diagnostic Profile Report ───────────────── */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Overall Estimated Level Hero */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-moss-900 to-ink-950 text-white border border-moss-800 text-center space-y-3 shadow-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono text-emerald-300 backdrop-blur-sm">
                  <Award className="w-3.5 h-3.5" />
                  <span>Hasil Diagnostik Resmi PAHAM</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-moss-200 block uppercase tracking-wider font-mono">
                    Estimasi Level Kemahiran Keseluruhan
                  </span>
                  <div className="text-4xl font-serif font-bold text-white tracking-tight">
                    {diagnosticReport.overallLevel}
                  </div>
                </div>

                <p className="text-xs text-moss-200 max-w-md mx-auto font-sans leading-relaxed">
                  {isMandarin
                    ? `Level kemahiran Mandarin Anda berada pada standar ${diagnosticReport.overallLevel} (${diagnosticReport.framework}).`
                    : `Estimasi level kemahiran Bahasa Inggris Anda berada pada jenjang CEFR ${diagnosticReport.overallLevel}.`}
                </p>

                {/* Re-placement Comparison Badge if previous exists */}
                {diagnosticReport.comparisonWithPrevious && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-mono">
                    <span className="text-moss-300">Tes Sebelumnya: {diagnosticReport.comparisonWithPrevious.previousOverallLevel}</span>
                    <span>→</span>
                    <span className="font-bold text-emerald-300">Sekarang: {diagnosticReport.overallLevel}</span>
                  </div>
                )}
              </div>

              {/* Decoupled Skill-by-Skill Breakdown Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-moss-800" />
                  <span>Peta Kompetensi Terpisah (Decoupled Skill Profile)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(diagnosticReport.skillEstimates).map(([skill, est]) => (
                    <div
                      key={skill}
                      className="p-3.5 rounded-2xl bg-paper-100 border border-moss-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-ink-800 truncate">
                          {skill}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-900 text-white">
                          {est.estimatedLevel}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${est.abilityScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-ink-500 font-mono">
                        <span>Skor: {est.abilityScore}%</span>
                        <span className={est.masteryStatus === 'MASTERED' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                          {est.masteryStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Misconceptions & Fragile Knowledge Alerts */}
              {diagnosticReport.misconceptions.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Miskonsepsi Terdeteksi (High Confidence + Wrong Answer):</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                    {diagnosticReport.misconceptions.map(m => (
                      <li key={m.id}>
                        <strong>{m.skill}:</strong> {m.explanation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* School Curriculum Readiness */}
              <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-moss-800" />
                    <span>Kesiapan Materi Sekolah ({diagnosticReport.schoolReadiness.grade}):</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Status: {diagnosticReport.schoolReadiness.status}
                  </span>
                </div>
                <p className="text-[11px] text-ink-600 font-sans leading-relaxed">
                  Siswa memiliki kesiapan yang kuat pada topik: <em>{diagnosticReport.schoolReadiness.matchingSchoolTopics.join(', ')}</em>.
                </p>
              </div>

              {/* Action Button: Apply Learning Path to FSRS & PAMI */}
              <div className="pt-2">
                <button
                  onClick={handleApplyLearningPath}
                  disabled={isApplyingBridge || bridgeApplied}
                  className="w-full py-3.5 rounded-2xl bg-moss-900 hover:bg-moss-950 disabled:bg-emerald-800 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  {bridgeApplied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Rencana Belajar & FSRS Memory Berhasil Diterapkan!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>🚀 Terapkan Jalur Belajar, FSRS Memory & Rekomendasi Pami</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : currentQuestion ? (
            /* ── Active Question Stepper ────────────────────────────── */
            <div className="space-y-5 animate-fadeIn">
              
              {/* Top Progress & Skill Indicator */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-moss-900 text-white">
                    Domain: {currentQuestion.testedSkill}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-paper-200 text-ink-700">
                    Target: {currentQuestion.targetLevel}
                  </span>
                </div>

                <span className="text-[11px] text-ink-500 font-mono">
                  Soal {(session?.attempts.length || 0) + 1} / {session?.maxQuestions || 8}
                </span>
              </div>

              {/* Hanzi Visual if present */}
              {currentQuestion.characterVisual && (
                <div className="py-6 px-4 bg-paper-100 border border-moss-200 rounded-2xl text-center shadow-sm">
                  <span className="text-6xl font-serif text-ink-900 font-bold tracking-widest">
                    {currentQuestion.characterVisual}
                  </span>
                </div>
              )}

              {/* Instruction & Prompt */}
              <div className="space-y-2">
                <p className="text-xs font-serif text-ink-600 font-medium">
                  {currentQuestion.instruction}
                </p>
                <div className="p-4 rounded-2xl bg-paper-100/90 border border-moss-200">
                  <p className="text-sm font-semibold text-ink-900 leading-relaxed font-sans">
                    {currentQuestion.prompt}
                  </p>
                  {currentQuestion.contextSentence && (
                    <p className="text-xs text-ink-600 italic mt-2.5 border-t border-moss-100 pt-2 font-serif">
                      "{currentQuestion.contextSentence}"
                    </p>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs transition flex items-center justify-between ${
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

              {/* Confidence Rating Selector */}
              {selectedOption && (
                <div className="p-3.5 rounded-2xl bg-paper-100 border border-moss-200 space-y-2 animate-fadeIn">
                  <label className="text-[11px] font-bold text-ink-700 block">
                    Seberapa yakin kamu dengan jawaban ini? (Confidence Signal):
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {confidenceOptions.map(item => (
                      <button
                        key={item.rating}
                        onClick={() => setConfidence(item.rating)}
                        className={`p-2 rounded-xl text-center border text-[10px] font-medium transition ${
                          confidence === item.rating
                            ? 'bg-moss-900 border-moss-950 text-white font-bold shadow-sm'
                            : 'bg-paper-50 border-moss-200 text-ink-700 hover:bg-paper-200'
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{item.emoji}</span>
                        <span className="truncate block">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ink-500 space-y-2">
              <Sparkles className="w-5 h-5 text-moss-700 animate-spin mx-auto" />
              <p>Mempersiapkan tes penempatan adaptif...</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!diagnosticReport && (
          <div className="px-6 py-4 border-t border-moss-100 bg-paper-100 flex items-center justify-between">
            <div className="text-[11px] text-ink-500 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Anti-Guessing Diagnostic Active</span>
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={!selectedOption}
              className="px-5 py-2.5 rounded-xl bg-moss-900 hover:bg-moss-950 disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
