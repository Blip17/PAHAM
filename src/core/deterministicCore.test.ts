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

import { authService } from '../services/authService';
import { safeStorage } from '../services/supabaseClient';
import { generateDeterministicSocraticResponse } from '../services/ai/studyAssistant';

describe('Supabase Authentication & Profile Flow', () => {
  it('rejects registration when fields are missing or invalid', async () => {
    // Missing name
    const res1 = await authService.signUp('', 'test@paham.id', 'password123');
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('Nama panggilan');

    // Invalid email
    const res2 = await authService.signUp('Josh', 'invalid-email', 'password123');
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('email');

    // Weak password
    const res3 = await authService.signUp('Josh', 'josh@paham.id', '12345');
    expect(res3.success).toBe(false);
    expect(res3.error).toContain('minimal 6 karakter');

    // Password mismatch
    const res4 = await authService.signUp('Josh', 'josh@paham.id', 'password123', 'differentpass');
    expect(res4.success).toBe(false);
    expect(res4.error).toContain('tidak cocok');
  });

  it('registers a new valid user and initialises canonical profile', async () => {
    const testEmail = `student_${Date.now()}@paham.id`;
    const res = await authService.signUp('Satria', testEmail, 'rahasia123', 'rahasia123');

    expect(res.success).toBe(true);
    expect(res.profile).toBeDefined();
    expect(res.profile?.name).toBe('Satria');
    expect(res.profile?.email).toBe(testEmail);
    expect(res.profile?.onboardingCompleted).toBe(false);
  });

  it('prevents duplicate email registration with friendly error message', async () => {
    const testEmail = `dup_${Date.now()}@paham.id`;
    await authService.signUp('User Satu', testEmail, 'pass123456');

    // Attempt registering again with same email
    const dupRes = await authService.signUp('User Dua', testEmail, 'pass123456');
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain('sudah ada');
  });

  it('signs in with valid credentials and rejects wrong password', async () => {
    const testEmail = `login_${Date.now()}@paham.id`;
    await authService.signUp('Bunga', testEmail, 'kuncirahasia');

    // Wrong password
    const failRes = await authService.signIn(testEmail, 'wrongpass');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('belum benar');

    // Correct password
    const passRes = await authService.signIn(testEmail, 'kuncirahasia');
    expect(passRes.success).toBe(true);
    expect(passRes.profile?.name).toBe('Bunga');
  });

  it('clears active session upon signOut', async () => {
    await authService.signOut();
    expect(safeStorage.getItem('paham_session_user')).toBeNull();
  });
});

describe('Study Assistant Socratic Pedagogy Engine', () => {
  const sampleConcept: Concept = {
    id: 'c-test-pedagogy',
    subjectId: 'sub-bind',
    chapterId: 'chap-bind-1',
    title: 'Gaya Bahasa (Majas)',
    definition: 'Pemanfaatan kekayaan bahasa untuk memperoleh efek tertentu dalam karya sastra.',
    example: 'Angin malam berbisik lembut di telingaku (Personifikasi).',
    keyPoints: ['Personifikasi', 'Metafora', 'Hiperbola'],
    relationships: [],
    sources: [
      {
        materialId: 'mat-test-1',
        materialTitle: 'Catatan Bab 1 Majas',
        sourceType: 'catatan_guru',
        snippet: 'Catatan Bab 1 Majas',
        pageNumber: 4,
      },
    ],
    difficultyLevel: 2,
    createdAt: new Date().toISOString(),
  };

  it('generates a simplified explanation following EXPLAIN stage', () => {
    const response = generateDeterministicSocraticResponse({
      concept: sampleConcept,
      action: 'explain_simple',
    });

    expect(response.pedagogicalStage).toBe('EXPLAIN');
    expect(response.message).toContain('Gaya Bahasa (Majas)');
    expect(response.followupQuestion).toBeDefined();
  });

  it('generates concrete examples following ASK stage', () => {
    const response = generateDeterministicSocraticResponse({
      concept: sampleConcept,
      action: 'give_example',
    });

    expect(response.pedagogicalStage).toBe('ASK');
    expect(response.message).toContain('Personifikasi');
    expect(response.followupQuestion).toContain('contoh di atas');
  });

  it('generates retrieval hints following RETRIEVE stage', () => {
    const response = generateDeterministicSocraticResponse({
      concept: sampleConcept,
      action: 'give_hint',
    });

    expect(response.pedagogicalStage).toBe('RETRIEVE');
    expect(response.message).toContain('Petunjuk Kunci');
    expect(response.message).toContain('Catatan Bab 1');
  });

  it('generates active recall challenges following RETRIEVE stage', () => {
    const response = generateDeterministicSocraticResponse({
      concept: sampleConcept,
      action: 'test_me',
    });

    expect(response.pedagogicalStage).toBe('RETRIEVE');
    expect(response.message).toContain('Active Recall');
  });

  it('compares concepts following CORRECT stage', () => {
    const response = generateDeterministicSocraticResponse({
      concept: sampleConcept,
      action: 'compare',
    });

    expect(response.pedagogicalStage).toBe('CORRECT');
    expect(response.message).toContain('Perbandingan');
  });
});

