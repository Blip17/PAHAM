// Centralized Language Registry for PAHAM
// Provides language-agnostic discovery, registration, and framework metadata

import { LanguageMetadata, SupportedLanguageId } from './types';

class LanguageRegistryManager {
  private languages: Map<SupportedLanguageId, LanguageMetadata> = new Map();

  constructor() {
    this.registerDefaultLanguages();
  }

  private registerDefaultLanguages() {
    // 1. English (CEFR Framework)
    this.registerLanguage({
      id: 'en',
      name: 'Bahasa Inggris (English)',
      nativeName: 'English',
      flagEmoji: '🇬🇧',
      locale: 'en-US',
      script: 'Latin',
      writingSystem: 'ALPHABETIC',
      proficiencyFramework: 'CEFR',
      levelIds: ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      levelLabels: {
        'Pre-A1': 'Pre-A1 (Foundational Starter)',
        'A1': 'A1 (Beginner Elementary)',
        'A2': 'A2 (Pre-Intermediate)',
        'B1': 'B1 (Intermediate Independent)',
        'B2': 'B2 (Upper-Intermediate Vantage)',
        'C1': 'C1 (Advanced Effective Operational)',
        'C2': 'C2 (Mastery Proficiency)',
      },
      supportedSkills: [
        'LISTENING',
        'READING',
        'SPEAKING',
        'WRITING',
        'VOCABULARY',
        'GRAMMAR',
        'PRONUNCIATION',
        'PHONOLOGY',
        'FUNCTIONAL_LANGUAGE',
        'COLLOCATIONS',
        'COMPREHENSION',
        'INTERACTION',
      ],
      hasCharacterSystem: false,
      hasTonalSystem: false,
      colorTheme: {
        primary: '#2563eb', // Blue
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        bgBadge: 'bg-blue-950 text-blue-300 border-blue-800',
        border: 'border-blue-700/50',
      },
    });

    // 2. Mandarin Chinese (GF0025-2021 Framework)
    this.registerLanguage({
      id: 'zh-CN',
      name: 'Bahasa Mandarin (中文)',
      nativeName: '普通话 / 中文',
      flagEmoji: '🇨🇳',
      locale: 'zh-CN',
      script: 'Simplified Chinese (简体中文)',
      writingSystem: 'LOGOGRAPHIC',
      proficiencyFramework: 'GF0025',
      levelIds: ['Level-1', 'Level-2', 'Level-3', 'Level-4', 'Level-5', 'Level-6', 'Level-7-9'],
      levelLabels: {
        'Level-1': 'Level 1 (HSK 1 / 基础初级 - 500 Kata & 300 Hanzi)',
        'Level-2': 'Level 2 (HSK 2 / 初级进阶 - 1272 Kata & 600 Hanzi)',
        'Level-3': 'Level 3 (HSK 3 / 中级初阶 - 2245 Kata & 900 Hanzi)',
        'Level-4': 'Level 4 (HSK 4 / 中级进阶 - 3245 Kata & 1200 Hanzi)',
        'Level-5': 'Level 5 (HSK 5 / 高级初阶 - 4316 Kata & 1500 Hanzi)',
        'Level-6': 'Level 6 (HSK 6 / 高级进阶 - 5456 Kata & 1800 Hanzi)',
        'Level-7-9': 'Level 7-9 (HSK 7-9 / 精通级 - 11000+ Kata & 3000 Hanzi)',
      },
      supportedSkills: [
        'PINYIN',
        'TONES',
        'CHARACTERS',
        'VOCABULARY',
        'GRAMMAR',
        'LISTENING',
        'READING',
        'SPEAKING',
        'WRITING',
        'COMPREHENSION',
        'INTERACTION',
      ],
      hasCharacterSystem: true,
      hasTonalSystem: true,
      colorTheme: {
        primary: '#dc2626', // Red
        secondary: '#b91c1c',
        accent: '#f87171',
        bgBadge: 'bg-red-950 text-red-300 border-red-800',
        border: 'border-red-700/50',
      },
    });
  }

  /**
   * Register a new language plugin dynamically (e.g. Spanish, Japanese, German)
   */
  public registerLanguage(metadata: LanguageMetadata): void {
    this.languages.set(metadata.id, metadata);
  }

  /**
   * Get metadata for a specific language
   */
  public getLanguage(id: SupportedLanguageId): LanguageMetadata | undefined {
    return this.languages.get(id);
  }

  /**
   * List all registered languages
   */
  public getAllLanguages(): LanguageMetadata[] {
    return Array.from(this.languages.values());
  }

  /**
   * Check if a language is registered
   */
  public isLanguageSupported(id: SupportedLanguageId): boolean {
    return this.languages.has(id);
  }

  /**
   * Get level labels for a language
   */
  public getLevelsForLanguage(id: SupportedLanguageId): { id: string; label: string }[] {
    const lang = this.languages.get(id);
    if (!lang) return [];
    return lang.levelIds.map(levelId => ({
      id: levelId,
      label: lang.levelLabels[levelId] || levelId,
    }));
  }
}

export const languageRegistry = new LanguageRegistryManager();
