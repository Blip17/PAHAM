// Local-First Placement History Storage for PAHAM
// Stores completed diagnostic reports and retrieves previous attempts for delta comparisons

import { PlacementDiagnosticReport } from './types';
import { SupportedLanguageId } from '../core/types';

const STORAGE_KEY_PREFIX = 'paham_placement_history_';

export class PlacementStorage {
  /**
   * Save a completed placement diagnostic report
   */
  public static async saveReport(report: PlacementDiagnosticReport): Promise<void> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${report.userId}_${report.languageId}`;
      const history = await this.getHistory(report.userId, report.languageId);
      history.unshift(report); // Add to front

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(history));
      }
    } catch (err) {
      console.warn('[PlacementStorage] Failed to save placement report locally:', err);
    }
  }

  /**
   * Get all past placement attempts for a user and language
   */
  public static async getHistory(
    userId: string,
    languageId: SupportedLanguageId
  ): Promise<PlacementDiagnosticReport[]> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}_${languageId}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (err) {
      console.warn('[PlacementStorage] Failed to load placement history:', err);
    }
    return [];
  }

  /**
   * Get the most recent previous placement report for comparison
   */
  public static async getLatestReport(
    userId: string,
    languageId: SupportedLanguageId
  ): Promise<PlacementDiagnosticReport | null> {
    const history = await this.getHistory(userId, languageId);
    return history.length > 0 ? history[0] : null;
  }
}
