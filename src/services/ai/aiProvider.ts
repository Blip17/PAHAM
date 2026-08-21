// AI Provider Entry Point for PAHAM
// Re-exports centralized AI service, domain types, and security vault

import { aiService } from './aiService';
import { aiSecurityVault } from './aiSecurity';

export * from './types';
export * from './aiSecurity';
export * from './aiService';
export * from './providers/BaseProvider';
export * from './providers/PahamProvider';
export * from './providers/GeminiProvider';

// Canonical singleton export for application views
export const ai = aiService;
export const aiVault = aiSecurityVault;
