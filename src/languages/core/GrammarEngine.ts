// Universal Grammar Engine for PAHAM Language Architecture
// Supports structural formulas, common mistake analysis, tenses, aspect markers, and measure words

import { GrammarItem, SupportedLanguageId } from './types';

export class GrammarEngine {
  private grammarItems: Map<string, GrammarItem> = new Map();

  /**
   * Register a grammar learning object
   */
  public registerGrammar(item: GrammarItem): void {
    this.grammarItems.set(item.id, item);
  }

  /**
   * Register a batch of grammar items
   */
  public registerBatch(items: GrammarItem[]): void {
    items.forEach(item => this.registerGrammar(item));
  }

  /**
   * Get grammar item by ID
   */
  public getGrammar(id: string): GrammarItem | undefined {
    return this.grammarItems.get(id);
  }

  /**
   * Get all grammar items for a language
   */
  public getGrammarByLanguage(languageId: SupportedLanguageId): GrammarItem[] {
    return Array.from(this.grammarItems.values()).filter(item => item.languageId === languageId);
  }

  /**
   * Get grammar items by level
   */
  public getGrammarByLevel(languageId: SupportedLanguageId, level: string): GrammarItem[] {
    return Array.from(this.grammarItems.values()).filter(
      item => item.languageId === languageId && item.proficiencyLevel === level
    );
  }

  /**
   * Get grammar items by category (e.g. 'Tenses', 'Conditionals', 'Aspect Markers', 'Sentence Order')
   */
  public getGrammarByCategory(languageId: SupportedLanguageId, category: string): GrammarItem[] {
    return Array.from(this.grammarItems.values()).filter(
      item => item.languageId === languageId && item.category.toLowerCase() === category.toLowerCase()
    );
  }
}

export const grammarEngine = new GrammarEngine();
