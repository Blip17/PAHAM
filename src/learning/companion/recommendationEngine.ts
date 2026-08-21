// PAHAM Personal Learning Companion — Recommendation Engine
// Deterministic, signal-driven contextual intelligence with zero random suggestions and personalized acceptance learning

import {
  Concept,
  StudentConceptState,
  MistakeRecord,
  Flashcard,
  Exam,
  StudyGoal,
  Material,
  LearningEvent,
  CompanionRecommendation,
  CompanionNotificationPreferences,
  RecommendationPriority,
  RecommendationActionType,
  Subject
} from '../../core/types';

export interface RecommendationEngineInput {
  concepts: Concept[];
  subjects: Subject[];
  studentStates: Map<string, StudentConceptState>;
  mistakes: MistakeRecord[];
  flashcards: Flashcard[];
  exams: Exam[];
  goals: StudyGoal[];
  materials: Material[];
  learningEvents: LearningEvent[];
  preferences: CompanionNotificationPreferences;
  pastRecommendations: CompanionRecommendation[];
  currentDate?: Date;
}

export class CompanionRecommendationEngine {
  /**
   * Generates prioritized, explainable recommendations based on learning signals
   */
  public generateRecommendations(input: RecommendationEngineInput): CompanionRecommendation[] {
    const {
      concepts,
      subjects,
      studentStates,
      mistakes,
      flashcards,
      exams,
      goals,
      materials,
      learningEvents,
      preferences,
      pastRecommendations,
      currentDate = new Date(),
    } = input;

    const nowIso = currentDate.toISOString();
    const recommendations: CompanionRecommendation[] = [];

    // Helper map for subject lookups
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const conceptMap = new Map(concepts.map(c => [c.id, c]));

    // Check user suppressed rules and active snoozes
    const suppressedSet = new Set(preferences.suppressedRuleIds || []);
    const snoozedSet = new Set<string>();

    for (const past of pastRecommendations) {
      if (past.snoozedUntil && new Date(past.snoozedUntil).getTime() > currentDate.getTime()) {
        snoozedSet.add(past.ruleId);
      }
    }

    // ── RULE 1: EXAM PROXIMITY (HIGH) ───────────────────────────────────────
    if (preferences.enableHighPriority && !suppressedSet.has('RULE_EXAM_PROXIMITY') && !snoozedSet.has('RULE_EXAM_PROXIMITY')) {
      const upcomingExams = exams
        .map(e => {
          const examTime = new Date(e.examDate).getTime();
          const daysRemaining = Math.ceil((examTime - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          return { ...e, daysRemaining };
        })
        .filter(e => e.daysRemaining >= 0 && e.daysRemaining <= 5)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      if (upcomingExams.length > 0) {
        const closestExam = upcomingExams[0];
        const sub = subjectMap.get(closestExam.subjectId);
        const subName = sub ? sub.name : 'Mata Pelajaran';

        // Find vulnerable concepts under this subject
        const subjectConcepts = concepts.filter(c => c.subjectId === closestExam.subjectId);
        const vulnerableConcept = subjectConcepts.find(c => {
          const state = studentStates.get(c.id);
          return !state || state.masteryScore < 70;
        }) || subjectConcepts[0];

        recommendations.push({
          id: `rec-exam-${closestExam.id}-${currentDate.toISOString().slice(0, 10)}`,
          ruleId: 'RULE_EXAM_PROXIMITY',
          examId: closestExam.id,
          subjectId: closestExam.subjectId,
          subjectName: subName,
          conceptId: vulnerableConcept?.id,
          conceptTitle: vulnerableConcept?.title,
          title: `Ulangan ${subName} Tinggal ${closestExam.daysRemaining} Hari`,
          message: `Ulangan ${closestExam.title || subName} sudah dekat. Kunci pemahaman konsep penting agar kamu percaya diri saat ujian.`,
          reason: `Ulangan terjadwal ${closestExam.daysRemaining} hari lagi (${closestExam.examDate}). Retensi materi butuh diperkuat.`,
          sourceSignals: ['EXAM_PROXIMITY'],
          priority: 'HIGH',
          actionType: vulnerableConcept ? 'STUDY_CONCEPT' : 'SIMULATE_EXAM',
          actionPayload: { examId: closestExam.id, conceptId: vulnerableConcept?.id },
          mascotState: 'warning',
          bubblePrompt: `Ulangan ${closestExam.daysRemaining} hari lagi!`,
          createdAt: nowIso,
        });
      }
    }

    // ── RULE 2: FSRS OVERDUE FLASHCARDS (HIGH) ──────────────────────────────
    if (preferences.enableHighPriority && !suppressedSet.has('RULE_FSRS_OVERDUE') && !snoozedSet.has('RULE_FSRS_OVERDUE')) {
      const todayStr = currentDate.toISOString().slice(0, 10);
      const overdueCards = flashcards.filter(f => f.fsrs && f.fsrs.due && f.fsrs.due <= todayStr);

      if (overdueCards.length >= 2) {
        const topCard = overdueCards[0];
        recommendations.push({
          id: `rec-fsrs-${todayStr}`,
          ruleId: 'RULE_FSRS_OVERDUE',
          conceptId: topCard.conceptId,
          conceptTitle: topCard.conceptTitle,
          subjectId: topCard.subjectId,
          title: `${overdueCards.length} Kartu Flashcard Jatuh Tempo`,
          message: `${overdueCards.length} kartu memori telah mencapai jadwal FSRS hari ini. Luangkan 4 menit untuk menjaga daya ingat jangka panjangmu.`,
          reason: `${overdueCards.length} kartu flashcard jatuh tempo review per ${todayStr}.`,
          sourceSignals: ['FSRS_OVERDUE'],
          priority: 'HIGH',
          actionType: 'REVIEW_FLASHCARDS',
          actionPayload: { count: overdueCards.length },
          mascotState: 'recommending',
          bubblePrompt: `${overdueCards.length} kartu perlu diulang!`,
          createdAt: nowIso,
        });
      }
    }

    // ── RULE 3: REPEATED MISCONCEPTIONS (MEDIUM) ────────────────────────────
    if (preferences.enableMediumPriority && !suppressedSet.has('RULE_REPEATED_MISTAKE') && !snoozedSet.has('RULE_REPEATED_MISTAKE')) {
      // Group unresolved mistakes by concept
      const mistakeCountByConcept = new Map<string, MistakeRecord[]>();
      for (const m of mistakes) {
        if (!m.isResolved) {
          const list = mistakeCountByConcept.get(m.conceptId) || [];
          list.push(m);
          mistakeCountByConcept.set(m.conceptId, list);
        }
      }

      // Find concept with highest mistake count >= 2
      let mostVulnerableConceptId: string | null = null;
      let maxMistakes = 0;
      mistakeCountByConcept.forEach((list, cId) => {
        if (list.length >= maxMistakes && list.length >= 2) {
          maxMistakes = list.length;
          mostVulnerableConceptId = cId;
        }
      });

      if (mostVulnerableConceptId) {
        const conc = conceptMap.get(mostVulnerableConceptId);
        const sub = conc ? subjectMap.get(conc.subjectId) : undefined;
        const conceptMistakes = mistakeCountByConcept.get(mostVulnerableConceptId) || [];

        recommendations.push({
          id: `rec-mistake-${mostVulnerableConceptId}`,
          ruleId: 'RULE_REPEATED_MISTAKE',
          conceptId: mostVulnerableConceptId,
          conceptTitle: conc?.title || 'Konsep Belajar',
          subjectId: conc?.subjectId,
          subjectName: sub?.name,
          title: `Perbaiki Miskonsepsi: ${conc?.title}`,
          message: `Kamu tercatat ${conceptMistakes.length}x keliru pada soal yang melibatkan ${conc?.title}. Sesi drill 5 menit ini disiapkan untuk meluruskan pemahamanmu.`,
          reason: `Terdeteksi ${conceptMistakes.length} catatan miskonsepsi aktif pada konsep ini.`,
          sourceSignals: ['REPEATED_MISTAKE'],
          priority: 'MEDIUM',
          actionType: 'STUDY_CONCEPT',
          actionPayload: { conceptId: mostVulnerableConceptId, focus: 'misconception' },
          mascotState: 'thinking',
          bubblePrompt: 'Yuk luruskan konsep ini!',
          createdAt: nowIso,
        });
      }
    }

    // ── RULE 4: UNFINISHED GOAL MILESTONE (MEDIUM) ──────────────────────────
    if (preferences.enableMediumPriority && !suppressedSet.has('RULE_UNFINISHED_GOAL') && !snoozedSet.has('RULE_UNFINISHED_GOAL')) {
      const activeGoals = goals
        .filter(g => g.status === 'ACTIVE' && g.progressPercentage < 70)
        .map(g => {
          const targetTime = new Date(g.targetDate).getTime();
          const daysLeft = Math.ceil((targetTime - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          return { ...g, daysLeft };
        })
        .filter(g => g.daysLeft >= 0 && g.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft);

      if (activeGoals.length > 0) {
        const goal = activeGoals[0];
        const sub = subjectMap.get(goal.subjectId);

        recommendations.push({
          id: `rec-goal-${goal.id}`,
          ruleId: 'RULE_UNFINISHED_GOAL',
          goalId: goal.id,
          subjectId: goal.subjectId,
          subjectName: sub?.name,
          title: `Kejar Target: ${goal.desiredOutcome}`,
          message: `Target belajarmu berprogres ${goal.progressPercentage}% dengan sisa waktu ${goal.daysLeft} hari. Tambah 1 sesi belajar untuk mendekati target.`,
          reason: `Target mingguan '${goal.desiredOutcome}' tersisa ${goal.daysLeft} hari dan masih membutuhkan kemajuan.`,
          sourceSignals: ['UNFINISHED_GOAL'],
          priority: 'MEDIUM',
          actionType: 'STUDY_CONCEPT',
          actionPayload: { goalId: goal.id, subjectId: goal.subjectId },
          mascotState: 'encouraging',
          bubblePrompt: 'Sedikit lagi targetmu tercapai!',
          createdAt: nowIso,
        });
      }
    }

    // ── RULE 5: UNSTUDIED UPLOADED NOTES (MEDIUM) ───────────────────────────
    if (preferences.enableMediumPriority && !suppressedSet.has('RULE_UNSTUDIED_MATERIAL') && !snoozedSet.has('RULE_UNSTUDIED_MATERIAL')) {
      // Find material that has concepts not yet studied
      const unstudiedMaterial = materials.find(m => {
        const matConcepts = concepts.filter(c => c.chapterId === m.chapterId);
        return matConcepts.some(c => {
          const state = studentStates.get(c.id);
          return !state || !state.lastStudied;
        });
      });

      if (unstudiedMaterial) {
        const sub = subjectMap.get(unstudiedMaterial.subjectId);
        recommendations.push({
          id: `rec-mat-${unstudiedMaterial.id}`,
          ruleId: 'RULE_UNSTUDIED_MATERIAL',
          materialId: unstudiedMaterial.id,
          subjectId: unstudiedMaterial.subjectId,
          subjectName: sub?.name,
          title: `Pelajari Catatan: ${unstudiedMaterial.title}`,
          message: `Kamu memiliki catatan ${unstudiedMaterial.title} yang intisari materinya belum kamu pelajari. Mulai 8 menit sekarang!`,
          reason: `Dokumen '${unstudiedMaterial.title}' baru diunggah dan memiliki konsep yang belum pernah dipelajari.`,
          sourceSignals: ['UNSTUDIED_MATERIAL'],
          priority: 'MEDIUM',
          actionType: 'READ_MATERIAL',
          actionPayload: { materialId: unstudiedMaterial.id },
          mascotState: 'curious',
          bubblePrompt: 'Ada catatan baru!',
          createdAt: nowIso,
        });
      }
    }

    // ── RULE 6: STUDY RESCUE / RE-ENTRY (HIGH / MEDIUM) ─────────────────────
    if (!suppressedSet.has('RULE_STUDY_RESCUE') && !snoozedSet.has('RULE_STUDY_RESCUE')) {
      if (learningEvents.length > 0) {
        const timestamps = learningEvents.map(e => new Date(e.timestamp).getTime());
        const latestTime = Math.max(...timestamps);
        const daysSince = Math.floor((currentDate.getTime() - latestTime) / (1000 * 60 * 60 * 24));

        if (daysSince >= 3) {
          recommendations.push({
            id: `rec-rescue-${currentDate.toISOString().slice(0, 10)}`,
            ruleId: 'RULE_STUDY_RESCUE',
            title: 'Mulai Lagi Pelan-pelan (5 Menit)',
            message: `Sudah ${daysSince} hari sejak sesi belajarmu yang lalu. Tidak perlu mengejar semua sekaligus—cukup 5 menit untuk menyegarkan memori.`,
            reason: `Tidak ada aktivitas belajar tercatat selama ${daysSince} hari terakhir.`,
            sourceSignals: ['STREAK_PRESERVATION'],
            priority: 'HIGH',
            actionType: 'RESCUE_STUDY',
            actionPayload: { minutes: 5 },
            mascotState: 'encouraging',
            bubblePrompt: 'Mulai 5 menit yuk!',
            createdAt: nowIso,
          });
        }
      }
    }

    // ── RULE 7: RETENTION ANCHOR (LOW) ──────────────────────────────────────
    if (preferences.enableLowPriority && !suppressedSet.has('RULE_RETENTION_ANCHOR') && !snoozedSet.has('RULE_RETENTION_ANCHOR')) {
      // Find high mastery concepts not reviewed in > 10 days
      const anchorConcept = concepts.find(c => {
        const state = studentStates.get(c.id);
        if (!state || state.masteryScore < 80 || !state.lastStudied) return false;
        const daysSinceStudy = (currentDate.getTime() - new Date(state.lastStudied).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceStudy > 10;
      });

      if (anchorConcept) {
        const sub = subjectMap.get(anchorConcept.subjectId);
        recommendations.push({
          id: `rec-anchor-${anchorConcept.id}`,
          ruleId: 'RULE_RETENTION_ANCHOR',
          conceptId: anchorConcept.id,
          conceptTitle: anchorConcept.title,
          subjectId: anchorConcept.subjectId,
          subjectName: sub?.name,
          title: `Uji Ketahanan Memori: ${anchorConcept.title}`,
          message: `Konsep ${anchorConcept.title} sudah kamu kuasai dengan baik. Jawab 2 pertanyaan singkat untuk memastikan retensinya tetap 100%.`,
          reason: `Konsep dengan penguasaan tinggi (${studentStates.get(anchorConcept.id)?.masteryScore}%) belum diuji kembali selama > 10 hari.`,
          sourceSignals: ['RETENTION_ANCHOR'],
          priority: 'LOW',
          actionType: 'TAKE_QUIZ',
          actionPayload: { conceptId: anchorConcept.id },
          mascotState: 'thinking',
          bubblePrompt: 'Cek ingatan sebentar yuk!',
          createdAt: nowIso,
        });
      }
    }

    // ── SORTING & RANKING ───────────────────────────────────────────────────
    const priorityWeight: Record<RecommendationPriority, number> = {
      HIGH: 300,
      MEDIUM: 200,
      LOW: 100,
    };

    // Calculate acceptance score per rule to prioritize rules the student frequently accepts
    const ruleAcceptanceCount = new Map<string, number>();
    for (const p of pastRecommendations) {
      if (p.outcome === 'ACCEPTED') {
        ruleAcceptanceCount.set(p.ruleId, (ruleAcceptanceCount.get(p.ruleId) || 0) + 10);
      } else if (p.outcome === 'DISMISSED') {
        ruleAcceptanceCount.set(p.ruleId, (ruleAcceptanceCount.get(p.ruleId) || 0) - 5);
      }
    }

    return recommendations.sort((a, b) => {
      const scoreA = priorityWeight[a.priority] + (ruleAcceptanceCount.get(a.ruleId) || 0);
      const scoreB = priorityWeight[b.priority] + (ruleAcceptanceCount.get(b.ruleId) || 0);
      return scoreB - scoreA;
    });
  }
}

export const companionEngine = new CompanionRecommendationEngine();
