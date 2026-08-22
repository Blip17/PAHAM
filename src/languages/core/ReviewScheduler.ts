// FSRS Spaced Repetition Review Scheduler for PAHAM Language Architecture
// Seamlessly connects foreign language learning objects to PAHAM's FSRS v4 memory engine

import { FSRSEngine } from '../../core/fsrsEngine';
import { FSRSCard, FSRSRating } from '../../core/types';
import { LanguageItemState, SupportedLanguageId } from './types';

export class ReviewScheduler {
  private fsrs: FSRSEngine;
  private itemStates: Map<string, LanguageItemState> = new Map();

  constructor() {
    this.fsrs = new FSRSEngine();
  }

  /**
   * Create an initial item state with FSRS card for a language item
   */
  public initializeItemState(
    userId: string,
    languageId: SupportedLanguageId,
    itemType: 'VOCABULARY' | 'GRAMMAR' | 'CHARACTER' | 'TONE_PAIR' | 'SKILL',
    itemId: string,
    proficiencyLevel: string
  ): LanguageItemState {
    const key = `${userId}_${languageId}_${itemType}_${itemId}`;
    const existing = this.itemStates.get(key);
    if (existing) return existing;

    const blankFsrs = this.fsrs.createEmptyCard(itemId);
    const newState: LanguageItemState = {
      id: key,
      userId,
      languageId,
      itemType,
      itemId,
      proficiencyLevel,
      fsrsCard: blankFsrs,
      masteryScore: 0,
      masteryState: 'UNSEEN',
      correctCount: 0,
      incorrectCount: 0,
      lastPracticedAt: new Date().toISOString(),
    };

    this.itemStates.set(key, newState);
    return newState;
  }

  /**
   * Process a review attempt and update FSRS intervals and stability
   */
  public recordReview(
    userId: string,
    languageId: SupportedLanguageId,
    itemType: 'VOCABULARY' | 'GRAMMAR' | 'CHARACTER' | 'TONE_PAIR' | 'SKILL',
    itemId: string,
    rating: FSRSRating, // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
    proficiencyLevel = 'A1'
  ): {
    updatedState: LanguageItemState;
    nextReviewDue: string;
    intervalDays: number;
  } {
    const state = this.initializeItemState(userId, languageId, itemType, itemId, proficiencyLevel);
    
    // Process with FSRS engine
    const { updatedCard, intervalDays } = this.fsrs.processReview(state.fsrsCard, rating);
    state.fsrsCard = updatedCard;

    if (rating >= 3) {
      state.correctCount += 1;
      state.masteryScore = Math.min(100, state.masteryScore + (rating === 4 ? 15 : 10));
    } else {
      state.incorrectCount += 1;
      state.masteryScore = Math.max(0, state.masteryScore - 12);
    }

    state.masteryState = state.masteryScore >= 80 ? 'MASTERED' : state.masteryScore >= 40 ? 'FAMILIAR' : 'LEARNING';
    state.lastPracticedAt = new Date().toISOString();

    this.itemStates.set(state.id, state);

    return {
      updatedState: state,
      nextReviewDue: updatedCard.due,
      intervalDays,
    };
  }

  /**
   * Get all review items due today or overdue
   */
  public getDueReviews(userId: string, languageId: SupportedLanguageId): LanguageItemState[] {
    const now = new Date();
    return Array.from(this.itemStates.values()).filter(state => {
      const matchUser = state.userId === userId;
      const matchLang = state.languageId === languageId;
      const isDue = new Date(state.fsrsCard.due) <= now;
      return matchUser && matchLang && isDue;
    });
  }

  /**
   * Get upcoming review queue count and next review timestamps
   */
  public getReviewQueueSummary(userId: string, languageId: SupportedLanguageId) {
    const due = this.getDueReviews(userId, languageId);
    const all = Array.from(this.itemStates.values()).filter(
      s => s.userId === userId && s.languageId === languageId
    );

    return {
      dueCount: due.length,
      totalTrackedItems: all.length,
      masteredCount: all.filter(s => s.masteryState === 'MASTERED').length,
      learningCount: all.filter(s => s.masteryState === 'LEARNING' || s.masteryState === 'FAMILIAR').length,
    };
  }
}

export const reviewScheduler = new ReviewScheduler();
