// FSRS (Free Spaced Repetition Scheduler) Engine for PAHAM
// Implements standard FSRS memory model for concept retention and review scheduling

import { FSRSCard, FSRSRating } from './types';

// Default FSRS v4 parameters
const DEFAULT_W = [
  0.4072, 1.1827, 3.1262, 15.4722, // Initial stabilities for ratings 1, 2, 3, 4
  7.2102, 0.5316, 1.0651, 0.0234,  // Difficulty parameters
  1.616, 0.1544, 1.0824,           // Stability after recall success
  1.9813, 0.0953, 0.2975, 0.4912,  // Stability after recall lapse
  0.0392, 1.4994, 0.1444, 0.9419   // Short-term parameters
];

const REQUEST_RETENTION = 0.90; // 90% target retention rate
const DECAY_FACTOR = -0.5;
const FACTOR = Math.pow(REQUEST_RETENTION, 1 / DECAY_FACTOR) - 1;

export class FSRSEngine {
  private w: number[];

  constructor(customWeights?: number[]) {
    this.w = customWeights || DEFAULT_W;
  }

  /**
   * Create a new blank FSRS card for a concept
   */
  public createEmptyCard(conceptId: string): FSRSCard {
    return {
      conceptId,
      due: new Date().toISOString(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: 0, // New
    };
  }

  /**
   * Compute current retrievability of a concept card given days elapsed
   */
  public calculateRetrievability(card: FSRSCard, currentDate: Date = new Date()): number {
    if (card.state === 0 || card.stability === 0) return 0;
    if (!card.last_review) return 1.0;

    const lastReviewDate = new Date(card.last_review);
    const elapsedDays = Math.max(0, (currentDate.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Retrievability formula R(t, S) = (1 + FACTOR * (t / S)) ^ DECAY_FACTOR
    const retrievability = Math.pow(1 + FACTOR * (elapsedDays / Math.max(0.1, card.stability)), DECAY_FACTOR);
    return Math.min(1.0, Math.max(0.0, retrievability));
  }

  /**
   * Process a review rating and calculate updated FSRS state and next review interval
   */
  public processReview(card: FSRSCard, rating: FSRSRating, reviewDate: Date = new Date()): {
    updatedCard: FSRSCard;
    intervalDays: number;
  } {
    const elapsedDays = card.last_review
      ? Math.max(0, (reviewDate.getTime() - new Date(card.last_review).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let newStability = card.stability;
    let newDifficulty = card.difficulty;
    let newState = card.state;
    let newLapses = card.lapses;
    let newReps = card.reps + 1;

    if (card.state === 0) {
      // First time learning (New card)
      newDifficulty = this.initDifficulty(rating);
      newStability = this.initStability(rating);
      newState = rating === 1 ? 1 : 2; // Learning or Review
    } else {
      // Existing card review
      const retrievability = this.calculateRetrievability(card, reviewDate);
      newDifficulty = this.nextDifficulty(card.difficulty, rating);

      if (rating === 1) {
        // Again (lapse / failure)
        newLapses += 1;
        newState = 3; // Relearning
        newStability = this.nextForgetStability(card.difficulty, card.stability, retrievability);
      } else {
        // Recall success (Hard: 2, Good: 3, Easy: 4)
        newState = 2; // Review
        newStability = this.nextRecallStability(card.difficulty, card.stability, retrievability, rating);
      }
    }

    // Calculate next interval in days to hit target retention
    let intervalDays = Math.max(1, Math.round(newStability * (Math.pow(REQUEST_RETENTION, 1 / DECAY_FACTOR) - 1) / FACTOR));
    
    // Easy rating bonus
    if (rating === 4) {
      intervalDays = Math.max(2, Math.round(intervalDays * 1.3));
    } else if (rating === 1) {
      intervalDays = 1; // Due tomorrow or today for lapses
    }

    const nextDueDate = new Date(reviewDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const updatedCard: FSRSCard = {
      ...card,
      due: nextDueDate.toISOString(),
      stability: Number(newStability.toFixed(2)),
      difficulty: Number(newDifficulty.toFixed(2)),
      elapsed_days: Math.round(elapsedDays),
      scheduled_days: intervalDays,
      reps: newReps,
      lapses: newLapses,
      state: newState,
      last_review: reviewDate.toISOString(),
    };

    return { updatedCard, intervalDays };
  }

  private initStability(rating: FSRSRating): number {
    return Math.max(0.1, this.w[rating - 1]);
  }

  private initDifficulty(rating: FSRSRating): number {
    const d = this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1;
    return Math.min(10, Math.max(1, d));
  }

  private nextDifficulty(d: number, rating: FSRSRating): number {
    const delta = -this.w[6] * (rating - 3);
    const nextD = d + delta * ((10 - d) / 9);
    // Mean reversion to default difficulty
    const meanReversion = this.w[7] * this.initDifficulty(3) + (1 - this.w[7]) * nextD;
    return Math.min(10, Math.max(1, meanReversion));
  }

  private nextRecallStability(d: number, s: number, r: number, rating: FSRSRating): number {
    const hardPenalty = rating === 2 ? this.w[15] : 1;
    const easyBonus = rating === 4 ? this.w[16] : 1;
    const factor = Math.exp(this.w[8]) * (11 - d) * Math.pow(s, -this.w[9]) * (Math.exp((1 - r) * this.w[10]) - 1) * hardPenalty * easyBonus;
    return Math.max(0.1, s * (1 + factor));
  }

  private nextForgetStability(d: number, s: number, r: number): number {
    return Math.max(
      0.1,
      this.w[11] * Math.pow(d, -this.w[12]) * (Math.pow(s + 1, this.w[13]) - 1) * Math.exp((1 - r) * this.w[14])
    );
  }
}

export const fsrs = new FSRSEngine();
