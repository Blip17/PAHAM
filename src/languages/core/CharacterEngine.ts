// Dedicated Chinese Character (Hanzi) Learning Engine for PAHAM
// Decouples Character Recognition from Character Writing and tracks stroke counts & radicals

import { CharacterItem } from './types';

export class CharacterEngine {
  private characters: Map<string, CharacterItem> = new Map();

  /**
   * Register a character
   */
  public registerCharacter(item: CharacterItem): void {
    this.characters.set(item.character, item);
  }

  /**
   * Register a batch of characters
   */
  public registerBatch(items: CharacterItem[]): void {
    items.forEach(c => this.registerCharacter(c));
  }

  /**
   * Get character details by Hanzi
   */
  public getCharacter(char: string): CharacterItem | undefined {
    return this.characters.get(char);
  }

  /**
   * Get all characters
   */
  public getAllCharacters(): CharacterItem[] {
    return Array.from(this.characters.values());
  }

  /**
   * Get characters by HSK / GF0025 Level
   */
  public getCharactersByLevel(level: string): CharacterItem[] {
    return Array.from(this.characters.values()).filter(c => c.hskLevel === level);
  }

  /**
   * Record practice result separately for recognition vs writing
   */
  public recordMastery(
    char: string,
    practiceType: 'RECOGNITION' | 'WRITING',
    isCorrect: boolean
  ): CharacterItem | undefined {
    const item = this.characters.get(char);
    if (!item) return undefined;

    const change = isCorrect ? 15 : -12;

    if (practiceType === 'RECOGNITION') {
      item.recognitionMastery = Math.max(0, Math.min(100, item.recognitionMastery + change));
    } else {
      item.writingMastery = Math.max(0, Math.min(100, item.writingMastery + change));
    }

    this.characters.set(char, item);
    return item;
  }

  /**
   * Get characters that user can recognize but struggle to write
   */
  public getRecognitionWritingGap(): CharacterItem[] {
    return Array.from(this.characters.values()).filter(
      c => c.recognitionMastery >= 60 && c.writingMastery < 40
    );
  }
}

export const characterEngine = new CharacterEngine();
