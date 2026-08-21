// PAHAM Quality Guardian — Automated Test Suite
// Verifies full multi-perspective audit execution and overall application health score

import { describe, it, expect } from 'vitest';
import { qualityGuardian } from './qualityGuardian';

describe('PAHAM Quality Guardian — Continuous Audit Suite', () => {
  it('executes full multi-perspective audit and achieves healthy QA score (>= 90%)', async () => {
    const report = await qualityGuardian.runFullAudit();

    expect(report).toBeDefined();
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.failCount).toBe(0);
    expect(report.passCount).toBeGreaterThan(5);
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('verifies User Flow audits (FSRS calculation & Feynman studio)', async () => {
    const report = await qualityGuardian.runFullAudit();
    const flowFindings = report.findings.filter(f => f.category === 'USER_FLOW');

    expect(flowFindings.length).toBeGreaterThanOrEqual(2);
    expect(flowFindings.every(f => f.status === 'PASS')).toBe(true);
  });

  it('verifies Backend & Database schema integrity across all 18 Dexie tables', async () => {
    const report = await qualityGuardian.runFullAudit();
    const dbFinding = report.findings.find(f => f.id === 'be-dexie-schema');

    expect(dbFinding).toBeDefined();
    expect(dbFinding?.status).toBe('PASS');
  });

  it('verifies Security and Secret Redaction safeguards', async () => {
    const report = await qualityGuardian.runFullAudit();
    const secFinding = report.findings.find(f => f.id === 'sec-log-redaction');

    expect(secFinding).toBeDefined();
    expect(secFinding?.status).toBe('PASS');
  });

  it('measures Performance metrics accurately with low execution latency', async () => {
    const report = await qualityGuardian.runFullAudit();
    
    expect(report.performanceMetrics).toBeDefined();
    expect(report.performanceMetrics.fsrsProcessingLatencyMs).toBeLessThan(100);
    expect(report.performanceMetrics.engineCalculationLatencyMs).toBeLessThan(50);
  });
});
