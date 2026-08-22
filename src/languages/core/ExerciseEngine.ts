// Universal Exercise Engine for PAHAM Language Architecture
// Generates, manages, and validates exercises across all language skills and proficiency levels

import {
  UniversalExercise,
  ExerciseAttemptResult,
  SupportedLanguageId,
  SkillType,
  ExerciseType,
  DifficultyLevel,
} from './types';

export class ExerciseEngine {
  private exercises: Map<string, UniversalExercise> = new Map();

  /**
   * Register an exercise
   */
  public registerExercise(exercise: UniversalExercise): void {
    this.exercises.set(exercise.id, exercise);
  }

  /**
   * Register a batch of exercises
   */
  public registerBatch(exercises: UniversalExercise[]): void {
    exercises.forEach(e => this.registerExercise(e));
  }

  /**
   * Get exercise by ID
   */
  public getExercise(id: string): UniversalExercise | undefined {
    return this.exercises.get(id);
  }

  /**
   * Get exercises filtered by language, level, and optional skill
   */
  public getExercises(
    languageId: SupportedLanguageId,
    level?: string,
    skillType?: SkillType,
    exerciseType?: ExerciseType
  ): UniversalExercise[] {
    return Array.from(this.exercises.values()).filter(e => {
      const matchLang = e.languageId === languageId;
      const matchLevel = !level || e.proficiencyLevel === level;
      const matchSkill = !skillType || e.skillType === skillType;
      const matchType = !exerciseType || e.exerciseType === exerciseType;
      return matchLang && matchLevel && matchSkill && matchType;
    });
  }

  /**
   * Evaluate a user's attempt on an exercise
   */
  public evaluateAttempt(
    exerciseId: string,
    userAnswer: string | string[],
    timeSpentSeconds: number
  ): ExerciseAttemptResult {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) {
      return {
        exerciseId,
        languageId: 'en',
        isCorrect: false,
        userAnswer,
        correctAnswer: '',
        timeSpentSeconds,
        difficultyRated: 'APPROPRIATE',
        feedbackText: 'Soal tidak ditemukan.',
        timestamp: new Date().toISOString(),
      };
    }

    let isCorrect = false;

    if (Array.isArray(exercise.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        isCorrect = JSON.stringify(exercise.correctAnswer) === JSON.stringify(userAnswer);
      } else {
        isCorrect = exercise.correctAnswer.includes(userAnswer.trim());
      }
    } else {
      const userStr = Array.isArray(userAnswer) ? userAnswer.join(' ') : userAnswer;
      isCorrect = userStr.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();
    }

    // Determine difficulty rating from performance and time
    let difficultyRated: DifficultyLevel = 'APPROPRIATE';
    if (isCorrect && timeSpentSeconds < 4) {
      difficultyRated = 'VERY_EASY';
    } else if (isCorrect && timeSpentSeconds < 10) {
      difficultyRated = 'EASY';
    } else if (!isCorrect && timeSpentSeconds > 20) {
      difficultyRated = 'TOO_HARD';
    } else if (!isCorrect) {
      difficultyRated = 'CHALLENGING';
    }

    const feedbackText = isCorrect
      ? `Tepat sekali! ${exercise.explanation}`
      : `Kurang tepat. Jawaban yang benar adalah "${Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer.join(', ') : exercise.correctAnswer}". ${exercise.explanation}`;

    return {
      exerciseId,
      languageId: exercise.languageId,
      isCorrect,
      userAnswer,
      correctAnswer: exercise.correctAnswer,
      timeSpentSeconds,
      difficultyRated,
      feedbackText,
      timestamp: new Date().toISOString(),
    };
  }
}

export const exerciseEngine = new ExerciseEngine();
