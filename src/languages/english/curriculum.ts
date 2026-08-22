// English CEFR Curriculum Structure & Learning Units
// Modular curriculum units from Pre-A1 to C2 with objectives and skill links

export interface EnglishCurriculumUnit {
  id: string;
  level: string;
  title: string;
  theme: string;
  description: string;
  targetCanDo: string;
  vocabularyIds: string[];
  grammarIds: string[];
  estimatedMinutes: number;
}

export const ENGLISH_CURRICULUM_UNITS: EnglishCurriculumUnit[] = [
  {
    id: 'unit_en_a1_01',
    level: 'A1',
    title: 'Unit 1: Personal Identity & Daily Routines',
    theme: 'Daily Life',
    description: 'Membangun fondasi percakapan: menyapa, mengenalkan diri, waktu, dan aktivitas harian.',
    targetCanDo: 'Can describe simple daily routines and introduce oneself confidently.',
    vocabularyIds: ['en_vocab_accomplish'],
    grammarIds: ['en_gram_present_simple'],
    estimatedMinutes: 25,
  },
  {
    id: 'unit_en_a2_02',
    level: 'A2',
    title: 'Unit 2: Historical Memories & Storytelling',
    theme: 'History & Memories',
    description: 'Menceritakan liburan, peristiwa lampau, dan kebiasaan masa kecil.',
    targetCanDo: 'Can tell a simple story about past events and personal experiences.',
    vocabularyIds: ['en_vocab_ancient'],
    grammarIds: ['en_gram_past_simple'],
    estimatedMinutes: 30,
  },
  {
    id: 'unit_en_b1_03',
    level: 'B1',
    title: 'Unit 3: Dreams, Hypotheses & Social Challenges',
    theme: 'Society & Choices',
    description: 'Mengekspresikan opini pribadi, pengandaian masa depan, dan menghadapi tantangan hidup.',
    targetCanDo: 'Can discuss hypothetical situations and give reasons for personal opinions.',
    vocabularyIds: ['en_vocab_courageous', 'en_vocab_accomplish'],
    grammarIds: ['en_gram_conditionals_type2'],
    estimatedMinutes: 35,
  },
  {
    id: 'unit_en_b2_04',
    level: 'B2',
    title: 'Unit 4: Academic Discourse & Global Perspectives',
    theme: 'Science & Exposition',
    description: 'Menganalisis data, menulis argumen terstruktur, dan menyusun teks objektif formal.',
    targetCanDo: 'Can write clear, well-structured arguments and comprehend complex academic texts.',
    vocabularyIds: ['en_vocab_consequence', 'en_vocab_significant', 'en_vocab_furthermore', 'en_vocab_perseverance'],
    grammarIds: ['en_gram_passive_voice'],
    estimatedMinutes: 40,
  },
];
