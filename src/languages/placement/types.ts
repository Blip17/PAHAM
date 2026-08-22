// PAHAM Foreign Language Placement Test Architecture — Types & Definitions
// Multidimensional skill-based adaptive placement with confidence diagnostics and school readiness

import { SupportedLanguageId, SkillType, DifficultyLevel } from '../core/types';

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export type ConfidenceLabel =
  | 'VERY_UNSURE'
  | 'UNSURE'
  | 'SOMEWHAT_CONFIDENT'
  | 'CONFIDENT'
  | 'VERY_CONFIDENT';

export interface PlacementQuestion {
  id: string;
  languageId: SupportedLanguageId;
  testedSkill: SkillType;
  targetLevel: string; // CEFR (Pre-A1..C2) or GF0025 (Level-1..Level-6)
  difficultyIndex: number; // 0.0 (easiest) to 1.0 (most difficult)
  discriminationIndex: number; // 0.2 to 1.0 (IRT diagnostic power)
  questionType:
    | 'VOCABULARY_RECOGNITION'
    | 'VOCABULARY_IN_CONTEXT'
    | 'GRAMMAR_COMPLETION'
    | 'SENTENCE_CORRECTION'
    | 'READING_COMPREHENSION'
    | 'LISTENING_PHONETICS'
    | 'FUNCTIONAL_LANGUAGE'
    | 'COLLOCATION_MATCH'
    | 'HANZI_RECOGNITION'
    | 'PINYIN_RECOGNITION'
    | 'TONE_IDENTIFICATION'
    | 'TONE_PAIR_DISCRIMINATION'
    | 'TONE_SANDHI_APPLICATION'
    | 'CLASSIFIER_SELECTION'
    | 'WORD_ORDER_REORDERING'
    | 'SHORT_PRODUCTION';
  prompt: string;
  instruction: string;
  contextSentence?: string;
  characterVisual?: string;
  audioPromptText?: string;
  options: string[];
  correctAnswer: string | string[];
  distractorRationale?: Record<string, string>;
  explanation: string;
  diagnosticTags: string[];
  prerequisiteConcepts?: string[];
  schoolTopicLink?: string;
}

export interface QuestionAnswerAttempt {
  questionId: string;
  testedSkill: SkillType;
  targetLevel: string;
  difficultyIndex: number;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  confidence: ConfidenceRating;
  timeSpentSeconds: number;
  diagnosticTags: string[];
  diagnosticCategory:
    | 'VERIFIED_MASTERY'       // Correct + High Confidence
    | 'FRAGILE_KNOWLEDGE'      // Correct + Low Confidence
    | 'CRITICAL_MISCONCEPTION'  // Wrong + High Confidence
    | 'KNOWLEDGE_GAP';         // Wrong + Low Confidence
  timestamp: string;
}

export interface SkillEstimate {
  skillType: SkillType;
  estimatedLevel: string; // e.g. "B1" or "Level-2"
  abilityScore: number;    // 0 to 100
  uncertainty: number;     // 0.0 (high certainty) to 1.0 (high uncertainty)
  questionsCount: number;
  isFullyAssessed: boolean;
  masteryStatus: 'MASTERED' | 'DEVELOPING' | 'NEEDS_PRACTICE' | 'NOT_TESTED';
}

export interface MisconceptionRecord {
  id: string;
  skill: SkillType;
  questionId: string;
  conceptTag: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  remedialSuggestion: string;
}

export interface SchoolReadinessReport {
  grade: string;
  readinessScore: number; // 0 - 100
  status: 'EXCELLENT' | 'STRONG' | 'NEEDS_REVIEW' | 'CRITICAL_GAPS';
  matchingSchoolTopics: string[];
  curriculumGaps: string[];
  remediationPlan: string[];
}

export interface PlacementDiagnosticReport {
  attemptId: string;
  userId: string;
  languageId: SupportedLanguageId;
  framework: 'CEFR' | 'GF0025';
  overallLevel: string; // Aggregate benchmark level
  overallConfidenceScore: number; // 0 - 100
  totalQuestionsAnswered: number;
  skillEstimates: Record<SkillType, SkillEstimate>;
  strengths: string[];
  weaknesses: string[];
  misconceptions: MisconceptionRecord[];
  fragileKnowledgeTags: string[];
  schoolReadiness: SchoolReadinessReport;
  learningPathSeeds: {
    recommendedStartingUnit: string;
    suggestedFocusAreas: string[];
    fsrsSeedItems: string[];
    pamiCoachingSummary: string;
  };
  comparisonWithPrevious?: {
    previousAttemptId: string;
    previousDate: string;
    previousOverallLevel: string;
    currentOverallLevel: string;
    skillDeltas: {
      skill: SkillType;
      previousLevel: string;
      currentLevel: string;
      deltaStatus: 'IMPROVED' | 'STABLE' | 'NEEDS_ATTENTION';
    }[];
  };
  completedAt: string;
}

export interface AdaptivePlacementSession {
  sessionId: string;
  userId: string;
  languageId: SupportedLanguageId;
  startTime: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetSkills: SkillType[];
  testedQuestions: string[];
  attempts: QuestionAnswerAttempt[];
  currentSkillEstimates: Record<SkillType, SkillEstimate>;
  maxQuestions: number;
  isFinished: boolean;
}
