// Centralized AI Service Dispatcher for PAHAM
// Orchestrates active provider selection, automatic local fallback, and secure request routing

import { BaseAIProvider, HandwritingInput, HandwritingResult, QuestionBlueprint, AnswerAnalysisInput, AnswerAnalysisResult } from './providers/BaseProvider';
import { PahamProvider, pahamProvider } from './providers/PahamProvider';
import { GeminiProvider, geminiProvider } from './providers/GeminiProvider';
import { aiSecurityVault } from './aiSecurity';
import {
  AIProviderType,
  AIModelName,
  AIRequestOptions,
  AIResponse,
  AIConnectionTestResult,
  AIProviderConfig
} from './types';
import { Concept, Question } from '../../core/types';

export class AIService {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map([
    ['paham', pahamProvider],
    ['gemini', geminiProvider],
  ]);

  /**
   * Retrieves active provider based on security configuration and availability
   */
  public async getActiveProvider(): Promise<BaseAIProvider> {
    const config = await aiSecurityVault.getConfig();
    if (config.activeProvider === 'gemini') {
      return this.providers.get('gemini') || pahamProvider;
    }
    return pahamProvider;
  }

  /**
   * Centralized AI Response Generator
   * Dispatches request to active provider with seamless fallback to PahamProvider if enabled
   */
  public async generateAIResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const config = await aiSecurityVault.getConfig();
    const activeProvider = await this.getActiveProvider();

    // 1. Attempt with active provider
    const response = await activeProvider.generateRawResponse(prompt, {
      model: options?.model || config.selectedModel,
      temperature: options?.temperature,
      maxOutputTokens: options?.maxOutputTokens,
      systemInstruction: options?.systemInstruction,
    });

    if (response.success) {
      return response;
    }

    // 2. If active provider fails and fallback is enabled, route to Paham native provider
    if (config.fallbackEnabled && activeProvider.providerType !== 'paham') {
      const fallbackResponse = await pahamProvider.generateRawResponse(prompt, options);
      return {
        ...fallbackResponse,
        isFallback: true,
      };
    }

    return response;
  }

  /**
   * Tests connection to a specific provider or custom key
   */
  public async testConnection(providerType: AIProviderType = 'gemini', apiKey?: string): Promise<AIConnectionTestResult> {
    const targetProvider = this.providers.get(providerType) || pahamProvider;
    return targetProvider.testConnection(apiKey);
  }

  /**
   * Domain: OCR & Handwriting Text Cleanup
   */
  public async extractHandwriting(input: HandwritingInput): Promise<HandwritingResult> {
    const config = await aiSecurityVault.getConfig();
    const provider = await this.getActiveProvider();

    try {
      return await provider.extractHandwriting(input);
    } catch (err) {
      if (config.fallbackEnabled && provider.providerType !== 'paham') {
        return pahamProvider.extractHandwriting(input);
      }
      throw err;
    }
  }

  /**
   * Domain: Concept Explanation Generation
   */
  public async generateExplanation(concept: Concept, misconception?: string): Promise<string> {
    const config = await aiSecurityVault.getConfig();
    const provider = await this.getActiveProvider();

    try {
      return await provider.generateExplanation(concept, misconception);
    } catch (err) {
      if (config.fallbackEnabled && provider.providerType !== 'paham') {
        return pahamProvider.generateExplanation(concept, misconception);
      }
      throw err;
    }
  }

  /**
   * Domain: Adaptive Curriculum Question Generator
   */
  public async generateQuestion(blueprint: QuestionBlueprint): Promise<Question> {
    const config = await aiSecurityVault.getConfig();
    const provider = await this.getActiveProvider();

    try {
      return await provider.generateQuestion(blueprint);
    } catch (err) {
      if (config.fallbackEnabled && provider.providerType !== 'paham') {
        return pahamProvider.generateQuestion(blueprint);
      }
      throw err;
    }
  }

  /**
   * Domain: Student Answer & Misconception Analysis
   */
  public async analyzeAnswer(input: AnswerAnalysisInput): Promise<AnswerAnalysisResult> {
    const config = await aiSecurityVault.getConfig();
    const provider = await this.getActiveProvider();

    try {
      return await provider.analyzeAnswer(input);
    } catch (err) {
      if (config.fallbackEnabled && provider.providerType !== 'paham') {
        return pahamProvider.analyzeAnswer(input);
      }
      throw err;
    }
  }
}

export const aiService = new AIService();
