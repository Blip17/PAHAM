// Learning Method Selector for PAHAM
// Deterministically chooses the most effective cognitive learning method for any concept based on student state, FSRS schedule, and exam proximity

import { 
  Concept, 
  StudentConceptState, 
  MistakeRecord, 
  Exam, 
  StudyMode, 
  LearningMethodRecommendation 
} from '../../core/types';

export interface MethodSelectionContext {
  concept: Concept;
  studentState?: StudentConceptState;
  recentMistakes?: MistakeRecord[];
  upcomingExams?: Exam[];
  availableMinutes?: number;
  totalDueConceptsCount?: number;
}

export const learningMethodSelector = {
  /**
   * Selects the single highest-value study method for a concept and explains WHY
   */
  selectMethod(context: MethodSelectionContext): LearningMethodRecommendation {
    const { 
      concept, 
      studentState, 
      recentMistakes = [], 
      upcomingExams = [], 
      availableMinutes = 25,
      totalDueConceptsCount = 0 
    } = context;

    const conceptMistakes = recentMistakes.filter(m => m.conceptId === concept.id && !m.isResolved);
    const hasActiveMisconception = conceptMistakes.length > 0;

    // Check closest exam covering this concept
    const now = new Date();
    const relevantExams = upcomingExams
      .filter(e => e.coveredChapterIds?.includes(concept.chapterId) || e.subjectId === concept.subjectId)
      .map(e => ({
        exam: e,
        diffDays: Math.ceil((new Date(e.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .filter(e => e.diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays);

    const closestExam = relevantExams[0];
    const isExamImminent = closestExam && closestExam.diffDays <= 3;

    // FSRS state
    const isNew = !studentState || studentState.fsrs.reps === 0;
    const isDue = studentState && new Date(studentState.fsrs.due) <= now;
    const masteryScore = studentState?.masteryScore ?? 0;
    const reps = studentState?.fsrs.reps ?? 0;
    const lapses = studentState?.fsrs.lapses ?? 0;

    // RULE 1: Repeated Misconception / Active Error
    if (hasActiveMisconception || lapses >= 2) {
      return {
        method: 'REPAIR',
        methodLabel: 'Perbaikan Kekeliruan (Repair)',
        reason: `Kamu sempat keliru di catatan pembeda (${conceptMistakes[0]?.misconceptionDescription || 'salah konsep'}). Kita bedah dan bandingkan konsepnya.`,
        relevanceScore: 0.98,
        estimatedMinutes: 8,
        alternativeMethods: [
          { method: 'RECALL', label: 'Uji Ingatan', reason: 'Jika kamu ingin mencoba mengingat kembali dulu.' },
          { method: 'LEARN', label: 'Baca Ulang', reason: 'Jika ingin membaca intisari materi dari awal.' }
        ]
      };
    }

    // RULE 2: Imminent Exam (< 3 days) and has baseline mastery
    if (isExamImminent && masteryScore >= 0.5) {
      return {
        method: 'MIXED_PRACTICE',
        methodLabel: 'Latihan Campuran (Exam Prep)',
        reason: `Ulangan ${closestExam.exam.title} tinggal ${closestExam.diffDays === 0 ? 'hari ini' : `${closestExam.diffDays} hari lagi`}. Latihan variasi soal untuk simulasi nyata.`,
        relevanceScore: 0.95,
        estimatedMinutes: 10,
        alternativeMethods: [
          { method: 'ADAPTIVE_PRACTICE', label: 'Latihan Adaptif', reason: 'Fokus pada peningkatan level kesulitan.' },
          { method: 'FLASHCARD', label: 'Review Kilat Kartu', reason: 'Review cepat poin-poin hafalan materi.' }
        ]
      };
    }

    // RULE 3: Brand New Concept
    if (isNew) {
      return {
        method: 'LEARN',
        methodLabel: 'Pahami Dasar (Learn)',
        reason: 'Konsep ini baru pertama kali dipelajari dari catatan sekolahmu. Mulai dari intisari, contoh, dan analogi.',
        relevanceScore: 0.92,
        estimatedMinutes: 7,
        alternativeMethods: [
          { method: 'RECALL', label: 'Coba Uji Ingatan', reason: 'Jika kamu merasa sudah pernah mendengarnya di kelas.' },
          { method: 'FLASHCARD', label: 'Buat Flashcard', reason: 'Langsung simpan definisi ke kartu memori.' }
        ]
      };
    }

    // RULE 4: Many Overdue items (> 5) -> Rescue mode
    if (totalDueConceptsCount >= 5 && isDue) {
      return {
        method: 'RESCUE',
        methodLabel: 'Sesi Penyelamatan (Rescue)',
        reason: `Ada beberapa konsep yang terlewat. PAHAM memprioritaskan poin paling penting dalam durasi ringkas.`,
        relevanceScore: 0.90,
        estimatedMinutes: 6,
        alternativeMethods: [
          { method: 'FLASHCARD', label: 'Review Cepat Kartu', reason: 'Selesaikan antrean kartu memori dalam 5 menit.' }
        ]
      };
    }

    // RULE 5: High Recall / Good Foundation but Needs Application
    if (reps >= 2 && masteryScore >= 0.6 && masteryScore < 0.85) {
      return {
        method: 'ADAPTIVE_PRACTICE',
        methodLabel: 'Latihan Soal Adaptif',
        reason: 'Kamu sudah paham dasar konsepnya. Sekarang kita uji pada variasi soal yang tingkat kesulitannya menyesuaikan kemampuanmu.',
        relevanceScore: 0.88,
        estimatedMinutes: 9,
        alternativeMethods: [
          { method: 'RECALL', label: 'Active Recall', reason: 'Uji ingatan mandiri tanpa pilihan ganda.' },
          { method: 'FLASHCARD', label: 'Flashcard', reason: 'Ulangi hafalan cepat.' }
        ]
      };
    }

    // RULE 6: FSRS Due Item
    if (isDue) {
      if (masteryScore >= 0.7) {
        return {
          method: 'FLASHCARD',
          methodLabel: 'Review Flashcard FSRS',
          reason: 'Waktunya mengulang kartu memori sebelum kurva retensi memorimu menurun.',
          relevanceScore: 0.86,
          estimatedMinutes: 5,
          alternativeMethods: [
            { method: 'RECALL', label: 'Active Recall Mandiri', reason: 'Tulis kembali jawaban lengkap tanpa kartu.' },
            { method: 'ADAPTIVE_PRACTICE', label: 'Latihan Soal', reason: 'Uji dengan studi kasus baru.' }
          ]
        };
      } else {
        return {
          method: 'RECALL',
          methodLabel: 'Active Recall (Uji Ingatan)',
          reason: 'Konsep ini sudah pernah dipelajari, tapi memorinya mulai terlupakan. Ingat kembali tanpa melihat catatan.',
          relevanceScore: 0.87,
          estimatedMinutes: 7,
          alternativeMethods: [
            { method: 'FLASHCARD', label: 'Flashcard', reason: 'Review menggunakan kartu bolak-balik.' },
            { method: 'LEARN', label: 'Baca Ulang', reason: 'Jika kamu sudah lupa total intisarinya.' }
          ]
        };
      }
    }

    // Default Maintenance
    return {
      method: 'FLASHCARD',
      methodLabel: 'Pemeliharaan Memori',
      reason: 'Konsep stabil. Review ringan untuk mempertahankan kestabilan jangka panjang.',
      relevanceScore: 0.75,
      estimatedMinutes: 5,
      alternativeMethods: [
        { method: 'ADAPTIVE_PRACTICE', label: 'Tantangan Soal Baru', reason: 'Coba soal tingkat kesulitan lebih tinggi.' }
      ]
    };
  }
};
