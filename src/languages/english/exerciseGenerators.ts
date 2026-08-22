// Specialized English Exercise Dataset & Generators
// Supports multiple choice, fill in the blank, error correction, and sentence transformations

import { UniversalExercise } from '../core/types';

export const ENGLISH_EXERCISES_DATA: UniversalExercise[] = [
  // ── Present Simple (A1) ──────────────────────────────────────────────────
  {
    id: 'en_ex_01_present_simple',
    languageId: 'en',
    skillType: 'GRAMMAR',
    exerciseType: 'FILL_IN_BLANK',
    proficiencyLevel: 'A1',
    topic: 'Daily Routines',
    instruction: 'Pilih bentuk kata kerja yang tepat untuk melengkapi kalimat berikut:',
    prompt: 'My brother _____ (study) at the university every morning.',
    options: ['study', 'studies', 'studying', 'is study'],
    correctAnswer: 'studies',
    distractors: ['study', 'studying', 'is study'],
    explanation: 'Subjek "My brother" adalah orang ketiga tunggal (He), sehingga kata kerja "study" berakhiran konsonan+y berubah menjadi "studies".',
    hint: 'Perhatikan bahwa subjeknya adalah He (tunggal).',
  },

  // ── Past Simple (A2) ─────────────────────────────────────────────────────
  {
    id: 'en_ex_02_past_simple',
    languageId: 'en',
    skillType: 'GRAMMAR',
    exerciseType: 'ERROR_CORRECTION',
    proficiencyLevel: 'A2',
    topic: 'Past Events',
    instruction: 'Temukan bagian kalimat yang salah tata bahasanya:',
    prompt: 'Did you went to the science museum with Sarah yesterday?',
    options: ['Did you', 'went', 'with Sarah', 'yesterday'],
    correctAnswer: 'went',
    distractors: ['Did you', 'with Sarah', 'yesterday'],
    explanation: 'Setelah kata bantu tanya lampau "Did", kata kerja harus kembali ke bentuk dasar "go" (Did you go...).',
    hint: 'Ingat aturan kata kerja setelah auxiliary "Did".',
  },

  // ── Conditionals Type 2 (B1) ─────────────────────────────────────────────
  {
    id: 'en_ex_03_conditionals',
    languageId: 'en',
    skillType: 'GRAMMAR',
    exerciseType: 'GRAMMAR',
    proficiencyLevel: 'B1',
    topic: 'Hypothetical Situations',
    instruction: 'Lengkapi kalimat pengandaian (Second Conditional) berikut:',
    prompt: 'If I _____ (have) more free time, I would learn three foreign languages.',
    options: ['have', 'had', 'will have', 'would have'],
    correctAnswer: 'had',
    distractors: ['have', 'will have', 'would have'],
    explanation: 'Pada Second Conditional (klausa If), kita menggunakan Past Simple (had) untuk menyatakan situasi hipotetis saat ini.',
    hint: 'Formula Second Conditional: If + S + Past Simple (V2), S + would + V1.',
  },

  // ── Vocabulary in Context (B2) ───────────────────────────────────────────
  {
    id: 'en_ex_04_vocab_collocation',
    languageId: 'en',
    skillType: 'COLLOCATIONS',
    exerciseType: 'VOCABULARY',
    proficiencyLevel: 'B2',
    topic: 'Academic & Analysis',
    instruction: 'Pilih kata yang membentuk kolokasi alami dengan kata benda di bawah ini:',
    prompt: 'The research team achieved a _____ improvement in memory retention after using FSRS.',
    options: ['significant', 'ancient', 'courageous', 'furthermore'],
    correctAnswer: 'significant',
    distractors: ['ancient', 'courageous', 'furthermore'],
    explanation: '"Significant improvement" adalah pasangan kata (collocation) standar yang bermakna "peningkatan yang nyata/signifikan".',
    hint: 'Cari kata sifat yang bermakna penting atau besar dampaknya.',
  },

  // ── Reading Comprehension (B1) ───────────────────────────────────────────
  {
    id: 'en_ex_05_reading',
    languageId: 'en',
    skillType: 'READING',
    exerciseType: 'COMPREHENSION',
    proficiencyLevel: 'B1',
    topic: 'Learning Science',
    instruction: 'Bacalah teks singkat berikut dan jawab pertanyaannya:',
    contextSentence: 'Spaced repetition is an evidence-based learning technique that incorporates increasing intervals of time between subsequent review of previously learned material in order to exploit the psychological spacing effect.',
    prompt: 'What is the primary benefit of spaced repetition according to the text?',
    options: [
      'It exploits the spacing effect to strengthen long-term memory',
      'It allows students to skip review sessions entirely',
      'It replaces the need for school teachers',
      'It only works for mathematics'
    ],
    correctAnswer: 'It exploits the spacing effect to strengthen long-term memory',
    distractors: [
      'It allows students to skip review sessions entirely',
      'It replaces the need for school teachers',
      'It only works for mathematics'
    ],
    explanation: 'Teks menyatakan bahwa teknik ini memanfaatkan "spacing effect" untuk mengoptimalkan interval pengulangan materi.',
    hint: 'Perhatikan kalimat "to exploit the psychological spacing effect".',
  },
];
