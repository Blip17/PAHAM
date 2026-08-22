// Serverless Endpoint: POST /api/dev/auth
// Authenticates developer credentials and returns active environment + session token

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnvironment, verifyDevAuth } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const env = getEnvironment();
  const auth = verifyDevAuth(req);

  // If GET request, just check current session status
  if (req.method === 'GET') {
    return res.status(200).json({
      isAuthorized: auth.isAuthorized,
      environment: env,
      developerName: auth.isAuthorized ? auth.developerName : null,
      serverTime: new Date().toISOString(),
    });
  }

  // If POST request, attempt login
  const { passcode, developerName = 'Lead Engineer' } = req.body || {};
  const validSecret = process.env.PAHAM_DEV_SECRET || 'paham-dev-2026';

  if (passcode === validSecret || (env === 'DEVELOPMENT' && passcode === 'dev')) {
    return res.status(200).json({
      success: true,
      isAuthorized: true,
      environment: env,
      developerName,
      token: validSecret,
      permissions: {
        canInspectDatabase: true,
        canMutateDatabase: env !== 'PRODUCTION',
        canReplayJourneys: true,
        canTriggerMascot: true,
        canToggleFeatureFlags: true,
      },
      message: `Developer authenticated successfully (${env}).`,
      serverTime: new Date().toISOString(),
    });
  }

  return res.status(401).json({
    success: false,
    isAuthorized: false,
    environment: env,
    error: 'Kunci otorisasi pengembang salah. Akses ditolak.',
    serverTime: new Date().toISOString(),
  });
}
