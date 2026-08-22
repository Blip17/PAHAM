// PAHAM Foreign Language Learning Architecture — Universal Core Types
// Comprehensive, language-agnostic types supporting CEFR, GF0025-2021, and future language extensions

export type SupportedLanguageId = 'en' | 'zh-CN' | string;

export type ProficiencyFrameworkType = 'CEFR' | 'GF0025' | 'ACTFL' | 'JLPT' | 'CUSTOM';

export type SkillType =
  | 'LISTENING'
  | 'READING'
  | 'SPEAKING'
  | 'WRITING'
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'PRONUNCIATION'
  | 'COMPREHENSION'
  | 'INTERACTION'
  // Language-Specific Skill Extensions
  | 'PINYIN'
  | 'TONES'
  | 'CHARACTERS'
  | 'PHONOLOGY'
  | 'FUNCTIONAL_LANGUAGE'
  | 'COLLOCATIONS';

export type MasteryState = 'UNSEEN' | 'LEARNING' | 'FAMILIAR' | 'MASTERED';

export type ExerciseType =
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'READING'
  | 'LISTENING'
  | 'TRANSLATION'
  | 'SPEAKING'
  | 'WRITING'
  | 'PRONUNCIATION'
  | 'CHARACTER_RECOGNITION'
  | 'CHARACTER_WRITING'
  | 'TONE_PAIR'
  | 'SENTENCE_ORDERING'
  | 'FILL_IN_BLANK'
  | 'ERROR_CORRECTION'
  | 'COMPREHENSION';

export type DifficultyLevel = 'VERY_EASY' | 'EASY' | 'APPROPRIATE' | 'CHALLENGING' | 'TOO_HARD';

export interface LanguageMetadata {
  id: SupportedLanguageId;
  name: string;
  nativeName: string;
  flagEmoji: string;
  locale: string;
  script: string;
  writingSystem: 'ALPHABETIC' | 'LOGOGRAPHIC' | 'SYLLABIC' | 'ABJAD';
  proficiencyFramework: ProficiencyFrameworkType;
  levelIds: string[];
  levelLabels: Record<string, string>;
  supportedSkills: SkillType[];
  hasCharacterSystem: boolean;
  hasTonalSystem: boolean;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
    bgBadge: string;
    border: string;
  };
}

export interface SkillCompetency {
  id: string;
  languageId: SupportedLanguageId;
  skillType: SkillType;
  level: string;
  title: string;
  description: string;
  canDoStatement: string;
  prerequisites?: string[];
  masteryScore: number; // 0 to 100
  masteryState: MasteryState;
  evidenceCount: number;
  lastPracticedAt?: string;
}

export interface ExampleSentence {
  original: string;
  translation: string;
  pinyin?: string;
  audioUrl?: string;
}

export interface VocabularyItem {
  id: string;
  languageId: SupportedLanguageId;
  word: string;
  normalizedForm: string;
  translation: string;
  definition: string;
  partOfSpeech: string;
  proficiencyLevel: string;
  topic: string;
  frequencyRank?: number;
  ipa?: string;
  exampleSentences: ExampleSentence[];
  relatedWords?: string[];
  commonMistakes?: string[];
  // Mandarin specific extensions
  hanzi?: string;
  pinyin?: string;
  toneNumbers?: number[];
  radical?: string;
  strokeCount?: number;
  components?: string[];
  simplified?: string;
  traditional?: string;
  // English specific extensions
  collocations?: string[];
  phrasalVerbs?: string[];
  irregularForms?: string[];
  usageNotes?: string;
}

export interface GrammarItem {
  id: string;
  languageId: SupportedLanguageId;
  name: string;
  title: string;
  proficiencyLevel: string;
  category: string;
  explanation: string;
  patternFormula: string;
  prerequisites?: string[];
  examples: ExampleSentence[];
  commonMistakes: {
    incorrect: string;
    correct: string;
    explanation: string;
  }[];
  // Mandarin specific patterns (Measure words, Aspect particles, 把/被)
  aspectMarker?: string;
  measureWords?: string[];
  // English specific patterns (Tenses, Conditionals, Modals)
  tenseCategory?: string;
}

export interface CharacterItem {
  character: string;
  pinyin: string;
  tone: number;
  meaning: string;
  radical: string;
  strokeCount: number;
  components: string[];
  hskLevel: string;
  exampleWords: { hanzi: string; pinyin: string; translation: string }[];
  recognitionMastery: number; // 0 - 100
  writingMastery: number;     // 0 - 100
  frequencyRank?: number;
}

export interface TonePairItem {
  id: string;
  word: string;
  hanzi: string;
  pinyin: string;
  tonePair: [number, number]; // e.g. [1, 4] for 飞机 fēijī -> wait, fēijī is [1, 1], kāishǐ is [1, 3]
  meaning: string;
  difficulty: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  audioPrompt?: string;
}

export interface UniversalExercise {
  id: string;
  languageId: SupportedLanguageId;
  skillType: SkillType;
  exerciseType: ExerciseType;
  proficiencyLevel: string;
  topic: string;
  prompt: string;
  instruction: string;
  contextSentence?: string;
  audioUrl?: string;
  characterVisual?: string;
  options?: string[];
  correctAnswer: string | string[];
  distractors?: string[];
  explanation: string;
  hint: string;
  metadata?: Record<string, any>;
}

export interface ExerciseAttemptResult {
  exerciseId: string;
  languageId: SupportedLanguageId;
  isCorrect: boolean;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  timeSpentSeconds: number;
  difficultyRated: DifficultyLevel;
  feedbackText: string;
  mistakeCategory?: string;
  timestamp: string;
}

import { FSRSCard } from '../../core/types';

export interface LanguageItemState {
  id: string;
  userId: string;
  languageId: SupportedLanguageId;
  itemType: 'VOCABULARY' | 'GRAMMAR' | 'CHARACTER' | 'TONE_PAIR' | 'SKILL';
  itemId: string;
  proficiencyLevel: string;
  // FSRS v4 Spaced Repetition tracking
  fsrsCard: FSRSCard;
  masteryScore: number; // 0 - 100
  masteryState: MasteryState;
  correctCount: number;
  incorrectCount: number;
  lastPracticedAt: string;
}

export interface LanguageProfile {
  id: string;
  userId: string;
  languageId: SupportedLanguageId;
  proficiencyFramework: ProficiencyFrameworkType;
  currentLevel: string;
  targetLevel: string;
  dailyGoalMinutes: number;
  streakDays: number;
  totalWordsLearned: number;
  totalCharactersLearned: number;
  totalGrammarMastered: number;
  overallMasteryPercentage: number;
  schoolSyncEnabled: boolean;
  schoolGrade?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface AssessmentDiagnosticResult {
  assessmentId: string;
  languageId: SupportedLanguageId;
  userId: string;
  recommendedLevel: string;
  skillBreakdown: Record<SkillType, number>;
  totalScore: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  studyPathRecommendations: string[];
  completedAt: string;
}

export interface AITutorInteraction {
  userMessage: string;
  targetLanguage: SupportedLanguageId;
  userLevel: string;
  tutorResponse: string;
  pedagogicalStage: 'EXPLAIN' | 'HINT_GENTLE' | 'HINT_DIRECT' | 'EXAMPLE' | 'CORRECTION' | 'PRAISE';
  corrections?: {
    original: string;
    corrected: string;
    ruleExplanation: string;
  }[];
  suggestedFollowUp?: string[];
  conceptLink?: string;
}
