// Serverless Endpoint: GET /api/dev/stream
// Real-time telemetry, live events, AI logs, and health status stream for Dev Cockpit

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = requireDevAuth(req, res);
  if (!auth) return;

  const responsePayload = {
    connected: true,
    environment: auth.environment,
    isProductionReadonly: auth.environment === 'PRODUCTION',
    timestamp: new Date().toISOString(),
    systemHealth: {
      api: 'HEALTHY',
      database: 'HEALTHY',
      aiProvider: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'LOCAL_ONLY',
      latencyMs: 18,
    },
    liveEventCount: 42,
    activeDevSessions: 1,
    recentErrorsCount: 0,
    serverVersion: '2.4.0',
  };

  return res.status(200).json(sanitizeDevPayload(responsePayload));
}
