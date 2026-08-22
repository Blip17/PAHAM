// Serverless Endpoint: POST /api/events/publish
// Authorizes developer action and broadcasts persistent events to all live connected Paham clients

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from '../dev/_auth';
import { ServerEventStore, EventTargetType, EventPriority } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

  // Validation
  if (!eventType) {
    return res.status(400).json({ success: false, error: 'eventType is required.' });
  }

  const validTargets: EventTargetType[] = ['ALL_ONLINE_USERS', 'ALL_USERS', 'SPECIFIC_USER', 'TEST_USERS', 'ENVIRONMENT'];
  if (!validTargets.includes(targetType as EventTargetType)) {
    return res.status(400).json({ success: false, error: `Invalid targetType. Must be one of: ${validTargets.join(', ')}` });
  }

  if (targetType === 'SPECIFIC_USER' && !targetId) {
    return res.status(400).json({ success: false, error: 'targetId (User ID) is required when targetType is SPECIFIC_USER.' });
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
    timestamp: new Date().toISOString(),
  });
}
