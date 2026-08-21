// AI Security Vault & Secret Sanitization for PAHAM
// Protects API keys from exposure in localStorage, console logs, error messages, and network responses

import { AIStorageMode, AIProviderConfig } from './types';

// In-Memory Secret Vault (Never exposed to window or global scope)
let inMemoryApiKey: string | null = null;

const STORAGE_KEY_ENCRYPTED_VAULT = 'paham_secure_ai_vault_v2';
const STORAGE_KEY_CONFIG = 'paham_ai_config_v2';

/**
 * Key Masking: Generates safe snippet like "AIza...8fA2"
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length < 8) return '****';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Log Sanitizer: Redacts API key signatures and patterns from logs and error strings
 */
export function sanitizeForLogs(text: string): string {
  if (!text || typeof text !== 'string') return '';
  // Redact standard Gemini API key pattern (AIza...)
  return text.replace(/AIza[0-9A-Za-z-_]{25,50}/g, 'AIza...[REDACTED_API_KEY]');
}

/**
 * Safe Error Sanitizer
 */
export function sanitizeError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem AI yang tidak diketahui.';
  const message = error.message || String(error);
  return sanitizeForLogs(message);
}

// ----------------------------------------------------
// Web Crypto AES-GCM-256 Helpers for Persistent Vault
// ----------------------------------------------------
const ENCRYPTION_SALT = new Uint8Array([70, 65, 72, 65, 77, 95, 83, 69, 67, 85, 82, 69, 95, 65, 73, 95]);

async function getDerivedKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Derive key using browser origin and constant salt
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(window.location.origin + '_paham_device_salt'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: ENCRYPTION_SALT,
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivedKey();

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  // Pack IV + ciphertext into base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptSecret(cipherBase64: string): Promise<string | null> {
  try {
    const raw = atob(cipherBase64);
    const combined = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) combined[i] = raw.charCodeAt(i);

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await getDerivedKey();

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('[AISecurity] Failed to decrypt persistent secret', sanitizeError(err));
    return null;
  }
}

// Memory fallback for headless/Node environments
const memoryStorage = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, value); } catch {}
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch {}
    }
    memoryStorage.delete(key);
  }
};

// ----------------------------------------------------
// AI Secret Vault Interface
// ----------------------------------------------------
export class AISecurityVault {
  /**
   * Sets the user's custom API key into memory and optional encrypted storage
   */
  public async setApiKey(key: string, mode: AIStorageMode = 'session'): Promise<void> {
    const cleanKey = key.trim();
    if (!cleanKey) {
      await this.clearApiKey();
      return;
    }

    // Always keep active in memory
    inMemoryApiKey = cleanKey;

    if (mode === 'persistent' && typeof window !== 'undefined' && window.crypto?.subtle) {
      try {
        const encrypted = await encryptSecret(cleanKey);
        safeStorage.setItem(STORAGE_KEY_ENCRYPTED_VAULT, encrypted);
      } catch {
        safeStorage.removeItem(STORAGE_KEY_ENCRYPTED_VAULT);
      }
    } else {
      safeStorage.removeItem(STORAGE_KEY_ENCRYPTED_VAULT);
    }

    // Clean old plaintext key if present from legacy versions
    safeStorage.removeItem('paham_gemini_api_key');

    this.saveConfig({ activeProvider: 'gemini', hasCustomKey: true, storageMode: mode });
  }

  /**
   * Retrieves the raw API key for authorized request execution
   * NEVER exposed outside of the provider client layer
   */
  public async getActiveApiKey(): Promise<string | null> {
    // 1. Check in-memory key (fastest & most secure)
    if (inMemoryApiKey) {
      return inMemoryApiKey;
    }

    // 2. Check encrypted persistent vault
    const encrypted = safeStorage.getItem(STORAGE_KEY_ENCRYPTED_VAULT);
    if (encrypted && typeof window !== 'undefined' && window.crypto?.subtle) {
      const decrypted = await decryptSecret(encrypted);
      if (decrypted) {
        inMemoryApiKey = decrypted; // cache in memory
        return decrypted;
      }
    }

    // 3. Check environment variable as default system fallback
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) {
      return envKey.trim();
    }

    return null;
  }

  /**
   * Clears the API key from both memory and encrypted storage
   */
  public async clearApiKey(): Promise<void> {
    inMemoryApiKey = null;
    safeStorage.removeItem(STORAGE_KEY_ENCRYPTED_VAULT);
    safeStorage.removeItem('paham_gemini_api_key');
    this.saveConfig({ activeProvider: 'paham', hasCustomKey: false, maskedKeySnippet: undefined });
  }

  /**
   * Checks if a custom key is currently available
   */
  public async hasCustomKey(): Promise<boolean> {
    const key = await this.getActiveApiKey();
    return Boolean(key);
  }

  /**
   * Gets safe configuration metadata for UI without exposing the secret
   */
  public async getConfig(): Promise<AIProviderConfig> {
    const rawConfig = safeStorage.getItem(STORAGE_KEY_CONFIG);
    let config: AIProviderConfig = {
      activeProvider: 'paham',
      selectedModel: 'gemini-2.5-flash',
      storageMode: 'session',
      fallbackEnabled: true,
      hasCustomKey: false,
    };

    if (rawConfig) {
      try {
        config = { ...config, ...JSON.parse(rawConfig) };
      } catch {}
    }

    const key = await this.getActiveApiKey();
    config.hasCustomKey = Boolean(key);
    config.maskedKeySnippet = key ? maskApiKey(key) : undefined;
    if (!rawConfig) {
      config.activeProvider = key ? 'gemini' : 'paham';
    }

    return config;
  }

  /**
   * Updates non-sensitive AI provider preferences
   */
  public saveConfig(updates: Partial<AIProviderConfig>): void {
    const current = safeStorage.getItem(STORAGE_KEY_CONFIG);
    let config: AIProviderConfig = {
      activeProvider: 'paham',
      selectedModel: 'gemini-2.5-flash',
      storageMode: 'session',
      fallbackEnabled: true,
      hasCustomKey: false,
    };
    if (current) {
      try {
        config = { ...config, ...JSON.parse(current) };
      } catch {}
    }

    const updated = { ...config, ...updates };
    // Strip any potential sensitive keys
    delete (updated as any).apiKey;
    delete (updated as any).secret;

    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  }
}

export const aiSecurityVault = new AISecurityVault();

