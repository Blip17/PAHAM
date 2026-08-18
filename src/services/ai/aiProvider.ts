// AI Provider Interface and Implementations for PAHAM
// Provides Gemini Interactions API (gemini-3.6-flash) with local deterministic fallback

import { GoogleGenAI } from '@google/genai';
import { budgetGuard } from './budgetGuard';
import { Concept, Question, QuestionType, StudentConceptState } from '../../core/types';

export interface HandwritingExtractionResult {
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

export interface AnswerAnalysisResult {
  isCorrect: boolean;
  score: number; // 0 to 1
  feedbackText: string;
  misconceptionIdentified?: string;
  suggestedAction: string;
}

export interface AIProvider {
  extractHandwriting(input: { rawOcrSnippet: string; subjectName: string }): Promise<HandwritingExtractionResult>;
  generateExplanation(concept: Concept, misconception?: string): Promise<string>;
  generateQuestion(blueprint: QuestionBlueprint): Promise<Question>;
  analyzeAnswer(input: {
    questionPrompt: string;
    expectedAnswer: string;
    studentAnswer: string;
    concept: Concept;
  }): Promise<AnswerAnalysisResult>;
}

// ----------------------------------------------------
// 1. LOCAL DETERMINISTIC PROVIDER (Zero API / Fallback)
// ----------------------------------------------------
export class LocalProvider implements AIProvider {
  async extractHandwriting(input: { rawOcrSnippet: string; subjectName: string }): Promise<HandwritingExtractionResult> {
    const text = input.rawOcrSnippet.trim();
    // Deterministic concept keyword extractor
    const keywords = ['tokoh', 'penokohan', 'alur', 'latar', 'amanat', 'variabel', 'koefisien', 'konstanta', 'ekosistem', 'produsen', 'konsumen'];
    const found = keywords.filter(k => text.toLowerCase().includes(k));
    const titleCased = found.map(f => f.charAt(0).toUpperCase() + f.slice(1));

    return {
      cleanedText: text.replace(/\s+/g, ' '),
      detectedConcepts: titleCased.length > 0 ? titleCased : ['Materi Terstruktur'],
      confidence: 0.92,
      isAiEnhanced: false,
      notes: 'Diproses melalui mesin ekstraksi lokal deterministik PAHAM.',
    };
  }

  async generateExplanation(concept: Concept, misconception?: string): Promise<string> {
    let text = `${concept.definition}\n\nContoh nyata dalam konteks pelajaran: ${concept.example}`;
    if (misconception) {
      text += `\n\nCatatan penting: Hindari kekeliruan "${misconception}". Perhatikan kata kunci pembeda utama.`;
    }
    return text;
  }

  async generateQuestion(blueprint: QuestionBlueprint): Promise<Question> {
    const qId = `local-q-${Date.now()}`;
    return {
      id: qId,
      subjectId: 'sub-local',
      chapterId: 'chap-local',
      conceptId: 'c-local',
      questionType: 'multiple_choice',
      difficulty: blueprint.difficulty,
      prompt: `Berdasarkan materi ${blueprint.conceptTitle}, manakah penerapan atau ciri yang paling tepat?`,
      options: [
        { id: 'opt-1', text: `Penerapan sesuai konsep: ${blueprint.conceptDefinition.slice(0, 75)}...`, isCorrect: true },
        { id: 'opt-2', text: 'Konsep yang berkebalikan atau tidak memiliki hubungan kausalitas', isCorrect: false },
        { id: 'opt-3', text: 'Pernyataan umum yang mengaburkan ciri khusus konsep ini', isCorrect: false },
        { id: 'opt-4', text: 'Hanya berlaku pada kondisi khusus tanpa aturan umum', isCorrect: false },
      ],
      explanation: `Jawaban benar didasarkan pada definisi ${blueprint.conceptTitle}, yaitu: ${blueprint.conceptDefinition}`,
      misconceptionAlert: 'Pastikan membaca setiap opsi dengan teliti sebelum memilih.',
      timesAnswered: 0,
      timesCorrect: 0,
      qualityStatus: 'auto_generated',
    };
  }

  async analyzeAnswer(input: {
    questionPrompt: string;
    expectedAnswer: string;
    studentAnswer: string;
    concept: Concept;
  }): Promise<AnswerAnalysisResult> {
    const cleanStudent = input.studentAnswer.trim().toLowerCase();
    const cleanExpected = input.expectedAnswer.trim().toLowerCase();
    
    const isExact = cleanStudent.includes(cleanExpected) || cleanExpected.includes(cleanStudent);
    
    // Key terminology matching
    const keyWords = input.concept.keyPoints.join(' ').toLowerCase().split(' ').filter(w => w.length > 4);
    const matchedCount = keyWords.filter(w => cleanStudent.includes(w)).length;

    const isPass = isExact || matchedCount >= 2;

    return {
      isCorrect: isPass,
      score: isPass ? 0.9 : 0.4,
      feedbackText: isPass
        ? 'Penjelasanmu sudah menangkap gagasan inti dengan baik dan sesuai dengan materi catatan.'
        : `Penjelasanmu masih belum lengkap. Konsep kuncinya adalah: "${input.concept.definition.slice(0, 100)}..."`,
      misconceptionIdentified: isPass ? undefined : `Perlu memperkuat pemahaman pada kata kunci utama ${input.concept.title}.`,
      suggestedAction: isPass ? 'Lanjut ke latihan soal aplikasi.' : 'Ulas kembali catatan guru pada halaman rujukan.',
    };
  }
}

// ----------------------------------------------------
// 2. GEMINI PROVIDER (Using @google/genai Interactions API)
// ----------------------------------------------------
export class GeminiProvider implements AIProvider {
  private localFallback = new LocalProvider();

  private getClient(): GoogleGenAI | null {
    const key = budgetGuard.getApiKey();
    if (!key) return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch {
      return null;
    }
  }

  async extractHandwriting(input: { rawOcrSnippet: string; subjectName: string }): Promise<HandwritingExtractionResult> {
    // 1. Check budget & client
    if (!budgetGuard.canMakeRequest()) {
      return this.localFallback.extractHandwriting(input);
    }
    const client = this.getClient();
    if (!client) {
      return this.localFallback.extractHandwriting(input);
    }

    // 2. Check Cache
    const cacheKey = `ocr_${input.rawOcrSnippet.slice(0, 40)}`;
    const cached = budgetGuard.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      budgetGuard.recordRequest();
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

      const interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: prompt,
      });

      const rawOutput = interaction.output_text || '';
      // Parse JSON from output
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result: HandwritingExtractionResult = {
          cleanedText: parsed.cleanedText || input.rawOcrSnippet,
          detectedConcepts: parsed.detectedConcepts || [],
          confidence: parsed.confidence || 0.95,
          isAiEnhanced: true,
          notes: parsed.notes || 'Berhasil dirapikan dengan AI.',
        };
        budgetGuard.setCachedResult(cacheKey, result);
        return result;
      }
      return this.localFallback.extractHandwriting(input);
    } catch (err) {
      console.warn('Gemini API call failed, using local fallback:', err);
      return this.localFallback.extractHandwriting(input);
    }
  }

  async generateExplanation(concept: Concept, misconception?: string): Promise<string> {
    if (!budgetGuard.canMakeRequest()) return this.localFallback.generateExplanation(concept, misconception);
    const client = this.getClient();
    if (!client) return this.localFallback.generateExplanation(concept, misconception);

    const cacheKey = `exp_${concept.id}_${misconception ? 'misc' : 'norm'}`;
    const cached = budgetGuard.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      budgetGuard.recordRequest();
      const prompt = `Jelaskan konsep berikut untuk siswa SMP/SMA Indonesia secara ringkas, jelas, dan berbasis fakta materi:
Konsep: ${concept.title}
Definisi Dasar: ${concept.definition}
Contoh Rujukan: ${concept.example}
${misconception ? `Kekeliruan siswa yang sering terjadi: "${misconception}"` : ''}

Format:
- 1 paragraf penjelasan inti yang mudah dipahami
- 1 contoh kasus konkret dalam kehidupan sehari-hari / soal ujian
- 1 tips singkat membedakan dengan konsep yang mirip.
Gunakan bahasa yang hangat, cerdas, dan membangkitkan pemahaman (bukan sekadar menghafal).`;

      const interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: prompt,
      });

      const response = interaction.output_text || await this.localFallback.generateExplanation(concept, misconception);
      budgetGuard.setCachedResult(cacheKey, response);
      return response;
    } catch (err) {
      console.warn('Gemini explanation failed, fallback to local', err);
      return this.localFallback.generateExplanation(concept, misconception);
    }
  }

  async generateQuestion(blueprint: QuestionBlueprint): Promise<Question> {
    if (!budgetGuard.canMakeRequest()) return this.localFallback.generateQuestion(blueprint);
    const client = this.getClient();
    if (!client) return this.localFallback.generateQuestion(blueprint);

    try {
      budgetGuard.recordRequest();
      const prompt = `Buat 1 soal latihan formatif kurikulum Indonesia berkualitas tinggi dengan spesifikasi blueprint berikut:
Mata Pelajaran: ${blueprint.subjectName}
Bab: ${blueprint.chapterTitle}
Target Konsep: ${blueprint.conceptTitle}
Definisi Materi: ${blueprint.conceptDefinition}
Tingkat Kesulitan: ${blueprint.difficulty}/5
Tipe Soal: ${blueprint.questionType}

Output HARUS berupa JSON valid persis format:
{
  "prompt": "Soal cerita atau pertanyaan jelas...",
  "options": [
    { "id": "opt-1", "text": "Pilihan A", "isCorrect": false },
    { "id": "opt-2", "text": "Pilihan B (Benar)", "isCorrect": true },
    { "id": "opt-3", "text": "Pilihan C", "isCorrect": false },
    { "id": "opt-4", "text": "Pilihan D", "isCorrect": false }
  ],
  "explanation": "Alasan mengapa jawaban tersebut benar...",
  "misconceptionAlert": "Kekeliruan umum yang harus diwaspadai..."
}`;

      const interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: prompt,
      });

      const text = interaction.output_text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          id: `ai-q-${Date.now()}`,
          subjectId: 'sub-generated',
          chapterId: 'chap-generated',
          conceptId: 'c-generated',
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
      return this.localFallback.generateQuestion(blueprint);
    } catch (err) {
      console.warn('Gemini question generation fallback to local', err);
      return this.localFallback.generateQuestion(blueprint);
    }
  }

  async analyzeAnswer(input: {
    questionPrompt: string;
    expectedAnswer: string;
    studentAnswer: string;
    concept: Concept;
  }): Promise<AnswerAnalysisResult> {
    if (!budgetGuard.canMakeRequest()) return this.localFallback.analyzeAnswer(input);
    const client = this.getClient();
    if (!client) return this.localFallback.analyzeAnswer(input);

    try {
      budgetGuard.recordRequest();
      const prompt = `Evaluasi jawaban penjelasan siswa Indonesia untuk konsep "${input.concept.title}".
Pertanyaan: "${input.questionPrompt}"
Kunci Jawaban / Materi Acuan: "${input.expectedAnswer}"
Jawaban Siswa: "${input.studentAnswer}"

Tugas:
Analisis apakah siswa sudah benar-benar paham atau hanya menebak/keliru.
Balas dalam JSON valid:
{
  "isCorrect": true/false,
  "score": 0.85,
  "feedbackText": "Umpan balik yang ramah dan memahamkan...",
  "misconceptionIdentified": "Deskripsi kekeliruan jika ada (atau null)",
  "suggestedAction": "Langkah belajar berikutnya"
}`;

      const interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: prompt,
      });

      const text = interaction.output_text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return this.localFallback.analyzeAnswer(input);
    } catch (err) {
      console.warn('Gemini answer analysis fallback', err);
      return this.localFallback.analyzeAnswer(input);
    }
  }
}

// Export singleton provider router
export const ai = new GeminiProvider();
