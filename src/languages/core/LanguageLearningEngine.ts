// PAHAM Unified Language Learning Engine Facade
// Coordinates Language Registry, Competencies, Vocab, Grammar, Characters, Exercises, Reviews, AI Tutor, and School Linking

import { languageRegistry } from './LanguageRegistry';
import { skillEngine } from './SkillEngine';
import { vocabularyEngine } from './VocabularyEngine';
import { grammarEngine } from './GrammarEngine';
import { pronunciationEngine } from './PronunciationEngine';
import { characterEngine } from './CharacterEngine';
import { exerciseEngine } from './ExerciseEngine';
import { assessmentEngine } from './AssessmentEngine';
import { reviewScheduler } from './ReviewScheduler';
import { progressEngine } from './ProgressEngine';
import { adaptiveDifficultyEngine } from './AdaptiveDifficultyEngine';
import { languageAITutor } from './LanguageAITutor';
import { schoolFirstMode } from './SchoolFirstMode';

export class LanguageLearningEngine {
  public registry = languageRegistry;
  public skills = skillEngine;
  public vocabulary = vocabularyEngine;
  public grammar = grammarEngine;
  public pronunciation = pronunciationEngine;
  public characters = characterEngine;
  public exercises = exerciseEngine;
  public assessments = assessmentEngine;
  public reviews = reviewScheduler;
  public progress = progressEngine;
  public adaptive = adaptiveDifficultyEngine;
  public tutor = languageAITutor;
  public school = schoolFirstMode;

  /**
   * Health check and diagnostics for language learning subsystem
   */
  public getHealthStatus() {
    const langs = this.registry.getAllLanguages();
    return {
      status: 'OPERATIONAL',
      registeredLanguagesCount: langs.length,
      languages: langs.map(l => ({
        id: l.id,
        name: l.name,
        framework: l.proficiencyFramework,
        levelsCount: l.levelIds.length,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

export const languageLearningEngine = new LanguageLearningEngine();
