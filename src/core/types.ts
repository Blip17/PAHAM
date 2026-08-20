// Core Data Types for PAHAM (Personal Adaptive Learning System)

export type GradeLevel = 'Kelas 7' | 'Kelas 8' | 'Kelas 9' | 'Kelas 10' | 'Kelas 11' | 'Kelas 12';
export type Semester = 'Semester 1' | 'Semester 2';

export type EducationSystem = 'indonesia' | 'international';
export type LearningMethod =
  | 'latihan_soal'
  | 'simulasi_ujian'
  | 'penjelasan_singkat'
  | 'langkah_demi_langkah'
  | 'flashcard'
  | 'campuran';
export type StudyTimeSlot = '10-15' | '20-30' | '30-60' | '60+' | 'tidak_tentu';

export interface UserProfile {
  id: string;
  name: string;                           // display name (panggilan)
  email?: string;
  grade: GradeLevel;
  semester: Semester;
  schoolName: string;
  dailyTimeTargetMinutes: number;
  createdAt: string;
  updatedAt: string;
  // Extended onboarding fields
  displayName?: string;                   // "dipanggil apa" — short preferred name
  schoolCity?: string;
  schoolProvince?: string;
  educationSystem?: EducationSystem;
  curriculum?: string;                    // "Kurikulum Merdeka" | "K13" | "IB" | etc.
  preferredLearningMethods?: LearningMethod[];
  availableStudyTime?: StudyTimeSlot;
  studyDays?: string[];
  onboardingCompleted?: boolean;
  onboardingVersion?: number;             // 1 = current spec
  hasSeenArrival?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  iconName: string;
  description: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  description?: string;
  examRelevance: 'high' | 'medium' | 'low';
}

export type MaterialSourceType = 
  | 'catatan_guru'    // Teacher notes (handwritten/printed)
  | 'fotokopi'        // Photocopies
  | 'lembar_kerja'    // Worksheets
  | 'buku_cetak'      // Textbook
  | 'catatan_pribadi' // Personal student notes
  | 'pdf';

export type ExtractionMethod = 'local_ocr' | 'ai_vision' | 'manual_entry';
export type VerificationState = 'UNVERIFIED' | 'AUTO_ACCEPTED' | 'USER_VERIFIED' | 'AI_VERIFIED' | 'NEEDS_REVIEW';

export interface MaterialBlock {
  id: string;
  materialId: string;
  pageNumber: number;
  blockType: 'heading' | 'paragraph' | 'list_item' | 'formula' | 'handwritten_note' | 'table';
  text: string;
  confidence: number; // 0 to 1
  isHandwritten: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  verificationState: VerificationState;
  extractedConcepts?: string[];
}

export interface Material {
  id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  sourceType: MaterialSourceType;
  dateAdded: string;
  pageCount: number;
  hasHandwriting: boolean;
  isVerified: boolean;
  thumbnailUrl?: string;
  rawText?: string;
  blocks: MaterialBlock[];
  previewPages?: Array<{
    pageNumber: number;
    imageUrl?: string;
    canvasNotes?: string;
  }>;
}

export type ConceptRelationshipType = 
  | 'IS_A' 
  | 'PART_OF' 
  | 'EXAMPLE_OF' 
  | 'CONTRASTS_WITH' 
  | 'PREREQUISITE_OF' 
  | 'RELATED_TO';

export interface ConceptRelationship {
  id: string;
  targetConceptId: string;
  relationshipType: ConceptRelationshipType;
  notes?: string;
}

export interface SourceReference {
  materialId: string;
  materialTitle: string;
  sourceType: MaterialSourceType;
  pageNumber: number;
  lineNumber?: number;
  snippet: string;
}

export interface Concept {
  id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  definition: string;
  example: string;
  keyPoints: string[];
  relationships: ConceptRelationship[];
  sources: SourceReference[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5; // 1: very easy, 5: abstract/hard
  createdAt: string;
}

// FSRS Spaced Repetition State
export type FSRSState = 0 | 1 | 2 | 3; // 0: New, 1: Learning, 2: Review, 3: Relearning
export type FSRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FSRSCard {
  conceptId: string;
  due: string; // ISO date
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FSRSState;
  last_review?: string;
}

export interface StudentConceptState {
  conceptId: string;
  masteryScore: number; // 0.0 to 1.0 (readiness)
  fsrs: FSRSCard;
  recentAttemptsCount: number;
  recentCorrectCount: number;
  commonMistakes: string[];
  lastStudied?: string;
  priorityScore: number; // calculated for daily planner
  recommendedMode: 'learn' | 'recall' | 'practice' | 'review' | 'rescue';
}

export type QuestionType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'fill_blank' 
  | 'short_answer' 
  | 'scenario' 
  | 'error_detection';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  conceptId: string;
  questionType: QuestionType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  options?: QuestionOption[];
  correctAnswerText?: string;
  explanation: string;
  misconceptionAlert?: string;
  sourceReference?: string;
  timesAnswered: number;
  timesCorrect: number;
  qualityStatus: 'approved' | 'auto_generated' | 'needs_review';
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  examDate: string; // ISO date string
  durationMinutes: number;
  totalQuestions: number;
  coveredChapterIds: string[];
  importance: 'high' | 'medium' | 'low';
  readinessScore: number; // calculated 0-100%
  completedAttempts: number;
}

export interface ExamQuestionAnswer {
  questionId: string;
  conceptId: string;
  userSelectedOptionId?: string;
  userTextAnswer?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  subjectId: string;
  startedAt: string;
  submittedAt: string;
  durationSecondsUsed: number;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswersCount: number;
  strongConceptIds: string[];
  weakConceptIds: string[];
  commonMistakeSummaries: string[];
  recommendedFollowupMinutes: number;
  answers: ExamQuestionAnswer[];
}

export interface MistakeRecord {
  id: string;
  conceptId: string;
  conceptTitle: string;
  subjectId: string;
  questionPrompt: string;
  userGivenAnswer: string;
  correctAnswer: string;
  misconceptionDescription: string;
  dateOccurred: string;
  isResolved: boolean;
}

export type LearningEventType = 
  | 'MATERIAL_IMPORTED'
  | 'CONCEPT_CREATED'
  | 'CONCEPT_VIEWED'
  | 'LEARN_STEP_COMPLETED'
  | 'QUESTION_ANSWERED'
  | 'REVIEW_RATED'
  | 'STUDY_SESSION_COMPLETED'
  | 'EXAM_STARTED'
  | 'EXAM_SUBMITTED';

export interface LearningEvent {
  id: string;
  timestamp: string;
  eventType: LearningEventType;
  subjectId?: string;
  conceptId?: string;
  metadata?: Record<string, any>;
}

export interface DailyStudyItem {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterTitle: string;
  conceptId: string;
  conceptTitle: string;
  priorityType: 'urgent_exam' | 'fsrs_due' | 'weak_mastery' | 'new_material';
  mode: 'learn' | 'recall' | 'practice' | 'review' | 'rescue';
  estimatedMinutes: number;
  reason: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  isCompleted: boolean;
}

export interface DailyStudyPlan {
  date: string;
  totalEstimatedMinutes: number;
  items: DailyStudyItem[];
  urgentExam?: {
    examId: string;
    subjectName: string;
    daysRemaining: number;
    readinessScore: number;
  };
}

export interface AIBudgetState {
  dailyCallsLimit: number;
  callsUsedToday: number;
  tokensUsedToday: number;
  lastResetDate: string;
  isBudgetExceeded: boolean;
  customApiKey?: string;
}

export type StudyAssistantAction = 
  | 'explain_simple'
  | 'give_example'
  | 'give_hint'
  | 'test_me'
  | 'compare';

export interface StudyAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionUsed?: StudyAssistantAction;
  timestamp: string;
  suggestedFollowups?: string[];
}

export interface StudyAssistantResponse {
  message: string;
  pedagogicalStage: 'EXPLAIN' | 'ASK' | 'RETRIEVE' | 'CORRECT' | 'PRACTICE';
  followupQuestion?: string;
  suggestedFollowups: string[];
  isAiGenerated: boolean;
}

// ────────────────────────────────────────────────────────────
// MAIN LEARNING ENGINE DOMAIN TYPES
// ────────────────────────────────────────────────────────────

export type CardType = 
  | 'BASIC'
  | 'CLOZE'
  | 'CONCEPT_DEFINITION'
  | 'TERM_DEFINITION'
  | 'QUESTION_ANSWER'
  | 'COMPARE'
  | 'FORMULA'
  | 'VOCABULARY'
  | 'IMAGE_RECALL';

export interface Flashcard {
  id: string;
  studentId?: string;
  conceptId: string;
  conceptTitle?: string;
  subjectId: string;
  chapterId: string;
  front: string;
  back: string;
  hint?: string;
  sourceReferences?: SourceReference[];
  cardType: CardType;
  fsrs: FSRSCard;
  createdAt: string;
  updatedAt: string;
}

export type FlashcardMode = 'DUE' | 'TOPIC' | 'WEAK' | 'NEW' | 'MIXED' | 'EXAM';

export type StudyMode = 
  | 'LEARN'
  | 'RECALL'
  | 'FLASHCARD'
  | 'ADAPTIVE_PRACTICE'
  | 'REPAIR'
  | 'MIXED_PRACTICE'
  | 'EXAM_PREP'
  | 'REVIEW'
  | 'RESCUE';

export type ActivityType = 
  | 'RECALL'
  | 'FLASHCARD'
  | 'EXPLANATION'
  | 'EXAMPLE'
  | 'QUIZ'
  | 'ADAPTIVE_QUESTION'
  | 'COMPARE'
  | 'TEACH_BACK'
  | 'CONFIDENCE_CHECK'
  | 'SUMMARY'
  | 'REVIEW';

export type SkillType = 
  | 'KNOWLEDGE'
  | 'RECALL'
  | 'APPLICATION'
  | 'DISTINCTION'
  | 'PROBLEM_SOLVING'
  | 'EXPLANATION';

export interface StudyActivity {
  id: string;
  sessionId: string;
  type: ActivityType;
  conceptId: string;
  conceptTitle?: string;
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  data?: any;
  result?: any;
}

export interface SessionSummaryData {
  timeStudiedSeconds: number;
  conceptsReviewedCount: number;
  questionsAnsweredCount: number;
  correctAnswersCount: number;
  masteryDelta: Record<string, { before: number; after: number }>;
  weaknessesIdentified: string[];
  strengthsReinforced: string[];
  nextReviewDate: string;
}

export interface StudySession {
  id: string;
  studentId?: string;
  conceptIds: string[];
  subjectId: string;
  mode: StudyMode;
  plannedDurationMinutes: number;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'abandoned';
  activities: StudyActivity[];
  masteryBefore?: number;
  masteryAfter?: number;
  confidenceBefore?: 'low' | 'medium' | 'high';
  confidenceAfter?: 'low' | 'medium' | 'high';
  summary?: SessionSummaryData;
}

export interface AdaptiveQuestionAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  conceptId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  skill: SkillType;
  answer: string;
  correct: boolean;
  mistakeType?: string;
  responseTimeSeconds: number;
  confidence?: 'low' | 'medium' | 'high';
}

export interface LearningMethodRecommendation {
  method: StudyMode;
  methodLabel: string;
  reason: string;
  relevanceScore: number; // 0 to 1
  estimatedMinutes: number;
  alternativeMethods: Array<{ method: StudyMode; label: string; reason: string }>;
}

