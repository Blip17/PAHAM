// PAHAM Internal Developer Cockpit — Comprehensive Unit & Integration Test Suite

import { describe, it, expect } from 'vitest';
import { featureFlagService } from './services/featureFlagService';
import { devEventBus } from './services/devEventBus';
import { userSimulatorService, SYNTHETIC_PRESETS } from './services/userSimulatorService';
import { devAuditLogger } from './services/devAuditLogger';
import { devErrorTracker } from './services/devErrorTracker';
import { devAiLogger } from './services/devAiLogger';
import { liveRemoteService } from './services/liveRemoteService';
import { devApiClient } from './services/devApiClient';
import { sanitizeDevPayload } from '../../api/dev/_auth';
import { REPLAY_JOURNEYS } from '../../api/dev/replay';
import { ServerEventStore } from '../../api/events/_store';
import unifiedEventsHandler from '../../api/events';
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

  // ── 8. Live Dev API Client & Environment Separation ───────────────────────
  it('detects active environment and provides authenticated telemetry client', async () => {
    const env = devApiClient.getEnvironment();
    expect(['DEVELOPMENT', 'STAGING', 'PRODUCTION']).toContain(env);

    const loginRes = await devApiClient.login('paham-dev-2026');
    expect(loginRes.success).toBe(true);

    const telemetry = await devApiClient.fetchTelemetry();
    expect(telemetry).toBeDefined();
    expect(telemetry.services.database.tablesCount).toBe(18);
    expect(telemetry.status).toBe('HEALTHY');
  });

  // ── 9. Server-Side Secret Redaction & Sanitization ────────────────────────
  it('redacts sensitive API keys and secrets from dev payloads', () => {
    const rawSecretData = {
      apiKey: 'AIzaSyD-secret-key-1234567890abcdef',
      user: {
        email: 'test@paham.id',
        password_hash: 'argon2$secretpassword',
        authSecret: 'super-secret-jwt-token',
      },
      message: 'Calling Gemini with key AIzaSyD-1234567890abcdef1234567890abcdef',
    };

    const sanitized = sanitizeDevPayload(rawSecretData);
    expect(sanitized.apiKey).toBe('[REDACTED_SECRET]');
    expect(sanitized.user.password_hash).toBe('[REDACTED_SECRET]');
    expect(sanitized.user.authSecret).toBe('[REDACTED_SECRET]');
    expect(sanitized.message).not.toContain('AIzaSyD-1234567890abcdef1234567890abcdef');
    expect(sanitized.message).toContain('[REDACTED_API_KEY]');
  });

  // ── 10. Replay Studio Journey State Machine ───────────────────────────────
  it('reproduces struggling student journey and activates rescue rule upon mistake spike', () => {
    const rescueJourney = REPLAY_JOURNEYS.STRUGGLING_STUDENT_RESCUE;
    expect(rescueJourney).toBeDefined();
    expect(rescueJourney.steps.length).toBeGreaterThanOrEqual(6);

    // Verify step sequence
    const step1 = rescueJourney.steps[0];
    expect(step1.stageName).toBe('USER CREATED');
    expect(step1.stateSnapshot.mistakesCount).toBe(0);

    // Verify mistake spike triggers recommendation
    const recStep = rescueJourney.steps.find(s => s.stateSnapshot.activeRuleId === 'RULE_STUDY_RESCUE');
    expect(recStep).toBeDefined();
    expect(recStep?.stateSnapshot.pikoEmotion).toBe('recommending');
    expect(recStep?.stateSnapshot.pikoSpeech).toContain('Diskriminan');
  });

  // ── 11. Server-Backed Realtime Event & Targeting Architecture ─────────────
  it('broadcasts server events globally and enforces user targeting rules', () => {
    // Setup Mock SSE clients: User A and User B
    let receivedUserA: any = null;
    let receivedUserB: any = null;

    const unregisterA = ServerEventStore.registerClient({
      clientId: 'client-user-a',
      userId: 'user-a',
      environment: 'DEVELOPMENT',
      isTestUser: false,
      connectedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      send: (data: string) => {
        receivedUserA = data;
      },
    });

    const unregisterB = ServerEventStore.registerClient({
      clientId: 'client-user-b',
      userId: 'user-b',
      environment: 'DEVELOPMENT',
      isTestUser: false,
      connectedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      send: (data: string) => {
        receivedUserB = data;
      },
    });

    expect(ServerEventStore.getOnlineCount('DEVELOPMENT')).toBeGreaterThanOrEqual(2);

    // 1. Publish Global Event -> Both User A and User B must receive it
    const globalEvent = ServerEventStore.publishEvent({
      eventType: 'pami.notification',
      createdBy: 'Lead Engineer',
      environment: 'DEVELOPMENT',
      targetType: 'ALL_ONLINE_USERS',
      payload: { message: 'Global realtime test', mascotState: 'happy' },
      priority: 'NORMAL',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(globalEvent.status).toBe('DELIVERED');
    expect(globalEvent.deliveryStats.deliveredCount).toBe(2);
    expect(receivedUserA).toContain('Global realtime test');
    expect(receivedUserB).toContain('Global realtime test');

    // 2. Publish Targeted Event -> Only User A receives it, User B does NOT
    receivedUserA = null;
    receivedUserB = null;

    const targetedEvent = ServerEventStore.publishEvent({
      eventType: 'pami.notification',
      createdBy: 'Lead Engineer',
      environment: 'DEVELOPMENT',
      targetType: 'SPECIFIC_USER',
      targetId: 'user-a',
      payload: { message: 'Targeted test for User A only', mascotState: 'encouraging' },
      priority: 'HIGH',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(targetedEvent.deliveryStats.deliveredCount).toBe(1);
    expect(receivedUserA).toContain('Targeted test for User A only');
    expect(receivedUserB).toBeNull();

    // 3. Persistent Inboxes across Page Refresh
    const persistentNotifsA = ServerEventStore.getActiveNotificationsForUser('user-a');
    expect(persistentNotifsA.length).toBeGreaterThanOrEqual(2);
    expect(persistentNotifsA.some(n => n.message.includes('Targeted test'))).toBe(true);

    const persistentNotifsB = ServerEventStore.getActiveNotificationsForUser('user-b');
    expect(persistentNotifsB.some(n => n.message.includes('Targeted test'))).toBe(false);

    // Cleanup
    unregisterA();
    unregisterB();
  });

  // ── 12. Unified Serverless Event Endpoint Handler (api/events.ts) ─────────
  it('handles unified /api/events actions (health, inbox, publish, list)', async () => {
    // 1. Health check action
    let healthJsonResult: any = null;
    const mockHealthReq: any = {
      method: 'GET',
      query: { action: 'health' },
      headers: {},
    };
    const mockHealthRes: any = {
      setHeader: () => {},
      status: (code: number) => ({
        json: (data: any) => {
          healthJsonResult = { code, data };
        },
      }),
    };

    await unifiedEventsHandler(mockHealthReq, mockHealthRes);
    expect(healthJsonResult).toBeDefined();
    expect(healthJsonResult.code).toBe(200);
    expect(healthJsonResult.data.status).toBe('HEALTHY');
    expect(healthJsonResult.data.auth).toBe('OK');
    expect(healthJsonResult.data.messageService).toBe('OK');

    // 2. Publish action
    let publishJsonResult: any = null;
    const mockPublishReq: any = {
      method: 'POST',
      query: {},
      headers: { 'x-dev-token': 'paham-dev-2026' },
      body: {
        action: 'publish',
        eventType: 'pami.notification',
        targetType: 'ALL_ONLINE_USERS',
        payload: { message: 'Unified endpoint test', mascotState: 'celebrating' },
      },
    };
    const mockPublishRes: any = {
      setHeader: () => {},
      status: (code: number) => ({
        json: (data: any) => {
          publishJsonResult = { code, data };
        },
      }),
    };

    await unifiedEventsHandler(mockPublishReq, mockPublishRes);
    expect(publishJsonResult).toBeDefined();
    expect(publishJsonResult.code).toBe(200);
    expect(publishJsonResult.data.success).toBe(true);

    // 3. Inbox fetch action
    let inboxJsonResult: any = null;
    const mockInboxReq: any = {
      method: 'GET',
      query: { action: 'inbox', userId: 'user-a' },
      headers: {},
    };
    const mockInboxRes: any = {
      setHeader: () => {},
      status: (code: number) => ({
        json: (data: any) => {
          inboxJsonResult = { code, data };
        },
      }),
    };

    await unifiedEventsHandler(mockInboxReq, mockInboxRes);
    expect(inboxJsonResult).toBeDefined();
    expect(inboxJsonResult.code).toBe(200);
    expect(inboxJsonResult.data.notifications.length).toBeGreaterThanOrEqual(1);
  });
});
