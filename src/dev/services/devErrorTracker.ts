// PAHAM Dev Error Tracker
// Centralized runtime error grouping, stack trace capture, and resolution tracking

import { DevErrorEntry } from '../types';

class DevErrorTracker {
  private errors: Map<string, DevErrorEntry> = new Map();

  constructor() {
    this.seedSampleErrors();
    this.setupGlobalErrorHandler();
  }

  private seedSampleErrors() {
    this.recordError(
      'Dexie read skipped in headless test runner',
      'components/AuthPanel.tsx:142',
      '/login',
      'LOW'
    );
  }

  private setupGlobalErrorHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError(
          event.message || 'Uncaught JavaScript Exception',
          event.filename ? `${event.filename}:${event.lineno}` : 'Unknown component',
          window.location.pathname || '/',
          'HIGH',
          event.error?.stack
        );
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        this.recordError(
          `Unhandled Promise Rejection: ${message}`,
          'Async Pipeline',
          window.location.pathname || '/',
          'HIGH',
          reason instanceof Error ? reason.stack : undefined
        );
      });
    }
  }

  public recordError(
    message: string,
    component: string = 'Unknown',
    route: string = '/',
    severity: DevErrorEntry['severity'] = 'MEDIUM',
    stack?: string
  ): DevErrorEntry {
    const errorKey = `${message}::${component}`;
    const existing = this.errors.get(errorKey);
    const now = new Date().toISOString();

    if (existing) {
      existing.occurrences += 1;
      existing.lastSeen = now;
      existing.resolved = false;
      this.errors.set(errorKey, existing);
      return existing;
    }

    const newError: DevErrorEntry = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      message,
      component,
      route,
      severity,
      stack,
      occurrences: 1,
      firstSeen: now,
      lastSeen: now,
      resolved: false,
    };

    this.errors.set(errorKey, newError);
    return newError;
  }

  public getErrors(): DevErrorEntry[] {
    return Array.from(this.errors.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }

  public markResolved(id: string): void {
    for (const [key, error] of this.errors.entries()) {
      if (error.id === id) {
        error.resolved = true;
        this.errors.set(key, error);
        break;
      }
    }
  }

  public clearErrors(): void {
    this.errors.clear();
  }
}

export const devErrorTracker = new DevErrorTracker();
