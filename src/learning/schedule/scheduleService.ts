// Schedule Service for PAHAM Study Studio
// Manages weekly timetables, custom study windows, expected outcomes, and gentle rescheduling

import { db } from '../../core/db';
import { 
  ScheduledStudyBlock, 
  StudyWindow, 
  Concept, 
  Subject, 
  StudyGoal, 
  Exam, 
  ExpectedOutcome,
  StudyMode 
} from '../../core/types';
import { goalPlanner } from '../goals/goalPlanner';

export const DEFAULT_STUDY_WINDOWS: StudyWindow[] = [
  { day: 'mon', startTime: '17:00', endTime: '18:00', isEnabled: true },
  { day: 'tue', startTime: '18:30', endTime: '19:30', isEnabled: true },
  { day: 'wed', startTime: '17:00', endTime: '18:00', isEnabled: true },
  { day: 'thu', startTime: '19:00', endTime: '20:00', isEnabled: true },
  { day: 'fri', startTime: '16:00', endTime: '17:30', isEnabled: true },
  { day: 'sat', startTime: '09:30', endTime: '11:00', isEnabled: true },
  { day: 'sun', startTime: '10:00', endTime: '11:30', isEnabled: false },
];

export const scheduleService = {
  /**
   * Generates or retrieves scheduled blocks for the current week
   */
  async ensureWeeklyScheduleSeeded(): Promise<ScheduledStudyBlock[]> {
    let existing = await db.scheduledBlocks.toArray();
    if (existing.length === 0) {
      const concepts = await db.concepts.toArray();
      const subjects = await db.subjects.toArray();
      const goals = await goalPlanner.ensureGoalsSeeded();
      const now = new Date();

      const blocks: ScheduledStudyBlock[] = [];
      const dayOffsets = [0, 1, 2, 3, 4]; // Mon-Fri sequence

      dayOffsets.forEach((offset, idx) => {
        const targetDate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];
        const concept = concepts[idx % Math.max(1, concepts.length)] || {
          id: 'c-default',
          subjectId: 'sub-bind',
          title: 'Pemahaman Konsep Kunci',
          definition: 'Intisari materi sekolah.',
        };
        const subject = subjects.find(s => s.id === concept.subjectId) || subjects[0];

        const mode: StudyMode = idx === 0 ? 'RECALL' : idx === 1 ? 'ADAPTIVE_PRACTICE' : idx === 2 ? 'FLASHCARD' : 'REPAIR';
        const duration = idx % 2 === 0 ? 15 : 20;

        const outcomes: ExpectedOutcome[] = [
          {
            id: `out-1-${idx}`,
            description: `Menjelaskan intisari ${concept.title} tanpa membuka buku catatan.`,
            outcomeType: 'RECALL_OUTCOME',
            isAchieved: idx === 0,
          },
          {
            id: `out-2-${idx}`,
            description: `Membedakan istilah kunci dan tidak tertukar saat ulangan.`,
            outcomeType: 'APPLICATION_OUTCOME',
            isAchieved: false,
          },
          {
            id: `out-3-${idx}`,
            description: `Menjawab 3 butir soal latihan adaptif tingkat menengah.`,
            outcomeType: 'APPLICATION_OUTCOME',
            isAchieved: false,
          }
        ];

        blocks.push({
          id: `block-${dateStr}-${idx}`,
          date: dateStr,
          startTime: idx % 2 === 0 ? '17:00' : '19:00',
          endTime: idx % 2 === 0 ? '17:15' : '19:20',
          subjectId: subject?.id || 'sub-bind',
          subjectName: subject?.name || 'Bahasa Indonesia',
          conceptIds: [concept.id],
          conceptTitle: concept.title,
          mode,
          goalId: goals[0]?.id,
          reason: idx === 0 ? 'Review jatuh tempo dan persiapan ulangan.' : 'Penguatan retensi memori jangka panjang.',
          expectedOutcomes: outcomes,
          status: idx === 0 ? 'COMPLETED' : 'PLANNED',
          plannedDurationMinutes: duration,
          completedMinutes: idx === 0 ? 15 : undefined,
        });
      });

      await db.scheduledBlocks.bulkPut(blocks);
      existing = blocks;
    }
    return existing;
  },

  /**
   * Reschedules a missed study block to a new time without guilt
   */
  async rescheduleBlock(blockId: string, newTime: string, newDate?: string): Promise<ScheduledStudyBlock | null> {
    const block = await db.scheduledBlocks.get(blockId);
    if (!block) return null;

    const updated: ScheduledStudyBlock = {
      ...block,
      date: newDate || block.date,
      startTime: newTime,
      status: 'RESCHEDULED',
    };

    await db.scheduledBlocks.put(updated);
    return updated;
  },

  /**
   * Marks a scheduled study block as completed
   */
  async completeBlock(blockId: string, durationMinutes: number): Promise<void> {
    const block = await db.scheduledBlocks.get(blockId);
    if (block) {
      const updated: ScheduledStudyBlock = {
        ...block,
        status: 'COMPLETED',
        completedMinutes: durationMinutes,
        expectedOutcomes: block.expectedOutcomes.map(o => ({ ...o, isAchieved: true })),
      };
      await db.scheduledBlocks.put(updated);
    }
  }
};
