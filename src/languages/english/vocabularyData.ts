// Comprehensive English Vocabulary Dataset aligned with CEFR (Pre-A1 to B2+)
// Includes IPA, Collocations, Phrasal Verbs, Definitions, Example Sentences, and Common Mistakes

import { VocabularyItem } from '../core/types';

export const ENGLISH_VOCABULARY_DATA: VocabularyItem[] = [
  // ── A1 Level ─────────────────────────────────────────────────────────────
  {
    id: 'en_vocab_accomplish',
    languageId: 'en',
    word: 'accomplish',
    normalizedForm: 'accomplish',
    translation: 'mencapai / menyelesaikan dengan berhasil',
    definition: 'to succeed in doing something good after putting effort into it',
    partOfSpeech: 'verb',
    proficiencyLevel: 'B1',
    topic: 'Achievement & Education',
    frequencyRank: 1850,
    ipa: '/əˈkʌm.plɪʃ/',
    collocations: ['accomplish a goal', 'accomplish a mission', 'accomplish a feat'],
    irregularForms: ['accomplishes', 'accomplished', 'accomplishing'],
    exampleSentences: [
      {
        original: 'If we work together, we can accomplish our study goals easily.',
        translation: 'Jika kita bekerja sama, kita dapat mencapai tujuan belajar kita dengan mudah.',
      },
      {
        original: 'She felt proud to accomplish the entire course in two weeks.',
        translation: 'Dia merasa bangga menyelesaikan seluruh modul dalam dua minggu.',
      },
    ],
    commonMistakes: [
      'Salah: "accomplish to do something" -> Benar: "accomplish something / succeed in doing something".',
    ],
  },
  {
    id: 'en_vocab_ancient',
    languageId: 'en',
    word: 'ancient',
    normalizedForm: 'ancient',
    translation: 'kuno / purba',
    definition: 'belonging to the very distant past and no longer in existence',
    partOfSpeech: 'adjective',
    proficiencyLevel: 'A2',
    topic: 'History & Culture',
    frequencyRank: 1200,
    ipa: '/ˈeɪn.ʃənt/',
    collocations: ['ancient civilization', 'ancient monument', 'ancient history'],
    exampleSentences: [
      {
        original: 'The ancient temple was built over a thousand years ago.',
        translation: 'Candi kuno itu dibangun lebih dari seribu tahun yang lalu.',
      },
    ],
  },
  {
    id: 'en_vocab_courageous',
    languageId: 'en',
    word: 'courageous',
    normalizedForm: 'courageous',
    translation: 'berani / gagah berani',
    definition: 'having or showing courage; brave and determined',
    partOfSpeech: 'adjective',
    proficiencyLevel: 'B1',
    topic: 'Character & Personality',
    ipa: '/kəˈreɪ.dʒəs/',
    collocations: ['courageous decision', 'courageous act', 'courageous hero'],
    relatedWords: ['brave', 'fearless', 'heroic'],
    exampleSentences: [
      {
        original: 'It was a courageous decision to speak the truth.',
        translation: 'Itu adalah keputusan yang berani untuk mengatakan kebenaran.',
      },
    ],
  },
  {
    id: 'en_vocab_consequence',
    languageId: 'en',
    word: 'consequence',
    normalizedForm: 'consequence',
    translation: 'konsekuensi / akibat logis',
    definition: 'a result or effect of an action or condition',
    partOfSpeech: 'noun',
    proficiencyLevel: 'B2',
    topic: 'Science & Society',
    ipa: '/ˈkɒn.sɪ.kwəns/',
    collocations: ['dire consequences', 'as a consequence of', 'face the consequences'],
    exampleSentences: [
      {
        original: 'Global warming has serious consequences for agriculture.',
        translation: 'Pemanasan global memiliki konsekuensi serius bagi pertanian.',
      },
    ],
  },
  {
    id: 'en_vocab_significant',
    languageId: 'en',
    word: 'significant',
    normalizedForm: 'significant',
    translation: 'signifikan / penting / berarti',
    definition: 'sufficiently great or important to be worthy of attention; noteworthy',
    partOfSpeech: 'adjective',
    proficiencyLevel: 'B2',
    topic: 'Academic & Analysis',
    ipa: '/sɪɡˈnɪf.ɪ.kənt/',
    collocations: ['significant improvement', 'significant impact', 'significant difference'],
    exampleSentences: [
      {
        original: 'There has been a significant increase in student test scores.',
        translation: 'Terdapat peningkatan yang signifikan pada nilai ujian siswa.',
      },
    ],
  },
  {
    id: 'en_vocab_furthermore',
    languageId: 'en',
    word: 'furthermore',
    normalizedForm: 'furthermore',
    translation: 'selain itu / terlebih lagi',
    definition: 'in addition; moreover; used to introduce a fresh point in an argument',
    partOfSpeech: 'adverb',
    proficiencyLevel: 'B2',
    topic: 'Discourse Markers & Essay',
    ipa: '/ˌfɜː.ðəˈmɔːr/',
    exampleSentences: [
      {
        original: 'The project is too expensive; furthermore, we lack the necessary time.',
        translation: 'Proyek ini terlalu mahal; selain itu, kita kekurangan waktu yang dibutuhkan.',
      },
    ],
  },
  {
    id: 'en_vocab_perseverance',
    languageId: 'en',
    word: 'perseverance',
    normalizedForm: 'perseverance',
    translation: 'kegigihan / ketekunan pantang menyerah',
    definition: 'persistence in doing something despite difficulty or delay in achieving success',
    partOfSpeech: 'noun',
    proficiencyLevel: 'B2',
    topic: 'Mindset & Learning',
    ipa: '/ˌpɜː.sɪˈvɪə.rəns/',
    collocations: ['through sheer perseverance', 'show perseverance', 'test of perseverance'],
    exampleSentences: [
      {
        original: 'Mastering a foreign language requires daily practice and perseverance.',
        translation: 'Menguasai bahasa asing membutuhkan latihan harian dan ketekunan pantang menyerah.',
      },
    ],
  },
];
