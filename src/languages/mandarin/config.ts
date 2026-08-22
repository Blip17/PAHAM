// Mandarin Chinese GF0025-2021 Configuration & Proficiency Framework Specifications
// Implements Chinese Proficiency Standards for International Chinese Language Education

import { SkillCompetency } from '../core/types';

export const MANDARIN_GF0025_COMPETENCIES: SkillCompetency[] = [
  // ── Level 1 (HSK 1 / Elementary Foundation) ───────────────────────────────
  {
    id: 'zh_comp_lvl1_pinyin_tones',
    languageId: 'zh-CN',
    skillType: 'TONES',
    level: 'Level-1',
    title: '4 Tones & Pinyin Syllables (4 个基本声调)',
    description: 'Mampu membedakan dan melafalkan 4 nada dasar Mandarin (阴平, 阳平, 上声, 去声) dan nada netral (轻声).',
    canDoStatement: 'Can accurately pronounce and distinguish the 4 Mandarin tones and basic Pinyin syllables.',
    masteryScore: 80,
    masteryState: 'MASTERED',
    evidenceCount: 15,
  },
  {
    id: 'zh_comp_lvl1_characters',
    languageId: 'zh-CN',
    skillType: 'CHARACTERS',
    level: 'Level-1',
    title: 'Foundational 300 Hanzi Recognition (基础 300 汉字)',
    description: 'Mengenali bentuk visual, goresan dasar, dan arti dari 300 karakter Hanzi tingkat pertama.',
    canDoStatement: 'Can recognize 300 essential Chinese characters and identify basic radicals (偏旁部首).',
    masteryScore: 75,
    masteryState: 'FAMILIAR',
    evidenceCount: 12,
  },
  {
    id: 'zh_comp_lvl1_word_order',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    level: 'Level-1',
    title: 'Basic Word Order: S + Time/Place + V + O (基本语序)',
    description: 'Menyusun kalimat sederhana dengan menempatkan keterangan waktu/tempat sebelum kata kerja.',
    canDoStatement: 'Can form correct simple sentences following Mandarin word order rules.',
    masteryScore: 70,
    masteryState: 'FAMILIAR',
    evidenceCount: 8,
  },

  // ── Level 2 (HSK 2 / Elementary Upper) ────────────────────────────────────
  {
    id: 'zh_comp_lvl2_measure_words',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    level: 'Level-2',
    title: 'Common Classifiers & Measure Words (常用量词: 个, 本, 张, 只, 条)',
    description: 'Menggunakan kata bantu bilangan (measure words) yang sesuai dengan karakteristik objek benda.',
    canDoStatement: 'Can correctly pair nouns with their appropriate Mandarin classifiers/measure words.',
    masteryScore: 65,
    masteryState: 'LEARNING',
    evidenceCount: 6,
  },
  {
    id: 'zh_comp_lvl2_tone_pairs',
    languageId: 'zh-CN',
    skillType: 'TONES',
    level: 'Level-2',
    title: 'Tone Sandhi & 2-Character Tone Pairs (变调与双音节声调)',
    description: 'Menguasai aturan perubahan nada (e.g. 3rd+3rd tone, 不, 一) dan kelancaran 20 kombinasi nada ganda.',
    canDoStatement: 'Can pronounce 2-syllable tone combinations smoothly with proper tone sandhi rules.',
    masteryScore: 60,
    masteryState: 'LEARNING',
    evidenceCount: 7,
  },

  // ── Level 3 (HSK 3 / Intermediate Starter) ────────────────────────────────
  {
    id: 'zh_comp_lvl3_aspect_particles',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    level: 'Level-3',
    title: 'Aspect Particles: 了, 着, 过 (动态助词)',
    description: 'Membedakan aspek selesainya tindakan (了), keberlangsungan (着), dan pengalaman masa lalu (过).',
    canDoStatement: 'Can accurately express completed action, ongoing state, and past experience using aspect particles.',
    masteryScore: 50,
    masteryState: 'LEARNING',
    evidenceCount: 5,
  },
  {
    id: 'zh_comp_lvl3_character_writing',
    languageId: 'zh-CN',
    skillType: 'CHARACTERS',
    level: 'Level-3',
    title: 'Character Stroke Order & Production (汉字书写笔顺)',
    description: 'Mampu menuliskan karakter Mandarin dengan urutan goresan (stroke order) dan proporsi yang tepat.',
    canDoStatement: 'Can write frequently used Chinese characters with correct stroke order.',
    masteryScore: 40,
    masteryState: 'LEARNING',
    evidenceCount: 4,
  },

  // ── Level 4+ (HSK 4+ / Intermediate Vantage) ──────────────────────────────
  {
    id: 'zh_comp_lvl4_ba_bei',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    level: 'Level-4',
    title: 'Disposal & Passive Structures: 把字句 & 被字句',
    description: 'Menggunakan konstruksi 把 (disposal) untuk penanganan objek dan 被 untuk kalimat pasif.',
    canDoStatement: 'Can construct complex disposal (把) and passive (被) sentences in spoken and written contexts.',
    masteryScore: 30,
    masteryState: 'LEARNING',
    evidenceCount: 3,
  },
];
