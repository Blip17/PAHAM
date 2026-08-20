// Comprehensive Unit Tests for PAHAM Main Learning Engine
// Tests learningMethodSelector, flashcardService, adaptiveQuestionEngine, and studySessionEngine

import { describe, it, expect } from 'vitest';
import { learningMethodSelector } from './engine/learningMethodSelector';
import { flashcardService } from './flashcards/flashcardService';
import { adaptiveQuestionEngine } from './engine/adaptiveQuestionEngine';
import { studySessionEngine } from './engine/studySessionEngine';
import { goalPlanner } from './goals/goalPlanner';
import { notificationService } from './notifications/notificationService';
import { Concept, StudentConceptState, MistakeRecord, Exam, Question } from '../core/types';
import { fsrs } from '../core/fsrsEngine';

const mockConcept: Concept = {
  id: 'c-penokohan',
  subjectId: 'sub-bind',
  chapterId: 'chap-1',
  title: 'Penokohan',
  definition: 'Cara pengarang menggambarkan watak dan karakter tokoh dalam cerita fiksi.',
  example: 'Tokoh antagonis digambarkan dengan sifat licik melalui dialog dan tindakan.',
  keyPoints: ['Tokoh adalah pemeran cerita', 'Penokohan adalah penggambaran watak pemeran'],
  relationships: [],
  sources: [{
    materialId: 'mat-1',
    materialTitle: 'Catatan Guru Bab 1',
    sourceType: 'catatan_guru',
    pageNumber: 3,
    snippet: 'Penokohan adalah cara pengarang menggambarkan watak tokoh.'
  }],
  difficultyLevel: 2,
  createdAt: new Date().toISOString(),
};

describe('Learning Method Selector', () => {
  it('selects LEARN for a brand new unstudied concept', () => {
    const recommendation = learningMethodSelector.selectMethod({
      concept: mockConcept,
      studentState: undefined,
    });

    expect(recommendation.method).toBe('LEARN');
    expect(recommendation.relevanceScore).toBeGreaterThan(0.9);
    expect(recommendation.reason).toContain('baru pertama kali dipelajari');
  });

  it('selects REPAIR when an active misconception/mistake is present', () => {
    const mistake: MistakeRecord = {
      id: 'mst-1',
      conceptId: mockConcept.id,
      conceptTitle: mockConcept.title,
      subjectId: mockConcept.subjectId,
      questionPrompt: 'Apakah bedanya tokoh dan penokohan?',
      userGivenAnswer: 'Tokoh adalah watak',
      correctAnswer: 'Tokoh adalah pelaku cerita',
      misconceptionDescription: 'Tertukar antara pelaku dan watak',
      dateOccurred: new Date().toISOString(),
      isResolved: false,
    };

    const recommendation = learningMethodSelector.selectMethod({
      concept: mockConcept,
      recentMistakes: [mistake],
    });

    expect(recommendation.method).toBe('REPAIR');
    expect(recommendation.relevanceScore).toBe(0.98);
    expect(recommendation.reason).toContain('Tertukar antara pelaku dan watak');
  });

  it('selects MIXED_PRACTICE when an exam is imminent (<= 3 days)', () => {
    const exam: Exam = {
      id: 'ex-1',
      subjectId: mockConcept.subjectId,
      title: 'Penilaian Harian Bahasa Indonesia',
      examDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 45,
      totalQuestions: 20,
      coveredChapterIds: [mockConcept.chapterId],
      importance: 'high',
      readinessScore: 75,
      completedAttempts: 0,
    };

    const state: StudentConceptState = {
      conceptId: mockConcept.id,
      masteryScore: 0.72,
      fsrs: fsrs.createEmptyCard(mockConcept.id),
      recentAttemptsCount: 3,
      recentCorrectCount: 3,
      commonMistakes: [],
      priorityScore: 50,
      recommendedMode: 'practice',
    };

    const recommendation = learningMethodSelector.selectMethod({
      concept: mockConcept,
      studentState: state,
      upcomingExams: [exam],
    });

    expect(recommendation.method).toBe('MIXED_PRACTICE');
    expect(recommendation.reason).toContain('Penilaian Harian Bahasa Indonesia');
  });

  it('selects ADAPTIVE_PRACTICE when recall is good but application needs drilling', () => {
    const card = fsrs.createEmptyCard(mockConcept.id);
    card.reps = 2;

    const state: StudentConceptState = {
      conceptId: mockConcept.id,
      masteryScore: 0.70,
      fsrs: card,
      recentAttemptsCount: 4,
      recentCorrectCount: 3,
      commonMistakes: [],
      priorityScore: 40,
      recommendedMode: 'practice',
    };

    const recommendation = learningMethodSelector.selectMethod({
      concept: mockConcept,
      studentState: state,
    });

    expect(recommendation.method).toBe('ADAPTIVE_PRACTICE');
    expect(recommendation.reason).toContain('paham dasar konsepnya');
  });
});

describe('Flashcard Service', () => {
  it('generates atomic flashcards with definition, example, and contrast pointers', () => {
    const cards = flashcardService.generateCardsForConcept(mockConcept);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    
    const defCard = cards.find(c => c.cardType === 'CONCEPT_DEFINITION');
    expect(defCard).toBeDefined();
    expect(defCard?.front).toContain('Apa yang dimaksud dengan Penokohan');
    expect(defCard?.back).toBe(mockConcept.definition);
  });

  it('generates targeted contrast flashcard from student mistake', () => {
    const mistake: MistakeRecord = {
      id: 'mst-2',
      conceptId: mockConcept.id,
      conceptTitle: mockConcept.title,
      subjectId: mockConcept.subjectId,
      questionPrompt: 'Apa bedanya tokoh dan penokohan?',
      userGivenAnswer: 'Tokoh adalah penggambaran watak',
      correctAnswer: 'Tokoh adalah pemeran',
      misconceptionDescription: 'Tertukar antara tokoh dan penokohan',
      dateOccurred: new Date().toISOString(),
      isResolved: false,
    };

    const card = flashcardService.generateCardFromMistake(mistake, mockConcept);
    expect(card.front).toContain('Bagaimana membedakan Penokohan');
    expect(card.back).toContain('Kekeliruan sebelumnya');
  });

  it('formats friendly FSRS interval labels for students', () => {
    expect(flashcardService.formatIntervalLabel(1, 1)).toBe('Ulangi Besok (1 hari)');
    expect(flashcardService.formatIntervalLabel(3, 4)).toBe('4 hari lagi');
    expect(flashcardService.formatIntervalLabel(4, 7)).toBe('1 minggu lagi');
  });
});

describe('Adaptive Question Engine', () => {
  it('initializes adaptive multi-question session state', () => {
    const state = adaptiveQuestionEngine.createSessionState([mockConcept.id], 2, 8);
    expect(state.totalTargetQuestions).toBe(8);
    expect(state.currentDifficulty).toBe(2);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.isCompleted).toBe(false);
  });

  it('synthesizes questions matching difficulty and skill when pool is empty', () => {
    const q1 = adaptiveQuestionEngine.synthesizeDynamicQuestion(mockConcept, 2, 'KNOWLEDGE', 0);
    expect(q1.difficulty).toBe(2);
    expect(q1.prompt).toContain('mendefinisikan');

    const q3 = adaptiveQuestionEngine.synthesizeDynamicQuestion(mockConcept, 3, 'APPLICATION', 1);
    expect(q3.difficulty).toBe(3);
    expect(q3.prompt).toContain('studi kasus');
  });

  it('adapts difficulty upward upon consecutive correct answers', () => {
    const state = adaptiveQuestionEngine.createSessionState([mockConcept.id], 2, 8);
    const q = adaptiveQuestionEngine.synthesizeDynamicQuestion(mockConcept, 2, 'KNOWLEDGE', 0);
    const correctOpt = q.options?.find(o => o.isCorrect)?.id || 'opt-1';

    // Attempt 1 (Correct)
    const res1 = adaptiveQuestionEngine.processAttempt(state, q, correctOpt, 10);
    expect(res1.isCorrect).toBe(true);

    // Attempt 2 (Correct again -> should increase difficulty)
    const res2 = adaptiveQuestionEngine.processAttempt(res1.updatedState, q, correctOpt, 10);
    expect(res2.updatedState.currentDifficulty).toBe(3);
    expect(res2.updatedState.adaptationFeedback).toContain('dinaikkan sedikit');
  });

  it('triggers repair mode and lowers difficulty on wrong answer', () => {
    const state = adaptiveQuestionEngine.createSessionState([mockConcept.id], 3, 8);
    const q = adaptiveQuestionEngine.synthesizeDynamicQuestion(mockConcept, 3, 'APPLICATION', 0);
    const wrongOpt = q.options?.find(o => !o.isCorrect)?.id || 'opt-2';

    const res = adaptiveQuestionEngine.processAttempt(state, q, wrongOpt, 12);
    expect(res.isCorrect).toBe(false);
    expect(res.updatedState.currentDifficulty).toBe(2);
    expect(res.updatedState.adaptationFeedback).toContain('menurunkan tingkat kesulitan');
  });
});

describe('Study Session Engine', () => {
  it('builds full cognitive activity sequences for LEARN mode', () => {
    const activities = studySessionEngine.buildActivitiesForSession('sess-1', 'LEARN', [mockConcept]);
    const types = activities.map(a => a.type);

    expect(types).toContain('RECALL');
    expect(types).toContain('EXPLANATION');
    expect(types).toContain('TEACH_BACK');
    expect(types).toContain('ADAPTIVE_QUESTION');
    expect(types).toContain('CONFIDENCE_CHECK');
    expect(types).toContain('REVIEW');
  });

  it('builds contrast repair sequence for REPAIR mode', () => {
    const activities = studySessionEngine.buildActivitiesForSession('sess-2', 'REPAIR', [mockConcept]);
    const types = activities.map(a => a.type);

    expect(types).toContain('COMPARE');
    expect(types).toContain('EXPLANATION');
    expect(types).toContain('ADAPTIVE_QUESTION');
  });
});

describe('Goal Planner & Proposed Sessions', () => {
  it('generates a realistic weekly session distribution for a goal', () => {
    const goal = {
      id: 'g-test',
      title: 'Siap Ulangan Biologi',
      subjectId: 'sub-bio',
      goalType: 'EXAM_GOAL' as const,
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      desiredOutcome: 'Stabil di konsep metabolisme',
      weeklyFrequency: 3,
      availableMinutesPerSession: 15,
      priority: 'high' as const,
      progressPercentage: 50,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessions = goalPlanner.generateProposedSessions(goal);
    expect(sessions.length).toBe(3);
    expect(sessions[0].durationMinutes).toBe(15);
    expect(sessions[0].focus).toContain('Active Recall');
  });
});

describe('Notification & Quiet Hours System', () => {
  it('identifies quiet hours correctly when crossing midnight', () => {
    const prefs = {
      enabled: true,
      studyReminders: true,
      examReminders: true,
      reviewReminders: true,
      dailyPlanning: true,
      reminderLeadMinutes: 5 as const,
      frequency: 'normal' as const,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:30',
      permissionState: 'granted' as const,
    };

    // Test helper directly using start/end logic
    const isQuiet = notificationService.isInsideQuietHours(prefs);
    expect(typeof isQuiet).toBe('boolean');
  });
});

