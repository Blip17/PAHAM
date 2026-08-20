// Flashcard Service for PAHAM
// First-class Spaced Repetition Flashcards powered by FSRS engine and grounded in student school materials

import { db } from '../../core/db';
import { 
  Flashcard, 
  Concept, 
  FSRSRating, 
  FSRSCard, 
  MistakeRecord, 
  CardType,
  FlashcardMode 
} from '../../core/types';
import { fsrs } from '../../core/fsrsEngine';

export const flashcardService = {
  /**
   * Generates atomic flashcards from a concept's source material and key points
   */
  generateCardsForConcept(concept: Concept): Flashcard[] {
    const cards: Flashcard[] = [];
    const now = new Date().toISOString();

    // 1. Concept Definition Card (Essential Recall)
    cards.push({
      id: `fc-def-${concept.id}`,
      conceptId: concept.id,
      conceptTitle: concept.title,
      subjectId: concept.subjectId,
      chapterId: concept.chapterId,
      cardType: 'CONCEPT_DEFINITION',
      front: `Apa yang dimaksud dengan ${concept.title}?`,
      back: concept.definition,
      hint: concept.keyPoints?.[0] || 'Ingat kata kunci utama catatan gurumu.',
      sourceReferences: concept.sources,
      fsrs: fsrs.createEmptyCard(concept.id),
      createdAt: now,
      updatedAt: now,
    });

    // 2. Concrete Example Application Card
    if (concept.example && concept.example.trim().length > 5) {
      cards.push({
        id: `fc-ex-${concept.id}`,
        conceptId: concept.id,
        conceptTitle: concept.title,
        subjectId: concept.subjectId,
        chapterId: concept.chapterId,
        cardType: 'QUESTION_ANSWER',
        front: `Berikan satu contoh nyata dari ${concept.title} dalam materi/kehidupan!`,
        back: concept.example,
        hint: 'Perhatikan bagaimana konsep ini diterapkan pada soal sekolah.',
        sourceReferences: concept.sources,
        fsrs: fsrs.createEmptyCard(concept.id),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Key Pointers / Contrast Card
    if (concept.keyPoints && concept.keyPoints.length > 1) {
      cards.push({
        id: `fc-kp-${concept.id}`,
        conceptId: concept.id,
        conceptTitle: concept.title,
        subjectId: concept.subjectId,
        chapterId: concept.chapterId,
        cardType: 'COMPARE',
        front: `Sebutkan poin pembeda utama yang harus diingat pada ${concept.title}!`,
        back: concept.keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n'),
        sourceReferences: concept.sources,
        fsrs: fsrs.createEmptyCard(concept.id),
        createdAt: now,
        updatedAt: now,
      });
    }

    return cards;
  },

  /**
   * Generates a targeted repair flashcard from a recurring mistake record
   */
  generateCardFromMistake(mistake: MistakeRecord, concept: Concept): Flashcard {
    const now = new Date().toISOString();
    return {
      id: `fc-mst-${mistake.id}`,
      conceptId: mistake.conceptId,
      conceptTitle: mistake.conceptTitle,
      subjectId: mistake.subjectId,
      chapterId: concept.chapterId,
      cardType: 'COMPARE',
      front: `Catatan Pembeda: Bagaimana membedakan ${concept.title} agar tidak keliru?`,
      back: `Kekeliruan sebelumnya: "${mistake.misconceptionDescription}"\n\nPenjelasan Tepat:\n${concept.definition}`,
      hint: `Jawaban benar saat ujian: ${mistake.correctAnswer}`,
      sourceReferences: concept.sources,
      fsrs: fsrs.createEmptyCard(concept.id),
      createdAt: now,
      updatedAt: now,
    };
  },

  /**
   * Loads or seeds flashcards for all existing concepts in Dexie
   */
  async ensureCardsSeeded(): Promise<Flashcard[]> {
    let existingCards = await db.flashcards.toArray();
    if (existingCards.length === 0) {
      const concepts = await db.concepts.toArray();
      const allNewCards: Flashcard[] = [];

      for (const concept of concepts) {
        const cards = this.generateCardsForConcept(concept);
        allNewCards.push(...cards);
      }

      if (allNewCards.length > 0) {
        await db.flashcards.bulkPut(allNewCards);
        existingCards = allNewCards;
      }
    }
    return existingCards;
  },

  /**
   * Gets flashcards filtered by mode (DUE, WEAK, NEW, TOPIC, MIXED, EXAM)
   */
  async getCardsByMode(mode: FlashcardMode, conceptId?: string, subjectId?: string): Promise<Flashcard[]> {
    await this.ensureCardsSeeded();
    const allCards = await db.flashcards.toArray();
    const now = new Date();

    let filtered = allCards;

    if (subjectId) {
      filtered = filtered.filter(c => c.subjectId === subjectId);
    }

    if (conceptId) {
      filtered = filtered.filter(c => c.conceptId === conceptId);
    }

    switch (mode) {
      case 'DUE':
        return filtered.filter(c => new Date(c.fsrs.due) <= now);
      case 'NEW':
        return filtered.filter(c => c.fsrs.reps === 0);
      case 'WEAK':
        return filtered.filter(c => c.fsrs.lapses > 0 || c.fsrs.stability < 2);
      case 'TOPIC':
        return filtered;
      case 'MIXED':
      case 'EXAM':
      default:
        // Priority order: Due -> Weak -> New -> Stable
        return filtered.sort((a, b) => {
          const aDue = new Date(a.fsrs.due) <= now ? 1 : 0;
          const bDue = new Date(b.fsrs.due) <= now ? 1 : 0;
          if (aDue !== bDue) return bDue - aDue;
          return a.fsrs.stability - b.fsrs.stability;
        });
    }
  },

  /**
   * Rates a flashcard with FSRS rating (1: Again, 2: Hard, 3: Good, 4: Easy)
   * Updates FSRS state in Dexie and synchronizes studentConceptState
   */
  async rateFlashcard(card: Flashcard, rating: FSRSRating): Promise<{ updatedCard: Flashcard; intervalDays: number }> {
    const { updatedCard: updatedFSRS, intervalDays } = fsrs.processReview(card.fsrs, rating);
    const now = new Date().toISOString();

    const updatedFlashcard: Flashcard = {
      ...card,
      fsrs: updatedFSRS,
      updatedAt: now,
    };

    await db.flashcards.put(updatedFlashcard);

    // Synchronize concept student state
    const existingState = await db.studentConceptStates.get(card.conceptId);
    if (existingState) {
      const isSuccess = rating >= 3;
      const newScore = isSuccess 
        ? Math.min(0.98, existingState.masteryScore + 0.12)
        : Math.max(0.2, existingState.masteryScore - 0.15);

      await db.studentConceptStates.put({
        ...existingState,
        masteryScore: newScore,
        fsrs: updatedFSRS,
        lastStudied: now,
        recentAttemptsCount: existingState.recentAttemptsCount + 1,
        recentCorrectCount: existingState.recentCorrectCount + (isSuccess ? 1 : 0),
        priorityScore: rating === 1 ? 95 : Math.max(10, existingState.priorityScore - 20),
      });
    }

    // Log Learning Event
    await db.learningEvents.add({
      id: `evt-fc-${Date.now()}`,
      timestamp: now,
      eventType: 'REVIEW_RATED',
      subjectId: card.subjectId,
      conceptId: card.conceptId,
      metadata: { flashcardId: card.id, rating, intervalDays, stability: updatedFSRS.stability },
    });

    return { updatedCard: updatedFlashcard, intervalDays };
  },

  /**
   * Formats FSRS interval into friendly student language
   */
  formatIntervalLabel(rating: FSRSRating, intervalDays: number): string {
    if (rating === 1) return 'Ulangi Besok (1 hari)';
    if (intervalDays <= 1) return '1 hari lagi';
    if (intervalDays <= 4) return `${intervalDays} hari lagi`;
    if (intervalDays <= 7) return '1 minggu lagi';
    return `${Math.round(intervalDays / 7)} minggu lagi`;
  }
};
