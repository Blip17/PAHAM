// Goal Planner Service for PAHAM Study Studio
// Manages student goals, progress calculations, and goal-to-schedule influence

import { db } from '../../core/db';
import { StudyGoal, GoalType, Concept, StudentConceptState, Exam, Subject } from '../../core/types';

export const goalPlanner = {
  /**
   * Initializes default seed goals if database is empty
   */
  async ensureGoalsSeeded(): Promise<StudyGoal[]> {
    let existing = await db.goals.toArray();
    if (existing.length === 0) {
      const subjects = await db.subjects.toArray();
      const bindSub = subjects.find(s => s.code === 'BIN') || subjects[0];
      const matSub = subjects.find(s => s.code === 'MAT') || subjects[1];

      const now = new Date();
      const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
      const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const seedGoals: StudyGoal[] = [
        {
          id: 'goal-bind-exam',
          title: 'Siap Ulangan Bahasa Indonesia (Bab 1 & 2)',
          subjectId: bindSub?.id || 'sub-bind',
          goalType: 'EXAM_GOAL',
          targetDate: inFourDays,
          desiredOutcome: 'Membedakan unsur fiksi (tokoh vs penokohan) dan gagasan utama tanpa ragu.',
          weeklyFrequency: 4,
          availableMinutesPerSession: 15,
          priority: 'high',
          progressPercentage: 68,
          status: 'ACTIVE',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 'goal-mat-mastery',
          title: 'Kuasai Aljabar & Persamaan Linear',
          subjectId: matSub?.id || 'sub-mat',
          goalType: 'MASTERY_GOAL',
          targetDate: inTwoWeeks,
          desiredOutcome: 'Lancar menyelesaikan soal campuran persamaan dua variabel.',
          weeklyFrequency: 3,
          availableMinutesPerSession: 20,
          priority: 'medium',
          progressPercentage: 45,
          status: 'ACTIVE',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }
      ];

      await db.goals.bulkPut(seedGoals);
      existing = seedGoals;
    }
    return existing;
  },

  /**
   * Calculates dynamic progress for a goal based on actual mastery and exam states
   */
  async calculateGoalProgress(goal: StudyGoal): Promise<number> {
    const states = await db.studentConceptStates.toArray();
    const concepts = await db.concepts.toArray();

    const subjectConcepts = concepts.filter(c => c.subjectId === goal.subjectId);
    if (subjectConcepts.length === 0) return goal.progressPercentage;

    let totalScore = 0;
    let counted = 0;

    for (const c of subjectConcepts) {
      const s = states.find(st => st.conceptId === c.id);
      if (s) {
        totalScore += s.masteryScore;
        counted++;
      }
    }

    if (counted === 0) return goal.progressPercentage;
    const avgScore = (totalScore / counted) * 100;
    return Math.min(100, Math.max(0, Math.round(avgScore)));
  },

  /**
   * Creates a new user-defined study goal
   */
  async createGoal(newGoal: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt' | 'progressPercentage'>): Promise<StudyGoal> {
    const now = new Date().toISOString();
    const goal: StudyGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      progressPercentage: 10,
      createdAt: now,
      updatedAt: now,
    };

    await db.goals.put(goal);
    return goal;
  },

  /**
   * Generates a recommended session distribution for a goal
   */
  generateProposedSessions(goal: StudyGoal): Array<{ dayName: string; durationMinutes: number; focus: string }> {
    const days = ['Senin', 'Rabu', 'Jumat', 'Sabtu'];
    return days.slice(0, goal.weeklyFrequency).map((day, idx) => ({
      dayName: day,
      durationMinutes: goal.availableMinutesPerSession,
      focus: idx === 0 ? 'Active Recall & Definisi' : idx === 1 ? 'Latihan Soal Aplikasi' : 'Flashcard & Review Campuran',
    }));
  }
};
