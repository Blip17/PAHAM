// Mandarin Chinese Grammar Patterns Dataset aligned with GF0025-2021
// Word Order, Measure Words, Aspect Markers, and Complex Sentence Structures

import { GrammarItem } from '../core/types';

export const MANDARIN_GRAMMAR_DATA: GrammarItem[] = [
  // ── Word Order (Level 1) ──────────────────────────────────────────────────
  {
    id: 'zh_gram_word_order',
    languageId: 'zh-CN',
    name: 'Mandarin Word Order (S + Time/Place + V + O)',
    title: 'Urutan Kalimat Dasar Mandarin: Subjek + Waktu + Tempat + Kata Kerja + Objek',
    proficiencyLevel: 'Level-1',
    category: 'Sentence Structure',
    explanation: 'Dalam tata bahasa Mandarin, keterangan waktu dan tempat SELALU diletakkan sebelum kata kerja utama (berbeda dengan bahasa Indonesia/Inggris yang sering meletakkannya di akhir kalimat).',
    patternFormula: '主语 (Subjek) + 时间 (Waktu) + 地点 (Tempat) + 动词 (Kata Kerja) + 宾语 (Objek)',
    examples: [
      {
        original: '我明天在学校学习汉语。',
        pinyin: 'Wǒ míngtiān zài xuéxiào xuéxí hànyǔ.',
        translation: 'Saya besok di sekolah belajar bahasa Mandarin (Saya akan belajar bahasa Mandarin di sekolah besok).',
      },
      {
        original: '他晚上在图书馆看书。',
        pinyin: 'Tā wǎnshang zài túshūguǎn kàn shū.',
        translation: 'Dia malam hari di perpustakaan membaca buku.',
      },
    ],
    commonMistakes: [
      {
        incorrect: '我学习汉语明天。(Wǒ xuéxí hànyǔ míngtiān.)',
        correct: '我明天学习汉语。(Wǒ míngtiān xuéxí hànyǔ.)',
        explanation: 'Keterangan waktu "míngtiān" tidak boleh diletakkan di akhir kalimat.',
      },
    ],
  },

  // ── Measure Words (Level 2) ───────────────────────────────────────────────
  {
    id: 'zh_gram_measure_words',
    languageId: 'zh-CN',
    name: 'Classifiers & Measure Words (量词: 个, 本, 张, 条, 只)',
    title: 'Kata Bantu Bilangan (量词 / Measure Words)',
    proficiencyLevel: 'Level-2',
    category: 'Measure Words',
    explanation: 'Dalam bahasa Mandarin, setiap kata benda yang dihitung dengan angka atau ditunjuk dengan 这/那 (ini/itu) WAJIB menggunakan kata bantu bilangan (Classifier/Measure Word) yang sesuai.',
    patternFormula: '数词 (Angka) / 这 / 那 + 量词 (Measure Word) + 名词 (Kata Benda)',
    measureWords: ['个 (umum/orang)', '本 (buku/jilid)', '张 (kertas/meja/tiket/benda datar)', '条 (benda panjang/ikan/celana)', '只 (hewan kecil)'],
    examples: [
      {
        original: '我想买两本书。',
        pinyin: 'Wǒ xiǎng mǎi liǎng běn shū.',
        translation: 'Saya ingin membeli dua buah buku (Note: angka 2 untuk kuantitas adalah liǎng, bukan èr).',
      },
      {
        original: '桌子上有一张地图。',
        pinyin: 'Zhuōzi shang yǒu yì zhāng dìtú.',
        translation: 'Di atas meja ada selembar peta.',
      },
    ],
    commonMistakes: [
      {
        incorrect: '两个书 (liǎng gè shū)',
        correct: '两本书 (liǎng běn shū)',
        explanation: 'Buku menggunakan measure word khusus "本 (běn)", bukan "个 (gè)".',
      },
    ],
  },

  // ── Aspect Particle 了 (Level 2/3) ────────────────────────────────────────
  {
    id: 'zh_gram_aspect_le',
    languageId: 'zh-CN',
    name: 'Aspect Particle 了 (Dynamic Le & Modal Le)',
    title: 'Partikel Aspek 了: Perubahan Keadaan & Tindakan Selesai',
    proficiencyLevel: 'Level-2',
    category: 'Aspect Particles',
    explanation: 'Partikel 了 (le) memiliki dua fungsi utama: 1) Diletakkan setelah kata kerja untuk menandai selesainya perbuatan (Action Completion), 2) Diletakkan di akhir kalimat untuk menandai terjadinya perubahan situasi/keadaan baru (Change of State).',
    patternFormula: '1. V + 了 + O (Selesai dilakukan) | 2. Kalimat + 了 (Perubahan situasi)',
    aspectMarker: '了 (le)',
    examples: [
      {
        original: '我已经吃了早饭。',
        pinyin: 'Wǒ yǐjīng chī le zǎofàn.',
        translation: 'Saya sudah selesai sarapan pagi.',
      },
      {
        original: '下雨了，我们别出去了。',
        pinyin: 'Xiàyǔ le, wǒmen bié chūqu le.',
        translation: 'Hujan sudah mulai turun (perubahan cuaca), mari kita jangan keluar.',
      },
    ],
    commonMistakes: [
      {
        incorrect: '我昨天没吃了早饭。',
        correct: '我昨天没吃早饭。',
        explanation: 'Bentuk negatif "没 (méi)" untuk menyatakan belum/tidak terjadinya perbuatan TIDAK BOLEH disertai partikel "了".',
      },
    ],
  },

  // ── Disposal Sentence 把字句 (Level 4) ─────────────────────────────────────
  {
    id: 'zh_gram_ba_sentence',
    languageId: 'zh-CN',
    name: 'Disposal Construction (把字句)',
    title: 'Konstruksi Kalimat "把" (Disposal Structure)',
    proficiencyLevel: 'Level-4',
    category: 'Advanced Patterns',
    explanation: 'Digunakan ketika subjek melakukan perbuatan yang mengubah posisi, keadaan, atau hasil dari objek spesifik yang telah diketahui.',
    patternFormula: 'Subjek + 把 + Objek Spesifik + Kata Kerja + Hasil/Arah/Perubahan (Pelengkap)',
    examples: [
      {
        original: '请把手机放在桌子上。',
        pinyin: 'Qǐng bǎ shǒujī fàng zài zhuōzi shang.',
        translation: 'Tolong letakkan ponsel itu di atas meja.',
      },
      {
        original: '我把作业做完了。',
        pinyin: 'Wǒ bǎ zuòyè zuò wán le.',
        translation: 'Saya telah menyelesaikan PR saya.',
      },
    ],
    commonMistakes: [
      {
        incorrect: '我把作业做。(Wǒ bǎ zuòyè zuò.)',
        correct: '我把作业做完了。(Wǒ bǎ zuòyè zuò wán le.)',
        explanation: 'Kalimat 把 wajib memiliki pelengkap hasil/arah (seperti 完, 在, 到, 了) setelah kata kerja dasar.',
      },
    ],
  },
];
