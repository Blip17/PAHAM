// Study Session Engine for PAHAM
// Coordinates multi-step cognitive study sessions, activity sequences, learning event logging, and post-session mastery summaries

import { db } from '../../core/db';
import { 
  StudySession, 
  StudyActivity, 
  StudyMode, 
  Concept, 
  StudentConceptState, 
  SessionSummaryData 
} from '../../core/types';

export const studySessionEngine = {
  /**
   * Constructs an ordered sequence of StudyActivity blocks for a session
   */
  buildActivitiesForSession(
    sessionId: string,
    mode: StudyMode, 
    concepts: Concept[]
  ): StudyActivity[] {
    const activities: StudyActivity[] = [];
    let order = 1;

    const primaryConcept = concepts[0];
    if (!primaryConcept) return activities;

    switch (mode) {
      case 'LEARN':
        // Recall Pre-check -> Source Foundation -> Elaboration -> Practice Question -> Confidence -> FSRS
        activities.push({ id: `act-${order}`, sessionId, type: 'RECALL', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'active' });
        activities.push({ id: `act-${order}`, sessionId, type: 'EXPLANATION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'TEACH_BACK', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'ADAPTIVE_QUESTION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'CONFIDENCE_CHECK', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'REVIEW', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        break;

      case 'REPAIR':
        // Contrast Misconception -> Focused Repair Question -> Active Recall -> Confidence -> FSRS
        activities.push({ id: `act-${order}`, sessionId, type: 'COMPARE', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'active' });
        activities.push({ id: `act-${order}`, sessionId, type: 'EXPLANATION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'ADAPTIVE_QUESTION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'CONFIDENCE_CHECK', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'REVIEW', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        break;

      case 'FLASHCARD':
        // Flashcard batch -> Confidence Check -> FSRS Schedule
        activities.push({ id: `act-${order}`, sessionId, type: 'FLASHCARD', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'active' });
        activities.push({ id: `act-${order}`, sessionId, type: 'REVIEW', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        break;

      case 'ADAPTIVE_PRACTICE':
      case 'MIXED_PRACTICE':
      case 'EXAM_PREP':
        // Adaptive multi-question sequence -> Confidence -> FSRS
        activities.push({ id: `act-${order}`, sessionId, type: 'ADAPTIVE_QUESTION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'active' });
        activities.push({ id: `act-${order}`, sessionId, type: 'CONFIDENCE_CHECK', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'REVIEW', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        break;

      case 'RECALL':
      case 'RESCUE':
      default:
        // Retrieval -> Explanation -> Flashcard -> FSRS
        activities.push({ id: `act-${order}`, sessionId, type: 'RECALL', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'active' });
        activities.push({ id: `act-${order}`, sessionId, type: 'EXPLANATION', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'FLASHCARD', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        activities.push({ id: `act-${order}`, sessionId, type: 'REVIEW', conceptId: primaryConcept.id, conceptTitle: primaryConcept.title, order: order++, status: 'pending' });
        break;
    }

    return activities;
  },

  /**
   * Initializes and persists a new StudySession
   */
  async startSession(
    mode: StudyMode, 
    concepts: Concept[], 
    plannedDurationMinutes: number = 15
  ): Promise<StudySession> {
    const sessionId = `sess-${Date.now()}`;
    const now = new Date().toISOString();
    const primaryConcept = concepts[0];

    const activities = this.buildActivitiesForSession(sessionId, mode, concepts);

    let masteryBefore = 0.5;
    if (primaryConcept) {
      const state = await db.studentConceptStates.get(primaryConcept.id);
      if (state) masteryBefore = state.masteryScore;
    }

    const session: StudySession = {
      id: sessionId,
      conceptIds: concepts.map(c => c.id),
      subjectId: primaryConcept?.subjectId || '',
      mode,
      plannedDurationMinutes,
      startedAt: now,
      status: 'active',
      activities,
      masteryBefore,
    };

    await db.studySessions.put(session);

    await db.learningEvents.add({
      id: `evt-sess-${Date.now()}`,
      timestamp: now,
      eventType: 'STUDY_SESSION_COMPLETED',
      subjectId: session.subjectId,
      conceptId: primaryConcept?.id,
      metadata: { sessionId, mode, plannedDurationMinutes },
    });

    return session;
  },

  /**
   * Completes a session and generates summary metrics
   */
  async completeSession(
    session: StudySession,
    timeStudiedSeconds: number,
    correctCount: number,
    totalQuestionsCount: number,
    confidenceAfter?: 'low' | 'medium' | 'high'
  ): Promise<StudySession> {
    const now = new Date().toISOString();
    const primaryConceptId = session.conceptIds[0];

    let masteryAfter = (session.masteryBefore || 0.5);
    const accuracy = totalQuestionsCount > 0 ? correctCount / totalQuestionsCount : 0.8;
    masteryAfter = Math.min(0.98, Math.max(0.2, masteryAfter + (accuracy >= 0.7 ? 0.14 : -0.08)));

    const summary: SessionSummaryData = {
      timeStudiedSeconds,
      conceptsReviewedCount: session.conceptIds.length,
      questionsAnsweredCount: totalQuestionsCount,
      correctAnswersCount: correctCount,
      masteryDelta: {
        [primaryConceptId || 'default']: {
          before: Math.round((session.masteryBefore || 0.5) * 100),
          after: Math.round(masteryAfter * 100),
        }
      },
      weaknessesIdentified: accuracy < 0.7 ? ['Penerapan soal campuran masih perlu pengulangan'] : [],
      strengthsReinforced: accuracy >= 0.7 ? ['Definisi dan identifikasi pola kunci stabil'] : [],
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const completedSession: StudySession = {
      ...session,
      endedAt: now,
      status: 'completed',
      masteryAfter,
      confidenceAfter,
      summary,
    };

    await db.studySessions.put(completedSession);
    return completedSession;
  }
};
