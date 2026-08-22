// Mandarin Chinese Vocabulary Dataset aligned with GF0025-2021 (Level 1 to Level 3+)
// Supports Hanzi, Pinyin, Tone Numbers, Radicals, Example Sentences, and Common Mistakes

import { VocabularyItem } from '../core/types';

export const MANDARIN_VOCABULARY_DATA: VocabularyItem[] = [
  // ── Level 1 (HSK 1) ───────────────────────────────────────────────────────
  {
    id: 'zh_vocab_nihao',
    languageId: 'zh-CN',
    word: '你好',
    normalizedForm: '你好',
    translation: 'halo / salam',
    definition: 'greeting used when meeting someone; hello',
    partOfSpeech: 'phrase',
    proficiencyLevel: 'Level-1',
    topic: 'Greetings & Etiquette',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    toneNumbers: [3, 3],
    exampleSentences: [
      {
        original: '你好，很高兴认识你！',
        pinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
        translation: 'Halo, sangat senang bisa mengenalmu!',
      },
    ],
  },
  {
    id: 'zh_vocab_xiexie',
    languageId: 'zh-CN',
    word: '谢谢',
    normalizedForm: '谢谢',
    translation: 'terima kasih',
    definition: 'expression of gratitude; thank you',
    partOfSpeech: 'verb / phrase',
    proficiencyLevel: 'Level-1',
    topic: 'Greetings & Etiquette',
    hanzi: '谢谢',
    pinyin: 'xiè xie',
    toneNumbers: [4, 0],
    exampleSentences: [
      {
        original: '谢谢老师的帮助。',
        pinyin: 'Xièxie lǎoshī de bāngzhù.',
        translation: 'Terima kasih atas bantuan guru.',
      },
    ],
  },
  {
    id: 'zh_vocab_xuesheng',
    languageId: 'zh-CN',
    word: '学生',
    normalizedForm: '学生',
    translation: 'siswa / pelajar / murid',
    definition: 'student; pupil; person who is studying',
    partOfSpeech: 'noun',
    proficiencyLevel: 'Level-1',
    topic: 'School & Education',
    hanzi: '学生',
    pinyin: 'xué sheng',
    toneNumbers: [2, 0],
    exampleSentences: [
      {
        original: '我是高中二年级的学生。',
        pinyin: 'Wǒ shì gāozhōng èr niánjí de xuésheng.',
        translation: 'Saya adalah siswa SMA kelas 11.',
      },
    ],
  },
  {
    id: 'zh_vocab_laoshi',
    languageId: 'zh-CN',
    word: '老师',
    normalizedForm: '老师',
    translation: 'guru / pengajar',
    definition: 'teacher; instructor',
    partOfSpeech: 'noun',
    proficiencyLevel: 'Level-1',
    topic: 'School & Education',
    hanzi: '老师',
    pinyin: 'lǎo shī',
    toneNumbers: [3, 1],
    exampleSentences: [
      {
        original: '张老师教我们中文。',
        pinyin: 'Zhāng lǎoshī jiāo wǒmen zhōngwén.',
        translation: 'Guru Zhang mengajar kami bahasa Mandarin.',
      },
    ],
  },

  // ── Level 2 (HSK 2) ───────────────────────────────────────────────────────
  {
    id: 'zh_vocab_duoshao',
    languageId: 'zh-CN',
    word: '多少',
    normalizedForm: '多少',
    translation: 'berapa (jumlah)',
    definition: 'how much; how many (typically for quantities > 10)',
    partOfSpeech: 'pronoun',
    proficiencyLevel: 'Level-2',
    topic: 'Shopping & Numbers',
    hanzi: '多少',
    pinyin: 'duō shao',
    toneNumbers: [1, 0],
    exampleSentences: [
      {
        original: '这本书多少钱？',
        pinyin: 'Zhè běn shū duōshao qián?',
        translation: 'Buku ini harganya berapa?',
      },
    ],
  },
  {
    id: 'zh_vocab_haochi',
    languageId: 'zh-CN',
    word: '好吃',
    normalizedForm: '好吃',
    translation: 'enak / lezat (makanan)',
    definition: 'tasty; delicious (for food items)',
    partOfSpeech: 'adjective',
    proficiencyLevel: 'Level-2',
    topic: 'Food & Dining',
    hanzi: '好吃',
    pinyin: 'hǎo chī',
    toneNumbers: [3, 1],
    exampleSentences: [
      {
        original: '中国菜非常好吃！',
        pinyin: 'Zhōngguó cài fēicháng hǎochī!',
        translation: 'Masakan Tiongkok sangat lezat!',
      },
    ],
  },
  {
    id: 'zh_vocab_huanjing',
    languageId: 'zh-CN',
    word: '环境',
    normalizedForm: '环境',
    translation: 'lingkungan / suasana',
    definition: 'environment; surroundings; ambient atmosphere',
    partOfSpeech: 'noun',
    proficiencyLevel: 'Level-3',
    topic: 'Nature & Society',
    hanzi: '环境',
    pinyin: 'huán jìng',
    toneNumbers: [2, 4],
    exampleSentences: [
      {
        original: '我们学校的学习环境很好。',
        pinyin: 'Wǒmen xuéxiào de xuéxí huánjìng hěn hǎo.',
        translation: 'Lingkungan belajar di sekolah kami sangat bagus.',
      },
    ],
  },
];
