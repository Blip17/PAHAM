// Data Bootstrapper for PAHAM Language Architecture
// Populates language registries with English CEFR and Mandarin GF0025 datasets

import { languageLearningEngine } from './LanguageLearningEngine';
import { ENGLISH_CEFR_COMPETENCIES } from '../english/config';
import { ENGLISH_VOCABULARY_DATA } from '../english/vocabularyData';
import { ENGLISH_GRAMMAR_DATA } from '../english/grammarData';
import { ENGLISH_EXERCISES_DATA } from '../english/exerciseGenerators';

import { MANDARIN_GF0025_COMPETENCIES } from '../mandarin/config';
import { MANDARIN_CHARACTERS_DATA } from '../mandarin/characterData';
import { MANDARIN_TONE_PAIRS_DATA } from '../mandarin/pinyinToneData';
import { MANDARIN_VOCABULARY_DATA } from '../mandarin/vocabularyData';
import { MANDARIN_GRAMMAR_DATA } from '../mandarin/grammarData';
import { MANDARIN_EXERCISES_DATA } from '../mandarin/exerciseGenerators';

export function initializeLanguageData(): void {
  // 1. English Subsystems
  languageLearningEngine.skills.registerBatch(ENGLISH_CEFR_COMPETENCIES);
  languageLearningEngine.vocabulary.registerBatch(ENGLISH_VOCABULARY_DATA);
  languageLearningEngine.grammar.registerBatch(ENGLISH_GRAMMAR_DATA);
  languageLearningEngine.exercises.registerBatch(ENGLISH_EXERCISES_DATA);

  // 2. Mandarin Subsystems
  languageLearningEngine.skills.registerBatch(MANDARIN_GF0025_COMPETENCIES);
  languageLearningEngine.characters.registerBatch(MANDARIN_CHARACTERS_DATA);
  languageLearningEngine.pronunciation.registerTonePairs(MANDARIN_TONE_PAIRS_DATA);
  languageLearningEngine.vocabulary.registerBatch(MANDARIN_VOCABULARY_DATA);
  languageLearningEngine.grammar.registerBatch(MANDARIN_GRAMMAR_DATA);
  languageLearningEngine.exercises.registerBatch(MANDARIN_EXERCISES_DATA);
}

// Auto-run bootstrap upon module import
initializeLanguageData();
