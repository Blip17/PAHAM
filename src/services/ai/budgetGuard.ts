// AI Budget Guard for PAHAM
// Protects against API rate limits, tracks token quotas, and manages local caching

export interface BudgetConfig {
  dailyCallLimit: number;
  hourlyCallLimit: number;
  warnThreshold: number; // e.g. 0.8 (80%)
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  dailyCallLimit: 50,
  hourlyCallLimit: 20,
  warnThreshold: 0.8,
};

const STORAGE_KEY_BUDGET = 'paham_ai_budget_state';
const STORAGE_KEY_API_KEY = 'paham_gemini_api_key';
const CACHE_PREFIX = 'paham_ai_cache_';

export class AIBudgetGuard {
  private dailyLimit: number;
  private hourlyLimit: number;

  constructor(config: BudgetConfig = DEFAULT_BUDGET_CONFIG) {
    this.dailyLimit = config.dailyCallLimit;
    this.hourlyLimit = config.hourlyCallLimit;
  }

  public getApiKey(): string | null {
    // Check localStorage or environment variable
    return localStorage.getItem(STORAGE_KEY_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
  }

  public setApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  }

  public getUsageState(): {
    callsToday: number;
    dailyLimit: number;
    callsThisHour: number;
    hourlyLimit: number;
    isBudgetExceeded: boolean;
    hasCustomApiKey: boolean;
  } {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const raw = localStorage.getItem(STORAGE_KEY_BUDGET);

    let data = { date: today, hour: currentHour, dayCount: 0, hourCount: 0 };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          data.dayCount = parsed.dayCount || 0;
          data.hourCount = parsed.hour === currentHour ? (parsed.hourCount || 0) : 0;
        }
      } catch (e) {
        console.error('Failed to parse budget state', e);
      }
    }

    const hasCustomApiKey = Boolean(this.getApiKey());
    // If student provided their own API key, limit is higher
    const effectiveDailyLimit = hasCustomApiKey ? 300 : this.dailyLimit;
    const isBudgetExceeded = data.dayCount >= effectiveDailyLimit || data.hourCount >= this.hourlyLimit;

    return {
      callsToday: data.dayCount,
      dailyLimit: effectiveDailyLimit,
      callsThisHour: data.hourCount,
      hourlyLimit: this.hourlyLimit,
      isBudgetExceeded,
      hasCustomApiKey,
    };
  }

  public canMakeRequest(): boolean {
    const usage = this.getUsageState();
    return !usage.isBudgetExceeded;
  }

  public recordRequest(): void {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const state = this.getUsageState();

    const updated = {
      date: today,
      hour: currentHour,
      dayCount: state.callsToday + 1,
      hourCount: state.callsThisHour + 1,
    };

    localStorage.setItem(STORAGE_KEY_BUDGET, JSON.stringify(updated));
  }

  /**
   * Caching helper: check cache for prompt
   */
  public getCachedResult(key: string): any | null {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      // Valid for 7 days
      if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  /**
   * Save response to cache
   */
  public setCachedResult(key: string, data: any): void {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('LocalStorage full, skipping cache save', e);
    }
  }
}

export const budgetGuard = new AIBudgetGuard();
