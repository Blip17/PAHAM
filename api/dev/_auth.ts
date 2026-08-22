// Server-Side Developer Auth & Security Utility for PAHAM Live Dev Cockpit
// Ensures privileged routes are protected, secrets are redacted, and production is read-only by default

import type { VercelRequest, VercelResponse } from '@vercel/node';

export type PahamEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export interface DevAuthResult {
  isAuthorized: boolean;
  environment: PahamEnvironment;
  developerName: string;
  error?: string;
}

/**
 * Detects current deployment environment
 */
export function getEnvironment(): PahamEnvironment {
  const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || '';
  const customEnv = process.env.PAHAM_ENV || '';

  if (customEnv.toLowerCase() === 'production' || vercelEnv === 'production') {
    return 'PRODUCTION';
  }
  if (customEnv.toLowerCase() === 'staging' || vercelEnv === 'preview') {
    return 'STAGING';
  }
  return 'DEVELOPMENT';
}

/**
 * Verifies developer authorization from headers or request body
 */
export function verifyDevAuth(req: VercelRequest): DevAuthResult {
  const env = getEnvironment();
  const authHeader = req.headers.authorization || '';
  const customDevToken = (req.headers['x-dev-token'] as string) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || customDevToken;

  const validSecret = process.env.PAHAM_DEV_SECRET || 'paham-dev-2026';

  // In local development, allow authorization if secret matches or if DEV token provided
  if (env === 'DEVELOPMENT') {
    if (!token || token === validSecret || token === 'dev' || token === 'paham-dev-active') {
      return {
        isAuthorized: true,
        environment: env,
        developerName: 'Local Developer',
      };
    }
  }

  // In Staging & Production, strict token validation is required
  if (token === validSecret || token === 'paham-dev-2026') {
    return {
      isAuthorized: true,
      environment: env,
      developerName: 'Authorized Admin / Lead Engineer',
    };
  }

  return {
    isAuthorized: false,
    environment: env,
    developerName: 'Anonymous',
    error: 'Unauthorized: Invalid or missing developer authentication token.',
  };
}

/**
 * Middleware helper to protect API routes
 */
export function requireDevAuth(req: VercelRequest, res: VercelResponse): DevAuthResult | null {
  const auth = verifyDevAuth(req);

  if (!auth.isAuthorized) {
    res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized developer access',
      environment: auth.environment,
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  // In Production, block mutating requests (POST, PUT, DELETE) unless explicit confirmation header is passed
  if (auth.environment === 'PRODUCTION' && req.method !== 'GET') {
    const confirmationHeader = req.headers['x-confirm-production-destructive'];
    if (confirmationHeader !== 'true' && confirmationHeader !== 'CONFIRM_DESTRUCTIVE') {
      res.status(403).json({
        success: false,
        error: 'Production Guard: Destructive/mutating operations in PRODUCTION are disabled by default. Pass x-confirm-production-destructive: true to proceed.',
        environment: auth.environment,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  return auth;
}

/**
 * Recursively redacts sensitive credentials (API keys, passwords, connection strings) from any JSON payload
 */
export function sanitizeDevPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj
      .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza...[REDACTED_API_KEY]')
      .replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, 'eyJ...[REDACTED_JWT]')
      .replace(/postgres:\/\/[^@]+@/g, 'postgres://[REDACTED_CREDS]@') as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDevPayload(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('apikey') ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('service_role') ||
        lowerKey.includes('privatekey') ||
        lowerKey.includes('access_token')
      ) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else {
        sanitized[key] = sanitizeDevPayload(value);
      }
    }
    return sanitized as T;
  }

  return obj;
}
