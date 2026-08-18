// Automated Unit Tests for PAHAM Deterministic Core
// Tests FSRS memory scheduling, Mastery Engine calculation, and Study Planner logic

import { describe, it, expect } from 'vitest';
import { fsrs } from './fsrsEngine';
import { masteryEngine } from './masteryEngine';
import { studyPlanner } from './studyPlannerEngine';
import { Concept, StudentConceptState, Subject, Chapter, Exam } from './types';

describe('FSRS Spaced Repetition Engine', () => {
  it('initializes an empty new card with 0 stability', () => {
    const card = fsrs.createEmptyCard('concept-test-1');
    expect(card.conceptId).toBe('concept-test-1');
    expect(card.state).toBe(0); // New
    expect(card.reps).toBe(0);
    expect(card.stability).toBe(0);
  });

  it('updates state and increases stability upon Good rating (3)', () => {
    const card = fsrs.createEmptyCard('concept-test-1');
    const { updatedCard, intervalDays } = fsrs.processReview(card, 3);

    expect(updatedCard.reps).toBe(1);
    expect(updatedCard.stability).toBeGreaterThan(0);
    expect(updatedCard.state).toBe(2); // Review
    expect(intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('increases lapses and sets state to Relearning upon Again rating (1)', () => {
    const card = fsrs.createEmptyCard('concept-test-1');
    // First review
    const { updatedCard: card1 } = fsrs.processReview(card, 3);
    // Second review fails
    const { updatedCard: card2, intervalDays } = fsrs.processReview(card1, 1);

    expect(card2.lapses).toBe(1);
    expect(card2.state).toBe(3); // Relearning
    expect(intervalDays).toBe(1);
  });

  it('computes decay in retrievability over elapsed time', () => {
    const card = fsrs.createEmptyCard('concept-test-1');
    const { updatedCard } = fsrs.processReview(card, 3);

    // Current retrievability
    const rNow = fsrs.calculateRetrievability(updatedCard, new Date());
    expect(rNow).toBeGreaterThan(0.85);

    // After 30 days
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const rFuture = fsrs.calculateRetrievability(updatedCard, futureDate);
    expect(rFuture).toBeLessThan(rNow);
  });
});

describe('Mastery Engine', () => {
  const sampleConcept: Concept = {
    id: 'c-1',
    subjectId: 'sub-1',
    chapterId: 'chap-1',
    title: 'Penokohan',
    definition: 'Cara pengarang menggambarkan watak tokoh.',
    example: 'Pitung dermawan.',
    keyPoints: ['Analitik vs Dramatik'],
    relationships: [],
    sources: [],
    difficultyLevel: 3,
    createdAt: new Date().toISOString(),
  };

  it('evaluates unstudied concept with low readiness and Learn recommendation', () => {
    const result = masteryEngine.evaluateConcept(sampleConcept, undefined);
    expect(result.readinessPercentage).toBeLessThan(30);
    expect(result.statusLabel).toBe('Belum Dipelajari');
    expect(result.recommendedMode).toBe('learn');
  });

  it('penalizes concepts with active misconceptions and suggests Practice mode', () => {
    const studentState: StudentConceptState = {
      conceptId: 'c-1',
      masteryScore: 0.6,
      fsrs: {
        conceptId: 'c-1',
        due: new Date().toISOString(),
        stability: 2,
        difficulty: 5,
        elapsed_days: 1,
        scheduled_days: 2,
        reps: 3,
        lapses: 1,
        state: 2,
      },
      recentAttemptsCount: 5,
      recentCorrectCount: 2,
      commonMistakes: ['Tertukar antara tokoh dan penokohan'],
      priorityScore: 80,
      recommendedMode: 'practice',
    };

    const result = masteryEngine.evaluateConcept(sampleConcept, studentState);
    expect(result.recommendedMode).toBe('practice');
    expect(result.priorityScore).toBeGreaterThan(60);
  });
});

describe('Study Planner Engine', () => {
  it('generates a personalized daily schedule prioritizing upcoming exams and weak concepts', () => {
    const concepts: Concept[] = [
      {
        id: 'c-exam-1',
        subjectId: 'sub-bind',
        chapterId: 'chap-bind-5',
        title: 'Penokohan',
        definition: '...',
        example: '...',
        keyPoints: [],
        relationships: [],
        sources: [],
        difficultyLevel: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c-other-2',
        subjectId: 'sub-mat',
        chapterId: 'chap-mat-3',
        title: 'Variabel',
        definition: '...',
        example: '...',
        keyPoints: [],
        relationships: [],
        sources: [],
        difficultyLevel: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    const studentStates = new Map<string, StudentConceptState>([
      [
        'c-exam-1',
        {
          conceptId: 'c-exam-1',
          masteryScore: 0.5,
          fsrs: {
            conceptId: 'c-exam-1',
            due: new Date().toISOString(),
            stability: 1.5,
            difficulty: 6,
            elapsed_days: 1,
            scheduled_days: 1,
            reps: 2,
            lapses: 1,
            state: 1,
          },
          recentAttemptsCount: 4,
          recentCorrectCount: 2,
          commonMistakes: ['Sering tertukar'],
          priorityScore: 90,
          recommendedMode: 'practice',
        },
      ],
    ]);

    const subjects: Subject[] = [
      { id: 'sub-bind', name: 'Bahasa Indonesia', code: 'BIN', color: '#2D5A43', iconName: 'BookOpen', description: '' },
      { id: 'sub-mat', name: 'Matematika', code: 'MAT', color: '#B94726', iconName: 'Calculator', description: '' },
    ];

    const chapters: Chapter[] = [
      { id: 'chap-bind-5', subjectId: 'sub-bind', number: 5, title: 'Bab 5 Teks Fiksi', examRelevance: 'high' },
      { id: 'chap-mat-3', subjectId: 'sub-mat', number: 3, title: 'Bab 3 Aljabar', examRelevance: 'low' },
    ];

    const exams: Exam[] = [
      {
        id: 'ex-1',
        subjectId: 'sub-bind',
        title: 'Ulangan Harian Bab 5',
        examDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 45,
        totalQuestions: 20,
        coveredChapterIds: ['chap-bind-5'],
        importance: 'high',
        readinessScore: 75,
        completedAttempts: 0,
      },
    ];

    const plan = studyPlanner.generateDailyPlan(concepts, studentStates, subjects, chapters, exams, 25);

    expect(plan.items.length).toBeGreaterThan(0);
    // Highest priority item should be the exam-scoped weak concept
    expect(plan.items[0].conceptId).toBe('c-exam-1');
    expect(plan.items[0].urgencyLevel).toBe('high');
    expect(plan.urgentExam).toBeDefined();
    expect(plan.urgentExam?.daysRemaining).toBe(3);
  });
});
