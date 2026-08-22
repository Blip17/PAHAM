// Replay Studio Preset Data & Types
export interface ReplayStep {
  stepIndex: number;
  stageName: string;
  eventType: string;
  timestampOffsetSeconds: number;
  payload: Record<string, any>;
  stateSnapshot: {
    accuracy: number;
    mistakesCount: number;
    overdueCards: number;
    activeRuleId?: string;
    pikoEmotion: string;
    pikoSpeech: string;
    conceptMastery: Record<string, number>;
  };
  explanation: string;
}

export interface ReplayJourneyPreset {
  id: string;
  title: string;
  description: string;
  syntheticUser: {
    id: string;
    name: string;
    archetype: string;
  };
  steps: ReplayStep[];
}

export const REPLAY_JOURNEYS: Record<string, ReplayJourneyPreset> = {
  STRUGGLING_STUDENT_RESCUE: {
    id: 'STRUGGLING_STUDENT_RESCUE',
    title: 'Siswa Butuh Bantuan (5x Salah → Rescue Rule → Piko Zzz/Prompt)',
    description: 'Siswa baru menjawab 5 pertanyaan salah secara berturut-turut pada materi Fungsi Kuadrat. Mesin rekomendasi mengaktifkan RULE_STUDY_RESCUE dan memicu notifikasi intervensi Piko.',
    syntheticUser: {
      id: 'dev-sim-struggling-01',
      name: '[Dev Sim] Siswa Butuh Bantuan',
      archetype: 'STRUGGLING_STUDENT',
    },
    steps: [
      {
        stepIndex: 1,
        stageName: 'USER CREATED',
        eventType: 'user.created',
        timestampOffsetSeconds: 0,
        payload: { grade: 'Kelas 11', curriculum: 'Kurikulum Merdeka' },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'idle',
          pikoSpeech: 'Halo! Piko siap temani belajarmu hari ini.',
          conceptMastery: {},
        },
        explanation: 'Akun siswa diinisialisasi dengan kurikulum SMA Kelas 11.',
      },
      {
        stepIndex: 2,
        stageName: 'MATERIAL UPLOADED & OCR',
        eventType: 'material.imported',
        timestampOffsetSeconds: 45,
        payload: { title: 'Catatan Guru - Fungsi Kuadrat & Diskriminan', pages: 2 },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'thinking',
          pikoSpeech: 'Piko sedang membaca catatan tulisan tangan gurumu...',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Catatan guru diunggah dan konsep inti diekstraksi ke basis pengetahuan.',
      },
      {
        stepIndex: 3,
        stageName: 'QUIZ STARTED',
        eventType: 'quiz.started',
        timestampOffsetSeconds: 90,
        payload: { conceptId: 'c-diskriminan', difficulty: 2 },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'encouraging',
          pikoSpeech: 'Yuk coba uji pemahamanmu dengan kuis singkat!',
          conceptMastery: { 'c-diskriminan': 0.2 },
        },
        explanation: 'Sesi latihan adaptif dimulai untuk menguji daya ingat awal.',
      },
      {
        stepIndex: 4,
        stageName: 'QUESTION 1 INCORRECT',
        eventType: 'question.answered',
        timestampOffsetSeconds: 130,
        payload: { questionId: 'q-1', isCorrect: false, chosen: 'C', correct: 'A', conceptId: 'c-diskriminan' },
        stateSnapshot: {
          accuracy: 0,
          mistakesCount: 1,
          overdueCards: 0,
          pikoEmotion: 'encouraging',
          pikoSpeech: 'Jangan khawatir, perhatikan rumus D = b² - 4ac ya.',
          conceptMastery: { 'c-diskriminan': 0.15 },
        },
        explanation: 'Siswa salah menghitung tanda diskriminan.',
      },
      {
        stepIndex: 5,
        stageName: 'MULTIPLE WRONG ANSWERS (SPIKE)',
        eventType: 'question.answered',
        timestampOffsetSeconds: 210,
        payload: { questionId: 'q-2', isCorrect: false, chosen: 'B', correct: 'D', conceptId: 'c-diskriminan' },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          pikoEmotion: 'warning',
          pikoSpeech: 'Sepertinya ada kebingungan di konsep titik potong sumbu X.',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Lonjakan kesalahan terdeteksi pada konsep yang sama.',
      },
      {
        stepIndex: 6,
        stageName: 'RECOMMENDATION GENERATED',
        eventType: 'recommendation.generated',
        timestampOffsetSeconds: 260,
        payload: { ruleId: 'RULE_STUDY_RESCUE', priority: 'HIGH', actionType: 'RESCUE_STUDY' },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          activeRuleId: 'RULE_STUDY_RESCUE',
          pikoEmotion: 'recommending',
          pikoSpeech: 'Piko sarankan review 5 menit konsep Diskriminan sebelum lanjut.',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Engine mengevaluasi sinyal dan membangkitkan intervensi penyelamatan.',
      },
      {
        stepIndex: 7,
        stageName: 'PIKO COMPANION NOTIFICATION ACCEPTED',
        eventType: 'recommendation.accepted',
        timestampOffsetSeconds: 300,
        payload: { recommendationId: 'rec-rescue-1', durationMinutes: 5 },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          pikoEmotion: 'celebrating',
          pikoSpeech: 'Keren! Mari kita pelajari bersama sampai benar-benar paham.',
          conceptMastery: { 'c-diskriminan': 0.4 },
        },
        explanation: 'Siswa menerima rekomendasi dan memasuki mini-sesi penyelamatan konsep.',
      },
      {
        stepIndex: 8,
        stageName: 'FSRS REVIEW SCHEDULED',
        eventType: 'fsrs.card_created',
        timestampOffsetSeconds: 420,
        payload: { conceptId: 'c-diskriminan', due: '2026-08-23', stability: 1.5, difficulty: 4.2 },
        stateSnapshot: {
          accuracy: 60,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'idle',
          pikoSpeech: 'Kartu review dijadwalkan besok untuk mengunci retensi otakmu.',
          conceptMastery: { 'c-diskriminan': 0.65 },
        },
        explanation: 'Siklus belajar tuntas: konsep diperbaiki dan kartu pengulangan FSRS dijadwalkan.',
      },
    ],
  },
  EXAM_CRUNCH_TIMELINE: {
    id: 'EXAM_CRUNCH_TIMELINE',
    title: 'Ujian Besok (Exam Crunch Mode → Countdown → Drill)',
    description: 'Siswa memiliki jadwal Penilaian Akhir Semester (PAS) dalam 24 jam. Paham mengaktifkan mode drill intensif.',
    syntheticUser: {
      id: 'dev-sim-exam-02',
      name: '[Dev Sim] Siswa Mode Ujian',
      archetype: 'EXAM_TOMORROW',
    },
    steps: [
      {
        stepIndex: 1,
        stageName: 'EXAM CREATED (H-1)',
        eventType: 'exam.created',
        timestampOffsetSeconds: 0,
        payload: { title: 'PAS Fisika & Matematika', daysRemaining: 1, totalQuestions: 25 },
        stateSnapshot: {
          accuracy: 75,
          mistakesCount: 0,
          overdueCards: 2,
          activeRuleId: 'RULE_EXAM_PREPARATION',
          pikoEmotion: 'warning',
          pikoSpeech: 'Ujian tinggal 1 hari lagi! Fokus latihan soal terarah ya.',
          conceptMastery: { 'c-newton': 0.7, 'c-diskriminan': 0.6 },
        },
        explanation: 'Jadwal ujian terdaftar, Piko mengaktifkan banner persiapan intensif.',
      },
      {
        stepIndex: 2,
        stageName: 'SIMULATION ATTEMPT SUBMITTED',
        eventType: 'exam.submitted',
        timestampOffsetSeconds: 1800,
        payload: { score: 84, correct: 21, total: 25, weakConcepts: ['c-diskriminan'] },
        stateSnapshot: {
          accuracy: 84,
          mistakesCount: 4,
          overdueCards: 0,
          pikoEmotion: 'celebrating',
          pikoSpeech: 'Skor simulasi 84%! Ada 1 bab yang bisa dimantapkan lagi.',
          conceptMastery: { 'c-newton': 0.85, 'c-diskriminan': 0.72 },
        },
        explanation: 'Simulasi selesai dan analisis kelemahan langsung diuraikan.',
      },
    ],
  },
};
