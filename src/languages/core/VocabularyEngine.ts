// Universal Vocabulary Engine for PAHAM Language Architecture
// Supports IPA, Collocations, Hanzi, Pinyin, Tones, Example Sentences, and Mastery Tracking

import { VocabularyItem, SupportedLanguageId } from './types';

export class VocabularyEngine {
  private vocabularyItems: Map<string, VocabularyItem> = new Map();

  /**
   * Register a vocabulary item
   */
  public registerItem(item: VocabularyItem): void {
    this.vocabularyItems.set(item.id, item);
  }

  /**
   * Register a batch of vocabulary items
   */
  public registerBatch(items: VocabularyItem[]): void {
    items.forEach(item => this.registerItem(item));
  }

  /**
   * Get vocabulary item by ID
   */
  public getItem(id: string): VocabularyItem | undefined {
    return this.vocabularyItems.get(id);
  }

  /**
   * Get all vocabulary items for a language
   */
  public getItemsByLanguage(languageId: SupportedLanguageId): VocabularyItem[] {
    return Array.from(this.vocabularyItems.values()).filter(item => item.languageId === languageId);
  }

  /**
   * Get vocabulary items by language and level
   */
  public getItemsByLevel(languageId: SupportedLanguageId, level: string): VocabularyItem[] {
    return Array.from(this.vocabularyItems.values()).filter(
      item => item.languageId === languageId && item.proficiencyLevel === level
    );
  }

  /**
   * Get vocabulary items by topic
   */
  public getItemsByTopic(languageId: SupportedLanguageId, topic: string): VocabularyItem[] {
    return Array.from(this.vocabularyItems.values()).filter(
      item => item.languageId === languageId && item.topic.toLowerCase() === topic.toLowerCase()
    );
  }

  /**
   * Search vocabulary by query (word, translation, pinyin, or definition)
   */
  public search(languageId: SupportedLanguageId, query: string): VocabularyItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getItemsByLanguage(languageId);

    return this.getItemsByLanguage(languageId).filter(item => {
      const matchWord = item.word.toLowerCase().includes(q);
      const matchTrans = item.translation.toLowerCase().includes(q);
      const matchDef = item.definition.toLowerCase().includes(q);
      const matchPinyin = item.pinyin?.toLowerCase().includes(q) || false;
      const matchHanzi = item.hanzi?.includes(q) || false;

      return matchWord || matchTrans || matchDef || matchPinyin || matchHanzi;
    });
  }

  /**
   * Generate distractors for multiple-choice exercises from same language & level
   */
  public getDistractors(item: VocabularyItem, count: number = 3): string[] {
    const pool = this.getItemsByLevel(item.languageId, item.proficiencyLevel)
      .filter(i => i.id !== item.id)
      .map(i => i.translation);

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

export const vocabularyEngine = new VocabularyEngine();
