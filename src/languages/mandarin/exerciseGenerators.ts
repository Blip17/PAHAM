// Specialized Mandarin Exercise Dataset & Generators
// Tone Pair drills, Character Recognition/Writing, Measure Words, and Word Order

import { UniversalExercise } from '../core/types';

export const MANDARIN_EXERCISES_DATA: UniversalExercise[] = [
  // ── 1. Tone Pair Exercise (Level 1/2) ────────────────────────────────────
  {
    id: 'zh_ex_01_tone_pair',
    languageId: 'zh-CN',
    skillType: 'TONES',
    exerciseType: 'TONE_PAIR',
    proficiencyLevel: 'Level-1',
    topic: 'Tone Combinations',
    instruction: 'Identifikasi kombinasi nada yang tepat untuk kata di bawah ini:',
    prompt: '老师 (lǎoshī - Guru)',
    options: ['Nada 3 + Nada 1 (Low Dipping + High Flat)', 'Nada 1 + Nada 1', 'Nada 2 + Nada 4', 'Nada 4 + Nada 1'],
    correctAnswer: 'Nada 3 + Nada 1 (Low Dipping + High Flat)',
    distractors: ['Nada 1 + Nada 1', 'Nada 2 + Nada 4', 'Nada 4 + Nada 1'],
    explanation: 'Karakter 老 (lǎo) bernada 3 (turun-naik rendah) dan 师 (shī) bernada 1 (tinggi datar stabil). Kombinasinya adalah 3 + 1.',
    hint: 'Lafalkan "lǎo" dengan nada berat di tenggorokan lalu "shī" dengan nada tinggi datar.',
  },

  // ── 2. Character Recognition Exercise (Level 1) ──────────────────────────
  {
    id: 'zh_ex_02_char_recognition',
    languageId: 'zh-CN',
    skillType: 'CHARACTERS',
    exerciseType: 'CHARACTER_RECOGNITION',
    proficiencyLevel: 'Level-1',
    topic: 'Hanzi Recognition',
    characterVisual: '好',
    instruction: 'Pilihlah Pinyin dan arti yang tepat untuk karakter Hanzi di atas:',
    prompt: 'Karakter: 好 (Terdiri dari komponen radikal 女 [Perempuan] + 子 [Anak])',
    options: [
      'hǎo — baik / bagus',
      'xué — belajar',
      'xiè — terima kasih',
      'guó — negara',
    ],
    correctAnswer: 'hǎo — baik / bagus',
    distractors: [
      'xué — belajar',
      'xiè — terima kasih',
      'guó — negara',
    ],
    explanation: 'Karakter 好 (hǎo) bermakna baik/bagus. Mnemonic: Ibu (女) memeluk anak (子) adalah hal yang sangat baik/indah (好).',
    hint: 'Karakter ini sering dipakai saat menyapa: "你_____ (Halo)".',
  },

  // ── 3. Measure Word Insertion Exercise (Level 2) ─────────────────────────
  {
    id: 'zh_ex_03_measure_word',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    exerciseType: 'FILL_IN_BLANK',
    proficiencyLevel: 'Level-2',
    topic: 'Classifiers & Measure Words',
    instruction: 'Pilihlah kata bantu bilangan (量词) yang tepat untuk melengkapi kalimat:',
    prompt: '我想在书店买两 _____ 汉语书。(Wǒ xiǎng zài shūdiàn mǎi liǎng _____ hànyǔ shū.)',
    options: ['本 (běn)', '个 (gè)', '张 (zhāng)', '条 (tiáo)'],
    correctAnswer: '本 (běn)',
    distractors: ['个 (gè)', '张 (zhāng)', '条 (tiáo)'],
    explanation: 'Benda berupa buku/jilid berhalaman (书 / 字典) wajib menggunakan kata bantu bilangan "本 (běn)".',
    hint: 'Cari kata bantu khusus untuk buku atau jilid.',
  },

  // ── 4. Mandarin Word Order Exercise (Level 1) ────────────────────────────
  {
    id: 'zh_ex_04_word_order',
    languageId: 'zh-CN',
    skillType: 'GRAMMAR',
    exerciseType: 'SENTENCE_ORDERING',
    proficiencyLevel: 'Level-1',
    topic: 'Sentence Structure',
    instruction: 'Susunlah kata-kata acak berikut menjadi kalimat Mandarin yang benar:',
    prompt: 'Urutan benar untuk: [学习汉语 (belajar Mandarin)] [明天 (besok)] [我 (saya)] [在学校 (di sekolah)]',
    options: [
      '我 + 明天 + 在学校 + 学习汉语',
      '我 + 学习汉语 + 明天 + 在学校',
      '明天 + 学习汉语 + 在学校 + 我',
      '在学校 + 学习汉语 + 我 + 明天',
    ],
    correctAnswer: '我 + 明天 + 在学校 + 学习汉语',
    distractors: [
      '我 + 学习汉语 + 明天 + 在学校',
      '明天 + 学习汉语 + 在学校 + 我',
      '在学校 + 学习汉语 + 我 + 明天',
    ],
    explanation: 'Urutan baku tata bahasa Mandarin adalah Subjek (我) + Waktu (明天) + Tempat (在学校) + Kata Kerja & Objek (学习汉语).',
    hint: 'Ingat rumus S + Waktu + Tempat + V + O.',
  },

  // ── 5. Tone Sandhi Rule Exercise (Level 2) ───────────────────────────────
  {
    id: 'zh_ex_05_sandhi',
    languageId: 'zh-CN',
    skillType: 'TONES',
    exerciseType: 'PRONUNCIATION',
    proficiencyLevel: 'Level-2',
    topic: 'Tone Sandhi Rules',
    instruction: 'Bagaimana pengucapan lisan nada yang tepat untuk kata "你好" (nǐ hǎo)?',
    prompt: 'Kata: 你好 (Dua karakter sama-sama bernada 3)',
    options: [
      'Karakter pertama berubah diucapkan menjadi Nada 2: "ní hǎo"',
      'Karakter kedua berubah menjadi Nada 1: "nǐ hāo"',
      'Kedua karakter tetap diucapkan nada 3 datar: "nǐ hǎo"',
      'Karakter pertama menjadi nada 4: "nì hǎo"',
    ],
    correctAnswer: 'Karakter pertama berubah diucapkan menjadi Nada 2: "ní hǎo"',
    distractors: [
      'Karakter kedua berubah menjadi Nada 1: "nǐ hāo"',
      'Kedua karakter tetap diucapkan nada 3 datar: "nǐ hǎo"',
      'Karakter pertama menjadi nada 4: "nì hǎo"',
    ],
    explanation: 'Sesuai aturan Tone Sandhi Mandarin: Jika dua karakter bernada 3 (上声) berurutan, karakter pertama berubah diucapkan menjadi nada 2 (Rising / 阳平).',
    hint: 'Ingat rumus perubahan nada 3 + 3 -> 2 + 3.',
  },
];
