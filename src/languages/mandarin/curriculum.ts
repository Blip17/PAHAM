// Mandarin GF0025-2021 Curriculum Structure & Learning Units
// Modular learning progression covering Spoken Language (Pinyin/Tones) and Written Language (Hanzi)

export interface MandarinCurriculumUnit {
  id: string;
  level: string;
  title: string;
  chineseTitle: string;
  theme: string;
  description: string;
  targetCanDo: string;
  pinyinFocus: string;
  characterIds: string[];
  vocabularyIds: string[];
  grammarIds: string[];
  estimatedMinutes: number;
}

export const MANDARIN_CURRICULUM_UNITS: MandarinCurriculumUnit[] = [
  {
    id: 'unit_zh_lvl1_01',
    level: 'Level-1',
    title: 'Unit 1: Pinyin Basics, 4 Tones & Friendly Greetings',
    chineseTitle: '第一单元：拼音基础、四声与日常问候',
    theme: 'Foundations & Greetings',
    description: 'Menguasai 4 nada utama, sistem inisial/final Pinyin, dan menyapa teman serta guru.',
    targetCanDo: 'Can pronounce Pinyin initials/finals accurately, recognize 4 tones, and greet politely in Mandarin.',
    pinyinFocus: 'Initials: b, p, m, f | Finals: a, o, e, i, u, ü | 4 Tones',
    characterIds: ['好', '学', '生'],
    vocabularyIds: ['zh_vocab_nihao', 'zh_vocab_xiexie', 'zh_vocab_xuesheng', 'zh_vocab_laoshi'],
    grammarIds: ['zh_gram_word_order'],
    estimatedMinutes: 30,
  },
  {
    id: 'unit_zh_lvl2_02',
    level: 'Level-2',
    title: 'Unit 2: Measure Words, Tone Pairs & Food Ordering',
    chineseTitle: '第二单元：常用量词、双音节声调与点餐购物',
    theme: 'Shopping & Dining',
    description: 'Melatih kelancaran pasangan nada ganda (Tone Pairs), kata bantu bilangan, dan transaksi harian.',
    targetCanDo: 'Can use classifiers (量词) accurately and pronounce 2-syllable tone combinations smoothly.',
    pinyinFocus: 'Tone Sandhi 3+3 -> 2+3, Rule of 不 & 一',
    characterIds: ['中', '国', '本', '谢'],
    vocabularyIds: ['zh_vocab_duoshao', 'zh_vocab_haochi'],
    grammarIds: ['zh_gram_measure_words', 'zh_gram_aspect_le'],
    estimatedMinutes: 35,
  },
  {
    id: 'unit_zh_lvl3_03',
    level: 'Level-3',
    title: 'Unit 3: School Life, Aspect Particles & Environmental Themes',
    chineseTitle: '第三单元：校园生活、动态助词与环境话题',
    theme: 'School & Society',
    description: 'Menguasai partikel aspek (了/着/过), membaca teks paragraf pendek, dan menulis karakter terstruktur.',
    targetCanDo: 'Can read short paragraphs in simplified Hanzi and describe completed or continuous actions.',
    pinyinFocus: 'Connected speech & neutral tone in conversational speed',
    characterIds: ['好', '学', '生', '中', '国'],
    vocabularyIds: ['zh_vocab_huanjing', 'zh_vocab_laoshi'],
    grammarIds: ['zh_gram_aspect_le', 'zh_gram_ba_sentence'],
    estimatedMinutes: 40,
  },
];
