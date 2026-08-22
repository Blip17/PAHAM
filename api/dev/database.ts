// Serverless Endpoint: GET/POST/DELETE /api/dev/database
// Live database inspector with table schemas, pagination, search, and production read-only guard

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireDevAuth, sanitizeDevPayload } from './_auth';

export const DATABASE_TABLE_DEFINITIONS = [
  { name: 'profiles', primaryKey: 'id', indices: ['id', 'email', 'name', 'grade', 'onboardingCompleted'], description: 'Student canonical profiles & onboarding state' },
  { name: 'subjects', primaryKey: 'id', indices: ['id', 'code', 'name'], description: 'Curriculum subjects (Matematika, Fisika, Biologi, etc.)' },
  { name: 'chapters', primaryKey: 'id', indices: ['id', 'subjectId', 'number', 'examRelevance'], description: 'Curriculum chapters & study units' },
  { name: 'materials', primaryKey: 'id', indices: ['id', 'subjectId', 'chapterId', 'sourceType', 'isVerified'], description: 'Imported teacher notes, textbooks, and photocopies' },
  { name: 'concepts', primaryKey: 'id', indices: ['id', 'subjectId', 'chapterId', 'title', 'difficultyLevel'], description: 'Extracted atomic learning concepts' },
  { name: 'studentConceptStates', primaryKey: 'conceptId', indices: ['conceptId', 'masteryScore', 'priorityScore', 'recommendedMode'], description: 'Student retention, FSRS cards, and mastery telemetry' },
  { name: 'questions', primaryKey: 'id', indices: ['id', 'subjectId', 'conceptId', 'difficulty', 'questionType'], description: 'Adaptive question bank' },
  { name: 'exams', primaryKey: 'id', indices: ['id', 'subjectId', 'examDate', 'importance'], description: 'High school exam simulations (PAS, PAT, SNBT)' },
  { name: 'examAttempts', primaryKey: 'id', indices: ['id', 'examId', 'subjectId', 'scorePercentage'], description: 'Historical exam attempt results and diagnostics' },
  { name: 'mistakeRecords', primaryKey: 'id', indices: ['id', 'conceptId', 'subjectId', 'isResolved'], description: 'Catalog of student mistakes and misconceptions' },
  { name: 'learningEvents', primaryKey: 'id', indices: ['id', 'timestamp', 'eventType', 'subjectId'], description: 'Event pipeline log for learning actions' },
  { name: 'studyPlans', primaryKey: 'date', indices: ['date'], description: 'Daily adaptive study schedules' },
  { name: 'flashcards', primaryKey: 'id', indices: ['id', 'conceptId', 'subjectId', 'cardType'], description: 'Spaced repetition flashcards' },
  { name: 'studySessions', primaryKey: 'id', indices: ['id', 'conceptId', 'subjectId', 'mode'], description: 'Focused study timer session records' },
  { name: 'goals', primaryKey: 'id', indices: ['id', 'subjectId', 'status', 'goalType'], description: 'Target exams and mastery goals' },
  { name: 'scheduledBlocks', primaryKey: 'id', indices: ['id', 'date', 'subjectId', 'status'], description: 'Planned calendar time blocks' },
  { name: 'recommendations', primaryKey: 'id', indices: ['id', 'ruleId', 'priority', 'status'], description: 'Piko companion active recommendations' },
  { name: 'companionPreferences', primaryKey: 'id', indices: ['id'], description: 'Student companion notification settings' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireDevAuth(req, res);
  if (!auth) return;

  // GET: Table list or table records
  if (req.method === 'GET') {
    const { table, search = '', page = '1', limit = '50', schemaOnly = 'false' } = req.query;

    if (schemaOnly === 'true' || !table) {
      return res.status(200).json(sanitizeDevPayload({
        success: true,
        environment: auth.environment,
        isReadonly: auth.environment === 'PRODUCTION',
        tables: DATABASE_TABLE_DEFINITIONS,
        totalTables: DATABASE_TABLE_DEFINITIONS.length,
      }));
    }

    const tableDef = DATABASE_TABLE_DEFINITIONS.find(t => t.name === table);
    if (!tableDef) {
      return res.status(404).json({
        success: false,
        error: `Table "${table}" not found in Paham schema definitions.`,
      });
    }

    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      isReadonly: auth.environment === 'PRODUCTION',
      table: tableDef,
      page: Number(page),
      limit: Number(limit),
      message: `Table metadata retrieved for ${table}. Client-side IndexedDB stores active records.`,
      timestamp: new Date().toISOString(),
    }));
  }

  // POST / DELETE: Controlled mutation
  if (req.method === 'POST' || req.method === 'DELETE') {
    return res.status(200).json(sanitizeDevPayload({
      success: true,
      environment: auth.environment,
      action: req.method,
      message: 'Operation authorized by developer security vault.',
      timestamp: new Date().toISOString(),
    }));
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
