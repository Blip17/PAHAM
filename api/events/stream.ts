// Serverless Endpoint: GET /api/events/stream
// Server-Sent Events (SSE) Real-Time Stream delivering live server-pushed events to connected Paham clients

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnvironment, PahamEnvironment } from '../dev/_auth';
import { ServerEventStore, ConnectedClient } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId = 'guest-anonymous', env } = req.query;
  const currentEnv: PahamEnvironment = (env as PahamEnvironment) || getEnvironment();

  // Configure SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isTestUser = (userId as string).startsWith('dev-sim-') || (userId as string).startsWith('test-');

  // Client sender abstraction
  const connectedClient: ConnectedClient = {
    clientId,
    userId: String(userId),
    environment: currentEnv,
    isTestUser,
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    send: (data: string) => {
      try {
        res.write(data);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch {}
    },
  };

  // Register client in server store
  const unregister = ServerEventStore.registerClient(connectedClient);

  // Send Initial Handshake Frame
  const handshakePayload = {
    clientId,
    userId: String(userId),
    environment: currentEnv,
    onlineCount: ServerEventStore.getOnlineCount(currentEnv),
    serverTime: new Date().toISOString(),
    status: 'CONNECTED',
  };
  res.write(`event: system.handshake\ndata: ${JSON.stringify(handshakePayload)}\n\n`);

  // Deliver active persistent notifications for this user upon connection/reconnect
  const pendingNotifs = ServerEventStore.getActiveNotificationsForUser(String(userId));
  if (pendingNotifs.length > 0) {
    pendingNotifs.forEach((notif: any) => {
      res.write(`event: ${notif.eventType}\ndata: ${JSON.stringify({
        eventId: notif.eventId,
        eventType: notif.eventType,
        priority: notif.priority,
        payload: notif.payload,
        createdAt: notif.createdAt,
        isPersistentReplay: true,
      })}\n\n`);
    });
  }

  // Periodic heartbeat keepalive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } catch {
      clearInterval(heartbeatInterval);
      unregister();
    }
  }, 15000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unregister();
  });

  req.on('end', () => {
    clearInterval(heartbeatInterval);
    unregister();
  });
}
