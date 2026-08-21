// Quiz View for PAHAM
// Multi-mode active recall engine with Quick, Topic, Weakness, Review, and Adaptive Generator modes

import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  BookOpen,
  Sparkles,
  Layers,
  Filter,
  Flame,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';
import { Question, Concept, MistakeRecord, QuestionOption, StudentConceptState, StudyAssistantAction, SkillType } from '../core/types';
import { ai } from '../services/ai/aiProvider';
import { StudyAssistantDrawer } from '../components/study/StudyAssistantDrawer';
import { adaptiveQuestionEngine, AdaptiveSessionState } from '../learning/engine/adaptiveQuestionEngine';
import { flashcardService } from '../learning/flashcards/flashcardService';
import { PahamMascot } from '../components/mascot/PahamMascot';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

interface QuizViewProps {
  initialConceptId?: string;
  onFinishQuiz: () => void;
  onStartLearnConcept: (conceptId: string) => void;
}

type QuizMode = 'adaptive' | 'quick' | 'topic' | 'weakness' | 'review' | 'generate';

export const QuizView: React.FC<QuizViewProps> = ({
  initialConceptId,
  onFinishQuiz,
  onStartLearnConcept,
}) => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [studentStates, setStudentStates] = useState<StudentConceptState[]>([]);
  
  const [quizMode, setQuizMode] = useState<QuizMode>('adaptive');
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>(initialConceptId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [mistakesMade, setMistakesMade] = useState<Array<{ question: Question; conceptTitle: string; userOptionText: string }>>([]);

  // Adaptive Engine State
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveSessionState | null>(null);
  const [adaptiveMicrocopy, setAdaptiveMicrocopy] = useState<string>('Soal pertama menguji pemahaman dasar.');

  // Study Assistant Drawer State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantConcept, setAssistantConcept] = useState<Concept | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState<Question | undefined>(undefined);
  const [assistantAnswerGiven, setAssistantAnswerGiven] = useState<string | undefined>(undefined);
  const [assistantMistake, setAssistantMistake] = useState<MistakeRecord | undefined>(undefined);

  // Dynamic question generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      const concs: Concept[] = await db.concepts.toArray();
      const qs: Question[] = await db.questions.toArray();
      const states: StudentConceptState[] = await db.studentConceptStates.toArray();

      setConcepts(concs);
      setAllQuestions(qs);
      setStudentStates(states);

      filterQuestionsByMode('quick', initialConceptId, qs, concs, states);
    }
    loadData();
  }, [initialConceptId]);

  const filterQuestionsByMode = (
    mode: QuizMode, 
    conceptId: string | undefined, 
    qs: Question[], 
    concs: Concept[], 
    states: StudentConceptState[]
  ) => {
    let filtered: Question[] = [];
    const stateMap = new Map(states.map(s => [s.conceptId, s]));

    if (mode === 'topic' && conceptId) {
      filtered = qs.filter(q => q.conceptId === conceptId);
    } else if (mode === 'weakness') {
      const weakConceptIds = new Set(
        states.filter(s => s.masteryScore < 0.7 || s.commonMistakes.length > 0).map(s => s.conceptId)
      );
      filtered = qs.filter(q => weakConceptIds.has(q.conceptId));
    } else if (mode === 'review') {
      const dueConceptIds = new Set(
        states.filter(s => new Date(s.fsrs.due) <= new Date()).map(s => s.conceptId)
      );
      filtered = qs.filter(q => dueConceptIds.has(q.conceptId));
    }

    if (filtered.length === 0) {
      filtered = qs.slice(0, 5);
    }

    setActiveQuestions(filtered);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setUserScore(0);
    setMistakesMade([]);
    setQuizFinished(false);
  };

  const handleModeChange = (newMode: QuizMode) => {
    setQuizMode(newMode);
    filterQuestionsByMode(newMode, selectedConceptId, allQuestions, concepts, studentStates);
  };

  const handleGenerateAdaptiveQuestion = async () => {
    const targetConcept = concepts.find(c => c.id === (selectedConceptId || concepts[0]?.id)) || concepts[0];
    if (!targetConcept) return;
    setIsGenerating(true);

    // Resolve real subject and chapter names from DB
    let subjectName = 'Mata Pelajaran';
    let chapterTitle = 'Materi Pokok';
    try {
      const sub = await db.subjects.get(targetConcept.subjectId);
      const chap = await db.chapters.get(targetConcept.chapterId);
      if (sub) subjectName = sub.name;
      if (chap) chapterTitle = chap.title;
    } catch {}

    try {
      const newQuestion = await ai.generateQuestion({
        subjectName,
        chapterTitle,
        conceptTitle: targetConcept.title,
        conceptDefinition: targetConcept.definition,
        difficulty: targetConcept.difficultyLevel || 3,
        questionType: 'multiple_choice',
      });

      // Assign real IDs before saving
      newQuestion.subjectId = targetConcept.subjectId;
      newQuestion.chapterId = targetConcept.chapterId;
      newQuestion.conceptId = targetConcept.id;

      await db.questions.add(newQuestion);
      setAllQuestions(prev => [newQuestion, ...prev]);
      setActiveQuestions([newQuestion]);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setIsAnswered(false);
      setUserScore(0);
      setQuizFinished(false);
    } catch (err) {
      console.error('Failed to generate adaptive question', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = activeQuestions[currentIndex];
  const conceptMap = new Map(concepts.map((c: Concept) => [c.id, c]));

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optId);
  };

  const handleConfirmAnswer = async () => {
    if (!currentQ || !selectedOptionId || isAnswered) return;
    setIsAnswered(true);

    const chosenOption = currentQ.options?.find((o: QuestionOption) => o.id === selectedOptionId);
    const isCorrect = Boolean(chosenOption?.isCorrect);

    if (isCorrect) {
      setUserScore(prev => prev + 1);
    } else {
      // Record mistake
      const conc = conceptMap.get(currentQ.conceptId);
      const correctOpt = currentQ.options?.find((o: QuestionOption) => o.isCorrect);

      const mistake: MistakeRecord = {
        id: `mst-${Date.now()}`,
        conceptId: currentQ.conceptId,
        conceptTitle: conc?.title || 'Materi',
        subjectId: currentQ.subjectId,
        questionPrompt: currentQ.prompt,
        userGivenAnswer: chosenOption?.text || '',
        correctAnswer: correctOpt?.text || '',
        misconceptionDescription: currentQ.misconceptionAlert || 'Kekeliruan identifikasi konsep materi.',
        dateOccurred: new Date().toISOString(),
        isResolved: false,
      };

      await db.mistakeRecords.add(mistake);
      setMistakesMade(prev => [...prev, {
        question: currentQ,
        conceptTitle: conc?.title || 'Materi',
        userOptionText: chosenOption?.text || '',
      }]);
    }

    // Record question stat
    await db.questions.update(currentQ.id, {
      timesAnswered: (currentQ.timesAnswered || 0) + 1,
      timesCorrect: (currentQ.timesCorrect || 0) + (isCorrect ? 1 : 0),
    });

    await db.learningEvents.add({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'QUESTION_ANSWERED',
      conceptId: currentQ.conceptId,
      metadata: { isCorrect, questionId: currentQ.id },
    });
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      if (userScore >= Math.floor(activeQuestions.length * 0.7)) {
        try {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        } catch {}
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header with Mode Selector */}
      <div className="border-b border-paper-300 pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-normal">
              Latihan Mandiri
            </h1>
            <p className="text-xs text-ink-600 font-serif">
              Drill konsep terarah dengan umpan balik langsung dan pencatatan mispersepsi.
            </p>
          </div>

          <button
            onClick={handleGenerateAdaptiveQuestion}
            disabled={isGenerating}
            className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto text-moss-900 border-moss-300 bg-moss-50/50 hover:bg-moss-100 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-moss-800" />
            {isGenerating ? 'Menyusun Soal...' : 'Buat Soal Adaptif'}
          </button>
        </div>

        {/* Mode Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => handleModeChange('adaptive')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              quizMode === 'adaptive' ? 'bg-moss-900 text-paper-50 font-bold' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-moss-200" />
            Latihan Adaptif (Multi-Level)
          </button>
          <button
            onClick={() => handleModeChange('quick')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              quizMode === 'quick' ? 'bg-ink-900 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
            }`}
          >
            Mode Cepat (5 Soal)
          </button>
          <button
            onClick={() => handleModeChange('weakness')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              quizMode === 'weakness' ? 'bg-terracotta-800 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Titik Rawan / Kelemahan
          </button>
          <button
            onClick={() => handleModeChange('review')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
              quizMode === 'review' ? 'bg-amber-800 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            FSRS Due Review
          </button>
        </div>

        {/* Adaptive Microcopy Feedback Banner with Mascot */}
        {quizMode === 'adaptive' && !quizFinished && (
          <div className="p-3 bg-paper-100 rounded border border-moss-200 text-xs font-mono text-moss-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-moss-600 animate-pulse shrink-0" />
              <span>{adaptiveMicrocopy || 'Menyesuaikan tingkat kesulitan soal secara adaptif...'}</span>
            </div>
            <PahamMascot size="xs" state={isAnswered ? (userScore > 0 ? 'success' : 'encouraging') : 'thinking'} />
          </div>
        )}
      </div>

      {/* QUIZ FINISHED REPORT */}
      {quizFinished ? (
        <div className="paper-sheet p-8 space-y-6 text-center">
          <PahamMascot 
            size="lg" 
            state={userScore >= Math.floor(activeQuestions.length * 0.7) ? 'celebrating' : 'encouraging'} 
            bubbleText={userScore >= Math.floor(activeQuestions.length * 0.7) ? 'Penguasaan luar biasa!' : 'Latihan yang bagus! Terus asah ya.'}
            bubblePosition="top"
            className="mx-auto"
          />

          <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block pt-2">
            Latihan Selesai
          </span>
          
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-serif font-bold text-ink-950">
              {Math.round((userScore / Math.max(1, activeQuestions.length)) * 100)}%
            </div>
            <p className="text-sm text-ink-600 font-serif">
              {userScore} dari {activeQuestions.length} soal terjawab dengan benar.
            </p>
          </div>

          {mistakesMade.length > 0 ? (
            <div className="text-left bg-paper-100 p-4 rounded border border-paper-300 space-y-3">
              <span className="text-xs font-semibold text-terracotta-900 uppercase tracking-wider block">
                Konsep yang Perlu Kamu Ulang:
              </span>
              <div className="space-y-2">
                {mistakesMade.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-paper-50 border border-paper-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-ink-900">{m.conceptTitle}</span>
                      <button
                        onClick={() => onStartLearnConcept(m.question.conceptId)}
                        className="text-moss-800 font-medium hover:underline text-[11px]"
                      >
                        Buka Modul →
                      </button>
                    </div>
                    <p className="text-ink-600 text-[11px] leading-relaxed">
                      {m.question.misconceptionAlert || 'Periksa kembali pembedaan konsep ini.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded bg-moss-50 border border-moss-200 text-moss-900 text-xs sm:text-sm font-serif">
              Luar biasa! Seluruh konsep pada sesi latihan ini berhasil kamu kuasai tanpa kekeliruan.
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => filterQuestionsByMode(quizMode, selectedConceptId, allQuestions, concepts, studentStates)}
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Ulangi Sesi Ini
            </Button>
            <Button
              onClick={onFinishQuiz}
              variant="primary"
              size="sm"
            >
              Selesai
            </Button>
          </div>
        </div>
      ) : currentQ ? (
        /* ACTIVE QUESTION CARD */
        <div className="paper-sheet p-6 sm:p-7 space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-paper-200 text-xs text-ink-500 font-mono">
            <span className="uppercase text-moss-800 font-semibold">
              {conceptMap.get(currentQ.conceptId)?.title || 'Materi'}
            </span>
            <span>
              Soal {currentIndex + 1} dari {activeQuestions.length}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <p className="text-sm sm:text-base font-serif text-ink-950 leading-relaxed whitespace-pre-line">
              {currentQ.prompt}
            </p>
            {currentQ.sourceReference && (
              <span className="text-[10px] font-mono text-ink-400 block">
                Sumber: {currentQ.sourceReference}
              </span>
            )}
          </div>

          {/* Options with Tactile Interactive Feedback */}
          <div className="space-y-2.5">
            {currentQ.options?.map((opt: QuestionOption) => {
              const isSelected = selectedOptionId === opt.id;
              let optStyle = 'border-paper-300 hover:bg-paper-100 hover:border-paper-400 text-ink-800';

              if (isAnswered) {
                if (opt.isCorrect) {
                  optStyle = 'bg-moss-100/90 border-moss-700 text-moss-950 font-semibold shadow-subtle';
                } else if (isSelected && !opt.isCorrect) {
                  optStyle = 'bg-terracotta-100 border-terracotta-600 text-terracotta-950 anim-shake';
                } else {
                  optStyle = 'border-paper-200 opacity-40 text-ink-400';
                }
              } else if (isSelected) {
                optStyle = 'bg-moss-50/80 border-moss-800 text-ink-950 font-medium shadow-subtle';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswered}
                  className={`w-full p-3.5 rounded border text-left text-xs sm:text-sm transition-all duration-150 flex items-start justify-between gap-3 ${optStyle} ${!isAnswered ? 'active:scale-[0.99] cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="font-serif">{opt.text}</span>
                  {isAnswered && opt.isCorrect && (
                    <Check className="w-4 h-4 text-moss-800 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !opt.isCorrect && (
                    <XCircle className="w-4 h-4 text-terracotta-700 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Rationale & Misconception Alert */}
          {isAnswered && (
            <div className="space-y-3">
              {/* Correctness Banner */}
              {(() => {
                const chosen = currentQ.options?.find((o: QuestionOption) => o.id === selectedOptionId);
                const isCorrect = Boolean(chosen?.isCorrect);
                const conc = conceptMap.get(currentQ.conceptId);

                return (
                  <div className={`p-4 rounded border text-xs space-y-2 ${
                    isCorrect ? 'bg-moss-50 border-moss-200 text-moss-950' : 'bg-terracotta-50 border-terracotta-200 text-terracotta-950'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        {isCorrect ? <Check className="w-4 h-4 text-moss-700" /> : <AlertTriangle className="w-4 h-4 text-terracotta-700" />}
                        {isCorrect ? 'Jawaban Tepat!' : 'Belum Tepat'}
                      </span>
                      {!isCorrect && conc && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssistantConcept(conc);
                            setAssistantQuestion(currentQ);
                            setAssistantAnswerGiven(chosen?.text || '');
                            setAssistantMistake({
                              id: `mst-${Date.now()}`,
                              conceptId: currentQ.conceptId,
                              conceptTitle: conc.title,
                              subjectId: currentQ.subjectId,
                              questionPrompt: currentQ.prompt,
                              userGivenAnswer: chosen?.text || '',
                              correctAnswer: currentQ.options?.find(o => o.isCorrect)?.text || '',
                              misconceptionDescription: currentQ.misconceptionAlert || 'Kekeliruan identifikasi konsep materi.',
                              dateOccurred: new Date().toISOString(),
                              isResolved: false,
                            });
                            setIsAssistantOpen(true);
                          }}
                          className="btn-secondary text-[11px] py-1 px-2.5 bg-paper-50 text-terracotta-900 border-terracotta-300 hover:bg-terracotta-100 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-terracotta-700" />
                          Bantu Aku Ngerti
                        </button>
                      )}
                    </div>

                    <p className="font-serif leading-relaxed text-ink-800">{currentQ.explanation}</p>

                    {currentQ.misconceptionAlert && (
                      <div className="pt-2 border-t border-paper-200 text-[11px] font-sans font-medium text-terracotta-900">
                        ⚠️ Catatan Pembeda: {currentQ.misconceptionAlert}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-paper-200 flex justify-end">
            {!isAnswered ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={!selectedOptionId}
                className="btn-primary text-xs py-2 px-5 disabled:opacity-50"
              >
                Jawab
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary text-xs py-2 px-5 shadow-subtle"
              >
                {currentIndex < activeQuestions.length - 1 ? 'Soal Berikutnya' : 'Lihat Hasil'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      ) : (
        <div className="paper-sheet p-12 text-center text-ink-500 font-serif">
          <HelpCircle className="w-8 h-8 text-ink-400 mx-auto mb-2" />
          <p>Tidak ada soal pada kategori ini.</p>
        </div>
      )}

      {/* Grounded Study Assistant Modal for Error Diagnosis */}
      <StudyAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        concept={assistantConcept}
        initialAction="give_hint"
        questionContext={assistantQuestion}
        studentAnswerGiven={assistantAnswerGiven}
        recentMistake={assistantMistake}
      />

    </div>
  );
};
