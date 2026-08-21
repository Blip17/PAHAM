// Gemini AI Provider for PAHAM
// Communicates with Google Gemini API securely using @google/genai with automatic error categorization

import { GoogleGenAI } from '@google/genai';
import {
  BaseAIProvider,
  HandwritingInput,
  HandwritingResult,
  QuestionBlueprint,
  AnswerAnalysisInput,
  AnswerAnalysisResult
} from './BaseProvider';
import {
  AIProviderType,
  AIModelName,
  AIRequestOptions,
  AIResponse,
  AIConnectionTestResult
} from '../types';
import { aiSecurityVault, sanitizeError } from '../aiSecurity';
import { Concept, Question } from '../../../core/types';

export class GeminiProvider extends BaseAIProvider {
  public readonly providerType: AIProviderType = 'gemini';
  public readonly defaultModel: AIModelName = 'gemini-2.5-flash';

  private async getClient(explicitKey?: string): Promise<{ client: GoogleGenAI; key: string } | null> {
    const key = explicitKey || await aiSecurityVault.getActiveApiKey();
    if (!key) return null;
    try {
      return { client: new GoogleGenAI({ apiKey: key }), key };
    } catch {
      return null;
    }
  }

  /**
   * Tests API key validity and returns latency & safe metadata
   */
  public async testConnection(apiKey?: string): Promise<AIConnectionTestResult> {
    const startTime = performance.now();
    const clientInfo = await this.getClient(apiKey);

    if (!clientInfo) {
      return {
        success: false,
        provider: 'gemini',
        model: this.defaultModel,
        message: 'Kunci API Gemini tidak ditemukan. Silakan masukkan kunci API Anda.',
        errorCategory: 'INVALID_KEY',
        latencyMs: 0,
      };
    }

    try {
      const response = await clientInfo.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Balas dengan 1 kata: "SIAP"',
      });

      const text = response.text || '';
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        message: `Koneksi Gemini API berhasil terhubung (${latencyMs}ms). Siap digunakan!`,
        latencyMs,
      };
    } catch (err) {
      const categorized = this.categorizeError(err);
      return {
        success: false,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        message: categorized.message,
        errorCategory: categorized.category,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }
  }

  public async generateRawResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const startTime = performance.now();
    const clientInfo = await this.getClient();

    if (!clientInfo) {
      return {
        success: false,
        provider: 'gemini',
        model: options?.model || this.defaultModel,
        isFallback: false,
        error: {
          category: 'INVALID_KEY',
          message: 'Kunci API belum diatur. Masukkan kunci API Anda di Pengaturan.',
        },
        durationMs: 0,
      };
    }

    try {
      const model = options?.model || this.defaultModel;
      const response = await clientInfo.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 1024,
          systemInstruction: options?.systemInstruction,
        },
      });

      const output = response.text || '';
      return {
        success: true,
        data: output,
        provider: 'gemini',
        model,
        isFallback: false,
        durationMs: Math.round(performance.now() - startTime),
      };
    } catch (err) {
      const categorized = this.categorizeError(err);
      return {
        success: false,
        provider: 'gemini',
        model: options?.model || this.defaultModel,
        isFallback: false,
        error: {
          category: categorized.category,
          message: categorized.message,
          rawErrorSanitized: sanitizeError(err),
        },
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  }

  public async extractHandwriting(input: HandwritingInput): Promise<HandwritingResult> {
    const prompt = `Anda adalah asisten kurikulum sekolah Indonesia (PAHAM). 
Mata Pelajaran: ${input.subjectName}
Teks hasil OCR tulisan tangan guru berikut ini memiliki beberapa karakter yang buram atau salah terbaca:
"""
${input.rawOcrSnippet}
"""
Tugas:
1. Rapikan kalimat agar menjadi tata bahasa Indonesia baku tanpa mengubah maksud materi sekolah.
2. Ekstrak 1-4 konsep pelajaran utama yang ditemukan.
3. Berikan output dalam format JSON valid:
{
  "cleanedText": "teks rapi",
  "detectedConcepts": ["Konsep 1", "Konsep 2"],
  "confidence": 0.95,
  "notes": "Catatan singkat perbaikan"
}`;

    const res = await this.generateRawResponse(prompt, {
      temperature: 0.2,
      responseFormat: 'json',
    });

    if (res.success && res.data) {
      try {
        const jsonMatch = res.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            cleanedText: parsed.cleanedText || input.rawOcrSnippet,
            detectedConcepts: parsed.detectedConcepts || [],
            confidence: parsed.confidence || 0.95,
            isAiEnhanced: true,
            notes: parsed.notes || 'Berhasil dirapikan dengan AI.',
          };
        }
      } catch {}
    }

    throw new Error(res.error?.message || 'Gagal mengekstrak catatan dengan Gemini.');
  }

  public async generateExplanation(concept: Concept, misconception?: string): Promise<string> {
    const prompt = `Jelaskan konsep berikut untuk siswa SMP/SMA Indonesia secara ringkas, jelas, dan berbasis fakta materi:
Konsep: ${concept.title}
Definisi Dasar: ${concept.definition}
Contoh Rujukan: ${concept.example || 'Contoh umum dalam kurikulum.'}
${misconception ? `Kekeliruan siswa yang sering terjadi: "${misconception}"` : ''}

Format:
- 1 paragraf penjelasan inti yang mudah dipahami
- 1 contoh kasus konkret dalam kehidupan sehari-hari / soal ujian
- 1 tips singkat membedakan dengan konsep yang mirip.
Gunakan bahasa yang hangat, cerdas, dan membangkitkan pemahaman (bukan sekadar menghafal).`;

    const res = await this.generateRawResponse(prompt, { temperature: 0.7 });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Gagal menghasilkan penjelasan.');
  }

  public async generateQuestion(blueprint: QuestionBlueprint): Promise<Question> {
    const prompt = `Buat 1 soal latihan formatif kurikulum Indonesia berkualitas tinggi dengan spesifikasi blueprint berikut:
Mata Pelajaran: ${blueprint.subjectName}
Bab: ${blueprint.chapterTitle}
Target Konsep: ${blueprint.conceptTitle}
Definisi Konsep: ${blueprint.conceptDefinition}
Tingkat Kesulitan: Level ${blueprint.difficulty} dari 5
Tipe Soal: ${blueprint.questionType}

Hasilkan output dalam format JSON valid persis:
{
  "prompt": "Pertanyaan soal yang berbobot...",
  "options": [
    { "id": "opt-1", "text": "Pilihan A", "isCorrect": true },
    { "id": "opt-2", "text": "Pilihan B", "isCorrect": false },
    { "id": "opt-3", "text": "Pilihan C", "isCorrect": false },
    { "id": "opt-4", "text": "Pilihan D", "isCorrect": false }
  ],
  "explanation": "Penjelasan mendalam mengapa jawaban benar adalah A...",
  "misconceptionAlert": "Kekeliruan umum siswa saat mengerjakan tipe soal ini..."
}`;

    const res = await this.generateRawResponse(prompt, { temperature: 0.6, responseFormat: 'json' });
    if (res.success && res.data) {
      try {
        const jsonMatch = res.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: `gemini-q-${Date.now()}`,
            subjectId: 'sub-gemini',
            chapterId: 'chap-gemini',
            conceptId: 'conc-gemini',
            questionType: blueprint.questionType,
            difficulty: blueprint.difficulty,
            prompt: parsed.prompt,
            options: parsed.options,
            explanation: parsed.explanation,
            misconceptionAlert: parsed.misconceptionAlert,
            timesAnswered: 0,
            timesCorrect: 0,
            qualityStatus: 'approved',
          };
        }
      } catch {}
    }
    throw new Error(res.error?.message || 'Gagal menghasilkan soal adaptif.');
  }

  public async analyzeAnswer(input: AnswerAnalysisInput): Promise<AnswerAnalysisResult> {
    const prompt = `Analisis jawaban siswa berikut terhadap konsep pelajaran:
Konsep: ${input.concept.title}
Definisi: ${input.concept.definition}
Pertanyaan: "${input.questionPrompt}"
Jawaban Kunci Diharapkan: "${input.expectedAnswer}"
Jawaban Siswa: "${input.studentAnswer}"

Tugas:
1. Tentukan apakah jawaban siswa benar / menangkap inti konsep.
2. Beri skor 0.0 sampai 1.0.
3. Beri feedback singkat, konstruktif, dan ramah.
4. Identifikasi miskonsepsi jika ada.
5. Rekomendasikan langkah berikutnya.

Format JSON valid:
{
  "isCorrect": true/false,
  "score": 0.9,
  "feedbackText": "Umpan balik...",
  "misconceptionIdentified": "Deskripsi kekeliruan (atau kosong jika benar)",
  "suggestedAction": "Lanjut latihan / baca ulang"
}`;

    const res = await this.generateRawResponse(prompt, { temperature: 0.3, responseFormat: 'json' });
    if (res.success && res.data) {
      try {
        const jsonMatch = res.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            isCorrect: Boolean(parsed.isCorrect),
            score: parsed.score ?? 0.8,
            feedbackText: parsed.feedbackText || 'Jawaban telah dianalisis.',
            misconceptionIdentified: parsed.misconceptionIdentified || undefined,
            suggestedAction: parsed.suggestedAction || 'Lanjut ke soal berikutnya.',
          };
        }
      } catch {}
    }
    throw new Error(res.error?.message || 'Gagal menganalisis jawaban siswa.');
  }
}

export const geminiProvider = new GeminiProvider();
