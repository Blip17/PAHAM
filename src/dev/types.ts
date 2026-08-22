// PAHAM Internal Developer Cockpit — Type Definitions
// Dense engineering definitions for observability, simulations, database explorer, and event lab

export type DevCockpitTab = 
  | 'overview'
  | 'replay'
  | 'database'
  | 'schema'
  | 'events'
  | 'scenarios'
  | 'simulator'
  | 'mascot'
  | 'recommendations'
  | 'ai'
  | 'errors'
  | 'flags'
  | 'security'
  | 'api'
  | 'jobs'
  | 'languages'
  | 'audit';

export type SystemHealthStatus = 'HEALTHY' | 'WARNING' | 'ERROR' | 'OFFLINE';

export interface SystemServiceStatus {
  name: string;
  status: SystemHealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

export interface DevEventRecord {
  id: string;
  timestamp: string;
  eventType: string;
  userId: string;
  payload: Record<string, any>;
  source: 'SYSTEM' | 'USER_ACTION' | 'DEV_LAB' | 'SCENARIO_BUILDER';
  status: 'PROCESSED' | 'QUEUED' | 'FAILED';
  resultingActions?: string[];
}

export interface DevScenarioStep {
  id: string;
  order: number;
  name: string;
  eventType: string;
  delayMs: number;
  payload: Record<string, any>;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  resultSummary?: string;
}

export type SyntheticUserPreset = 
  | 'NEW_USER'
  | 'ACTIVE_STUDENT'
  | 'STRUGGLING_STUDENT'
  | 'HIGH_PERFORMER'
  | 'EXAM_TOMORROW'
  | 'INACTIVE_USER'
  | 'FSRS_OVERDUE'
  | 'AI_HEAVY_USER'
  | 'OCR_HEAVY_USER';

export interface SyntheticUserMeta {
  preset: SyntheticUserPreset;
  title: string;
  description: string;
  badgeColor: string;
  statsPreview: {
    subjectsCount: number;
    conceptsCount: number;
    accuracyPercent: number;
    overdueCards: number;
    daysInactive: number;
    upcomingExamDays?: number;
  };
}

export interface DevAiLogEntry {
  id: string;
  timestamp: string;
  provider: 'gemini' | 'paham' | 'custom';
  model: string;
  feature: string;
  latencyMs: number;
  success: boolean;
  errorCategory?: string;
  promptSnippet: string;
  estimatedTokens?: number;
  isFallback: boolean;
}

export interface DevErrorEntry {
  id: string;
  message: string;
  stack?: string;
  component?: string;
  route: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'CORE' | 'AI' | 'UI' | 'EXPERIMENTAL';
  devOnly: boolean;
}

export interface DevAuditLogEntry {
  id: string;
  timestamp: string;
  developer: string;
  action: string;
  target: string;
  environment: 'development' | 'staging' | 'production';
  result: 'SUCCESS' | 'FAILED' | 'REVERTED';
  details?: Record<string, any>;
}

export interface DevBackgroundJob {
  id: string;
  name: string;
  type: 'FSRS_SYNC' | 'RECOMMENDATION_EVAL' | 'STREAK_CHECK' | 'NOTIFICATION_DISPATCH';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  durationMs?: number;
  error?: string;
  retryCount: number;
}
