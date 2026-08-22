// English Grammar Learning Objects Dataset aligned with CEFR
// Formulas, Structural Patterns, Common Mistakes with Diagnostic Explanations

import { GrammarItem } from '../core/types';

export const ENGLISH_GRAMMAR_DATA: GrammarItem[] = [
  // ── Present Simple (A1) ──────────────────────────────────────────────────
  {
    id: 'en_gram_present_simple',
    languageId: 'en',
    name: 'Present Simple Tense',
    title: 'Present Simple: Kebiasaan & Fakta Ilmiah',
    proficiencyLevel: 'A1',
    category: 'Tenses',
    explanation: 'Digunakan untuk menyatakan kebiasaan sehari-hari, jadwal rutin, dan fakta kebenaran umum.',
    patternFormula: 'Subject + Verb 1 (-s/-es untuk He/She/It) + Object',
    tenseCategory: 'Present',
    examples: [
      {
        original: 'She studies English every morning at 7 AM.',
        translation: 'Dia belajar bahasa Inggris setiap pagi pukul 7.',
      },
      {
        original: 'Water boils at 100 degrees Celsius.',
        translation: 'Air mendidih pada suhu 100 derajat Celsius.',
      },
    ],
    commonMistakes: [
      {
        incorrect: 'She study English every day.',
        correct: 'She studies English every day.',
        explanation: 'Subjek tunggal orang ketiga (He/She/It) wajib menambahkan akhiran -s atau -es pada kata kerja dasar.',
      },
      {
        incorrect: 'He don\'t know the answer.',
        correct: 'He doesn\'t know the answer.',
        explanation: 'Kalimat negatif untuk subjek He/She/It menggunakan auxiliary "does not (doesn\'t)", bukan "don\'t".',
      },
    ],
  },

  // ── Past Simple (A2) ─────────────────────────────────────────────────────
  {
    id: 'en_gram_past_simple',
    languageId: 'en',
    name: 'Past Simple Tense',
    title: 'Past Simple: Peristiwa Masa Lalu yang Selesai',
    proficiencyLevel: 'A2',
    category: 'Tenses',
    explanation: 'Digunakan untuk menceritakan kejadian yang dimulai dan telah tuntas di masa lampau pada waktu spesifik.',
    patternFormula: 'Subject + Verb 2 (Past Form) + Object / Time Signal (yesterday, last week, ago)',
    tenseCategory: 'Past',
    examples: [
      {
        original: 'We visited the national museum last weekend.',
        translation: 'Kami mengunjungi museum nasional akhir pekan lalu.',
      },
      {
        original: 'He went to school by bicycle yesterday.',
        translation: 'Dia pergi ke sekolah naik sepeda kemarin.',
      },
    ],
    commonMistakes: [
      {
        incorrect: 'Did you went to the library yesterday?',
        correct: 'Did you go to the library yesterday?',
        explanation: 'Setelah auxiliary "did" pada kalimat tanya atau negatif, kata kerja utama harus kembali ke bentuk dasar (Verb 1).',
      },
    ],
  },

  // ── Conditionals Type 2 (B1) ─────────────────────────────────────────────
  {
    id: 'en_gram_conditionals_type2',
    languageId: 'en',
    name: 'Second Conditional (Hypothetical / Unreal Present)',
    title: 'Second Conditional: Situasi Pengandaian & Khayalan',
    proficiencyLevel: 'B1',
    category: 'Conditionals',
    explanation: 'Digunakan untuk menyatakan situasi yang tidak nyata atau berlawanan dengan fakta saat ini (pengandaian).',
    patternFormula: 'If + Subject + Past Simple (were/Verb 2), Subject + would + Verb 1',
    examples: [
      {
        original: 'If I had more free time, I would travel around Indonesia.',
        translation: 'Jika saya punya lebih banyak waktu luang, saya akan bepergian keliling Indonesia.',
      },
      {
        original: 'If she were the president, she would improve education funding.',
        translation: 'Jika dia adalah presiden, dia akan meningkatkan anggaran pendidikan.',
      },
    ],
    commonMistakes: [
      {
        incorrect: 'If I will win the lottery, I would buy a house.',
        correct: 'If I won the lottery, I would buy a house.',
        explanation: 'Klausa "If" pada Second Conditional menggunakan Past Simple (won), bukan "will" atau "would".',
      },
    ],
  },

  // ── Passive Voice (B2) ───────────────────────────────────────────────────
  {
    id: 'en_gram_passive_voice',
    languageId: 'en',
    name: 'Passive Voice in Academic Texts',
    title: 'Passive Voice: Kalimat Pasif Formal & Akademis',
    proficiencyLevel: 'B2',
    category: 'Voice & Structure',
    explanation: 'Digunakan ketika tindakan atau objek yang dikenai perbuatan lebih penting daripada pelakunya.',
    patternFormula: 'Subject (Receiver) + To Be (disesuaikan tense) + Verb 3 (Past Participle) (+ by Agent)',
    examples: [
      {
        original: 'The research report was published by the science department.',
        translation: 'Laporan penelitian itu diterbitkan oleh departemen sains.',
      },
      {
        original: 'New solutions are being developed to combat climate change.',
        translation: 'Solusi-solusi baru sedang dikembangkan untuk memerangi perubahan iklim.',
      },
    ],
    commonMistakes: [
      {
        incorrect: 'The letter was wrote by John yesterday.',
        correct: 'The letter was written by John yesterday.',
        explanation: 'Bentuk kata kerja pasif selalu memerlukan Past Participle (Verb 3: written), bukan Verb 2 (wrote).',
      },
    ],
  },
];
