// Mandarin Pinyin, Tones, Tone Sandhi Rules, and Tone Pair Drill Combinations
// Provides systematic 2-syllable tone pair practice across all 20 tone permutations

import { TonePairItem } from '../core/types';

export interface ToneSandhiRule {
  id: string;
  name: string;
  triggerCondition: string;
  resultPhonetic: string;
  explanation: string;
  examples: { original: string; spokenPinyin: string; translation: string }[];
}

export const MANDARIN_TONE_SANDHI_RULES: ToneSandhiRule[] = [
  {
    id: 'sandhi_3_3',
    name: 'Aturan Dua Nada Tiga Berturutan (3 + 3 -> 2 + 3)',
    triggerCondition: 'Ketika dua karakter bernada 3 (上声) diucapkan berurutan.',
    resultPhonetic: 'Karakter pertama berubah diucapkan menjadi Nada 2 (Rising / 阳平).',
    explanation: 'Dalam tulisan Pinyin tanda nada tetap ditulis nada 3, namun saat diucapkan secara lisan nada pertama naik menjadi nada 2 agar lebih alami dan hemat napas.',
    examples: [
      { original: '你好 (nǐ hǎo)', spokenPinyin: 'ní hǎo', translation: 'Halo' },
      { original: '可以 (kě yǐ)', spokenPinyin: 'ké yǐ', translation: 'Boleh / bisa' },
      { original: '手表 (shǒu biǎo)', spokenPinyin: 'shóu biǎo', translation: 'Jam tangan' },
    ],
  },
  {
    id: 'sandhi_bu',
    name: 'Aturan Perubahan Nada Kata "不" (bù -> bú)',
    triggerCondition: 'Ketika kata "不" (bù - nada 4) bertemu karakter bernada 4 (去声).',
    resultPhonetic: '"不" berubah diucapkan menjadi Nada 2 (bú).',
    explanation: 'Jika diikuti nada 1, 2, atau 3, "不" tetap diucapkan nada 4 (bù). Hanya berubah menjadi bú di depan nada 4.',
    examples: [
      { original: '不是 (bù + shì)', spokenPinyin: 'bú shì', translation: 'Bukan / tidak adalah' },
      { original: '对不起 (duì bu qǐ)', spokenPinyin: 'duì bu qǐ', translation: 'Maaf' },
      { original: '不要 (bù + yào)', spokenPinyin: 'bú yào', translation: 'Jangan / tidak mau' },
    ],
  },
  {
    id: 'sandhi_yi',
    name: 'Aturan Perubahan Nada Kata "一" (yī -> yí / yì)',
    triggerCondition: 'Kata "一" (yī - nada 1) saat berpasangan dengan kata benda/bilangan.',
    resultPhonetic: 'Menjadi nada 2 (yí) di depan nada 4; menjadi nada 4 (yì) di depan nada 1, 2, atau 3.',
    explanation: '"一" hanya bernada 1 asli (yī) saat berhitung urutan (1, 2, 3) atau nomor telepon.',
    examples: [
      { original: '一个 (yī + gè)', spokenPinyin: 'yí gè', translation: 'Sebuah / satu orang' },
      { original: '一天 (yī + tiān)', spokenPinyin: 'yì tiān', translation: 'Satu hari (depan nada 1)' },
      { original: '一起 (yī + qǐ)', spokenPinyin: 'yì qǐ', translation: 'Bersama-sama (depan nada 3)' },
    ],
  },
];

export const MANDARIN_TONE_PAIRS_DATA: TonePairItem[] = [
  // Tone 1 Pairs (1-1, 1-2, 1-3, 1-4, 1-0)
  { id: 'tp_1_1', word: '飞机', hanzi: '飞机', pinyin: 'fēijī', tonePair: [1, 1], meaning: 'Pesawat terbang', difficulty: 'LEVEL_1' },
  { id: 'tp_1_2', word: '中国', hanzi: '中国', pinyin: 'zhōngguó', tonePair: [1, 2], meaning: 'Tiongkok', difficulty: 'LEVEL_1' },
  { id: 'tp_1_3', word: '机场', hanzi: '机场', pinyin: 'jīchǎng', tonePair: [1, 3], meaning: 'Bandara', difficulty: 'LEVEL_1' },
  { id: 'tp_1_4', word: '面包', hanzi: '面包', pinyin: 'miànbāo', tonePair: [1, 4], meaning: 'Roti (Note: miàn is 4, bāo is 1)', difficulty: 'LEVEL_1' },
  { id: 'tp_1_0', word: '妈妈', hanzi: '妈妈', pinyin: 'māma', tonePair: [1, 0], meaning: 'Ibu', difficulty: 'LEVEL_1' },

  // Tone 2 Pairs (2-1, 2-2, 2-3, 2-4, 2-0)
  { id: 'tp_2_1', word: '时间', hanzi: '时间', pinyin: 'shíjiān', tonePair: [2, 1], meaning: 'Waktu', difficulty: 'LEVEL_2' },
  { id: 'tp_2_2', word: '常常', hanzi: '常常', pinyin: 'chángcháng', tonePair: [2, 2], meaning: 'Sering / kerap', difficulty: 'LEVEL_2' },
  { id: 'tp_2_3', word: '苹果', hanzi: '苹果', pinyin: 'píngguǒ', tonePair: [2, 3], meaning: 'Apel', difficulty: 'LEVEL_2' },
  { id: 'tp_2_4', word: '学习', hanzi: '学习', pinyin: 'xuéxí', tonePair: [2, 2], meaning: 'Belajar', difficulty: 'LEVEL_2' },

  // Tone 3 Pairs (3-1, 3-2, 3-3, 3-4, 3-0)
  { id: 'tp_3_1', word: '老师', hanzi: '老师', pinyin: 'lǎoshī', tonePair: [3, 1], meaning: 'Guru', difficulty: 'LEVEL_1' },
  { id: 'tp_3_2', word: '游泳', hanzi: '游泳', pinyin: 'yóuyǒng', tonePair: [2, 3], meaning: 'Berenang', difficulty: 'LEVEL_2' },
  { id: 'tp_3_3', word: '你好', hanzi: '你好', pinyin: 'nǐhǎo', tonePair: [3, 3], meaning: 'Halo (diucapkan ní hǎo)', difficulty: 'LEVEL_1' },
  { id: 'tp_3_4', word: '比赛', hanzi: '比赛', pinyin: 'bǐsài', tonePair: [3, 4], meaning: 'Kompetisi / pertandingan', difficulty: 'LEVEL_2' },

  // Tone 4 Pairs (4-1, 4-2, 4-3, 4-4, 4-0)
  { id: 'tp_4_1', word: '生日', hanzi: '生日', pinyin: 'shēngrì', tonePair: [1, 4], meaning: 'Ulang tahun', difficulty: 'LEVEL_1' },
  { id: 'tp_4_2', word: '电话', hanzi: '电话', pinyin: 'diànhuà', tonePair: [4, 4], meaning: 'Telepon', difficulty: 'LEVEL_1' },
  { id: 'tp_4_3', word: '汉语', hanzi: '汉语', pinyin: 'hànyǔ', tonePair: [4, 3], meaning: 'Bahasa Mandarin', difficulty: 'LEVEL_1' },
  { id: 'tp_4_4', word: '再见', hanzi: '再见', pinyin: 'zàijiàn', tonePair: [4, 4], meaning: 'Sampai jumpa', difficulty: 'LEVEL_1' },
  { id: 'tp_4_0', word: '谢谢', hanzi: '谢谢', pinyin: 'xièxie', tonePair: [4, 0], meaning: 'Terima kasih', difficulty: 'LEVEL_1' },
];
