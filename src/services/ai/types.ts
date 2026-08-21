// AI Provider Domain Types and Security Definitions for PAHAM
// Strict security model with no exposed secrets in client state

export type AIProviderType = 'paham' | 'gemini' | 'custom';

export type AIModelName = 
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-1.5-flash'
  | 'paham-deterministic';

export type AIStorageMode = 'session' | 'persistent';

export type AIConnectionStatus = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR'
  | 'FALLBACK_ACTIVE';

export type AIErrorCategory = 
  | 'INVALID_KEY'
  | 'EXPIRED_KEY'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'MODEL_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AIProviderConfig {
  activeProvider: AIProviderType;
  selectedModel: AIModelName;
  storageMode: AIStorageMode;
  fallbackEnabled: boolean;
  hasCustomKey: boolean;
  maskedKeySnippet?: string; // e.g. "AIzaSy...****"
  lastConnectedAt?: string;
  lastTestedStatus?: AIConnectionStatus;
  lastErrorMessage?: string;
  lastErrorCategory?: AIErrorCategory;
}

export interface AIRequestOptions {
  model?: AIModelName;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
  allowFallback?: boolean;
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  provider: AIProviderType;
  model: AIModelName;
  isFallback: boolean;
  error?: {
    category: AIErrorCategory;
    message: string;
    rawErrorSanitized?: string;
  };
  durationMs: number;
}

export interface AIConnectionTestResult {
  success: boolean;
  provider: AIProviderType;
  model: AIModelName;
  message: string;
  errorCategory?: AIErrorCategory;
  latencyMs: number;
}
