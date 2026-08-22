// Adaptive Difficulty Calibration Engine for PAHAM Language Architecture
// Calibrates exercise difficulty based on empirical performance signals

import { DifficultyLevel } from './types';

export interface PerformanceSignal {
  recentAccuracy: number; // 0.0 to 1.0 (last 5-10 attempts)
  averageResponseTimeSeconds: number;
  repeatedMistakesCount: number;
  confidenceScore?: number; // 1-5
}

export class AdaptiveDifficultyEngine {
  /**
   * Determine optimal difficulty level given recent performance signals
   */
  public evaluateDifficulty(signals: PerformanceSignal): {
    rating: DifficultyLevel;
    recommendedAdjustment: 'INCREASE' | 'MAINTAIN' | 'DECREASE';
    rationale: string;
  } {
    const { recentAccuracy, averageResponseTimeSeconds, repeatedMistakesCount } = signals;

    // Too Hard Signal
    if (recentAccuracy < 0.4 || repeatedMistakesCount >= 3) {
      return {
        rating: 'TOO_HARD',
        recommendedAdjustment: 'DECREASE',
        rationale: 'Akurasi di bawah 40% atau terdapat kesalahan berulang. Kurangi kompleksitas materi.',
      };
    }

    // Challenging
    if (recentAccuracy < 0.7) {
      return {
        rating: 'CHALLENGING',
        recommendedAdjustment: 'MAINTAIN',
        rationale: 'Akurasi 40-70%. Tingkat kesulitan sesuai zona proksimal belajar siswa.',
      };
    }

    // Too Easy Signal
    if (recentAccuracy >= 0.95 && averageResponseTimeSeconds < 5.0) {
      return {
        rating: 'VERY_EASY',
        recommendedAdjustment: 'INCREASE',
        rationale: 'Akurasi sempurna dengan waktu respons sangat cepat (<5s). Tingkatkan level tantangan.',
      };
    }

    // Easy
    if (recentAccuracy >= 0.85) {
      return {
        rating: 'EASY',
        recommendedAdjustment: 'INCREASE',
        rationale: 'Akurasi di atas 85%. Siswa siap melangkah ke konsep yang lebih tinggi.',
      };
    }

    // Appropriate
    return {
      rating: 'APPROPRIATE',
      recommendedAdjustment: 'MAINTAIN',
      rationale: 'Kinerja stabil. Pertahankan ritme latihan saat ini.',
    };
  }
}

export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine();
