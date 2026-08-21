// PAHAM Dev Audit Logger
// Records all privileged developer actions, synthetic modifications, and destructive operations

import { DevAuditLogEntry } from '../types';

class DevAuditLogger {
  private logs: DevAuditLogEntry[] = [];

  constructor() {
    this.seedInitialLogs();
  }

  private seedInitialLogs() {
    this.logs = [
      {
        id: 'audit-1',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        developer: 'Dev Lead (Local Session)',
        action: 'BOOTSTRAP_DEV_ENVIRONMENT',
        target: 'System',
        environment: 'development',
        result: 'SUCCESS',
        details: { seedTables: 18, seedSubjects: 17 },
      },
    ];
  }

  public log(entry: Omit<DevAuditLogEntry, 'id' | 'timestamp'>): DevAuditLogEntry {
    const fullEntry: DevAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(fullEntry);
    return fullEntry;
  }

  public getLogs(limit: number = 100): DevAuditLogEntry[] {
    return [...this.logs].slice(-limit).reverse();
  }

  public clearLogs(): void {
    this.logs = [];
    this.seedInitialLogs();
  }
}

export const devAuditLogger = new DevAuditLogger();
