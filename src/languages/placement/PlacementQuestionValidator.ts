// Deterministic Placement Question Validator for PAHAM
// Validates structural integrity, answer consistency, distractor uniqueness, and diagnostic tags

import { PlacementQuestion } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PlacementQuestionValidator {
  /**
   * Validates a single placement question against strict pedagogical standards
   */
  public static validate(q: PlacementQuestion): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory Identity Fields
    if (!q.id || typeof q.id !== 'string') errors.push('Question ID is missing or invalid.');
    if (!q.languageId) errors.push('Language ID is required.');
    if (!q.testedSkill) errors.push('Tested Skill is required.');
    if (!q.targetLevel) errors.push('Target Proficiency Level is required.');

    // 2. Prompt & Instruction
    if (!q.prompt || q.prompt.trim().length === 0) errors.push('Question prompt is empty.');
    if (!q.instruction || q.instruction.trim().length === 0) errors.push('Question instruction is empty.');

    // 3. Options Validation
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push('Question must provide at least 2 selectable options.');
    } else {
      // Check for duplicate options
      const lowerOptions = q.options.map(o => o.trim().toLowerCase());
      const uniqueOptions = new Set(lowerOptions);
      if (uniqueOptions.size !== lowerOptions.length) {
        errors.push('Question contains duplicate options.');
      }
    }

    // 4. Correct Answer Validation
    if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
      errors.push('Correct answer must not be empty.');
    } else if (Array.isArray(q.options)) {
      const correctList = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      const matchExists = correctList.every(ans =>
        q.options.some(opt => opt.trim().toLowerCase() === ans.trim().toLowerCase())
      );
      if (!matchExists) {
        errors.push(`Correct answer "${JSON.stringify(q.correctAnswer)}" does not match any of the provided options.`);
      }
    }

    // 5. Pedagogical Explanations & Tags
    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push('Question explanation is required for feedback.');
    }
    if (!Array.isArray(q.diagnosticTags) || q.diagnosticTags.length === 0) {
      warnings.push('Diagnostic tags are recommended for granular skill profiling.');
    }

    // 6. Metric Bounds
    if (typeof q.difficultyIndex !== 'number' || q.difficultyIndex < 0.0 || q.difficultyIndex > 1.0) {
      warnings.push('Difficulty index should be normalized between 0.0 and 1.0.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Batch validation of question bank
   */
  public static validateBatch(questions: PlacementQuestion[]): {
    validCount: number;
    invalidCount: number;
    results: Map<string, ValidationResult>;
  } {
    const results = new Map<string, ValidationResult>();
    let validCount = 0;
    let invalidCount = 0;

    questions.forEach(q => {
      const res = this.validate(q);
      results.set(q.id, res);
      if (res.isValid) validCount++;
      else invalidCount++;
    });

    return { validCount, invalidCount, results };
  }
}
