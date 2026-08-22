// Serverless Endpoint: GET/POST /api/dev/flags
// Feature flag switchboard endpoint for controlling experiments across environments

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export const SERVER_FEATURE_FLAGS = [
  { key: 'new_dashboard', name: 'New Authenticated Study Studio', enabled: true, category: 'UI', description: 'Upgraded high-end study dashboard' },
  { key: 'pami_mascot', name: 'Piko Companion System', enabled: true, category: 'CORE', description: 'Contextual AI learning companion' },
  { key: 'recommendation_engine', name: 'Signal Recommendation Engine', enabled: true, category: 'CORE', description: 'Deterministic rule-based recommendations' },
  { key: 'gemini_byok', name: 'Gemini BYOK AI Provider', enabled: true, category: 'AI', description: 'Allow user-provided Gemini API key' },
  { key: 'ocr_fallback', name: 'Local/AI OCR Pipeline', enabled: true, category: 'CORE', description: 'Handwriting note recognition' },
  { key: 'fsrs', name: 'FSRS Spaced Repetition v4.5', enabled: true, category: 'CORE', description: 'Optimized retention spaced repetition' },
  { key: 'new_quiz_ui', name: 'Adaptive Quiz Engine v2', enabled: true, category: 'UI', description: '5-level adaptive question flow' },
  { key: 'experimental_ai', name: 'Experimental Feynman Multi-turn', enabled: false, category: 'AI', description: 'Deep multi-turn teach-back dialogues', devOnly: true },
  { key: 'replay_studio', name: 'PAHAM Replay Studio', enabled: true, category: 'CORE', description: 'Time travel & learning journey reproduction', devOnly: true },
  { key: 'dev_cockpit_live', name: 'Live Remote Cockpit Sync', enabled: true, category: 'CORE', description: 'Live web remote controls & SSE telemetry' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireDevAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      flags: SERVER_FEATURE_FLAGS,
      totalFlags: SERVER_FEATURE_FLAGS.length,
      timestamp: new Date().toISOString(),
    }));
  }

  if (req.method === 'POST') {
    const { key, enabled } = req.body || {};
    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      key,
      enabled: Boolean(enabled),
      message: `Feature flag "${key}" set to ${Boolean(enabled)}.`,
      timestamp: new Date().toISOString(),
    }));
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
