// PAHAM Quality Guardian — Domain Types
// Comprehensive QA domain definitions covering UX, Frontend, Backend, Security, and Performance

export type GuardianCategory = 
  | 'USER_FLOW' 
  | 'FRONTEND' 
  | 'BACKEND' 
  | 'SECURITY' 
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'VISUAL_QA';

export type GuardianSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type GuardianStatus = 'PASS' | 'WARN' | 'FAIL';

export interface GuardianFinding {
  id: string;
  category: GuardianCategory;
  severity: GuardianSeverity;
  status: GuardianStatus;
  title: string;
  affectedComponent: string;
  reproductionInfo: string;
  recommendedFix: string;
  isAutoFixable: boolean;
  metricValue?: string | number;
}

export interface PerformanceMetrics {
  fcpEstimateMs: number;
  routeTransitionLatencyMs: number;
  engineCalculationLatencyMs: number;
  fsrsProcessingLatencyMs: number;
  bundleChunkCount: number;
  totalBundleSizeBytes: number;
  memoryUsageEstimateMb: number;
}

export interface GuardianReport {
  timestamp: string;
  score: number; // 0 to 100
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: GuardianFinding[];
  performanceMetrics: PerformanceMetrics;
  auditDurationMs: number;
}

export interface FlowAuditStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  details?: string;
}
