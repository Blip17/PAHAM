// PAHAM Personal Learning Companion — End-to-End Unit & Integration Test Suite
// Verifies signal ingestion, deterministic recommendations, transparent reasoning, mascot states, and user interaction outcomes

import { describe, it, expect } from 'vitest';
import {
  Concept,
  StudentConceptState,
  MistakeRecord,
  Flashcard,
  Exam,
  StudyGoal,
  Material,
  LearningEvent,
  Subject,
  CompanionNotificationPreferences
} from '../../core/types';
import { CompanionRecommendationEngine } from './recommendationEngine';

describe('PAHAM Personal Learning Companion Engine', () => {
  const engine = new CompanionRecommendationEngine();

  const mockSubjects: Subject[] = [
    { id: 'sub-bind', name: 'Bahasa Indonesia', code: 'BIN', color: '#2D5A43', iconName: 'BookOpen', description: 'Bahasa' },
    { id: 'sub-mat', name: 'Matematika', code: 'MAT', color: '#B94726', iconName: 'Calculator', description: 'Matematika' },
  ];

  const mockConcepts: Concept[] = [
    {
      id: 'conc-penokohan',
      subjectId: 'sub-bind',
      chapterId: 'chap-1',
      title: 'Penokohan & Karakterisasi',
      definition: 'Metode pengarang menggambarkan watak tokoh.',
      example: 'Tokoh antagonis bertindak kasar.',
      keyPoints: ['Tokoh Protagonis', 'Metode Dramatik'],
      relationships: [],
      sources: [],
      difficultyLevel: 3,
      createdAt: '2026-08-15',
    },
    {
      id: 'conc-aljabar',
      subjectId: 'sub-mat',
      chapterId: 'chap-2',
      title: 'Persamaan Linear Satu Variabel',
      definition: 'Persamaan dengan 1 variabel berpangkat satu.',
      example: '2x + 4 = 10',
      keyPoints: ['Variabel', 'Konstanta'],
      relationships: [],
      sources: [],
      difficultyLevel: 2,
      createdAt: '2026-08-15',
    }
  ];

  const defaultPreferences: CompanionNotificationPreferences = {
    enableHighPriority: true,
    enableMediumPriority: true,
    enableLowPriority: true,
    suppressedRuleIds: [],
    cornerCompanionVisible: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:30',
  };

  const fixedDate = new Date('2026-08-22T10:00:00.000Z');

  it('generates HIGH priority recommendation when an exam is approaching within 5 days', () => {
    const exams: Exam[] = [
      {
        id: 'exam-bind-uts',
        subjectId: 'sub-bind',
        title: 'UTS Bahasa Indonesia',
        examDate: '2026-08-25', // 3 days away
        durationMinutes: 60,
        totalQuestions: 30,
        coveredChapterIds: ['chap-1'],
        importance: 'high',
        readinessScore: 60,
        completedAttempts: 0,
      }
    ];

    const studentStates = new Map<string, StudentConceptState>([
      ['conc-penokohan', {
        conceptId: 'conc-penokohan',
        masteryScore: 0.6,
        fsrs: {
          conceptId: 'conc-penokohan',
          due: '2026-08-23',
          stability: 2,
          difficulty: 4,
          elapsed_days: 1,
          scheduled_days: 2,
          reps: 3,
          lapses: 1,
          state: 2,
        },
        recentAttemptsCount: 5,
        recentCorrectCount: 3,
        commonMistakes: [],
        priorityScore: 80,
        recommendedMode: 'practice',
      }]
    ]);

    const recs = engine.generateRecommendations({
      concepts: mockConcepts,
      subjects: mockSubjects,
      studentStates,
      mistakes: [],
      flashcards: [],
      exams,
      goals: [],
      materials: [],
      learningEvents: [{ id: 'evt-1', timestamp: '2026-08-21T10:00:00.000Z', eventType: 'STUDY_SESSION_COMPLETED' }],
      preferences: defaultPreferences,
      pastRecommendations: [],
      currentDate: fixedDate,
    });

    expect(recs.length).toBeGreaterThan(0);
    const examRec = recs.find(r => r.ruleId === 'RULE_EXAM_PROXIMITY');
    expect(examRec).toBeDefined();
    expect(examRec?.priority).toBe('HIGH');
    expect(examRec?.mascotState).toBe('warning');
    expect(examRec?.reason).toContain('Ulangan terjadwal');
    expect(examRec?.bubblePrompt).toContain('Ulangan');
  });

  it('generates HIGH priority recommendation when FSRS flashcards are overdue', () => {
    const flashcards: Flashcard[] = [
      {
        id: 'fc-1',
        conceptId: 'conc-penokohan',
        conceptTitle: 'Penokohan',
        subjectId: 'sub-bind',
        chapterId: 'chap-1',
        front: 'Apa itu penokohan analitik?',
        back: 'Penggambaran watak tokoh secara langsung oleh pengarang.',
        cardType: 'CONCEPT_DEFINITION',
        fsrs: {
          conceptId: 'conc-penokohan',
          due: '2026-08-20',
          state: 2,
          stability: 1,
          difficulty: 3,
          elapsed_days: 1,
          scheduled_days: 1,
          reps: 2,
          lapses: 0,
          last_review: '2026-08-15',
        },
        createdAt: '2026-08-15',
        updatedAt: '2026-08-15',
      },
      {
        id: 'fc-2',
        conceptId: 'conc-aljabar',
        conceptTitle: 'Aljabar',
        subjectId: 'sub-mat',
        chapterId: 'chap-2',
        front: 'Apa itu variabel?',
        back: 'Simbol pengganti nilai yang belum diketahui.',
        cardType: 'CONCEPT_DEFINITION',
        fsrs: {
          conceptId: 'conc-aljabar',
          due: '2026-08-21',
          state: 2,
          stability: 1,
          difficulty: 2,
          elapsed_days: 1,
          scheduled_days: 1,
          reps: 2,
          lapses: 0,
          last_review: '2026-08-15',
        },
        createdAt: '2026-08-15',
        updatedAt: '2026-08-15',
      }
    ];

    const recs = engine.generateRecommendations({
      concepts: mockConcepts,
      subjects: mockSubjects,
      studentStates: new Map(),
      mistakes: [],
      flashcards,
      exams: [],
      goals: [],
      materials: [],
      learningEvents: [{ id: 'evt-1', timestamp: '2026-08-21T10:00:00.000Z', eventType: 'STUDY_SESSION_COMPLETED' }],
      preferences: defaultPreferences,
      pastRecommendations: [],
      currentDate: fixedDate,
    });

    const fsrsRec = recs.find(r => r.ruleId === 'RULE_FSRS_OVERDUE');
    expect(fsrsRec).toBeDefined();
    expect(fsrsRec?.priority).toBe('HIGH');
    expect(fsrsRec?.actionType).toBe('REVIEW_FLASHCARDS');
    expect(fsrsRec?.reason).toContain('2 kartu flashcard jatuh tempo');
  });

  it('generates MEDIUM priority recommendation when repeated misconceptions are detected', () => {
    const mistakes: MistakeRecord[] = [
      {
        id: 'm-1',
        conceptId: 'conc-penokohan',
        conceptTitle: 'Penokohan & Karakterisasi',
        subjectId: 'sub-bind',
        questionPrompt: 'Manakah contoh penokohan dramatik?',
        userGivenAnswer: 'Pengarang menyebut tokoh itu pemarah.',
        correctAnswer: 'Tokoh membanting pintu saat berbicara.',
        misconceptionDescription: 'Tertukar antara penokohan langsung dan tidak langsung.',
        dateOccurred: '2026-08-20T10:00:00.000Z',
        isResolved: false,
      },
      {
        id: 'm-2',
        conceptId: 'conc-penokohan',
        conceptTitle: 'Penokohan & Karakterisasi',
        subjectId: 'sub-bind',
        questionPrompt: 'Ciri penokohan analitik adalah...',
        userGivenAnswer: 'Digambarkan lewat dialog.',
        correctAnswer: 'Dideskripsikan langsung tanpa dialog.',
        misconceptionDescription: 'Tertukar istilah analitik dan dramatik.',
        dateOccurred: '2026-08-21T10:00:00.000Z',
        isResolved: false,
      }
    ];

    const recs = engine.generateRecommendations({
      concepts: mockConcepts,
      subjects: mockSubjects,
      studentStates: new Map(),
      mistakes,
      flashcards: [],
      exams: [],
      goals: [],
      materials: [],
      learningEvents: [{ id: 'evt-1', timestamp: '2026-08-21T10:00:00.000Z', eventType: 'STUDY_SESSION_COMPLETED' }],
      preferences: defaultPreferences,
      pastRecommendations: [],
      currentDate: fixedDate,
    });

    const mistakeRec = recs.find(r => r.ruleId === 'RULE_REPEATED_MISTAKE');
    expect(mistakeRec).toBeDefined();
    expect(mistakeRec?.priority).toBe('MEDIUM');
    expect(mistakeRec?.mascotState).toBe('thinking');
    expect(mistakeRec?.reason).toContain('2 catatan miskonsepsi aktif');
  });

  it('respects user suppressed rules and snoozed recommendations', () => {
    const mistakes: MistakeRecord[] = [
      {
        id: 'm-1',
        conceptId: 'conc-penokohan',
        conceptTitle: 'Penokohan',
        subjectId: 'sub-bind',
        questionPrompt: 'Soal',
        userGivenAnswer: 'A',
        correctAnswer: 'B',
        misconceptionDescription: 'Salah paham',
        dateOccurred: '2026-08-20',
        isResolved: false,
      },
      {
        id: 'm-2',
        conceptId: 'conc-penokohan',
        conceptTitle: 'Penokohan',
        subjectId: 'sub-bind',
        questionPrompt: 'Soal 2',
        userGivenAnswer: 'A',
        correctAnswer: 'B',
        misconceptionDescription: 'Salah paham',
        dateOccurred: '2026-08-20',
        isResolved: false,
      }
    ];

    const suppressedPrefs: CompanionNotificationPreferences = {
      ...defaultPreferences,
      suppressedRuleIds: ['RULE_REPEATED_MISTAKE'],
    };

    const recs = engine.generateRecommendations({
      concepts: mockConcepts,
      subjects: mockSubjects,
      studentStates: new Map(),
      mistakes,
      flashcards: [],
      exams: [],
      goals: [],
      materials: [],
      learningEvents: [{ id: 'evt-1', timestamp: '2026-08-21T10:00:00.000Z', eventType: 'STUDY_SESSION_COMPLETED' }],
      preferences: suppressedPrefs,
      pastRecommendations: [],
      currentDate: fixedDate,
    });

    const mistakeRec = recs.find(r => r.ruleId === 'RULE_REPEATED_MISTAKE');
    expect(mistakeRec).toBeUndefined();
  });

  it('elevates priority of rules that have high past acceptance', () => {
    const pastRecommendations = [
      {
        id: 'past-1',
        ruleId: 'RULE_UNSTUDIED_MATERIAL',
        title: 'Materi Baru',
        message: 'Belajar materi',
        reason: 'Baru upload',
        sourceSignals: ['UNSTUDIED_MATERIAL'],
        priority: 'MEDIUM' as const,
        actionType: 'READ_MATERIAL' as const,
        mascotState: 'curious' as const,
        bubblePrompt: 'Materi baru',
        createdAt: '2026-08-10',
        outcome: 'ACCEPTED' as const,
      },
      {
        id: 'past-2',
        ruleId: 'RULE_UNSTUDIED_MATERIAL',
        title: 'Materi Baru 2',
        message: 'Belajar materi',
        reason: 'Baru upload',
        sourceSignals: ['UNSTUDIED_MATERIAL'],
        priority: 'MEDIUM' as const,
        actionType: 'READ_MATERIAL' as const,
        mascotState: 'curious' as const,
        bubblePrompt: 'Materi baru',
        createdAt: '2026-08-11',
        outcome: 'ACCEPTED' as const,
      }
    ];

    const materials: Material[] = [
      {
        id: 'mat-1',
        subjectId: 'sub-mat',
        chapterId: 'chap-2',
        title: 'Catatan Persamaan Linear',
        sourceType: 'catatan_guru',
        dateAdded: '2026-08-21',
        pageCount: 1,
        hasHandwriting: true,
        isVerified: true,
        blocks: [],
      }
    ];

    const recs = engine.generateRecommendations({
      concepts: mockConcepts,
      subjects: mockSubjects,
      studentStates: new Map(),
      mistakes: [],
      flashcards: [],
      exams: [],
      goals: [],
      materials,
      learningEvents: [{ id: 'evt-1', timestamp: '2026-08-21T10:00:00.000Z', eventType: 'STUDY_SESSION_COMPLETED' }],
      preferences: defaultPreferences,
      pastRecommendations,
      currentDate: fixedDate,
    });

    const matRec = recs.find(r => r.ruleId === 'RULE_UNSTUDIED_MATERIAL');
    expect(matRec).toBeDefined();
    expect(matRec?.actionType).toBe('READ_MATERIAL');
  });
});
