import { AITutorInteraction, SupportedLanguageId } from './types';
import { aiService } from '../../services/ai/aiService';

export class LanguageAITutor {
  /**
   * Process a student's question or message with pedagogical scaffolding
   */
  public async respondToLearner(
    userMessage: string,
    targetLanguage: SupportedLanguageId,
    userLevel: string,
    context?: {
      currentConcept?: string;
      recentMistakes?: string[];
      stage?: 'HINT' | 'EXPLAIN' | 'CONVERSATION' | 'CORRECTION';
    }
  ): Promise<AITutorInteraction> {
    const isMandarin = targetLanguage === 'zh-CN';
    const langName = isMandarin ? 'Bahasa Mandarin' : 'Bahasa Inggris';
    const stage = context?.stage || 'HINT';

    const systemPrompt = `Anda adalah Piko, AI Language Tutor cerdas dan ramah di platform edukasi PAHAM.
Tugas Anda adalah mendampingi siswa Indonesia belajar ${langName} pada tingkat ${userLevel}.
PRINSIP PEDAGOGIS:
1. Jangan langsung memberikan jawaban akhir secara cuma-cuma jika siswa bertanya soal latihan. Berikan panduan bertahap (scaffolding).
2. Jika siswa membuat kesalahan tata bahasa, jelaskan polanya dengan ramah dalam Bahasa Indonesia yang ringkas dan jelas.
3. Selalu berikan contoh kalimat nyata dan transliterasi/pinyin yang tepat jika membahas Mandarin.
4. Gunakan nada bicara suportif, profesional, dan menyemangati.`;

    const promptText = `Pesan Siswa: "${userMessage}"
Konteks Pembelajaran:
- Bahasa Target: ${langName} (${userLevel})
- Topik Saat Ini: ${context?.currentConcept || 'Umum'}
- Kesalahan Terakhir: ${context?.recentMistakes?.join(', ') || 'Tidak ada'}
- Mode Respon: ${stage}

Berikan respon tutor yang mendidik, ringkas, dan memotivasi.`;

    try {
      const response = await aiService.generateAIResponse(promptText, {
        systemInstruction: systemPrompt,
        maxOutputTokens: 500,
      });

      return {
        userMessage,
        targetLanguage,
        userLevel,
        tutorResponse: response.data || 'Bagus sekali! Mari kita bedah polanya bersama.',
        pedagogicalStage: stage === 'HINT' ? 'HINT_GENTLE' : 'EXPLAIN',
        suggestedFollowUp: [
          isMandarin ? 'Bagaimana contoh kalimat lainnya?' : 'Can you give me another example?',
          isMandarin ? 'Apa beda nada 2 dan nada 3 pada kata ini?' : 'How do I pronounce this word naturally?',
          'Coba saya buat 1 kalimat sendiri!',
        ],
      };
    } catch {
      // Deterministic pedagogical fallback if offline or API key missing
      return this.generateDeterministicFallback(userMessage, targetLanguage, userLevel, context);
    }
  }

  /**
   * Deterministic pedagogical response for offline testing or instant UI feedback
   */
  private generateDeterministicFallback(
    userMessage: string,
    targetLanguage: SupportedLanguageId,
    userLevel: string,
    context?: any
  ): AITutorInteraction {
    const isMandarin = targetLanguage === 'zh-CN';

    if (isMandarin) {
      return {
        userMessage,
        targetLanguage,
        userLevel,
        tutorResponse: `Piko siap bantu! Untuk kalimat atau karakter ini, perhatikan:
1. Susunan pola kalimat dasar Mandarin adalah: **Subjek + Keterangan Waktu + Kata Kerja + Objek** (S + T + V + O).
2. Perhatikan nada (tones) pada tiap Hanzi agar maknanya tepat.
Coba sebutkan kata yang ingin kamu rangkai!`,
        pedagogicalStage: 'HINT_GENTLE',
        suggestedFollowUp: [
          'Jelaskan cara pakai partikel 了 (le)',
          'Latihan pasangan nada (Tone Pairs)',
          'Tanya arti karakter ini',
        ],
      };
    }

    return {
      userMessage,
      targetLanguage,
      userLevel,
      tutorResponse: `Great question! In English (${userLevel}), observe the sentence structure:
- Check your **Subject-Verb Agreement** (e.g. He/She/It + verb-s).
- Verify if the time marker indicates Past, Present, or Future.
Try forming the sentence again with this pattern in mind!`,
      pedagogicalStage: 'HINT_GENTLE',
      suggestedFollowUp: [
        'Give me an example sentence',
        'Explain the grammar rule',
        'Test my understanding with a quiz',
      ],
    };
  }
}

export const languageAITutor = new LanguageAITutor();
