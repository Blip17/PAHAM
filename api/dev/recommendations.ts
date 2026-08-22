// Serverless Endpoint: GET/POST /api/dev/recommendations
// Recommendation engine evaluator, rule inspection, and source signal testing

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireDevAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET' || req.method === 'POST') {
    const { 
      accuracyPercent = 42, 
      overdueCardsCount = 6, 
      daysInactive = 1, 
      daysToExam = 2, 
      repeatedMistakesCount = 3 
    } = req.method === 'POST' ? (req.body || {}) : req.query;

    const evaluatedRules = [];

    if (Number(repeatedMistakesCount) >= 2 || Number(accuracyPercent) < 50) {
      evaluatedRules.push({
        ruleId: 'RULE_STUDY_RESCUE',
        priority: 'HIGH',
        title: 'Penguatan Konsep Prioritas',
        reason: `Terdeteksi ${repeatedMistakesCount} kesalahan berturut-turut pada topik penting (Akurasi: ${accuracyPercent}%).`,
        actionType: 'RESCUE_STUDY',
        confidenceScore: 0.96,
        sourceSignals: ['REPEATED_MISTAKES', 'ACCURACY_DROP'],
      });
    }

    if (Number(overdueCardsCount) >= 3) {
      evaluatedRules.push({
        ruleId: 'RULE_FSRS_DUE',
        priority: 'MEDIUM',
        title: 'Review Kilas Jatuh Tempo',
        reason: `Ada ${overdueCardsCount} kartu flashcard yang jatuh tempo review FSRS hari ini.`,
        actionType: 'REVIEW_FLASHCARDS',
        confidenceScore: 0.92,
        sourceSignals: ['FSRS_OVERDUE'],
      });
    }

    if (Number(daysToExam) <= 3) {
      evaluatedRules.push({
        ruleId: 'RULE_EXAM_PREPARATION',
        priority: 'HIGH',
        title: 'Hitung Mundur Ujian (${daysToExam} Hari Lagi)',
        reason: 'Ujian PAS Matematika dijadwalkan segera. Fokus simulasi soal ujian terarah.',
        actionType: 'SIMULATE_EXAM',
        confidenceScore: 0.98,
        sourceSignals: ['UPCOMING_EXAM'],
      });
    }

    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      recommendations: evaluatedRules,
      totalRulesEvaluated: 8,
      activatedRulesCount: evaluatedRules.length,
      timestamp: new Date().toISOString(),
    }));
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
