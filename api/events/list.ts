import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload, applyCors } from '../dev/_auth';
import { ServerEventStore } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = requireDevAuth(req, res);
  if (!auth) return;

  const { limit = '100', eventType } = req.query;

  const events = ServerEventStore.getEvents(Number(limit), eventType ? String(eventType) : undefined);
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
    timestamp: new Date().toISOString(),
  }));
}
