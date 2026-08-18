// IndexedDB Database with Dexie for PAHAM
// Local-First storage for materials, concepts, FSRS cards, study history, questions, and exams

import Dexie, { Table } from 'dexie';
import {
  UserProfile,
  Subject,
  Chapter,
  Material,
  Concept,
  StudentConceptState,
  Question,
  Exam,
  ExamAttempt,
  MistakeRecord,
  LearningEvent,
  DailyStudyPlan
} from './types';

export class PahamDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  materials!: Table<Material, string>;
  concepts!: Table<Concept, string>;
  studentConceptStates!: Table<StudentConceptState, string>;
  questions!: Table<Question, string>;
  exams!: Table<Exam, string>;
  examAttempts!: Table<ExamAttempt, string>;
  mistakeRecords!: Table<MistakeRecord, string>;
  learningEvents!: Table<LearningEvent, string>;
  studyPlans!: Table<DailyStudyPlan, string>;

  constructor() {
    super('PahamDB');
    this.version(1).stores({
      profiles: 'id',
      subjects: 'id, name, code',
      chapters: 'id, subjectId, number',
      materials: 'id, subjectId, chapterId, sourceType, dateAdded',
      concepts: 'id, subjectId, chapterId, title',
      studentConceptStates: 'conceptId, masteryScore, priorityScore',
      questions: 'id, subjectId, chapterId, conceptId, questionType, qualityStatus',
      exams: 'id, subjectId, examDate',
      examAttempts: 'id, examId, subjectId, submittedAt',
      mistakeRecords: 'id, conceptId, subjectId, isResolved, dateOccurred',
      learningEvents: 'id, timestamp, eventType, subjectId, conceptId',
      studyPlans: 'date',
    });
  }
}

export const db = new PahamDatabase();

// 16+ Standard Indonesian Curriculum Subjects
export const DEFAULT_INDONESIAN_SUBJECTS: Subject[] = [
  {
    id: 'sub-bind',
    name: 'Bahasa Indonesia',
    code: 'BIN',
    color: '#2D5A43',
    iconName: 'BookOpen',
    description: 'Membaca kritis, struktur teks fiksi & nonfiksi, kebahasaan.',
  },
  {
    id: 'sub-mat',
    name: 'Matematika',
    code: 'MAT',
    color: '#B94726',
    iconName: 'Calculator',
    description: 'Aljabar, persamaan linear, geometri, trigonometri, kalkulus.',
  },
  {
    id: 'sub-ipa',
    name: 'IPA (Ilmu Pengetahuan Alam)',
    code: 'IPA',
    color: '#3A7D5C',
    iconName: 'Microscope',
    description: 'Sistem organisasi kehidupan, ekosistem, zat, dan energi.',
  },
  {
    id: 'sub-fisika',
    name: 'Fisika',
    code: 'FIS',
    color: '#1E4532',
    iconName: 'Zap',
    description: 'Kinematika, dinamika, termodinamika, gelombang, optika, listrik.',
  },
  {
    id: 'sub-kimia',
    name: 'Kimia',
    code: 'KIM',
    color: '#8F5313',
    iconName: 'FlaskConical',
    description: 'Struktur atom, ikatan kimia, stoikiometri, asam-basa, larutan.',
  },
  {
    id: 'sub-biologi',
    name: 'Biologi',
    code: 'BIO',
    color: '#26533C',
    iconName: 'Dna',
    description: 'Sel, metabolisme, genetika, evolusi, bioteknologi, ekologi.',
  },
  {
    id: 'sub-bing',
    name: 'Bahasa Inggris',
    code: 'ENG',
    color: '#B26A1A',
    iconName: 'Globe',
    description: 'Reading comprehension, descriptive text, tenses, vocabulary.',
  },
  {
    id: 'sub-ips',
    name: 'IPS (Ilmu Pengetahuan Sosial)',
    code: 'IPS',
    color: '#757067',
    iconName: 'Compass',
    description: 'Interaksi keruangan, sejarah Nusantara, aktivitas ekonomi.',
  },
  {
    id: 'sub-sejarah',
    name: 'Sejarah Indonesia',
    code: 'SEJ',
    color: '#94331A',
    iconName: 'Hourglass',
    description: 'Peradaban kuno, kerajaan Hindu-Buddha-Islam, kemerdekaan RI.',
  },
  {
    id: 'sub-geografi',
    name: 'Geografi',
    code: 'GEO',
    color: '#4B9670',
    iconName: 'Map',
    description: 'Litosfer, hidrosfer, atmosfer, penginderaan jauh, kependudukan.',
  },
  {
    id: 'sub-ekonomi',
    name: 'Ekonomi',
    code: 'EKO',
    color: '#6E400E',
    iconName: 'TrendingUp',
    description: 'Permintaan & penawaran, uang & perbankan, akuntansi, pasar.',
  },
  {
    id: 'sub-sosiologi',
    name: 'Sosiologi',
    code: 'SOS',
    color: '#5C564F',
    iconName: 'Users',
    description: 'Interaksi sosial, struktur sosial, konflik, integrasi, perubahan.',
  },
  {
    id: 'sub-ppkn',
    name: 'Pendidikan Pancasila (PPKn)',
    code: 'PKN',
    color: '#B94726',
    iconName: 'Shield',
    description: 'Nilai-nilai Pancasila, UUD 1945, norma hukum, NKRI, HAM.',
  },
  {
    id: 'sub-infor',
    name: 'Informatika',
    code: 'INF',
    color: '#173626',
    iconName: 'Cpu',
    description: 'Berpikir komputasional, algoritma, pemrograman, jaringan.',
  },
  {
    id: 'sub-agama',
    name: 'Pendidikan Agama & Budi Pekerti',
    code: 'AGM',
    color: '#2D5A43',
    iconName: 'Heart',
    description: 'Akidah, akhlak, fikih, sejarah peradaban, toleransi beragama.',
  },
  {
    id: 'sub-seni',
    name: 'Seni Budaya',
    code: 'SNB',
    color: '#D45D3B',
    iconName: 'Palette',
    description: 'Seni rupa, seni musik, seni tari, apresiasi karya seni Nusantara.',
  },
  {
    id: 'sub-pjok',
    name: 'PJOK (Penjasorkes)',
    code: 'PJK',
    color: '#3A7D5C',
    iconName: 'Activity',
    description: 'Permainan bola, atletik, kebugaran jasmani, kesehatan remaja.',
  },
];

// Seed initial authentic Indonesian curriculum data
export async function initializeDatabaseSeed() {
  const profileCount = await db.profiles.count();
  if (profileCount > 0) {
    // Ensure all 16 subjects exist in DB
    for (const sub of DEFAULT_INDONESIAN_SUBJECTS) {
      const existing = await db.subjects.get(sub.id);
      if (!existing) {
        await db.subjects.add(sub);
      }
    }
    return;
  }

  console.log('Seeding initial authentic PAHAM data with 16+ Indonesian subjects...');

  // 1. Profile
  const defaultProfile: UserProfile = {
    id: 'user-default',
    name: 'Satria Pratama',
    grade: 'Kelas 7',
    semester: 'Semester 1',
    schoolName: 'SMP Negeri 1',
    dailyTimeTargetMinutes: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.profiles.add(defaultProfile);

  // 2. Subjects (17 Subjects)
  await db.subjects.bulkAdd(DEFAULT_INDONESIAN_SUBJECTS);

  // 3. Chapters
  const initialChapters: Chapter[] = [
    {
      id: 'chap-bind-5',
      subjectId: 'sub-bind',
      number: 5,
      title: 'Bab 5 — Menyelami Teks Cerita Fiksi & Unsur Intrinsik',
      description: 'Membedakan tokoh, penokohan, alur, latar, sudut pandang, dan amanat.',
      examRelevance: 'high',
    },
    {
      id: 'chap-bind-4',
      subjectId: 'sub-bind',
      number: 4,
      title: 'Bab 4 — Menyibak Fakta dalam Teks Berita',
      description: 'Unsur 5W+1H, membedakan gagasan utama dan kalimat penjelas.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-mat-3',
      subjectId: 'sub-mat',
      number: 3,
      title: 'Bab 3 — Persamaan Linear Satu Variabel (PLSV)',
      description: 'Konsep kesetaraan, koefisien, konstanta, dan pemodelan masalah.',
      examRelevance: 'high',
    },
    {
      id: 'chap-ipa-4',
      subjectId: 'sub-ipa',
      number: 4,
      title: 'Bab 4 — Interaksi Makhluk Hidup & Ekosistem',
      description: 'Rantai makanan, jaring-jaring makanan, dan simbiosis.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-fisika-1',
      subjectId: 'sub-fisika',
      number: 1,
      title: 'Bab 1 — Besaran, Satuan, dan Pengukuran',
      description: 'Besaran pokok vs turunan, jangka sorong, dan mikrometer sekrup.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-kimia-1',
      subjectId: 'sub-kimia',
      number: 1,
      title: 'Bab 1 — Struktur Atom & Tabel Periodik Unsur',
      description: 'Proton, elektron, neutron, nomor massa, dan konfigurasi elektron.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-biologi-1',
      subjectId: 'sub-biologi',
      number: 1,
      title: 'Bab 1 — Organisasi Kehidupan & Sel',
      description: 'Perbedaan sel tumbuhan dan sel hewan, jaringan, dan organ.',
      examRelevance: 'high',
    },
    {
      id: 'chap-bing-2',
      subjectId: 'sub-bing',
      number: 2,
      title: 'Bab 2 — Describing People and Animals',
      description: 'Adjectives, simple present tense, and descriptive structure.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-sej-2',
      subjectId: 'sub-sejarah',
      number: 2,
      title: 'Bab 2 — Kerajaan Maritim Hindu-Buddha di Nusantara',
      description: 'Sriwijaya, Majapahit, Kutai, dan jalur sutra maritim.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-ppkn-2',
      subjectId: 'sub-ppkn',
      number: 2,
      title: 'Bab 2 — Norma dan Keadilan dalam Masyarakat',
      description: 'Norma agama, kesusilaan, kesopanan, dan hukum.',
      examRelevance: 'medium',
    },
    {
      id: 'chap-infor-1',
      subjectId: 'sub-infor',
      number: 1,
      title: 'Bab 1 — Berpikir Komputasional & Dekomposisi',
      description: 'Abstraksi, pola, dekomposisi masalah, dan algoritma dasar.',
      examRelevance: 'low',
    },
  ];
  await db.chapters.bulkAdd(initialChapters);

  // 4. Materials with preview pages
  const initialMaterials: Material[] = [
    {
      id: 'mat-bind-5-1',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      title: 'Catatan Guru: Unsur Intrinsik & Karakter Tokoh',
      sourceType: 'catatan_guru',
      dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      pageCount: 3,
      hasHandwriting: true,
      isVerified: true,
      blocks: [
        {
          id: 'blk-1',
          materialId: 'mat-bind-5-1',
          pageNumber: 1,
          blockType: 'heading',
          text: 'BAB V: UNSUR-UNSUR INTRINSIK CERITA FIKSI',
          confidence: 0.98,
          isHandwritten: false,
          verificationState: 'AUTO_ACCEPTED',
          extractedConcepts: ['Tokoh', 'Penokohan', 'Alur', 'Latar', 'Amanat'],
        },
        {
          id: 'blk-2',
          materialId: 'mat-bind-5-1',
          pageNumber: 1,
          blockType: 'paragraph',
          text: 'Tokoh adalah pelaku atau individu yang mengalami peristiwa dalam cerita. Tokoh terbagi menjadi protagonis, antagonis, dan tritagonis.',
          confidence: 0.95,
          isHandwritten: false,
          verificationState: 'AUTO_ACCEPTED',
          extractedConcepts: ['Tokoh'],
        },
        {
          id: 'blk-3',
          materialId: 'mat-bind-5-1',
          pageNumber: 2,
          blockType: 'handwritten_note',
          text: 'Penting! Penokohan BUKAN sekadar nama orang. Penokohan adalah cara pengarang menampilkan watak/sifat tokoh (misal: sombong, dermawan). Metode ada 2: Analitik (langsung disebutkan) & Dramatik (lewat dialog, tindakan, reaksi tokoh lain).',
          confidence: 0.88,
          isHandwritten: true,
          verificationState: 'AI_VERIFIED',
          extractedConcepts: ['Penokohan'],
        },
        {
          id: 'blk-4',
          materialId: 'mat-bind-5-1',
          pageNumber: 3,
          blockType: 'handwritten_note',
          text: 'Alur (Plot) adalah jalinan peristiwa bersebab. Jenis alur: Maju (kronologis), Mundur (flashback), dan Campuran.',
          confidence: 0.91,
          isHandwritten: true,
          verificationState: 'USER_VERIFIED',
          extractedConcepts: ['Alur'],
        },
      ],
    },
    {
      id: 'mat-mat-3-1',
      subjectId: 'sub-mat',
      chapterId: 'chap-mat-3',
      title: 'Lembar Kerja Siswa: Persamaan Linear Satu Variabel',
      sourceType: 'lembar_kerja',
      dateAdded: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      pageCount: 2,
      hasHandwriting: false,
      isVerified: true,
      blocks: [
        {
          id: 'blk-mat-1',
          materialId: 'mat-mat-3-1',
          pageNumber: 1,
          blockType: 'paragraph',
          text: 'Bentuk umum PLSV adalah ax + b = c dengan a ≠ 0, di mana x adalah variabel berderajat 1, a adalah koefisien, b dan c adalah konstanta.',
          confidence: 0.99,
          isHandwritten: false,
          verificationState: 'AUTO_ACCEPTED',
          extractedConcepts: ['Persamaan Linear Satu Variabel', 'Koefisien & Konstanta'],
        },
      ],
    },
    {
      id: 'mat-ipa-4-1',
      subjectId: 'sub-ipa',
      chapterId: 'chap-ipa-4',
      title: 'Fotokopi Diktat: Jaring Makanan & Interaksi Ekosistem',
      sourceType: 'fotokopi',
      dateAdded: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      pageCount: 2,
      hasHandwriting: false,
      isVerified: true,
      blocks: [
        {
          id: 'blk-ipa-1',
          materialId: 'mat-ipa-4-1',
          pageNumber: 1,
          blockType: 'paragraph',
          text: 'Rantai makanan adalah peristiwa makan dan dimakan dengan urutan tertentu. Produsen (tumbuhan hijau) menghasilkan makanan melalui fotosintesis.',
          confidence: 0.97,
          isHandwritten: false,
          verificationState: 'AUTO_ACCEPTED',
          extractedConcepts: ['Produsen & Konsumen'],
        },
      ],
    },
  ];
  await db.materials.bulkAdd(initialMaterials);

  // 5. Concepts
  const initialConcepts: Concept[] = [
    {
      id: 'c-penokohan',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      title: 'Penokohan (Karakterisasi)',
      definition: 'Cara pengarang menggambarkan dan mengembangkan watak atau sifat karakter dalam cerita melalui metode analitik (langsung) atau dramatik (perilaku, dialog, reaksi).',
      example: 'Dalam cerita "Si Pitung", sifat dermawan Pitung digambarkan dramatik saat ia membagikan hasil rampasan kepada warga miskin.',
      keyPoints: [
        'Beda dengan tokoh: Tokoh = pelaku (siapa), Penokohan = sifat/watak (bagaimana).',
        'Metode Analitik: Pengarang langsung menyebutkan sifat tokoh.',
        'Metode Dramatik: Watak diketahui lewat tindakan, dialog, atau tanggapan tokoh lain.',
      ],
      relationships: [
        { id: 'rel-1', targetConceptId: 'c-tokoh', relationshipType: 'RELATED_TO', notes: 'Sering tertukar' },
        { id: 'rel-2', targetConceptId: 'c-alur', relationshipType: 'PART_OF', notes: 'Unsur intrinsik' },
      ],
      sources: [
        {
          materialId: 'mat-bind-5-1',
          materialTitle: 'Catatan Guru: Unsur Intrinsik & Karakter Tokoh',
          sourceType: 'catatan_guru',
          pageNumber: 2,
          lineNumber: 4,
          snippet: 'Penokohan adalah cara pengarang menampilkan watak/sifat tokoh (misal: sombong, dermawan).',
        },
      ],
      difficultyLevel: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c-tokoh',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      title: 'Tokoh Cerita',
      definition: 'Pelaku atau entitas yang mengemban peristiwa dalam cerita fiksi (protagonis, antagonis, atau tritagonis).',
      example: 'Malin Kundang dan Ibunya adalah tokoh utama dalam cerita rakyat Malin Kundang.',
      keyPoints: [
        'Protagonis: Tokoh utama yang membawakan nilai positif.',
        'Antagonis: Tokoh penentang tokoh utama.',
        'Tritagonis: Tokoh penengah atau pendukung.',
      ],
      relationships: [
        { id: 'rel-3', targetConceptId: 'c-penokohan', relationshipType: 'CONTRASTS_WITH' },
      ],
      sources: [
        {
          materialId: 'mat-bind-5-1',
          materialTitle: 'Catatan Guru: Unsur Intrinsik & Karakter Tokoh',
          sourceType: 'catatan_guru',
          pageNumber: 1,
          lineNumber: 2,
          snippet: 'Tokoh adalah pelaku atau individu yang mengalami peristiwa dalam cerita.',
        },
      ],
      difficultyLevel: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c-alur',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      title: 'Alur (Plot)',
      definition: 'Rangkaian jalinan peristiwa yang memiliki hubungan sebab-akibat (kausalitas) dalam suatu karya fiksi.',
      example: 'Cerita dimulai dari perkenalan, timbul konflik, klimaks masalah, peleraian, hingga penyelesaian (Alur Maju).',
      keyPoints: [
        'Alur Maju: Runtun dari masa kini ke masa depan.',
        'Alur Mundur (Flashback): Menceritakan kembali masa lalu.',
        'Alur Campuran: Menggabungkan masa lalu dan masa kini.',
      ],
      relationships: [],
      sources: [
        {
          materialId: 'mat-bind-5-1',
          materialTitle: 'Catatan Guru: Unsur Intrinsik & Karakter Tokoh',
          sourceType: 'catatan_guru',
          pageNumber: 3,
          lineNumber: 1,
          snippet: 'Alur (Plot) adalah jalinan peristiwa bersebab.',
        },
      ],
      difficultyLevel: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c-gagasan-utama',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-4',
      title: 'Gagasan Utama (Ide Pokok)',
      definition: 'Pernyataan yang menjadi inti permasalahan atau topik yang dibahas dalam keseluruhan paragraf.',
      example: 'Gagasan utama sering tercantum dalam kalimat utama (di awal: deduktif, di akhir: induktif, atau campuran).',
      keyPoints: [
        'Satu paragraf idealnya hanya memiliki satu gagasan utama.',
        'Didukung oleh kalimat-kalimat penjelas.',
      ],
      relationships: [],
      sources: [],
      difficultyLevel: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c-plsv',
      subjectId: 'sub-mat',
      chapterId: 'chap-mat-3',
      title: 'Persamaan Linear Satu Variabel (PLSV)',
      definition: 'Kalimat matematika terbuka yang dihubungkan dengan tanda sama dengan (=) dan hanya memuat satu variabel dengan pangkat tertinggi satu.',
      example: '2x + 6 = 14  -->  2x = 8  -->  x = 4',
      keyPoints: [
        'Menggunakan sifat kesetaraan (kedua ruas ditambah/dikurang/dikali/dibagi bilangan sama).',
        'Solusi PLSV adalah nilai variabel yang membuat kalimat bernilai benar.',
      ],
      relationships: [],
      sources: [
        {
          materialId: 'mat-mat-3-1',
          materialTitle: 'Lembar Kerja Siswa: Persamaan Linear Satu Variabel',
          sourceType: 'lembar_kerja',
          pageNumber: 1,
          snippet: 'Bentuk umum PLSV adalah ax + b = c dengan a ≠ 0.',
        }
      ],
      difficultyLevel: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c-rantai-makanan',
      subjectId: 'sub-ipa',
      chapterId: 'chap-ipa-4',
      title: 'Rantai Makanan & Tingkat Trofik',
      definition: 'Jalur perpindahan energi makanan dari organisme produsen melalui serangkaian organisme pemangsa dalam suatu ekosistem.',
      example: 'Rumput (Produsen) -> Belalang (Konsumen I) -> Katak (Konsumen II) -> Ular (Konsumen III) -> Pengurai.',
      keyPoints: [
        'Produsen selalu menempati tingkat trofik I.',
        'Konsumen puncak tidak dimangsa hewan lain saat masih hidup.',
      ],
      relationships: [],
      sources: [
        {
          materialId: 'mat-ipa-4-1',
          materialTitle: 'Fotokopi Diktat: Jaring Makanan & Interaksi Ekosistem',
          sourceType: 'fotokopi',
          pageNumber: 1,
          snippet: 'Rantai makanan adalah peristiwa makan dan dimakan dengan urutan tertentu.',
        }
      ],
      difficultyLevel: 2,
      createdAt: new Date().toISOString(),
    },
  ];
  await db.concepts.bulkAdd(initialConcepts);

  // 6. Student Concept States
  const now = new Date();
  const initialStudentStates: StudentConceptState[] = [
    {
      conceptId: 'c-penokohan',
      masteryScore: 0.63,
      fsrs: {
        conceptId: 'c-penokohan',
        due: now.toISOString(),
        stability: 2.1,
        difficulty: 6.2,
        elapsed_days: 2,
        scheduled_days: 2,
        reps: 4,
        lapses: 2,
        state: 3,
        last_review: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 5,
      recentCorrectCount: 3,
      commonMistakes: [
        'Tertukar antara tokoh (pelaku fisik) dan penokohan (karakterisasi/sifat)',
        'Sulit membedakan metode analitik dan dramatik'
      ],
      lastStudied: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 92,
      recommendedMode: 'practice',
    },
    {
      conceptId: 'c-tokoh',
      masteryScore: 0.88,
      fsrs: {
        conceptId: 'c-tokoh',
        due: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        stability: 14.5,
        difficulty: 2.8,
        elapsed_days: 3,
        scheduled_days: 10,
        reps: 6,
        lapses: 0,
        state: 2,
        last_review: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 5,
      recentCorrectCount: 5,
      commonMistakes: [],
      lastStudied: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 25,
      recommendedMode: 'recall',
    },
    {
      conceptId: 'c-alur',
      masteryScore: 0.80,
      fsrs: {
        conceptId: 'c-alur',
        due: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        stability: 8.2,
        difficulty: 4.1,
        elapsed_days: 1,
        scheduled_days: 5,
        reps: 3,
        lapses: 0,
        state: 2,
        last_review: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 4,
      recentCorrectCount: 3,
      commonMistakes: [],
      lastStudied: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 40,
      recommendedMode: 'review',
    },
    {
      conceptId: 'c-gagasan-utama',
      masteryScore: 0.55,
      fsrs: {
        conceptId: 'c-gagasan-utama',
        due: now.toISOString(),
        stability: 1.8,
        difficulty: 6.8,
        elapsed_days: 3,
        scheduled_days: 1,
        reps: 2,
        lapses: 1,
        state: 1,
        last_review: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 4,
      recentCorrectCount: 2,
      commonMistakes: ['Mengira kalimat penjelas pertama adalah gagasan utama'],
      lastStudied: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 84,
      recommendedMode: 'learn',
    },
    {
      conceptId: 'c-plsv',
      masteryScore: 0.72,
      fsrs: {
        conceptId: 'c-plsv',
        due: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        stability: 5.4,
        difficulty: 5.2,
        elapsed_days: 2,
        scheduled_days: 4,
        reps: 3,
        lapses: 1,
        state: 2,
        last_review: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 5,
      recentCorrectCount: 4,
      commonMistakes: ['Lupa mengubah tanda positif/negatif saat pindah ruas'],
      lastStudied: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 68,
      recommendedMode: 'practice',
    },
    {
      conceptId: 'c-rantai-makanan',
      masteryScore: 0.78,
      fsrs: {
        conceptId: 'c-rantai-makanan',
        due: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        stability: 9.0,
        difficulty: 3.5,
        elapsed_days: 1,
        scheduled_days: 7,
        reps: 4,
        lapses: 0,
        state: 2,
        last_review: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      recentAttemptsCount: 4,
      recentCorrectCount: 3,
      commonMistakes: [],
      lastStudied: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      priorityScore: 35,
      recommendedMode: 'recall',
    },
  ];
  await db.studentConceptStates.bulkAdd(initialStudentStates);

  // 7. Exams & Deadlines
  const examDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const examDate2 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

  const initialExams: Exam[] = [
    {
      id: 'exam-bind-1',
      subjectId: 'sub-bind',
      title: 'Ulangan Harian: Menyelami Teks Cerita Fiksi',
      examDate: examDate1,
      durationMinutes: 45,
      totalQuestions: 25,
      coveredChapterIds: ['chap-bind-5', 'chap-bind-4'],
      importance: 'high',
      readinessScore: 76,
      completedAttempts: 1,
    },
    {
      id: 'exam-mat-1',
      subjectId: 'sub-mat',
      title: 'Penilaian Harian: Persamaan Linear Satu Variabel',
      examDate: examDate2,
      durationMinutes: 60,
      totalQuestions: 20,
      coveredChapterIds: ['chap-mat-3'],
      importance: 'medium',
      readinessScore: 72,
      completedAttempts: 0,
    },
  ];
  await db.exams.bulkAdd(initialExams);

  // 8. Questions
  const initialQuestions: Question[] = [
    {
      id: 'q-penokohan-1',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      conceptId: 'c-penokohan',
      questionType: 'scenario',
      difficulty: 3,
      prompt: 'Bacalah kutipan berikut:\n"Setiap pagi sebelum fajar menyingsing, Pak Raden sudah memanggul cangkulnya menuju sawah. Tak pernah sekalipun terdengar keluhan dari bibirnya, meski punggungnya kerap terasa ngilu."\n\nMetode penokohan yang digunakan pengarang untuk menggambarkan watak Pak Raden adalah...',
      options: [
        { id: 'opt-1', text: 'Analitik langsung oleh narator', isCorrect: false },
        { id: 'opt-2', text: 'Dramatik melalui tindakan dan perilaku tokoh', isCorrect: true },
        { id: 'opt-3', text: 'Dramatik melalui percakapan dengan tokoh lain', isCorrect: false },
        { id: 'opt-4', text: 'Analitik melalui penggambaran fisik secara mendalam', isCorrect: false },
      ],
      explanation: 'Pengarang tidak langsung menulis "Pak Raden adalah orang yang rajin", melainkan memperlihatkan tindakannya bangun sebelum fajar dan pantang mengeluh. Ini adalah metode penokohan dramatik (lewat perbuatan).',
      misconceptionAlert: 'Hati-hati: Jika pengarang tidak secara tersurat menulis kata sifat (rajin/ulet), teknik tersebut adalah dramatik, bukan analitik.',
      sourceReference: 'Catatan guru — Halaman 2',
      timesAnswered: 4,
      timesCorrect: 2,
      qualityStatus: 'approved',
    },
    {
      id: 'q-penokohan-2',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      conceptId: 'c-penokohan',
      questionType: 'multiple_choice',
      difficulty: 2,
      prompt: 'Manakah pernyataan yang paling tepat membedakan antara "Tokoh" dan "Penokohan"?',
      options: [
        { id: 'opt-a', text: 'Tokoh adalah watak sifat, sedangkan penokohan adalah pemeran dalam cerita.', isCorrect: false },
        { id: 'opt-b', text: 'Tokoh adalah pelaku yang mengalami peristiwa, sedangkan penokohan adalah cara pengarang menggambarkan watak tokoh.', isCorrect: true },
        { id: 'opt-c', text: 'Tokoh hanya mencakup protagonis, sedangkan penokohan mencakup antagonis.', isCorrect: false },
        { id: 'opt-d', text: 'Tokoh dan penokohan memiliki arti yang persis sama dalam cerita fiksi.', isCorrect: false },
      ],
      explanation: 'Tokoh menjawab pertanyaan "Siapa pelakunya?", sedangkan penokohan menjawab "Bagaimana watak atau karakter pelakunya digambarkan?".',
      misconceptionAlert: 'Banyak siswa sering menganggap tokoh dan penokohan adalah istilah yang sama.',
      sourceReference: 'Catatan guru — Halaman 1 & 2',
      timesAnswered: 5,
      timesCorrect: 3,
      qualityStatus: 'approved',
    },
    {
      id: 'q-alur-1',
      subjectId: 'sub-bind',
      chapterId: 'chap-bind-5',
      conceptId: 'c-alur',
      questionType: 'multiple_choice',
      difficulty: 2,
      prompt: 'Sebuah cerita dibuka dengan adegan seorang kakek yang mengenang masa kecilnya saat zaman perang 50 tahun lalu, lalu cerita berlanjut mengisahkan perjuangannya di masa perang tersebut. Alur yang digunakan dalam cerita tersebut adalah...',
      options: [
        { id: 'a-1', text: 'Alur Maju (Kronologis)', isCorrect: false },
        { id: 'a-2', text: 'Alur Mundur (Flashback / Sorot Balik)', isCorrect: true },
        { id: 'a-3', text: 'Alur Melingkar', isCorrect: false },
        { id: 'a-4', text: 'Alur Statis', isCorrect: false },
      ],
      explanation: 'Cerita berpindah dari masa sekarang menuju kilas balik masa lampau, sehingga menggunakan alur mundur (flashback).',
      sourceReference: 'Catatan guru — Halaman 3',
      timesAnswered: 3,
      timesCorrect: 3,
      qualityStatus: 'approved',
    },
    {
      id: 'q-plsv-1',
      subjectId: 'sub-mat',
      chapterId: 'chap-mat-3',
      conceptId: 'c-plsv',
      questionType: 'multiple_choice',
      difficulty: 3,
      prompt: 'Penyelesaian dari persamaan linear 3x - 5 = 16 adalah...',
      options: [
        { id: 'p-1', text: 'x = 3', isCorrect: false },
        { id: 'p-2', text: 'x = 7', isCorrect: true },
        { id: 'p-3', text: 'x = 9', isCorrect: false },
        { id: 'p-4', text: 'x = 11', isCorrect: false },
      ],
      explanation: 'Langkah penyelesaian:\n3x - 5 = 16\n3x = 16 + 5\n3x = 21\nx = 21 / 3 = 7',
      misconceptionAlert: 'Saat memindahkan -5 ke ruas kanan, tandanya berubah menjadi +5.',
      sourceReference: 'Lembar Kerja Siswa PLSV — Halaman 1',
      timesAnswered: 4,
      timesCorrect: 3,
      qualityStatus: 'approved',
    },
    {
      id: 'q-ipa-1',
      subjectId: 'sub-ipa',
      chapterId: 'chap-ipa-4',
      conceptId: 'c-rantai-makanan',
      questionType: 'multiple_choice',
      difficulty: 2,
      prompt: 'Dalam ekosistem sawah: Padi -> Belalang -> Burung Pipit -> Ular -> Elang. Organisme yang menduduki tingkat trofik III adalah...',
      options: [
        { id: 'i-1', text: 'Padi', isCorrect: false },
        { id: 'i-2', text: 'Belalang', isCorrect: false },
        { id: 'i-3', text: 'Burung Pipit', isCorrect: true },
        { id: 'i-4', text: 'Ular', isCorrect: false },
      ],
      explanation: 'Tingkat Trofik I = Padi (Produsen), Tingkat Trofik II = Belalang (Konsumen I), Tingkat Trofik III = Burung Pipit (Konsumen II).',
      sourceReference: 'Diktat Ekosistem — Halaman 1',
      timesAnswered: 3,
      timesCorrect: 3,
      qualityStatus: 'approved',
    },
  ];
  await db.questions.bulkAdd(initialQuestions);

  // 9. Initial Mistakes
  const initialMistakes: MistakeRecord[] = [
    {
      id: 'mst-1',
      conceptId: 'c-penokohan',
      conceptTitle: 'Penokohan (Karakterisasi)',
      subjectId: 'sub-bind',
      questionPrompt: 'Manakah pernyataan yang membedakan Tokoh dan Penokohan?',
      userGivenAnswer: 'Tokoh adalah watak sifat, sedangkan penokohan adalah pemeran fisik.',
      correctAnswer: 'Tokoh adalah pelaku, sedangkan penokohan adalah cara pengarang menggambarkan watak/sifat.',
      misconceptionDescription: 'Tertukar antara konsep Tokoh dan Penokohan.',
      dateOccurred: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isResolved: false,
    },
    {
      id: 'mst-2',
      conceptId: 'c-gagasan-utama',
      conceptTitle: 'Gagasan Utama (Ide Pokok)',
      subjectId: 'sub-bind',
      questionPrompt: 'Tentukan gagasan pokok dari paragraf deduktif...',
      userGivenAnswer: 'Memilih kalimat penjelas kedua',
      correctAnswer: 'Kalimat pertama paragraf deduktif',
      misconceptionDescription: 'Memilih kalimat elaborasi data alih-alih kalimat utama.',
      dateOccurred: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isResolved: false,
    },
  ];
  await db.mistakeRecords.bulkAdd(initialMistakes);

  // 10. Learning Events
  const initialEvents: LearningEvent[] = [
    {
      id: 'evt-1',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: 'MATERIAL_IMPORTED',
      subjectId: 'sub-bind',
      metadata: { title: 'Catatan Guru: Unsur Intrinsik & Karakter Tokoh' },
    },
    {
      id: 'evt-2',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: 'QUESTION_ANSWERED',
      conceptId: 'c-penokohan',
      subjectId: 'sub-bind',
      metadata: { isCorrect: false, questionId: 'q-penokohan-1' },
    },
    {
      id: 'evt-3',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: 'STUDY_SESSION_COMPLETED',
      subjectId: 'sub-bind',
      metadata: { durationMinutes: 12, conceptsReviewed: 3 },
    },
  ];
  await db.learningEvents.bulkAdd(initialEvents);

  console.log('PAHAM database seeded successfully with 17 curriculum subjects!');
}
