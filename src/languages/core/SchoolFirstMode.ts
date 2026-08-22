// School-First Integration Engine for PAHAM Language Architecture
// Links school curriculum chapters and uploaded materials to language learning objects

import { SupportedLanguageId, VocabularyItem, GrammarItem } from './types';
import { vocabularyEngine } from './VocabularyEngine';
import { grammarEngine } from './GrammarEngine';

export interface SchoolLanguageChapterLink {
  subjectId: string;
  chapterId: string;
  chapterTitle: string;
  gradeLevel: string;
  languageId: SupportedLanguageId;
  targetCEFRorGFLevel: string;
  coreVocabularyIds: string[];
  grammarPatternIds: string[];
  dialogueThemes: string[];
}

export class SchoolFirstMode {
  private chapterLinks: Map<string, SchoolLanguageChapterLink> = new Map();

  constructor() {
    this.registerDefaultCurriculumLinks();
  }

  private registerDefaultCurriculumLinks() {
    // 1. English School Chapters (SMA Kelas 10-11 Kurikulum Merdeka)
    this.registerChapterLink({
      subjectId: 'sub-bing',
      chapterId: 'ch-eng-narrative',
      chapterTitle: 'Narrative & Descriptive Texts: Legends & Biographies',
      gradeLevel: 'Kelas 10 SMA',
      languageId: 'en',
      targetCEFRorGFLevel: 'B1',
      coreVocabularyIds: ['en_vocab_ancient', 'en_vocab_courageous', 'en_vocab_accomplish'],
      grammarPatternIds: ['en_gram_past_simple', 'en_gram_relative_clauses'],
      dialogueThemes: ['Telling a folklore story', 'Describing a historical figure'],
    });

    this.registerChapterLink({
      subjectId: 'sub-bing',
      chapterId: 'ch-eng-analytical',
      chapterTitle: 'Analytical Exposition & Opinion Essay',
      gradeLevel: 'Kelas 11 SMA',
      languageId: 'en',
      targetCEFRorGFLevel: 'B2',
      coreVocabularyIds: ['en_vocab_consequence', 'en_vocab_significant', 'en_vocab_furthermore'],
      grammarPatternIds: ['en_gram_passive_voice', 'en_gram_conditionals_type2'],
      dialogueThemes: ['Debating environmental policy', 'Writing formal arguments'],
    });

    // 2. Mandarin School Chapters (SMA Peminatan Bahasa Mandarin)
    this.registerChapterLink({
      subjectId: 'sub-mand',
      chapterId: 'ch-man-daily-life',
      chapterTitle: '日常交流与学校生活 (Daily Communication & School Life)',
      gradeLevel: 'Kelas 10 SMA',
      languageId: 'zh-CN',
      targetCEFRorGFLevel: 'Level-1',
      coreVocabularyIds: ['zh_vocab_nihao', 'zh_vocab_xiexie', 'zh_vocab_xuesheng', 'zh_vocab_laoshi'],
      grammarPatternIds: ['zh_gram_word_order', 'zh_gram_question_ma'],
      dialogueThemes: ['Memperkenalkan diri & menanyakan kabar di kelas'],
    });

    this.registerChapterLink({
      subjectId: 'sub-mand',
      chapterId: 'ch-man-shopping-food',
      chapterTitle: '购物与点餐 (Shopping & Ordering Food)',
      gradeLevel: 'Kelas 11 SMA',
      languageId: 'zh-CN',
      targetCEFRorGFLevel: 'Level-2',
      coreVocabularyIds: ['zh_vocab_duoshao', 'zh_vocab_qian', 'zh_vocab_haochi', 'zh_vocab_fanyuan'],
      grammarPatternIds: ['zh_gram_measure_words', 'zh_gram_aspect_le'],
      dialogueThemes: ['Bertanya harga & memesan makanan di restoran'],
    });
  }

  /**
   * Register a school chapter link
   */
  public registerChapterLink(link: SchoolLanguageChapterLink): void {
    this.chapterLinks.set(`${link.subjectId}_${link.chapterId}`, link);
  }

  /**
   * Get chapter links for a language
   */
  public getLinksByLanguage(languageId: SupportedLanguageId): SchoolLanguageChapterLink[] {
    return Array.from(this.chapterLinks.values()).filter(l => l.languageId === languageId);
  }

  /**
   * Get learning objects associated with a specific school chapter
   */
  public getChapterLearningObjects(subjectId: string, chapterId: string): {
    vocabulary: VocabularyItem[];
    grammar: GrammarItem[];
  } {
    const link = this.chapterLinks.get(`${subjectId}_${chapterId}`);
    if (!link) {
      return { vocabulary: [], grammar: [] };
    }

    const vocabulary = link.coreVocabularyIds
      .map(id => vocabularyEngine.getItem(id))
      .filter(Boolean) as VocabularyItem[];

    const grammar = link.grammarPatternIds
      .map(id => grammarEngine.getGrammar(id))
      .filter(Boolean) as GrammarItem[];

    return { vocabulary, grammar };
  }
}

export const schoolFirstMode = new SchoolFirstMode();
