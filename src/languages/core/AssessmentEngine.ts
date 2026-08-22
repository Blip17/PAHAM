// Universal Diagnostic Assessment Engine for PAHAM Language Architecture
// Diagnostic placement testing and multi-dimensional skill evaluation

import {
  SupportedLanguageId,
  SkillType,
  AssessmentDiagnosticResult,
  UniversalExercise,
} from './types';
import { exerciseEngine } from './ExerciseEngine';
import { languageRegistry } from './LanguageRegistry';

export class AssessmentEngine {
  /**
   * Generate a balanced diagnostic placement test for a language
   */
  public generateDiagnosticTest(languageId: SupportedLanguageId): UniversalExercise[] {
    const lang = languageRegistry.getLanguage(languageId);
    if (!lang) return [];

    const levels = lang.levelIds;
    const testItems: UniversalExercise[] = [];

    // Collect 2-3 questions from each proficiency level across core skills
    levels.forEach(lvl => {
      const available = exerciseEngine.getExercises(languageId, lvl);
      const sample = available.slice(0, 3);
      testItems.push(...sample);
    });

    return testItems;
  }

  /**
   * Evaluate diagnostic placement results and determine recommended starting level
   */
  public evaluateDiagnostic(
    languageId: SupportedLanguageId,
    userId: string,
    answers: { exerciseId: string; userAnswer: string; isCorrect: boolean }[]
  ): AssessmentDiagnosticResult {
    const lang = languageRegistry.getLanguage(languageId);
    const levels = lang?.levelIds || ['A1'];

    let totalScore = 0;
    const skillScores: Partial<Record<SkillType, { correct: number; total: number }>> = {};
    const levelScores: Record<string, { correct: number; total: number }> = {};

    levels.forEach(lvl => {
      levelScores[lvl] = { correct: 0, total: 0 };
    });

    answers.forEach(ans => {
      const ex = exerciseEngine.getExercise(ans.exerciseId);
      if (!ex) return;

      if (!skillScores[ex.skillType]) {
        skillScores[ex.skillType] = { correct: 0, total: 0 };
      }
      skillScores[ex.skillType]!.total += 1;
      if (levelScores[ex.proficiencyLevel]) {
        levelScores[ex.proficiencyLevel].total += 1;
      }

      if (ans.isCorrect) {
        totalScore += 1;
        skillScores[ex.skillType]!.correct += 1;
        if (levelScores[ex.proficiencyLevel]) {
          levelScores[ex.proficiencyLevel].correct += 1;
        }
      }
    });

    // Determine recommended level: highest level where accuracy >= 65%
    let recommendedLevel = levels[0];
    for (const lvl of levels) {
      const lStat = levelScores[lvl];
      if (lStat && lStat.total > 0) {
        const accuracy = lStat.correct / lStat.total;
        if (accuracy >= 0.65) {
          recommendedLevel = lvl;
        } else {
          break;
        }
      }
    }

    // Build skill breakdown percentages
    const skillBreakdown: Partial<Record<SkillType, number>> = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [skill, val] of Object.entries(skillScores)) {
      const pct = Math.round((val.correct / Math.max(1, val.total)) * 100);
      skillBreakdown[skill as SkillType] = pct;

      if (pct >= 75) {
        strengths.push(`${skill} (${pct}%)`);
      } else if (pct < 50) {
        weaknesses.push(`${skill} (${pct}%)`);
      }
    }

    const studyPathRecommendations = [
      `Mulai materi pada level rekomendasi: ${recommendedLevel}.`,
      weaknesses.length > 0
        ? `Fokus latihan tambahan pada domain: ${weaknesses.join(', ')}.`
        : 'Pertahankan konsistensi latihan harian.',
      'Jadwalkan review FSRS berkala agar materi terkunci di memori jangka panjang.',
    ];

    return {
      assessmentId: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      languageId,
      userId,
      recommendedLevel,
      skillBreakdown: skillBreakdown as Record<SkillType, number>,
      totalScore,
      totalQuestions: answers.length,
      strengths,
      weaknesses,
      studyPathRecommendations,
      completedAt: new Date().toISOString(),
    };
  }
}

export const assessmentEngine = new AssessmentEngine();
