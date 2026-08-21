// Base AI Provider Interface for PAHAM
// Extensible contract for all AI engines with error categorization and structured responses

import {
  AIProviderType,
  AIModelName,
  AIRequestOptions,
  AIResponse,
  AIConnectionTestResult,
  AIErrorCategory
} from '../types';
import { Concept, Question, QuestionType } from '../../../core/types';

export interface HandwritingInput {
  rawOcrSnippet: string;
  subjectName: string;
}

export interface HandwritingResult {
  cleanedText: string;
  detectedConcepts: string[];
  confidence: number;
  isAiEnhanced: boolean;
  notes: string;
}

export interface QuestionBlueprint {
  subjectName: string;
  chapterTitle: string;
  conceptTitle: string;
  conceptDefinition: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  questionType: QuestionType;
}

export interface AnswerAnalysisInput {
  questionPrompt: string;
  expectedAnswer: string;
  studentAnswer: string;
  concept: Concept;
}

export interface AnswerAnalysisResult {
  isCorrect: boolean;
  score: number; // 0 to 1
  feedbackText: string;
  misconceptionIdentified?: string;
  suggestedAction: string;
}

export abstract class BaseAIProvider {
  public abstract readonly providerType: AIProviderType;
  public abstract readonly defaultModel: AIModelName;

  public abstract testConnection(apiKey?: string): Promise<AIConnectionTestResult>;
  
  public abstract generateRawResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>>;
  
  public abstract extractHandwriting(input: HandwritingInput): Promise<HandwritingResult>;
  
  public abstract generateExplanation(concept: Concept, misconception?: string): Promise<string>;
  
  public abstract generateQuestion(blueprint: QuestionBlueprint): Promise<Question>;
  
  public abstract analyzeAnswer(input: AnswerAnalysisInput): Promise<AnswerAnalysisResult>;

  /**
   * Helper to map HTTP/API errors to user-friendly categories and Indonesian messages
   */
  protected categorizeError(error: any): { category: AIErrorCategory; message: string } {
    const raw = (error?.message || String(error)).toLowerCase();

    if (raw.includes('api_key_invalid') || raw.includes('invalid api key') || raw.includes('400') && raw.includes('key')) {
      return {
        category: 'INVALID_KEY',
        message: 'Kunci Gemini API tidak valid atau salah ketik. Silakan periksa kembali API key kamu di Pengaturan.',
      };
    }

    if (raw.includes('permission_denied') || raw.includes('403') || raw.includes('expired') || raw.includes('revoked')) {
      return {
        category: 'EXPIRED_KEY',
        message: 'Kunci API telah kedaluwarsa atau aksesnya dicabut di Google AI Studio.',
      };
    }

    if (raw.includes('resource_exhausted') || raw.includes('429') || raw.includes('quota')) {
      return {
        category: 'QUOTA_EXCEEDED',
        message: 'Batas kuota Gemini API kamu telah habis untuk saat ini. Sistem akan beralih ke mesin cerdas PAHAM secara otomatis.',
      };
    }

    if (raw.includes('rate limit') || raw.includes('too many requests')) {
      return {
        category: 'RATE_LIMITED',
        message: 'Terlalu banyak permintaan dalam waktu singkat. Harap tunggu beberapa detik.',
      };
    }

    if (raw.includes('not found') || raw.includes('model_unavailable') || raw.includes('503')) {
      return {
        category: 'MODEL_UNAVAILABLE',
        message: 'Model AI yang dipilih sedang sibuk atau dalam pemeliharaan sementara.',
      };
    }

    if (raw.includes('network') || raw.includes('fetch') || raw.includes('failed to fetch') || raw.includes('offline')) {
      return {
        category: 'NETWORK_ERROR',
        message: 'Koneksi internet terputus. Menggunakan pemrosesan lokal PAHAM.',
      };
    }

    return {
      category: 'UNKNOWN_ERROR',
      message: 'Terjadi kendala saat menghubungkan ke layanan AI. Mode offline PAHAM tetap aktif.',
    };
  }
}
