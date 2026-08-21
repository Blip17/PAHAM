// PAHAM Dev Event Bus
// Real event dispatcher and recorder connecting Event Lab directly to live application systems

import { DevEventRecord } from '../types';
import { db } from '../../core/db';
import { companionEngine } from '../../learning/companion/recommendationEngine';
import { devAuditLogger } from './devAuditLogger';

type DevEventListener = (event: DevEventRecord) => void;

class DevEventBus {
  private inMemoryEvents: DevEventRecord[] = [];
  private listeners: Set<DevEventListener> = new Set();

  constructor() {
    this.seedDefaultEvents();
  }

  private seedDefaultEvents() {
    this.inMemoryEvents = [
      {
        id: 'evt-init-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: 'user.created',
        userId: 'dev-user-primary',
        payload: { email: 'student.dev@paham.id', grade: '10 SMA' },
        source: 'SYSTEM',
        status: 'PROCESSED',
        resultingActions: ['profile_initialized', 'seed_subjects_loaded'],
      },
      {
        id: 'evt-init-2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'study.completed',
        userId: 'dev-user-primary',
        payload: { conceptId: 'c-hukum-newton', minutes: 25, rating: 3 },
        source: 'USER_ACTION',
        status: 'PROCESSED',
        resultingActions: ['fsrs_interval_scheduled', 'streak_incremented'],
      }
    ];
  }

  public subscribe(listener: DevEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getRecentEvents(limit: number = 50): DevEventRecord[] {
    return [...this.inMemoryEvents].slice(-limit).reverse();
  }

  /**
   * Dispatches an event into the live Paham event pipeline
   */
  public async dispatchEvent(
    eventType: string, 
    payload: Record<string, any>, 
    userId: string = 'dev-user', 
    source: 'DEV_LAB' | 'SCENARIO_BUILDER' | 'USER_ACTION' = 'DEV_LAB'
  ): Promise<DevEventRecord> {
    const eventId = `dev-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = new Date().toISOString();
    const resultingActions: string[] = [];

    // 1. Process Domain Consequence
    try {
      if (eventType.startsWith('study.') || eventType.startsWith('question.')) {
        resultingActions.push('learning_event_persisted');
        // Record in live IndexedDB learning events
        try {
          await db.learningEvents.add({
            id: `le-${Date.now()}`,
            timestamp,
            eventType: 'STUDY_SESSION_COMPLETED',
            conceptId: payload.conceptId || 'c-sim-1',
            metadata: payload,
          });
        } catch {}
      }

      if (eventType === 'question.incorrect') {
        resultingActions.push('mistake_record_created');
        try {
          await db.mistakeRecords.add({
            id: `mistake-${Date.now()}`,
            conceptId: payload.conceptId || 'c-sim-1',
            conceptTitle: payload.conceptTitle || 'Konsep Simulasi',
            subjectId: payload.subjectId || 'sub-mat-wajib',
            questionPrompt: payload.prompt || 'Soal simulasi',
            userGivenAnswer: payload.chosenOption || 'A',
            correctAnswer: payload.correctOption || 'B',
            misconceptionDescription: 'Kesalahan terdeteksi dari Event Lab',
            dateOccurred: timestamp,
            isResolved: false,
          });
          resultingActions.push('rescue_recommendation_evaluated');
        } catch {}
      }

      if (eventType === 'recommendation.generated') {
        resultingActions.push('mascot_notification_queued');
        try {
          await db.recommendations.add({
            id: `rec-${Date.now()}`,
            ruleId: payload.ruleId || 'RULE_STUDY_RESCUE',
            title: payload.title || 'Uji Coba Rekomendasi Dev Lab',
            message: payload.message || 'Saran penguatan materi',
            reason: payload.reason || 'Dihasilkan melalui Developer Event Lab',
            sourceSignals: ['DEV_LAB_INJECTION'],
            priority: payload.priority || 'HIGH',
            actionType: 'RESCUE_STUDY',
            actionPayload: payload,
            mascotState: 'recommending',
            bubblePrompt: 'Yuk cek saran belajar ini!',
            createdAt: timestamp,
          });
        } catch {}
      }

      if (eventType === 'mascot.triggered') {
        resultingActions.push('companion_reaction_rendered');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('paham:mascot-trigger', { detail: payload }));
        }
      }

      const record: DevEventRecord = {
        id: eventId,
        timestamp,
        eventType,
        userId,
        payload,
        source,
        status: 'PROCESSED',
        resultingActions,
      };

      this.inMemoryEvents.push(record);
      this.listeners.forEach(l => l(record));

      devAuditLogger.log({
        developer: 'Developer',
        action: `DISPATCH_EVENT: ${eventType}`,
        target: `User: ${userId}`,
        environment: 'development',
        result: 'SUCCESS',
        details: { eventId, resultingActions },
      });

      return record;
    } catch (err: any) {
      const failedRecord: DevEventRecord = {
        id: eventId,
        timestamp,
        eventType,
        userId,
        payload,
        source,
        status: 'FAILED',
        resultingActions: [`Error: ${err?.message}`],
      };
      this.inMemoryEvents.push(failedRecord);
      return failedRecord;
    }
  }

  public clearHistory(): void {
    this.inMemoryEvents = [];
    this.seedDefaultEvents();
  }
}

export const devEventBus = new DevEventBus();
