// Mastery Engine for PAHAM
// Computes multi-factor mastery scores, readiness indexes, and learning mode recommendations

import { StudentConceptState, Concept, FSRSCard, Exam } from './types';
import { fsrs } from './fsrsEngine';

export interface MasteryEvaluation {
  masteryScore: number; // 0.0 to 1.0
  readinessPercentage: number; // 0 to 100
  statusLabel: 'Belum Dipelajari' | 'Perlu Perhatian' | 'Mulai Paham' | 'Kuat / Stabil';
  recommendedMode: 'learn' | 'recall' | 'practice' | 'review' | 'rescue';
  retrievability: number;
  accuracyRate: number;
  priorityScore: number;
}

export class MasteryEngine {
  /**
   * Evaluate a concept state for a student
   */
  public evaluateConcept(
    concept: Concept,
    studentState?: StudentConceptState,
    upcomingExams: Exam[] = []
  ): MasteryEvaluation {
    if (!studentState || studentState.fsrs.state === 0) {
      // Unstudied concept
      const hasUpcomingExam = this.findRelevantUpcomingExam(concept, upcomingExams);
      const isUrgent = hasUpcomingExam && hasUpcomingExam.daysRemaining <= 5;

      return {
        masteryScore: 0.1,
        readinessPercentage: 10,
        statusLabel: 'Belum Dipelajari',
        recommendedMode: isUrgent ? 'rescue' : 'learn',
        retrievability: 0,
        accuracyRate: 0,
        priorityScore: isUrgent ? 95 : 60,
      };
    }

    const { fsrs: card, recentAttemptsCount, recentCorrectCount, commonMistakes } = studentState;
    const retrievability = fsrs.calculateRetrievability(card);
    const accuracyRate = recentAttemptsCount > 0 ? recentCorrectCount / recentAttemptsCount : 0.5;
    
    // Stability factor (normalized up to 30 days)
    const stabilityFactor = Math.min(1.0, card.stability / 21);

    // Mistake penalty (unresolved confusion)
    const mistakePenalty = Math.min(0.3, commonMistakes.length * 0.1);

    // Composite Mastery Calculation (0.0 to 1.0)
    // 35% recent accuracy + 35% memory retrievability + 20% long-term stability - mistake penalty
    let composite = (accuracyRate * 0.35) + (retrievability * 0.35) + (stabilityFactor * 0.30) - mistakePenalty;
    composite = Math.max(0.05, Math.min(0.99, composite));

    const readinessPercentage = Math.round(composite * 100);

    // Status Label
    let statusLabel: MasteryEvaluation['statusLabel'] = 'Mulai Paham';
    if (readinessPercentage < 40) {
      statusLabel = 'Perlu Perhatian';
    } else if (readinessPercentage >= 78) {
      statusLabel = 'Kuat / Stabil';
    }

    // Exam proximity check
    const examInfo = this.findRelevantUpcomingExam(concept, upcomingExams);

    // Mode recommendation
    let recommendedMode: MasteryEvaluation['recommendedMode'] = 'recall';
    const isDue = new Date(card.due) <= new Date();

    if (examInfo && examInfo.daysRemaining <= 3 && readinessPercentage < 70) {
      recommendedMode = 'rescue';
    } else if (commonMistakes.length > 0 && accuracyRate < 0.65) {
      recommendedMode = 'practice'; // Application practice needed
    } else if (isDue) {
      recommendedMode = 'review'; // FSRS due
    } else if (composite < 0.45) {
      recommendedMode = 'learn';
    } else {
      recommendedMode = 'recall';
    }

    // Priority Score for Daily Study Planner (1 to 100)
    let priority = (1.0 - composite) * 50; // base priority from mastery gap (up to 50 pts)
    if (isDue) priority += 25; // +25 for FSRS due
    if (examInfo) {
      if (examInfo.daysRemaining <= 3) priority += 35;
      else if (examInfo.daysRemaining <= 7) priority += 20;
    }
    if (commonMistakes.length > 0) priority += 10;

    return {
      masteryScore: Number(composite.toFixed(2)),
      readinessPercentage,
      statusLabel,
      recommendedMode,
      retrievability: Number(retrievability.toFixed(2)),
      accuracyRate: Number(accuracyRate.toFixed(2)),
      priorityScore: Math.round(Math.min(100, Math.max(1, priority))),
    };
  }

  /**
   * Evaluate readiness for an entire Exam based on covered chapters
   */
  public evaluateExamReadiness(
    exam: Exam,
    allConcepts: Concept[],
    studentStates: Map<string, StudentConceptState>
  ): {
    overallReadiness: number;
    strongConcepts: Concept[];
    weakConcepts: Concept[];
    dueReviewCount: number;
    explanation: {
      positives: string[];
      negatives: string[];
    };
  } {
    const coveredConcepts = allConcepts.filter(c => 
      exam.coveredChapterIds.includes(c.chapterId)
    );

    if (coveredConcepts.length === 0) {
      return {
        overallReadiness: 50,
        strongConcepts: [],
        weakConcepts: [],
        dueReviewCount: 0,
        explanation: { positives: [], negatives: ['Belum ada materi terdaftar untuk bab ini.'] },
      };
    }

    let totalScore = 0;
    const strongConcepts: Concept[] = [];
    const weakConcepts: Concept[] = [];
    let dueReviewCount = 0;
    const positives: string[] = [];
    const negatives: string[] = [];

    coveredConcepts.forEach(concept => {
      const state = studentStates.get(concept.id);
      const evalResult = this.evaluateConcept(concept, state);
      totalScore += evalResult.readinessPercentage;

      if (evalResult.readinessPercentage >= 75) {
        strongConcepts.push(concept);
      } else if (evalResult.readinessPercentage < 60) {
        weakConcepts.push(concept);
      }

      if (state && new Date(state.fsrs.due) <= new Date()) {
        dueReviewCount++;
      }
    });

    const overallReadiness = Math.round(totalScore / coveredConcepts.length);

    if (strongConcepts.length > 0) {
      positives.push(`${strongConcepts.length} konsep memiliki retensi kuat`);
    }
    if (coveredConcepts.length >= 5) {
      positives.push(`Cakupan bab ${coveredConcepts.length} konsep terdaftar`);
    }
    if (weakConcepts.length > 0) {
      negatives.push(`${weakConcepts.length} konsep masih sering tertukar`);
    }
    if (dueReviewCount > 0) {
      negatives.push(`${dueReviewCount} jadwal review belum diselesaikan`);
    }

    return {
      overallReadiness,
      strongConcepts,
      weakConcepts,
      dueReviewCount,
      explanation: {
        positives,
        negatives,
      },
    };
  }

  private findRelevantUpcomingExam(
    concept: Concept,
    exams: Exam[]
  ): { exam: Exam; daysRemaining: number } | null {
    const now = new Date();
    const matches = exams
      .filter(e => e.coveredChapterIds.includes(concept.chapterId) || e.subjectId === concept.subjectId)
      .map(e => {
        const diffDays = Math.ceil((new Date(e.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { exam: e, daysRemaining: diffDays };
      })
      .filter(m => m.daysRemaining >= 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return matches.length > 0 ? matches[0] : null;
  }
}

export const masteryEngine = new MasteryEngine();
