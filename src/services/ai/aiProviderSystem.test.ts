// PAHAM AI Provider System — Unit & Integration Test Suite
// Verifies secure key handling, redaction, provider abstraction, error categorization, and automatic fallback

import { describe, it, expect, beforeEach } from 'vitest';
import { aiService } from './aiService';
import { aiSecurityVault, maskApiKey, sanitizeForLogs, sanitizeError } from './aiSecurity';
import { pahamProvider } from './providers/PahamProvider';
import { geminiProvider } from './providers/GeminiProvider';
import { Concept } from '../../core/types';

describe('PAHAM Secure AI Provider & Key Management System', () => {
  const sampleKey = 'AIzaSyD1234567890abcdefghijklmnopqrstu';

  beforeEach(async () => {
    await aiSecurityVault.clearApiKey();
    aiSecurityVault.saveConfig({
      activeProvider: 'paham',
      selectedModel: 'gemini-2.5-flash',
      storageMode: 'session',
      fallbackEnabled: true,
      hasCustomKey: false,
    });
  });

  describe('1. Security, Masking & Log Redaction', () => {
    it('masks API keys safely without revealing middle characters', () => {
      const masked = maskApiKey(sampleKey);
      expect(masked).toBe('AIza...rstu');
      expect(masked).not.toContain('1234567890');
    });

    it('redacts API key signatures from log strings', () => {
      const rawLog = `Failed request to https://generativelanguage.googleapis.com/v1beta?key=${sampleKey}&model=gemini`;
      const sanitized = sanitizeForLogs(rawLog);

      expect(sanitized).not.toContain(sampleKey);
      expect(sanitized).toContain('AIza...[REDACTED_API_KEY]');
    });

    it('redacts sensitive keys from error objects', () => {
      const err = new Error(`GoogleGenAI error: Key ${sampleKey} quota exceeded.`);
      const sanitized = sanitizeError(err);

      expect(sanitized).not.toContain(sampleKey);
      expect(sanitized).toContain('[REDACTED_API_KEY]');
    });
  });

  describe('2. In-Memory & Session Vault Management', () => {
    it('stores key in-memory during session mode and retrieves it safely', async () => {
      await aiSecurityVault.setApiKey(sampleKey, 'session');
      
      const activeKey = await aiSecurityVault.getActiveApiKey();
      expect(activeKey).toBe(sampleKey);

      const config = await aiSecurityVault.getConfig();
      expect(config.hasCustomKey).toBe(true);
      expect(config.maskedKeySnippet).toBe('AIza...rstu');
      expect(config.activeProvider).toBe('gemini');
    });

    it('completely clears key on disconnect', async () => {
      await aiSecurityVault.setApiKey(sampleKey, 'session');
      expect(await aiSecurityVault.hasCustomKey()).toBe(true);

      await aiSecurityVault.clearApiKey();
      expect(await aiSecurityVault.hasCustomKey()).toBe(false);
      expect(await aiSecurityVault.getActiveApiKey()).toBeNull();
    });
  });

  describe('3. Provider Abstraction & Dispatcher', () => {
    const mockConcept: Concept = {
      id: 'conc-test',
      subjectId: 'sub-test',
      chapterId: 'chap-test',
      title: 'Hukum Newton I',
      definition: 'Benda diam akan tetap diam jika tidak ada resultan gaya yang bekerja.',
      example: 'Penumpang terdorong ke depan saat bus direm mendadak.',
      keyPoints: ['Inersia', 'Kelembaman', 'Resultan Gaya Nol'],
      relationships: [],
      sources: [],
      difficultyLevel: 2,
      createdAt: '2026-08-21',
    };

    it('uses PahamProvider when no custom API key is present', async () => {
      const provider = await aiService.getActiveProvider();
      expect(provider.providerType).toBe('paham');

      const explanation = await aiService.generateExplanation(mockConcept);
      expect(explanation).toContain('Hukum Newton I');
      expect(explanation).toContain('Inersia');
    });

    it('generates high quality deterministic questions offline through PahamProvider', async () => {
      const question = await pahamProvider.generateQuestion({
        subjectName: 'Fisika',
        chapterTitle: 'Dinamika Gerak',
        conceptTitle: mockConcept.title,
        conceptDefinition: mockConcept.definition,
        difficulty: 3,
        questionType: 'multiple_choice',
      });

      expect(question.prompt).toContain('Hukum Newton I');
      expect(question.options && question.options.length).toBe(4);
      expect(question.explanation).toContain(mockConcept.definition);
    });

    it('analyzes student answers accurately using keyword comprehension matching', async () => {
      const result = await pahamProvider.analyzeAnswer({
        questionPrompt: 'Jelaskan konsep kelembaman benda.',
        expectedAnswer: 'Kecenderungan benda mempertahankan keadaan diam atau gerak lurus beraturan.',
        studentAnswer: 'Benda cenderung mempertahankan posisinya karena inersia dan kelembaman.',
        concept: mockConcept,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
      expect(result.feedbackText).toContain('gagasan inti');
    });
  });

  describe('4. Automatic Fallback Mechanism', () => {
    it('seamlessly falls back to Paham native provider when external generation fails', async () => {
      aiSecurityVault.saveConfig({
        activeProvider: 'gemini',
        fallbackEnabled: true,
      });

      // Without a valid key, generateAIResponse should safely fallback to Paham provider
      const response = await aiService.generateAIResponse('Jelaskan fotosintesis');
      expect(response.success).toBe(true);
      expect(response.provider).toBe('paham');
      expect(response.isFallback).toBe(true);
    });
  });

  describe('5. Error Categorization & Friendly Indonesian Messages', () => {
    it('maps 400 and invalid API keys to INVALID_KEY category', () => {
      const categorized = (geminiProvider as any).categorizeError(new Error('API_KEY_INVALID: Key not found.'));
      expect(categorized.category).toBe('INVALID_KEY');
      expect(categorized.message).toContain('Kunci Gemini API tidak valid');
    });

    it('maps 429 and quota exhaustion to QUOTA_EXCEEDED category', () => {
      const categorized = (geminiProvider as any).categorizeError(new Error('RESOURCE_EXHAUSTED: quota exceeded.'));
      expect(categorized.category).toBe('QUOTA_EXCEEDED');
      expect(categorized.message).toContain('Batas kuota');
    });

    it('maps network drops to NETWORK_ERROR category', () => {
      const categorized = (geminiProvider as any).categorizeError(new Error('TypeError: Failed to fetch network error'));
      expect(categorized.category).toBe('NETWORK_ERROR');
      expect(categorized.message).toContain('Koneksi internet');
    });
  });
});
