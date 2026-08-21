// Serverless Backend Route for PAHAM AI Integration
// Handles secure server-side validation & AI request proxying without exposing secrets

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function sanitizeLog(text: string): string {
  if (!text) return '';
  return text.replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza...[REDACTED]');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const apiKey = token || req.body?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      provider: 'gemini',
      connectionStatus: 'ERROR',
      errorCategory: 'INVALID_KEY',
      message: 'Kunci API Gemini tidak ditemukan.',
    });
  }

  const { action, prompt, model = 'gemini-2.5-flash' } = req.body || {};

  try {
    const client = new GoogleGenAI({ apiKey });

    if (action === 'validate' || action === 'test') {
      const startTime = performance.now();
      const testRes = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Balas dengan 1 kata: "SIAP"',
      });

      const latencyMs = Math.round(performance.now() - startTime);

      return res.status(200).json({
        success: true,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        connectionStatus: 'CONNECTED',
        latencyMs,
        message: `Koneksi Gemini API berhasil diverifikasi (${latencyMs}ms).`,
      });
    }

    // Process general prompt
    if (action === 'generate' && prompt) {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });

      return res.status(200).json({
        success: true,
        data: response.text || '',
        provider: 'gemini',
        model,
        connectionStatus: 'CONNECTED',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Action tidak didukung atau prompt kosong.',
    });

  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const sanitizedMsg = sanitizeLog(rawMsg);
    
    let errorCategory = 'UNKNOWN_ERROR';
    if (sanitizedMsg.toLowerCase().includes('key') || sanitizedMsg.includes('400')) {
      errorCategory = 'INVALID_KEY';
    } else if (sanitizedMsg.includes('429') || sanitizedMsg.toLowerCase().includes('quota')) {
      errorCategory = 'QUOTA_EXCEEDED';
    }

    return res.status(400).json({
      success: false,
      provider: 'gemini',
      connectionStatus: 'ERROR',
      errorCategory,
      message: sanitizedMsg,
    });
  }
}
