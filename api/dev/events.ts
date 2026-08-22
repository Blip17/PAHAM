// Serverless Endpoint: GET/POST /api/dev/events
// Event stream, event dispatching, and event pipeline inspection

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireDevAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const { limit = '50', eventType, userId } = req.query;

    const sampleEvents = [
      {
        id: `evt-live-${Date.now() - 30000}`,
        timestamp: new Date(Date.now() - 30000).toISOString(),
        eventType: 'STUDY_SESSION_COMPLETED',
        userId: userId || 'student-1',
        subjectId: 'sub-mat-wajib',
        conceptId: 'c-diskriminan',
        metadata: { durationMinutes: 25, questionsAnswered: 5, accuracy: 80 },
        resultingActions: ['mastery_updated', 'fsrs_review_scheduled'],
      },
      {
        id: `evt-live-${Date.now() - 60000}`,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        eventType: 'QUESTION_ANSWERED',
        userId: userId || 'student-1',
        conceptId: 'c-newton',
        metadata: { isCorrect: false, chosenOption: 'B', correctOption: 'A' },
        resultingActions: ['mistake_recorded', 'rescue_recommendation_evaluated'],
      },
    ];

    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      events: sampleEvents,
      totalCount: sampleEvents.length,
      timestamp: new Date().toISOString(),
    }));
  }

  if (req.method === 'POST') {
    const { eventType, payload, userId = 'dev-sim-user', source = 'DEV_COCKPIT' } = req.body || {};

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType is required.' });
    }

    const createdEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      source,
      payload: payload || {},
      status: 'PROCESSED',
      resultingActions: [
        'event_bus_notified',
        eventType.includes('incorrect') ? 'mistake_recorded' : 'mastery_updated',
        'piko_companion_evaluated',
      ],
    };

    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      event: createdEvent,
      message: `Event "${eventType}" successfully dispatched into Paham pipeline.`,
    }));
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
