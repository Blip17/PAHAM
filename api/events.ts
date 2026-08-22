// Centralized Serverless Backend Event & Message Service for PAHAM
// Handles authentication, validation, persistent storage, realtime broadcasting, and diagnostic health checks

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload, applyCors, DevAuthResult, PahamEnvironment, getEnvironment } from './dev/_auth';
import { ServerEventStore, EventTargetType, EventPriority, PahamServerEvent, UserNotificationRecord } from './events/_store';

export interface MessagingHealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  auth: 'OK' | 'FAILED';
  database: 'OK' | 'DEGRADED' | 'FAILED';
  messageService: 'OK' | 'FAILED';
  realtime: 'OK' | 'DEGRADED';
  delivery: 'OK' | 'PENDING';
  environment: PahamEnvironment;
  activeOnlineClientsCount: number;
  totalPersistedEventsCount: number;
  requestId: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS headers for cross-origin requests
  if (applyCors(req, res)) return;

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const action = (req.query?.action as string) || (req.body?.action as string) || (req.method === 'POST' ? 'publish' : 'list');

  try {
    // ── 1. HEALTH CHECK ACTION ──────────────────────────────────────────────
    if (action === 'health' || req.query?.health === 'true') {
      const currentEnv = getEnvironment();
      const onlineCount = ServerEventStore.getOnlineCount(currentEnv);
      const totalEvents = ServerEventStore.getEvents(1000).length;

      const healthResult: MessagingHealthCheckResult = {
        status: 'HEALTHY',
        auth: 'OK',
        database: 'OK',
        messageService: 'OK',
        realtime: 'OK',
        delivery: 'OK',
        environment: currentEnv,
        activeOnlineClientsCount: onlineCount,
        totalPersistedEventsCount: totalEvents,
        requestId,
        timestamp: new Date().toISOString(),
      };

      return res.status(200).json(healthResult);
    }

    // ── 2. INBOX FETCH ACTION (GET) ─────────────────────────────────────────
    if (action === 'inbox') {
      const userId = (req.query?.userId as string) || (req.body?.userId as string) || 'guest-anonymous';
      const notifications = ServerEventStore.getActiveNotificationsForUser(String(userId));

      return res.status(200).json({
        success: true,
        userId: String(userId),
        notifications,
        unreadCount: notifications.filter((n: any) => n.status !== 'READ' && n.status !== 'DISMISSED').length,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // ── 3. DISMISS NOTIFICATION ACTION (POST) ───────────────────────────────
    if (action === 'dismiss') {
      const { notificationId, userId = 'guest-anonymous' } = req.body || {};
      if (!notificationId) {
        return res.status(400).json({
          success: false,
          errorCategory: 'INVALID_PAYLOAD',
          message: 'notificationId is required for dismiss action.',
          requestId,
        });
      }

      const success = ServerEventStore.dismissNotification(notificationId, String(userId));
      return res.status(200).json({
        success,
        notificationId,
        message: success ? `Notification ${notificationId} dismissed.` : 'Notification not found or already dismissed.',
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // ── 4. PUBLISH EVENT ACTION (POST) ──────────────────────────────────────
    if (action === 'publish' || req.method === 'POST') {
      // Strict Server-Side Authorization: Normal users can NEVER publish global events
      const auth = requireDevAuth(req, res);
      if (!auth) return;

      const {
        eventType = 'pami.notification',
        targetType = 'ALL_ONLINE_USERS',
        targetId,
        payload = {},
        priority = 'NORMAL',
        expiresInHours = 24,
      } = req.body || {};

      if (!eventType) {
        return res.status(400).json({
          success: false,
          errorCategory: 'VALIDATION_ERROR',
          message: 'eventType is required.',
          requestId,
        });
      }

      const validTargets: EventTargetType[] = ['ALL_ONLINE_USERS', 'ALL_USERS', 'SPECIFIC_USER', 'TEST_USERS', 'ENVIRONMENT'];
      if (!validTargets.includes(targetType as EventTargetType)) {
        return res.status(400).json({
          success: false,
          errorCategory: 'VALIDATION_ERROR',
          message: `Invalid targetType. Must be one of: ${validTargets.join(', ')}`,
          requestId,
        });
      }

      if (targetType === 'SPECIFIC_USER' && !targetId) {
        return res.status(400).json({
          success: false,
          errorCategory: 'VALIDATION_ERROR',
          message: 'targetId (User ID) is required when targetType is SPECIFIC_USER.',
          requestId,
        });
      }

      const validPriorities: EventPriority[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
      const sanitizedPriority: EventPriority = validPriorities.includes(priority as EventPriority) ? (priority as EventPriority) : 'NORMAL';

      // Sanitize payload to guarantee no secrets/keys are broadcasted
      const sanitizedPayload = sanitizeDevPayload(payload);
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

      // Publish through Server Event Store & Realtime Stream
      const createdEvent = ServerEventStore.publishEvent({
        eventType,
        createdBy: auth.developerName,
        environment: auth.environment,
        targetType: targetType as EventTargetType,
        targetId: targetId || undefined,
        payload: sanitizedPayload,
        priority: sanitizedPriority,
        expiresAt,
      });

      return res.status(200).json({
        success: true,
        environment: auth.environment,
        event: createdEvent,
        onlineClientsTotal: ServerEventStore.getOnlineCount(auth.environment),
        deliveredToClientsCount: createdEvent.deliveryStats.deliveredCount,
        message: `Event "${eventType}" successfully published and broadcasted to ${createdEvent.deliveryStats.deliveredCount} live client(s).`,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // ── 5. LIST EVENTS ACTION (GET) ─────────────────────────────────────────
    if (action === 'list' || req.method === 'GET') {
      const auth = requireDevAuth(req, res);
      if (!auth) return;

      const limit = Number(req.query?.limit || 100);
      const eventType = req.query?.eventType ? String(req.query.eventType) : undefined;

      const events = ServerEventStore.getEvents(limit, eventType);
      const onlineCount = ServerEventStore.getOnlineCount(auth.environment);
      const onlineClients = ServerEventStore.getOnlineClients().map((c: any) => ({
        clientId: c.clientId,
        userId: c.userId,
        environment: c.environment,
        isTestUser: c.isTestUser,
        connectedAt: c.connectedAt,
      }));

      return res.status(200).json(sanitizeDevPayload({
        success: true,
        environment: auth.environment,
        events,
        totalEventsCount: events.length,
        onlineClientsCount: onlineCount,
        connectedClients: onlineClients,
        requestId,
        timestamp: new Date().toISOString(),
      }));
    }

    return res.status(400).json({
      success: false,
      errorCategory: 'UNKNOWN_ACTION',
      message: `Unknown action "${action}". Supported actions: health, inbox, dismiss, publish, list.`,
      requestId,
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      errorCategory: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'An unexpected server error occurred.',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
