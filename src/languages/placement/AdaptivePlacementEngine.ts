// Multi-Dimensional Adaptive Placement Engine for PAHAM Language Architecture
// IRT-inspired skill ability estimation, uncertainty minimization, and confidence diagnostics

import {
  PlacementQuestion,
  QuestionAnswerAttempt,
  SkillEstimate,
  AdaptivePlacementSession,
  PlacementDiagnosticReport,
  ConfidenceRating,
  MisconceptionRecord,
  SchoolReadinessReport,
} from './types';
import { SupportedLanguageId, SkillType } from '../core/types';
import { ENGLISH_PLACEMENT_QUESTION_BANK, MANDARIN_PLACEMENT_QUESTION_BANK } from './PlacementQuestionBank';
import { PlacementQuestionValidator } from './PlacementQuestionValidator';

export class AdaptivePlacementEngine {
  private questionBank: Map<string, PlacementQuestion> = new Map();

  constructor() {
    this.loadQuestionBanks();
  }

  private loadQuestionBanks() {
    ENGLISH_PLACEMENT_QUESTION_BANK.forEach(q => this.registerQuestion(q));
    MANDARIN_PLACEMENT_QUESTION_BANK.forEach(q => this.registerQuestion(q));
  }

  public registerQuestion(q: PlacementQuestion): boolean {
    const val = PlacementQuestionValidator.validate(q);
    if (!val.isValid) {
      console.warn(`[AdaptivePlacementEngine] Rejected invalid question ${q.id}:`, val.errors);
      return false;
    }
    this.questionBank.set(q.id, q);
    return true;
  }

  /**
   * Start a new adaptive placement session
   */
  public createSession(
    userId: string,
    languageId: SupportedLanguageId
  ): AdaptivePlacementSession {
    const isMandarin = languageId === 'zh-CN';
    const targetSkills: SkillType[] = isMandarin
      ? ['TONES', 'CHARACTERS', 'VOCABULARY', 'GRAMMAR', 'READING', 'WRITING']
      : ['VOCABULARY', 'GRAMMAR', 'READING', 'COLLOCATIONS', 'WRITING', 'COMPREHENSION'];

    const initialSkillEstimates: Partial<Record<SkillType, SkillEstimate>> = {};
    targetSkills.forEach(skill => {
      initialSkillEstimates[skill] = {
        skillType: skill,
        estimatedLevel: isMandarin ? 'Level-1' : 'A1',
        abilityScore: 30, // Default baseline
        uncertainty: 0.85, // High initial uncertainty
        questionsCount: 0,
        isFullyAssessed: false,
        masteryStatus: 'NOT_TESTED',
      };
    });

    return {
      sessionId: `pl_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      languageId,
      startTime: Date.now(),
      status: 'IN_PROGRESS',
      targetSkills,
      testedQuestions: [],
      attempts: [],
      currentSkillEstimates: initialSkillEstimates as Record<SkillType, SkillEstimate>,
      maxQuestions: isMandarin ? 10 : 8,
      isFinished: false,
    };
  }

  /**
   * Selects the next optimal diagnostic question based on skill uncertainty and ability estimate
   */
  public selectNextQuestion(session: AdaptivePlacementSession): PlacementQuestion | null {
    if (session.isFinished || session.attempts.length >= session.maxQuestions) {
      return null;
    }

    // 1. Identify skills with highest uncertainty that have < 3 questions tested
    const candidates = session.targetSkills
      .map(skill => session.currentSkillEstimates[skill])
      .filter(s => s && s.questionsCount < 3 && !s.isFullyAssessed)
      .sort((a, b) => b.uncertainty - a.uncertainty);

    const targetSkill = candidates.length > 0 ? candidates[0].skillType : session.targetSkills[0];
    const targetEstimate = session.currentSkillEstimates[targetSkill];
    const targetAbilityNorm = (targetEstimate?.abilityScore || 30) / 100;

    // 2. Filter available questions for this language and skill that haven't been tested yet
    const pool = Array.from(this.questionBank.values()).filter(
      q => q.languageId === session.languageId && !session.testedQuestions.includes(q.id)
    );

    if (pool.length === 0) return null;

    // Prioritize target skill questions closest to current ability estimate
    const skillPool = pool.filter(q => q.testedSkill === targetSkill);
    const candidateList = skillPool.length > 0 ? skillPool : pool;

    candidateList.sort((a, b) => {
      const diffA = Math.abs(a.difficultyIndex - targetAbilityNorm);
      const diffB = Math.abs(b.difficultyIndex - targetAbilityNorm);
      return diffA - diffB;
    });

    return candidateList[0] || null;
  }

  /**
   * Records a user's answer and updates ability estimates and confidence signals
   */
  public recordAnswer(
    session: AdaptivePlacementSession,
    questionId: string,
    userAnswer: string | string[],
    confidence: ConfidenceRating = 3,
    timeSpentSeconds: number = 5
  ): {
    attempt: QuestionAnswerAttempt;
    updatedEstimate: SkillEstimate;
    isSessionComplete: boolean;
  } {
    const question = this.questionBank.get(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in placement bank.`);
    }

    let isCorrect = false;
    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        isCorrect = JSON.stringify(question.correctAnswer) === JSON.stringify(userAnswer);
      } else {
        isCorrect = question.correctAnswer.some(ans => ans.trim().toLowerCase() === userAnswer.trim().toLowerCase());
      }
    } else {
      const uStr = Array.isArray(userAnswer) ? userAnswer.join(' ') : userAnswer;
      isCorrect = uStr.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    }

    // Classify Diagnostic Category based on Correctness + Confidence Signal
    let diagnosticCategory: QuestionAnswerAttempt['diagnosticCategory'] = 'KNOWLEDGE_GAP';
    if (isCorrect) {
      diagnosticCategory = confidence >= 4 ? 'VERIFIED_MASTERY' : 'FRAGILE_KNOWLEDGE';
    } else {
      diagnosticCategory = confidence >= 4 ? 'CRITICAL_MISCONCEPTION' : 'KNOWLEDGE_GAP';
    }

    const attempt: QuestionAnswerAttempt = {
      questionId,
      testedSkill: question.testedSkill,
      targetLevel: question.targetLevel,
      difficultyIndex: question.difficultyIndex,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      confidence,
      timeSpentSeconds,
      diagnosticTags: question.diagnosticTags,
      diagnosticCategory,
      timestamp: new Date().toISOString(),
    };

    session.attempts.push(attempt);
    session.testedQuestions.push(questionId);

    // Update Skill Estimate with Adaptive Bayes / IRT Step
    const skill = question.testedSkill;
    const est = session.currentSkillEstimates[skill] || {
      skillType: skill,
      estimatedLevel: question.targetLevel,
      abilityScore: 30,
      uncertainty: 0.8,
      questionsCount: 0,
      isFullyAssessed: false,
      masteryStatus: 'NOT_TESTED',
    };

    est.questionsCount += 1;

    // Ability Score Adjustment
    let delta = 0;
    if (isCorrect) {
      // Bonus if high confidence, slight bonus if low confidence
      delta = confidence >= 4 ? 22 * question.discriminationIndex : 14 * question.discriminationIndex;
    } else {
      // Penalty if wrong
      delta = confidence >= 4 ? -20 * question.discriminationIndex : -12 * question.discriminationIndex;
    }

    est.abilityScore = Math.max(5, Math.min(95, Math.round(est.abilityScore + delta)));
    
    // Reduce uncertainty with each question answered
    est.uncertainty = Math.max(0.1, Number((est.uncertainty * 0.65).toFixed(2)));
    if (est.uncertainty <= 0.25 || est.questionsCount >= 2) {
      est.isFullyAssessed = true;
    }

    // Determine Estimated Level for this specific skill
    est.estimatedLevel = this.mapScoreToLevel(session.languageId, est.abilityScore);
    est.masteryStatus = est.abilityScore >= 70 ? 'MASTERED' : est.abilityScore >= 45 ? 'DEVELOPING' : 'NEEDS_PRACTICE';

    session.currentSkillEstimates[skill] = est;

    // Check if session stopping criterion reached
    const allAssessed = session.targetSkills.every(s => session.currentSkillEstimates[s]?.isFullyAssessed);
    const maxReached = session.attempts.length >= session.maxQuestions;
    if (allAssessed || maxReached) {
      session.isFinished = true;
      session.status = 'COMPLETED';
    }

    return {
      attempt,
      updatedEstimate: est,
      isSessionComplete: session.isFinished,
    };
  }

  /**
   * Finalize session and generate comprehensive diagnostic report
   */
  public generateDiagnosticReport(
    session: AdaptivePlacementSession,
    previousReport?: PlacementDiagnosticReport
  ): PlacementDiagnosticReport {
    const isMandarin = session.languageId === 'zh-CN';
    const framework = isMandarin ? 'GF0025' : 'CEFR';

    // Calculate Overall Level from Weighted Competencies
    const validEstimates = Object.values(session.currentSkillEstimates);
    const avgScore = validEstimates.length > 0
      ? Math.round(validEstimates.reduce((a, b) => a + b.abilityScore, 0) / validEstimates.length)
      : 30;

    const overallLevel = this.mapScoreToLevel(session.languageId, avgScore);

    // Identify Strengths & Weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const misconceptions: MisconceptionRecord[] = [];
    const fragileKnowledgeTags: string[] = [];

    session.attempts.forEach(att => {
      const q = this.questionBank.get(att.questionId);
      if (!q) return;

      if (att.diagnosticCategory === 'CRITICAL_MISCONCEPTION') {
        misconceptions.push({
          id: `misc_${att.questionId}`,
          skill: att.testedSkill,
          questionId: att.questionId,
          conceptTag: att.diagnosticTags[0] || 'grammar_syntax',
          userAnswer: Array.isArray(att.userAnswer) ? att.userAnswer.join(', ') : att.userAnswer,
          correctAnswer: Array.isArray(att.correctAnswer) ? att.correctAnswer.join(', ') : att.correctAnswer,
          explanation: q.explanation,
          remedialSuggestion: `Pelajari kembali materi ${q.schoolTopicLink || q.testedSkill} untuk mengatasi miskonsepsi pada konsep ini.`,
        });
      }

      if (att.diagnosticCategory === 'FRAGILE_KNOWLEDGE') {
        fragileKnowledgeTags.push(...att.diagnosticTags);
      }
    });

    validEstimates.forEach(est => {
      if (est.abilityScore >= 65) {
        strengths.push(`${est.skillType} (${est.estimatedLevel})`);
      } else if (est.abilityScore < 45) {
        weaknesses.push(`${est.skillType} (${est.estimatedLevel})`);
      }
    });

    // School Readiness Analysis
    const schoolReadiness = this.computeSchoolReadiness(session.languageId, avgScore, weaknesses);

    // Learning Path Seed Generation
    const learningPathSeeds = {
      recommendedStartingUnit: isMandarin ? (avgScore >= 60 ? 'unit_zh_lvl2_02' : 'unit_zh_lvl1_01') : (avgScore >= 60 ? 'unit_en_b1_03' : 'unit_en_a1_01'),
      suggestedFocusAreas: weaknesses.length > 0 ? weaknesses : ['Konsistensi latihan harian'],
      fsrsSeedItems: misconceptions.map(m => m.conceptTag),
      pamiCoachingSummary: isMandarin
        ? `Pami melihat kosa kata dan pengenalan Hanzi kamu berada di level ${overallLevel}. Latihan nada dan partikel tata bahasa akan mempercepat kemahiranmu!`
        : `Great job! Your estimated level is ${overallLevel}. Focus on ${weaknesses[0] || 'vocabulary in context'} to boost your English fluency.`,
    };

    // Re-placement delta comparison if previous exists
    let comparisonWithPrevious = undefined;
    if (previousReport) {
      const skillDeltas = session.targetSkills.map(skill => {
        const prevLevel = previousReport.skillEstimates[skill]?.estimatedLevel || (isMandarin ? 'Level-1' : 'A1');
        const currLevel = session.currentSkillEstimates[skill]?.estimatedLevel || (isMandarin ? 'Level-1' : 'A1');
        let deltaStatus: 'IMPROVED' | 'STABLE' | 'NEEDS_ATTENTION' = 'STABLE';
        if (currLevel > prevLevel) deltaStatus = 'IMPROVED';
        else if (currLevel < prevLevel) deltaStatus = 'NEEDS_ATTENTION';

        return {
          skill,
          previousLevel: prevLevel,
          currentLevel: currLevel,
          deltaStatus,
        };
      });

      comparisonWithPrevious = {
        previousAttemptId: previousReport.attemptId,
        previousDate: previousReport.completedAt,
        previousOverallLevel: previousReport.overallLevel,
        currentOverallLevel: overallLevel,
        skillDeltas,
      };
    }

    return {
      attemptId: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: session.userId,
      languageId: session.languageId,
      framework,
      overallLevel,
      overallConfidenceScore: Math.round(
        (session.attempts.reduce((a, b) => a + b.confidence, 0) / Math.max(1, session.attempts.length * 5)) * 100
      ),
      totalQuestionsAnswered: session.attempts.length,
      skillEstimates: session.currentSkillEstimates,
      strengths,
      weaknesses,
      misconceptions,
      fragileKnowledgeTags: Array.from(new Set(fragileKnowledgeTags)),
      schoolReadiness,
      learningPathSeeds,
      comparisonWithPrevious,
      completedAt: new Date().toISOString(),
    };
  }

  private mapScoreToLevel(languageId: SupportedLanguageId, score: number): string {
    const isMandarin = languageId === 'zh-CN';
    if (isMandarin) {
      if (score >= 80) return 'Level-4';
      if (score >= 60) return 'Level-3';
      if (score >= 40) return 'Level-2';
      return 'Level-1';
    }
    // English CEFR
    if (score >= 85) return 'C1';
    if (score >= 70) return 'B2';
    if (score >= 50) return 'B1';
    if (score >= 35) return 'A2';
    return 'A1';
  }

  private computeSchoolReadiness(
    languageId: SupportedLanguageId,
    avgScore: number,
    weaknesses: string[]
  ): SchoolReadinessReport {
    const isMandarin = languageId === 'zh-CN';
    const grade = 'SMA Kelas 10-11 (Kurikulum Merdeka)';
    let status: SchoolReadinessReport['status'] = 'STRONG';

    if (avgScore >= 75) status = 'EXCELLENT';
    else if (avgScore >= 50) status = 'STRONG';
    else if (avgScore >= 35) status = 'NEEDS_REVIEW';
    else status = 'CRITICAL_GAPS';

    return {
      grade,
      readinessScore: avgScore,
      status,
      matchingSchoolTopics: isMandarin
        ? ['Perkenalan Diri & Kehidupan Sekolah', 'Benda-benda Kelas & Berbelanja']
        : ['Analytical Exposition', 'Narrative Text', 'Recount Text'],
      curriculumGaps: weaknesses,
      remediationPlan: [
        'Selesaikan unit kurikulum yang terhubung dengan topik sekolah saat ini.',
        'Gunakan flashcards FSRS untuk mengunci kosa kata yang terindikasi rentan (fragile knowledge).',
      ],
    };
  }
}

export const adaptivePlacementEngine = new AdaptivePlacementEngine();
