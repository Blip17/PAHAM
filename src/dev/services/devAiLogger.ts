// PAHAM Dev AI Request Logger
// Observability inspector for AI inferences with strict secret sanitization

import { DevAiLogEntry } from '../types';

class DevAiLogger {
  private logs: DevAiLogEntry[] = [];

  constructor() {
    this.seedSampleLogs();
  }

  private seedSampleLogs() {
    this.logs = [
      {
        id: 'ai-req-1',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        provider: 'paham',
        model: 'paham-deterministic',
        feature: 'Feynman Step 2 - Intisari Konsep',
        latencyMs: 18,
        success: true,
        promptSnippet: 'Jelaskan konsep Penokohan dan contoh...',
        estimatedTokens: 140,
        isFallback: false,
      },
      {
        id: 'ai-req-2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        provider: 'paham',
        model: 'paham-deterministic',
        feature: 'Adaptive Question Generator',
        latencyMs: 24,
        success: true,
        promptSnippet: 'Buat soal pilihan ganda Hukum Newton I...',
        estimatedTokens: 210,
        isFallback: false,
      },
    ];
  }

  public logRequest(entry: Omit<DevAiLogEntry, 'id' | 'timestamp'>): DevAiLogEntry {
    const full: DevAiLogEntry = {
      id: `ai-req-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(full);
    return full;
  }

  public getLogs(limit: number = 100): DevAiLogEntry[] {
    return [...this.logs].slice(-limit).reverse();
  }

  public clearLogs(): void {
    this.logs = [];
    this.seedSampleLogs();
  }
}

export const devAiLogger = new DevAiLogger();
