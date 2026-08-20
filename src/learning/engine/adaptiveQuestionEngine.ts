// Adaptive Question Engine for PAHAM
// Runs multi-question adaptive study sessions with real difficulty adaptation, misconception repair, and skill assessment

import { db } from '../../core/db';
import { 
  Question, 
  Concept, 
  StudentConceptState, 
  SkillType, 
  AdaptiveQuestionAttempt,
  QuestionOption
} from '../../core/types';

export interface AdaptiveSessionState {
  sessionId: string;
  targetConceptIds: string[];
  totalTargetQuestions: number;
  currentQuestionIndex: number;
  currentConceptId: string;
  currentDifficulty: 1 | 2 | 3 | 4 | 5;
  currentSkill: SkillType;
  attempts: AdaptiveQuestionAttempt[];
  consecutiveCorrect: number;
  consecutiveWrong: number;
  adaptationFeedback: string;
  isCompleted: boolean;
  stabilizedConceptIds: string[];
}

export const adaptiveQuestionEngine = {
  /**
   * Initializes a multi-question adaptive practice session
   */
  createSessionState(
    conceptIds: string[], 
    initialDifficulty: 1 | 2 | 3 | 4 | 5 = 2,
    targetCount: number = 8
  ): AdaptiveSessionState {
    const sessionId = `adp-sess-${Date.now()}`;
    return {
      sessionId,
      targetConceptIds: conceptIds,
      totalTargetQuestions: Math.max(5, Math.min(20, targetCount)),
      currentQuestionIndex: 0,
      currentConceptId: conceptIds[0],
      currentDifficulty: initialDifficulty,
      currentSkill: 'KNOWLEDGE',
      attempts: [],
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      adaptationFeedback: 'Memulai sesi adaptif. Soal pertama menguji dasar konsep.',
      isCompleted: false,
      stabilizedConceptIds: [],
    };
  },

  /**
   * Selects or dynamically synthesizes the next best question for the current state
   */
  async selectNextQuestion(
    sessionState: AdaptiveSessionState, 
    allQuestions: Question[], 
    concept: Concept
  ): Promise<Question> {
    const attemptedQuestionIds = new Set(sessionState.attempts.map(a => a.questionId));
    
    // Filter questions matching current concept
    let candidates = allQuestions.filter(q => 
      q.conceptId === sessionState.currentConceptId && 
      !attemptedQuestionIds.has(q.id)
    );

    // If candidate found matching difficulty
    let matched = candidates.find(q => q.difficulty === sessionState.currentDifficulty);
    if (matched) return matched;

    // Nearest difficulty
    if (candidates.length > 0) {
      candidates.sort((a, b) => Math.abs(a.difficulty - sessionState.currentDifficulty) - Math.abs(b.difficulty - sessionState.currentDifficulty));
      return candidates[0];
    }

    // Dynamic Synthesis Fallback (Deterministic question constructor)
    return this.synthesizeDynamicQuestion(concept, sessionState.currentDifficulty, sessionState.currentSkill, sessionState.currentQuestionIndex);
  },

  /**
   * Deterministic dynamic question generator ensuring question pool is never exhausted
   */
  synthesizeDynamicQuestion(concept: Concept, difficulty: number, skill: SkillType, index: number): Question {
    const qId = `dyn-q-${concept.id}-${difficulty}-${index}`;

    if (difficulty <= 2) {
      return {
        id: qId,
        subjectId: concept.subjectId,
        chapterId: concept.chapterId,
        conceptId: concept.id,
        difficulty: difficulty as any,
        questionType: 'multiple_choice',
        prompt: `Manakah pernyataan yang paling tepat mendefinisikan "${concept.title}"?`,
        options: [
          { id: 'opt-1', text: concept.definition, isCorrect: true },
          { id: 'opt-2', text: `Konsep umum yang tidak berkaitan dengan ${concept.title}.`, isCorrect: false },
          { id: 'opt-3', text: `Hafalan sekunder tanpa pemahaman konteks catatan guru.`, isCorrect: false },
        ],
        explanation: `Definisi resmi: ${concept.definition}`,
        misconceptionAlert: concept.keyPoints?.[0] || 'Pastikan tidak tertukar dengan bab lainnya.',
        timesAnswered: 0,
        timesCorrect: 0,
        qualityStatus: 'auto_generated',
      };
    } else if (difficulty === 3) {
      return {
        id: qId,
        subjectId: concept.subjectId,
        chapterId: concept.chapterId,
        conceptId: concept.id,
        difficulty: 3,
        questionType: 'scenario',
        prompt: `Dalam studi kasus berikut: "${concept.example || concept.title}", bagaimana prinsip ${concept.title} diterapkan?`,
        options: [
          { id: 'opt-1', text: `Menerapkan konsep dengan mengidentifikasi pola kunci: ${concept.keyPoints?.[0] || 'inti materi'}.`, isCorrect: true },
          { id: 'opt-2', text: `Mengabaikan variabel pengganggu dan langsung menebak kesimpulan.`, isCorrect: false },
          { id: 'opt-3', text: `Menyederhanakan rumus secara keliru tanpa langkah pembuktian.`, isCorrect: false },
        ],
        explanation: `Aplikasi konsep: ${concept.example || concept.definition}`,
        misconceptionAlert: 'Perhatikan penerapan nyata dalam contoh soal ulangan.',
        timesAnswered: 0,
        timesCorrect: 0,
        qualityStatus: 'auto_generated',
      };
    } else {
      return {
        id: qId,
        subjectId: concept.subjectId,
        chapterId: concept.chapterId,
        conceptId: concept.id,
        difficulty: 4,
        questionType: 'error_detection',
        prompt: `Perhatikan analisis tingkat lanjut terkait ${concept.title}. Manakah pembeda kritis yang membedakan konsep ini dari materi sejenis?`,
        options: [
          { id: 'opt-1', text: `${concept.keyPoints?.[0] || 'Poin pembeda utama'} sesuai dengan catatan guru.`, isCorrect: true },
          { id: 'opt-2', text: `Tidak ada perbedaan mendasar, semua rumus diperlakukan identik.`, isCorrect: false },
          { id: 'opt-3', text: `Hanya berlaku untuk kasus teoritis tanpa aplikasi riil.`, isCorrect: false },
        ],
        explanation: `Analisis mendalam: ${concept.definition}. Poin kunci: ${concept.keyPoints?.join(', ')}`,
        misconceptionAlert: 'Tingkat kesulitan tinggi: menguji kemampuan pembeda saat ulangan campuran.',
        timesAnswered: 0,
        timesCorrect: 0,
        qualityStatus: 'auto_generated',
      };
    }
  },

  /**
   * Processes a submitted answer, evaluates adaptation rules, and updates state
   */
  processAttempt(
    sessionState: AdaptiveSessionState,
    question: Question,
    selectedOptionId: string,
    responseTimeSeconds: number,
    confidence?: 'low' | 'medium' | 'high'
  ): { 
    updatedState: AdaptiveSessionState; 
    isCorrect: boolean; 
    feedbackText: string; 
    misconceptionText?: string;
  } {
    const chosen = question.options?.find((o: QuestionOption) => o.id === selectedOptionId);
    const isCorrect = Boolean(chosen?.isCorrect);

    const attempt: AdaptiveQuestionAttempt = {
      id: `att-${Date.now()}`,
      sessionId: sessionState.sessionId,
      questionId: question.id,
      conceptId: question.conceptId,
      difficulty: question.difficulty,
      skill: sessionState.currentSkill,
      answer: chosen?.text || '',
      correct: isCorrect,
      mistakeType: !isCorrect ? question.misconceptionAlert : undefined,
      responseTimeSeconds,
      confidence,
    };

    const newAttempts = [...sessionState.attempts, attempt];
    const newIndex = sessionState.currentQuestionIndex + 1;

    let newConsecutiveCorrect = isCorrect ? sessionState.consecutiveCorrect + 1 : 0;
    let newConsecutiveWrong = !isCorrect ? sessionState.consecutiveWrong + 1 : 0;

    let newDifficulty = sessionState.currentDifficulty;
    let newSkill = sessionState.currentSkill;
    let adaptationFeedback = '';
    let newConceptId = sessionState.currentConceptId;
    let stabilized = [...sessionState.stabilizedConceptIds];

    if (isCorrect) {
      if (newConsecutiveCorrect >= 2) {
        // Concept is stabilizing!
        if (newDifficulty < 5) {
          newDifficulty = (newDifficulty + 1) as any;
          newSkill = newDifficulty >= 3 ? 'APPLICATION' : 'DISTINCTION';
          adaptationFeedback = 'Bagus! Jawaban tepat berturut-turut. Tingkat tantangan dinaikkan sedikit.';
        } else {
          adaptationFeedback = 'Luar biasa! Kamu menguasai tingkat kesulitan tertinggi konsep ini.';
          if (!stabilized.includes(sessionState.currentConceptId)) {
            stabilized.push(sessionState.currentConceptId);
          }
          // Move to next concept if available
          const remaining = sessionState.targetConceptIds.filter(id => !stabilized.includes(id));
          if (remaining.length > 0) {
            newConceptId = remaining[0];
            newDifficulty = 2;
            adaptationFeedback = 'Konsep ini sudah stabil. Beralih ke konsep berikutnya.';
          }
        }
      } else {
        adaptationFeedback = 'Jawaban tepat. Mempertahankan ritme latihan adaptif.';
      }
    } else {
      // Wrong answer -> Repair loop
      if (newDifficulty > 1) {
        newDifficulty = (newDifficulty - 1) as any;
      }
      newSkill = 'KNOWLEDGE';
      adaptationFeedback = 'Belum tepat. PAHAM menurunkan tingkat kesulitan untuk memperkuat pemahaman dasar.';
    }

    // Check completion condition
    const isCompleted = newIndex >= sessionState.totalTargetQuestions || stabilized.length === sessionState.targetConceptIds.length;

    const updatedState: AdaptiveSessionState = {
      ...sessionState,
      currentQuestionIndex: newIndex,
      currentConceptId: newConceptId,
      currentDifficulty: newDifficulty,
      currentSkill: newSkill,
      attempts: newAttempts,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
      adaptationFeedback,
      isCompleted,
      stabilizedConceptIds: stabilized,
    };

    return {
      updatedState,
      isCorrect,
      feedbackText: question.explanation,
      misconceptionText: !isCorrect ? question.misconceptionAlert : undefined,
    };
  }
};
