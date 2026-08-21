// PAHAM Synthetic User Simulator Service
// Generates rich, realistic student archetypes for developer debugging and instant impersonation

import { SyntheticUserPreset, SyntheticUserMeta } from '../types';
import { db, DEFAULT_INDONESIAN_SUBJECTS } from '../../core/db';
import { UserProfile, Concept, StudentConceptState, Flashcard, Exam, MistakeRecord } from '../../core/types';
import { devAuditLogger } from './devAuditLogger';
import { devEventBus } from './devEventBus';

export const SYNTHETIC_PRESETS: Record<SyntheticUserPreset, SyntheticUserMeta> = {
  NEW_USER: {
    preset: 'NEW_USER',
    title: 'Siswa Baru (Fresh Registration)',
    description: 'Profil baru terdaftar, belum memiliki materi atau riwayat kuis. Cocok untuk menguji flow onboarding & empty states.',
    badgeColor: 'bg-blue-900 text-blue-200 border-blue-700',
    statsPreview: {
      subjectsCount: 0,
      conceptsCount: 0,
      accuracyPercent: 0,
      overdueCards: 0,
      daysInactive: 0,
    },
  },
  ACTIVE_STUDENT: {
    preset: 'ACTIVE_STUDENT',
    title: 'Siswa Aktif (Balanced Learner)',
    description: 'Belajar konsisten, streak 4 hari, jadwal flashcard seimbang, progres pemahaman 65%.',
    badgeColor: 'bg-moss-900 text-moss-200 border-moss-700',
    statsPreview: {
      subjectsCount: 3,
      conceptsCount: 14,
      accuracyPercent: 78,
      overdueCards: 2,
      daysInactive: 0,
    },
  },
  STRUGGLING_STUDENT: {
    preset: 'STRUGGLING_STUDENT',
    title: 'Siswa Butuh Bantuan (Struggling)',
    description: 'Banyak jawaban salah pada Matematika & Fisika, FSRS menumpuk, memicu rekomendasi penyelamatan Piko.',
    badgeColor: 'bg-terracotta-900 text-terracotta-200 border-terracotta-700',
    statsPreview: {
      subjectsCount: 2,
      conceptsCount: 10,
      accuracyPercent: 42,
      overdueCards: 7,
      daysInactive: 1,
    },
  },
  HIGH_PERFORMER: {
    preset: 'HIGH_PERFORMER',
    title: 'Siswa Berprestasi (High Mastery)',
    description: 'Akurasi 95%, streak 14 hari, seluruh konsep status Mastered, target harian selalu tercapai.',
    badgeColor: 'bg-purple-900 text-purple-200 border-purple-700',
    statsPreview: {
      subjectsCount: 5,
      conceptsCount: 28,
      accuracyPercent: 95,
      overdueCards: 0,
      daysInactive: 0,
    },
  },
  EXAM_TOMORROW: {
    preset: 'EXAM_TOMORROW',
    title: 'Ujian Besok (Exam Crunch Mode)',
    description: 'Ada jadwal Ujian Akhir Semester Fisika dalam 24 jam. Menampilkan banner intensif & drill mode.',
    badgeColor: 'bg-amber-900 text-amber-200 border-amber-700',
    statsPreview: {
      subjectsCount: 2,
      conceptsCount: 16,
      accuracyPercent: 70,
      overdueCards: 4,
      daysInactive: 0,
      upcomingExamDays: 1,
    },
  },
  INACTIVE_USER: {
    preset: 'INACTIVE_USER',
    title: 'Siswa Pasif (Retention Rescue)',
    description: 'Tidak membuka aplikasi selama 12 hari, memicu notifikasi pemulihan dan micro-session 5 menit.',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    statsPreview: {
      subjectsCount: 2,
      conceptsCount: 8,
      accuracyPercent: 60,
      overdueCards: 8,
      daysInactive: 12,
    },
  },
  FSRS_OVERDUE: {
    preset: 'FSRS_OVERDUE',
    title: 'Flashcard Menumpuk (FSRS Overdue)',
    description: 'Memiliki 12 kartu kilas jatuh tempo review, ideal untuk menguji spaced repetition flow.',
    badgeColor: 'bg-orange-900 text-orange-200 border-orange-700',
    statsPreview: {
      subjectsCount: 3,
      conceptsCount: 18,
      accuracyPercent: 68,
      overdueCards: 12,
      daysInactive: 3,
    },
  },
  AI_HEAVY_USER: {
    preset: 'AI_HEAVY_USER',
    title: 'Pengguna Aktif AI & Feynman',
    description: 'Menggunakan inferensi penjelasan mendalam pada banyak konsep sulit dan memiliki riwayat dialog AI.',
    badgeColor: 'bg-cyan-900 text-cyan-200 border-cyan-700',
    statsPreview: {
      subjectsCount: 4,
      conceptsCount: 22,
      accuracyPercent: 82,
      overdueCards: 1,
      daysInactive: 0,
    },
  },
  OCR_HEAVY_USER: {
    preset: 'OCR_HEAVY_USER',
    title: 'Kolektor Catatan Guru (OCR Heavy)',
    description: 'Memiliki 8 catatan buku tulis hasil scan kamera dengan puluhan konsep terekstraksi.',
    badgeColor: 'bg-emerald-900 text-emerald-200 border-emerald-700',
    statsPreview: {
      subjectsCount: 4,
      conceptsCount: 26,
      accuracyPercent: 76,
      overdueCards: 3,
      daysInactive: 0,
    },
  },
};

class UserSimulatorService {
  /**
   * Generates synthetic dataset for specified preset and populates Dexie tables
   */
  public async generateSyntheticUser(preset: SyntheticUserPreset): Promise<UserProfile> {
    const userId = `dev-sim-${preset.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const baseProfile: UserProfile = {
      id: userId,
      name: `[Dev] ${SYNTHETIC_PRESETS[preset].title}`,
      displayName: `[Dev] ${SYNTHETIC_PRESETS[preset].title}`,
      email: `test.${preset.toLowerCase()}@paham.internal`,
      grade: 'Kelas 11',
      semester: 'Semester 1',
      curriculum: 'Kurikulum Merdeka',
      schoolName: 'SMA Negeri 1 Simulasi Dev',
      dailyTimeTargetMinutes: 30,
      onboardingCompleted: preset !== 'NEW_USER',
      hasSeenArrival: true,
      createdAt: now,
      updatedAt: now,
    };

    // Save profile
    try {
      await db.profiles.put(baseProfile);
    } catch {}

    // Populate Preset specific mock data
    if (preset !== 'NEW_USER') {
      try {
        await this.populatePresetData(preset, userId, today);
      } catch {}
    }

    devAuditLogger.log({
      developer: 'Developer',
      action: `GENERATE_SYNTHETIC_USER: ${preset}`,
      target: `User: ${baseProfile.name} (${userId})`,
      environment: 'development',
      result: 'SUCCESS',
      details: { preset, stats: SYNTHETIC_PRESETS[preset].statsPreview },
    });

    devEventBus.dispatchEvent('user.created', { preset, userId }, userId, 'DEV_LAB');

    return baseProfile;
  }

  private async populatePresetData(preset: SyntheticUserPreset, userId: string, today: string) {
    const timestamp = new Date().toISOString();

    // 1. Chapters & Concepts
    const concepts: Concept[] = [
      {
        id: `sim-c-1-${preset}`,
        subjectId: 'sub-mat-wajib',
        chapterId: 'chap-mat-1',
        title: 'Fungsi Kuadrat & Diskriminan',
        definition: 'Bentuk umum f(x) = ax² + bx + c dengan nilai diskriminan D = b² - 4ac.',
        example: 'f(x) = x² - 4x + 4 memiliki D = 0, memotong sumbu X di 1 titik.',
        keyPoints: ['D > 0 memotong 2 titik', 'D = 0 menyinggung sumbu X', 'D < 0 tidak memotong'],
        relationships: [],
        sources: [],
        difficultyLevel: 3,
        createdAt: timestamp,
      },
      {
        id: `sim-c-2-${preset}`,
        subjectId: 'sub-fis',
        chapterId: 'chap-fis-1',
        title: 'Hukum II Newton',
        definition: 'Percepatan berbanding lurus dengan resultan gaya dan berbanding terbalik dengan massa (ΣF = m.a).',
        example: 'Mendorong mobil mogok membutuhkan gaya lebih besar daripada mendorong sepeda.',
        keyPoints: ['Satuan Gaya adalah Newton', 'Arah percepatan searah resultan gaya'],
        relationships: [],
        sources: [],
        difficultyLevel: 2,
        createdAt: timestamp,
      },
    ];

    try {
      for (const c of concepts) {
        await db.concepts.put(c);
      }
    } catch {}

    // 2. Student Concept States
    try {
      for (const c of concepts) {
        const isStruggling = preset === 'STRUGGLING_STUDENT';
        const isHigh = preset === 'HIGH_PERFORMER';

        const state: StudentConceptState = {
          conceptId: c.id,
          masteryScore: isHigh ? 0.95 : isStruggling ? 0.42 : 0.75,
          recentAttemptsCount: isHigh ? 8 : 2,
          recentCorrectCount: isHigh ? 8 : isStruggling ? 1 : 2,
          commonMistakes: isStruggling ? ['Salah rumus diskriminan'] : [],
          priorityScore: isStruggling ? 90 : 20,
          recommendedMode: isStruggling ? 'rescue' : isHigh ? 'review' : 'practice',
          fsrs: {
            conceptId: c.id,
            due: preset === 'FSRS_OVERDUE' || preset === 'STRUGGLING_STUDENT' ? '2026-08-10' : today,
            stability: isHigh ? 12 : 1.5,
            difficulty: isStruggling ? 4.5 : 2.8,
            elapsed_days: 2,
            scheduled_days: isHigh ? 14 : 1,
            reps: 3,
            lapses: isStruggling ? 3 : 0,
            state: 2,
          },
        };
        await db.studentConceptStates.put(state);
      }
    } catch {}

    // 3. Flashcards
    try {
      for (const c of concepts) {
        const card: Flashcard = {
          id: `sim-fc-${c.id}`,
          conceptId: c.id,
          subjectId: c.subjectId,
          chapterId: c.chapterId,
          front: `Apa rumus Diskriminan pada persamaan kuadrat?`,
          back: `D = b² - 4ac. Menentukan jumlah akar real grafik fungsi kuadrat.`,
          cardType: 'BASIC',
          fsrs: {
            conceptId: c.id,
            due: preset === 'FSRS_OVERDUE' ? '2026-08-15' : today,
            stability: 2,
            difficulty: 3,
            elapsed_days: 1,
            scheduled_days: 1,
            reps: 1,
            lapses: 0,
            state: 1,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await db.flashcards.put(card);
      }
    } catch {}

    // 4. Mistake records for struggling users
    if (preset === 'STRUGGLING_STUDENT') {
      try {
        await db.mistakeRecords.put({
          id: `sim-mistake-${Date.now()}`,
          conceptId: `sim-c-1-${preset}`,
          conceptTitle: 'Fungsi Kuadrat & Diskriminan',
          subjectId: 'sub-mat-wajib',
          questionPrompt: 'Berapakah nilai diskriminan dari x² - 4x + 4 = 0?',
          userGivenAnswer: 'D = 4',
          correctAnswer: 'D = 0',
          misconceptionDescription: 'Salah tanda saat mengalikan -4ac',
          dateOccurred: timestamp,
          isResolved: false,
        });
      } catch {}
    }

    // 5. Exam simulation for EXAM_TOMORROW
    if (preset === 'EXAM_TOMORROW') {
      try {
        const examDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const exam: Exam = {
          id: `sim-exam-${Date.now()}`,
          subjectId: 'sub-fis',
          title: 'Penilaian Akhir Semester (PAS) Fisika',
          examDate,
          totalQuestions: 25,
          durationMinutes: 60,
          coveredChapterIds: ['chap-fis-1'],
          importance: 'high',
          readinessScore: 75,
          completedAttempts: 0,
        };
        await db.exams.put(exam);
      } catch {}
    }
  }
}

export const userSimulatorService = new UserSimulatorService();
