// PAHAM Personal Learning Companion — Service Layer
// Orchestrates recommendation evaluation, user interactions (accept, dismiss, snooze), and preference persistence

import { db } from '../../core/db';
import {
  CompanionRecommendation,
  CompanionNotificationPreferences,
  RecommendationOutcome
} from '../../core/types';
import { companionEngine } from './recommendationEngine';

export const DEFAULT_COMPANION_PREFERENCES: CompanionNotificationPreferences = {
  enableHighPriority: true,
  enableMediumPriority: true,
  enableLowPriority: true,
  suppressedRuleIds: [],
  cornerCompanionVisible: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:30',
};

export class CompanionService {
  /**
   * Retrieves user preferences for companion notifications
   */
  public async getPreferences(): Promise<CompanionNotificationPreferences> {
    try {
      const stored = await db.companionPreferences.get('user_companion_prefs');
      if (stored) return stored;
    } catch {}
    return DEFAULT_COMPANION_PREFERENCES;
  }

  /**
   * Updates user companion preferences
   */
  public async updatePreferences(prefs: Partial<CompanionNotificationPreferences>): Promise<CompanionNotificationPreferences> {
    const current = await this.getPreferences();
    const updated: CompanionNotificationPreferences = { ...current, ...prefs };
    try {
      await db.companionPreferences.put(updated, 'user_companion_prefs');
    } catch (err) {
      console.warn('[CompanionService] Failed to save preferences to Dexie', err);
    }
    return updated;
  }

  /**
   * Evaluates all signals from database and returns prioritized active recommendations
   */
  public async getActiveRecommendations(currentDate: Date = new Date()): Promise<CompanionRecommendation[]> {
    try {
      const concepts = await db.concepts.toArray();
      const subjects = await db.subjects.toArray();
      const studentStatesArr = await db.studentConceptStates.toArray();
      const studentStates = new Map(studentStatesArr.map(s => [s.conceptId, s]));
      const mistakes = await db.mistakeRecords.toArray();
      const flashcards = await db.flashcards.toArray();
      const exams = await db.exams.toArray();
      const goals = await db.goals.toArray();
      const materials = await db.materials.toArray();
      const learningEvents = await db.learningEvents.toArray();
      const preferences = await this.getPreferences();
      const pastRecommendations = await db.recommendations.toArray();

      // Check quiet hours
      if (preferences.quietHoursEnabled && this.isQuietHour(currentDate, preferences.quietHoursStart, preferences.quietHoursEnd)) {
        // In quiet hours, only return non-intrusive low or high emergency items
        return [];
      }

      const generated = companionEngine.generateRecommendations({
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
        currentDate,
      });

      // Filter out recommendations that have been accepted or permanently dismissed
      const pastMap = new Map(pastRecommendations.map(p => [p.id, p]));
      const active = generated.filter(rec => {
        const existing = pastMap.get(rec.id);
        if (!existing) return true;
        if (existing.outcome === 'ACCEPTED' || existing.outcome === 'DISMISSED') return false;
        if (existing.snoozedUntil && new Date(existing.snoozedUntil).getTime() > currentDate.getTime()) return false;
        return true;
      });

      return active;
    } catch (err) {
      console.warn('[CompanionService] Failed to generate active recommendations', err);
      return [];
    }
  }

  /**
   * Gets the single most critical top recommendation
   */
  public async getTopRecommendation(currentDate: Date = new Date()): Promise<CompanionRecommendation | null> {
    const list = await this.getActiveRecommendations(currentDate);
    return list[0] || null;
  }

  /**
   * Accepts a recommendation, records learning event & timestamp
   */
  public async acceptRecommendation(recommendation: CompanionRecommendation): Promise<void> {
    const updated: CompanionRecommendation = {
      ...recommendation,
      acceptedAt: new Date().toISOString(),
      outcome: 'ACCEPTED',
    };

    try {
      await db.recommendations.put(updated);
      await db.learningEvents.add({
        id: `evt-rec-accept-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'STUDY_SESSION_COMPLETED',
        metadata: { recommendationId: recommendation.id, ruleId: recommendation.ruleId, priority: recommendation.priority },
      });
    } catch (err) {
      console.warn('[CompanionService] Failed to record recommendation acceptance', err);
    }
  }

  /**
   * Dismisses a recommendation, optionally suppressing this rule type
   */
  public async dismissRecommendation(recommendation: CompanionRecommendation, suppressRule: boolean = false): Promise<void> {
    const updated: CompanionRecommendation = {
      ...recommendation,
      dismissedAt: new Date().toISOString(),
      outcome: 'DISMISSED',
      suppressedRule: suppressRule ? recommendation.ruleId : undefined,
    };

    try {
      await db.recommendations.put(updated);
      if (suppressRule) {
        const prefs = await this.getPreferences();
        const ruleSet = new Set(prefs.suppressedRuleIds || []);
        ruleSet.add(recommendation.ruleId);
        await this.updatePreferences({ suppressedRuleIds: Array.from(ruleSet) });
      }
    } catch (err) {
      console.warn('[CompanionService] Failed to record recommendation dismissal', err);
    }
  }

  /**
   * Snoozes a recommendation for a specified number of hours
   */
  public async snoozeRecommendation(recommendation: CompanionRecommendation, hours: number = 2): Promise<void> {
    const snoozeDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const updated: CompanionRecommendation = {
      ...recommendation,
      snoozedUntil: snoozeDate,
      outcome: 'SNOOZED',
    };

    try {
      await db.recommendations.put(updated);
    } catch (err) {
      console.warn('[CompanionService] Failed to snooze recommendation', err);
    }
  }

  /**
   * Calculates recommendation performance and acceptance metrics
   */
  public async getAcceptanceMetrics(): Promise<{
    totalGenerated: number;
    totalAccepted: number;
    totalDismissed: number;
    totalSnoozed: number;
    acceptanceRate: number;
  }> {
    try {
      const all = await db.recommendations.toArray();
      const totalAccepted = all.filter(r => r.outcome === 'ACCEPTED').length;
      const totalDismissed = all.filter(r => r.outcome === 'DISMISSED').length;
      const totalSnoozed = all.filter(r => r.outcome === 'SNOOZED').length;
      const decidedCount = totalAccepted + totalDismissed;
      const acceptanceRate = decidedCount > 0 ? Math.round((totalAccepted / decidedCount) * 100) : 0;

      return {
        totalGenerated: all.length,
        totalAccepted,
        totalDismissed,
        totalSnoozed,
        acceptanceRate,
      };
    } catch {
      return { totalGenerated: 0, totalAccepted: 0, totalDismissed: 0, totalSnoozed: 0, acceptanceRate: 0 };
    }
  }

  private isQuietHour(date: Date, startStr: string, endStr: string): boolean {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const currentTotal = date.getHours() * 60 + date.getMinutes();
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal > endTotal) {
      return currentTotal >= startTotal || currentTotal < endTotal;
    }
    return currentTotal >= startTotal && currentTotal < endTotal;
  }
}

export const companionService = new CompanionService();
