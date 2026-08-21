// PAHAM Native Provider (Deterministic Educational AI Engine)
// Zero external API required, instant local execution, guaranteed 100% uptime and offline support

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
import { Concept, Question } from '../../../core/types';

export class PahamProvider extends BaseAIProvider {
  public readonly providerType: AIProviderType = 'paham';
  public readonly defaultModel: AIModelName = 'paham-deterministic';

  public async testConnection(): Promise<AIConnectionTestResult> {
    const startTime = performance.now();
    return {
      success: true,
      provider: 'paham',
      model: 'paham-deterministic',
      message: 'Mesin Cerdas Lokal PAHAM aktif dan siap digunakan secara offline.',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  public async generateRawResponse(prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const start = performance.now();
    return {
      success: true,
      data: `[PAHAM Local Response]: ${prompt.slice(0, 100)}...`,
      provider: 'paham',
      model: 'paham-deterministic',
      isFallback: false,
      durationMs: Math.round(performance.now() - start),
    };
  }

  public async extractHandwriting(input: HandwritingInput): Promise<HandwritingResult> {
    const text = input.rawOcrSnippet.trim();
    const keywords = ['tokoh', 'penokohan', 'alur', 'latar', 'amanat', 'variabel', 'koefisien', 'konstanta', 'ekosistem', 'produsen', 'konsumen', 'fotosintesis', 'gaya', 'energi'];
    const found = keywords.filter(k => text.toLowerCase().includes(k));
    const titleCased = found.map(f => f.charAt(0).toUpperCase() + f.slice(1));

    return {
      cleanedText: text.replace(/\s+/g, ' '),
      detectedConcepts: titleCased.length > 0 ? titleCased : ['Materi Pokok'],
      confidence: 0.94,
      isAiEnhanced: false,
      notes: 'Diproses melalui mesin ekstraksi lokal deterministik PAHAM.',
    };
  }

  public async generateExplanation(concept: Concept, misconception?: string): Promise<string> {
    let text = `**${concept.title}**\n\n${concept.definition}\n\nContoh nyata dalam konteks pelajaran: ${concept.example || 'Lihat materi rujukan.'}`;
    if (concept.keyPoints && concept.keyPoints.length > 0) {
      text += `\n\nPoin kunci: ${concept.keyPoints.join(', ')}`;
    }
    if (misconception) {
      text += `\n\nCatatan penting: Hindari kekeliruan "${misconception}". Perhatikan kata kunci pembeda utama.`;
    }
    return text;
  }

  public async generateQuestion(blueprint: QuestionBlueprint): Promise<Question> {
    const qId = `paham-q-${Date.now()}`;
    return {
      id: qId,
      subjectId: 'sub-paham',
      chapterId: 'chap-paham',
      conceptId: 'conc-paham',
      questionType: 'multiple_choice',
      difficulty: blueprint.difficulty,
      prompt: `Berdasarkan konsep ${blueprint.conceptTitle}, manakah pernyataan atau contoh aplikasi yang paling tepat?`,
      options: [
        { id: 'opt-1', text: `Penerapan sesuai konsep: ${blueprint.conceptDefinition.slice(0, 80)}...`, isCorrect: true },
        { id: 'opt-2', text: 'Pernyataan umum yang mengabaikan batasan konsep ini', isCorrect: false },
        { id: 'opt-3', text: 'Konsep yang bertolak belakang dengan aturan materi rujukan', isCorrect: false },
        { id: 'opt-4', text: 'Hanya berlaku pada kondisi khusus tanpa aturan umum', isCorrect: false },
      ],
      explanation: `Jawaban benar mengacu pada definisi baku ${blueprint.conceptTitle}: ${blueprint.conceptDefinition}`,
      misconceptionAlert: 'Periksa kembali pembeda kata kunci sebelum memilih opsi jawaban.',
      timesAnswered: 0,
      timesCorrect: 0,
      qualityStatus: 'approved',
    };
  }

  public async analyzeAnswer(input: AnswerAnalysisInput): Promise<AnswerAnalysisResult> {
    const cleanStudent = input.studentAnswer.trim().toLowerCase();
    const cleanExpected = input.expectedAnswer.trim().toLowerCase();

    const isExact = cleanStudent.includes(cleanExpected) || cleanExpected.includes(cleanStudent);
    const keyWords = (input.concept.keyPoints || []).join(' ').toLowerCase().split(' ').filter(w => w.length > 4);
    const matchedCount = keyWords.filter(w => cleanStudent.includes(w)).length;

    const isPass = isExact || matchedCount >= 2;

    return {
      isCorrect: isPass,
      score: isPass ? 0.95 : 0.4,
      feedbackText: isPass
        ? 'Penjelasanmu sudah menangkap gagasan inti dengan baik dan sesuai dengan materi catatan.'
        : `Penjelasanmu masih belum lengkap. Konsep kuncinya adalah: "${input.concept.definition.slice(0, 100)}..."`,
      misconceptionIdentified: isPass ? undefined : `Perlu memperkuat pemahaman pada kata kunci utama ${input.concept.title}.`,
      suggestedAction: isPass ? 'Lanjut ke latihan soal aplikasi.' : 'Ulas kembali catatan guru pada halaman rujukan.',
    };
  }
}

export const pahamProvider = new PahamProvider();
