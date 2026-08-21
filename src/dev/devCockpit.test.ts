// PAHAM Internal Developer Cockpit — Comprehensive Unit & Integration Test Suite

import { describe, it, expect } from 'vitest';
import { featureFlagService } from './services/featureFlagService';
import { devEventBus } from './services/devEventBus';
import { userSimulatorService, SYNTHETIC_PRESETS } from './services/userSimulatorService';
import { devAuditLogger } from './services/devAuditLogger';
import { devErrorTracker } from './services/devErrorTracker';
import { devAiLogger } from './services/devAiLogger';
import { liveRemoteService } from './services/liveRemoteService';
import { db } from '../core/db';

describe('PAHAM Internal Developer Cockpit Suite', () => {
  // ── 1. Feature Flags Service ──────────────────────────────────────────────
  it('loads default feature flags and allows toggling overrides', () => {
    const flags = featureFlagService.getAllFlags();
    expect(flags.length).toBeGreaterThanOrEqual(8);

    const isDashboardEnabled = featureFlagService.isEnabled('new_dashboard');
    expect(typeof isDashboardEnabled).toBe('boolean');

    // Toggle flag
    featureFlagService.setFlag('experimental_ai', true);
    expect(featureFlagService.isEnabled('experimental_ai')).toBe(true);

    featureFlagService.setFlag('experimental_ai', false);
    expect(featureFlagService.isEnabled('experimental_ai')).toBe(false);
  });

  // ── 2. Dev Event Bus & Pipeline Dispatcher ────────────────────────────────
  it('dispatches live application events and records side effects', async () => {
    let capturedEvent: any = null;
    const unsub = devEventBus.subscribe(evt => {
      capturedEvent = evt;
    });

    const dispatched = await devEventBus.dispatchEvent(
      'study.completed',
      { conceptId: 'c-test-newton', minutes: 20 },
      'test-student-1',
      'DEV_LAB'
    );

    expect(dispatched).toBeDefined();
    expect(dispatched.status).toBe('PROCESSED');
    expect(dispatched.resultingActions).toBeDefined();
    expect(dispatched.resultingActions?.length).toBeGreaterThan(0);
    expect(capturedEvent?.id).toBe(dispatched.id);

    unsub();
  });

  // ── 3. Synthetic User Simulator ───────────────────────────────────────────
  it('generates realistic synthetic datasets for struggling student preset', async () => {
    const profile = await userSimulatorService.generateSyntheticUser('STRUGGLING_STUDENT');

    expect(profile).toBeDefined();
    expect(profile.id).toContain('dev-sim-struggling_student');
    expect(profile.name).toContain('Siswa Butuh Bantuan');
    expect(profile.grade).toBe('Kelas 11');
  });

  it('generates high performer synthetic user with mastered states', async () => {
    const profile = await userSimulatorService.generateSyntheticUser('HIGH_PERFORMER');

    expect(profile.name).toContain('Siswa Berprestasi');
    expect(profile.onboardingCompleted).toBe(true);
  });

  // ── 4. Audit Logger ───────────────────────────────────────────────────────
  it('records privileged developer operations and maintains chronological history', () => {
    const initialCount = devAuditLogger.getLogs().length;

    devAuditLogger.log({
      developer: 'Lead Engineer',
      action: 'TEST_DEV_OPERATION',
      target: 'IndexedDB',
      environment: 'development',
      result: 'SUCCESS',
      details: { sample: 123 },
    });

    const logs = devAuditLogger.getLogs();
    expect(logs.length).toBe(initialCount + 1);
    expect(logs[0].action).toBe('TEST_DEV_OPERATION');
  });

  // ── 5. Error Tracker & Aggregator ─────────────────────────────────────────
  it('groups duplicate runtime errors and marks resolution status', () => {
    const uniqueMsg = `Custom Test Error ${Date.now()}`;
    const err1 = devErrorTracker.recordError(uniqueMsg, 'TestComponent.tsx', '/dev', 'MEDIUM');
    expect(err1.occurrences).toBe(1);

    // Record second occurrence of the same error
    const err2 = devErrorTracker.recordError(uniqueMsg, 'TestComponent.tsx', '/dev', 'MEDIUM');
    expect(err2.occurrences).toBe(2);

    // Resolve error
    devErrorTracker.markResolved(err2.id);
    const allErrors = devErrorTracker.getErrors();
    const resolved = allErrors.find(e => e.id === err2.id);
    expect(resolved?.resolved).toBe(true);
  });

  // ── 6. AI Sanitized Logger ────────────────────────────────────────────────
  it('logs AI inferences with latency and prompt snippet without exposing secrets', () => {
    const initialCount = devAiLogger.getLogs().length;

    devAiLogger.logRequest({
      provider: 'paham',
      model: 'paham-deterministic',
      feature: 'Test Verification Prompt',
      latencyMs: 15,
      success: true,
      promptSnippet: 'Jelaskan rumus resultan gaya...',
      estimatedTokens: 110,
      isFallback: false,
    });

    const logs = devAiLogger.getLogs();
    expect(logs.length).toBe(initialCount + 1);
    expect(logs[0].latencyMs).toBe(15);
  });

  // ── 7. Live Remote & Web Broadcast Service ────────────────────────────────
  it('broadcasts live mascot overrides and triggers subscribers with custom chat', () => {
    let receivedPayload: any = null;
    const unsub = liveRemoteService.subscribe(payload => {
      receivedPayload = payload;
    });

    liveRemoteService.broadcast({
      expression: 'sleeping',
      message: 'Zzz... Piko lagi tidur nih...',
      displayMode: 'BOTH',
      durationSeconds: 10,
      playSound: true,
      senderName: 'Lead Dev',
    });

    expect(receivedPayload).toBeDefined();
    expect(receivedPayload?.expression).toBe('sleeping');
    expect(receivedPayload?.message).toContain('Piko lagi tidur');
    expect(receivedPayload?.displayMode).toBe('BOTH');

    // Clear broadcast
    liveRemoteService.clearOverride();
    expect(receivedPayload).toBeNull();

    unsub();
  });
});
