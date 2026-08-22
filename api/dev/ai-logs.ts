// Serverless Endpoint: GET /api/dev/ai-logs
// Sanitized AI request telemetry without exposing raw keys, tokens, or sensitive prompts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = requireDevAuth(req, res);
  if (!auth) return;

  const mockLogs = [
    {
      id: `ai-log-${Date.now() - 10000}`,
      timestamp: new Date(Date.now() - 10000).toISOString(),
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      feature: 'Concept Explanation',
      latencyMs: 340,
      estimatedTokens: 145,
      success: true,
      promptSnippet: 'Jelaskan konsep Hukum Newton I dengan analogi sehari-hari...',
      isFallback: false,
    },
    {
      id: `ai-log-${Date.now() - 45000}`,
      timestamp: new Date(Date.now() - 45000).toISOString(),
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      feature: 'Feynman Teach-Back Verification',
      latencyMs: 412,
      estimatedTokens: 210,
      success: true,
      promptSnippet: 'Evaluasi penjelasan siswa mengenai Persamaan Kuadrat...',
      isFallback: false,
    },
    {
      id: `ai-log-${Date.now() - 90000}`,
      timestamp: new Date(Date.now() - 90000).toISOString(),
      provider: 'paham-deterministic',
      model: 'heuristic-rule-engine',
      feature: 'Recommendation Generation',
      latencyMs: 8,
      estimatedTokens: 0,
      success: true,
      promptSnippet: 'Evaluate signal spike: 4 mistakes in Math',
      isFallback: false,
    },
  ];

  return res.status(200).json(sanitizeDevPayload({
    success: true,
    environment: auth.environment,
    logs: mockLogs,
    activeProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'paham-deterministic',
    totalRequests: mockLogs.length,
    timestamp: new Date().toISOString(),
  }));
}
