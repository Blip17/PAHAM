// IndexedDB Database with Dexie for PAHAM
// Clean local-first database with standard Indonesian subjects and zero unwanted dummy data

import Dexie, { Table } from 'dexie';
import {
  UserProfile,
  Subject,
  Chapter,
  Material,
  Concept,
  StudentConceptState,
  Question,
  Exam,
  ExamAttempt,
  MistakeRecord,
  LearningEvent,
  DailyStudyPlan,
  Flashcard,
  StudySession,
  StudyGoal,
  ScheduledStudyBlock,
  CompanionRecommendation,
  CompanionNotificationPreferences
} from './types';

export class PahamDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  materials!: Table<Material, string>;
  concepts!: Table<Concept, string>;
  studentConceptStates!: Table<StudentConceptState, string>;
  questions!: Table<Question, string>;
  exams!: Table<Exam, string>;
  examAttempts!: Table<ExamAttempt, string>;
  mistakeRecords!: Table<MistakeRecord, string>;
  learningEvents!: Table<LearningEvent, string>;
  studyPlans!: Table<DailyStudyPlan, string>;
  flashcards!: Table<Flashcard, string>;
  studySessions!: Table<StudySession, string>;
  goals!: Table<StudyGoal, string>;
  scheduledBlocks!: Table<ScheduledStudyBlock, string>;
  recommendations!: Table<CompanionRecommendation, string>;
  companionPreferences!: Table<CompanionNotificationPreferences, string>;

  constructor() {
    super('PahamDB');
    this.version(1).stores({
      profiles: 'id',
      subjects: 'id, name, code',
      chapters: 'id, subjectId, number',
      materials: 'id, subjectId, chapterId, sourceType, dateAdded',
      concepts: 'id, subjectId, chapterId, title',
      studentConceptStates: 'conceptId, masteryScore, priorityScore',
      questions: 'id, subjectId, chapterId, conceptId, questionType, qualityStatus',
      exams: 'id, subjectId, examDate',
      examAttempts: 'id, examId, subjectId, submittedAt',
      mistakeRecords: 'id, conceptId, subjectId, isResolved, dateOccurred',
      learningEvents: 'id, timestamp, eventType, subjectId, conceptId',
      studyPlans: 'date',
      flashcards: 'id, conceptId, subjectId, chapterId, cardType',
      studySessions: 'id, subjectId, mode, startedAt',
      goals: 'id, subjectId, goalType, status, targetDate',
      scheduledBlocks: 'id, date, subjectId, status, startTime',
      recommendations: 'id, ruleId, priority, actionType, outcome, createdAt, snoozedUntil',
      companionPreferences: 'id',
    });
  }
}

export const db = new PahamDatabase();

// 17 Standard Indonesian Curriculum Subjects
export const DEFAULT_INDONESIAN_SUBJECTS: Subject[] = [
  {
    id: 'sub-bind',
    name: 'Bahasa Indonesia',
    code: 'BIN',
    color: '#2D5A43',
    iconName: 'BookOpen',
    description: 'Membaca kritis, struktur teks fiksi & nonfiksi, kebahasaan.',
  },
  {
    id: 'sub-mat',
    name: 'Matematika',
    code: 'MAT',
    color: '#B94726',
    iconName: 'Calculator',
    description: 'Aljabar, persamaan linear, geometri, trigonometri, kalkulus.',
  },
  {
    id: 'sub-ipa',
    name: 'IPA (Ilmu Pengetahuan Alam)',
    code: 'IPA',
    color: '#3A7D5C',
    iconName: 'Microscope',
    description: 'Sistem organisasi kehidupan, ekosistem, zat, dan energi.',
  },
  {
    id: 'sub-fisika',
    name: 'Fisika',
    code: 'FIS',
    color: '#1E4532',
    iconName: 'Zap',
    description: 'Kinematika, dinamika, termodinamika, gelombang, optika, listrik.',
  },
  {
    id: 'sub-kimia',
    name: 'Kimia',
    code: 'KIM',
    color: '#8F5313',
    iconName: 'FlaskConical',
    description: 'Struktur atom, ikatan kimia, stoikiometri, asam-basa, larutan.',
  },
  {
    id: 'sub-biologi',
    name: 'Biologi',
    code: 'BIO',
    color: '#26533C',
    iconName: 'Dna',
    description: 'Sel, metabolisme, genetika, evolusi, bioteknologi, ekologi.',
  },
  {
    id: 'sub-bing',
    name: 'Bahasa Inggris',
    code: 'ENG',
    color: '#B26A1A',
    iconName: 'Globe',
    description: 'Reading comprehension, descriptive text, tenses, vocabulary.',
  },
  {
    id: 'sub-ips',
    name: 'IPS (Ilmu Pengetahuan Sosial)',
    code: 'IPS',
    color: '#757067',
    iconName: 'Compass',
    description: 'Interaksi keruangan, sejarah Nusantara, aktivitas ekonomi.',
  },
  {
    id: 'sub-sejarah',
    name: 'Sejarah Indonesia',
    code: 'SEJ',
    color: '#94331A',
    iconName: 'Hourglass',
    description: 'Peradaban kuno, kerajaan Hindu-Buddha-Islam, kemerdekaan RI.',
  },
  {
    id: 'sub-geografi',
    name: 'Geografi',
    code: 'GEO',
    color: '#4B9670',
    iconName: 'Map',
    description: 'Litosfer, hidrosfer, atmosfer, penginderaan jauh, kependudukan.',
  },
  {
    id: 'sub-ekonomi',
    name: 'Ekonomi',
    code: 'EKO',
    color: '#6E400E',
    iconName: 'TrendingUp',
    description: 'Permintaan & penawaran, uang & perbankan, akuntansi, pasar.',
  },
  {
    id: 'sub-sosiologi',
    name: 'Sosiologi',
    code: 'SOS',
    color: '#5C564F',
    iconName: 'Users',
    description: 'Interaksi sosial, struktur sosial, konflik, integrasi, perubahan.',
  },
  {
    id: 'sub-ppkn',
    name: 'Pendidikan Pancasila (PPKn)',
    code: 'PKN',
    color: '#B94726',
    iconName: 'Shield',
    description: 'Nilai-nilai Pancasila, UUD 1945, norma hukum, NKRI, HAM.',
  },
  {
    id: 'sub-infor',
    name: 'Informatika',
    code: 'INF',
    color: '#173626',
    iconName: 'Cpu',
    description: 'Berpikir komputasional, algoritma, pemrograman, jaringan.',
  },
  {
    id: 'sub-agama',
    name: 'Pendidikan Agama & Budi Pekerti',
    code: 'AGM',
    color: '#2D5A43',
    iconName: 'Heart',
    description: 'Akidah, akhlak, fikih, sejarah peradaban, toleransi beragama.',
  },
  {
    id: 'sub-seni',
    name: 'Seni Budaya',
    code: 'SNB',
    color: '#D45D3B',
    iconName: 'Palette',
    description: 'Seni rupa, seni musik, seni tari, apresiasi karya seni Nusantara.',
  },
  {
    id: 'sub-pjok',
    name: 'PJOK (Penjasorkes)',
    code: 'PJK',
    color: '#3A7D5C',
    iconName: 'Activity',
    description: 'Permainan bola, atletik, kebugaran jasmani, kesehatan remaja.',
  },
];

// Initialization: Check if this is first run or upgrade from old profile format
export async function initializeDatabaseSeed() {
  // For existing users who had profiles before the entry experience upgrade,
  // mark their onboarding as complete so they don't get sent through the flow.
  const existingProfile = await db.profiles.toCollection().first();
  if (existingProfile && existingProfile.onboardingCompleted === undefined) {
    // Legacy profile — upgrade it silently
    const upgraded = {
      ...existingProfile,
      onboardingCompleted: true,
      onboardingVersion: 1,
      hasSeenArrival: true,
      displayName: existingProfile.name,
      updatedAt: new Date().toISOString(),
    };
    await db.profiles.put(upgraded);
    console.log('[PAHAM] Upgraded legacy profile to v1 onboarding format.');
  }

  // Subjects are now seeded during onboarding (OnboardingShell.handleFinish)
  // Only seed here as a fallback if somehow subjects are empty for an onboarded user
  if (existingProfile?.onboardingCompleted) {
    const subjectCount = await db.subjects.count();
    if (subjectCount === 0) {
      await db.subjects.bulkAdd(DEFAULT_INDONESIAN_SUBJECTS);
    }
  }
}
