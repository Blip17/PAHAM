// Study Assistant ("Teman Belajar") Service for PAHAM
// Socratic pedagogical AI assistant grounded in actual concept definitions, teacher notes,
// and student mistake records. Follows: EXPLAIN -> ASK -> RETRIEVE -> CORRECT -> PRACTICE.

import { budgetGuard } from './budgetGuard';
import { GoogleGenAI } from '@google/genai';
import { Concept, MistakeRecord, Question, StudyAssistantAction, StudyAssistantResponse } from '../../core/types';

export interface StudyAssistantContext {
  concept: Concept;
  action: StudyAssistantAction;
  studentQuery?: string;
  questionContext?: Question;
  studentAnswerGiven?: string;
  recentMistake?: MistakeRecord;
  masteryScore?: number;
}

// ----------------------------------------------------
// 1. DETERMINISTIC SOCRATIC FALLBACK GENERATOR
// ----------------------------------------------------
export function generateDeterministicSocraticResponse(ctx: StudyAssistantContext): StudyAssistantResponse {
  const { concept, action, questionContext, studentAnswerGiven, recentMistake } = ctx;

  switch (action) {
    case 'explain_simple':
      return {
        message: `Mari kita sederhanakan bagian penting dari **${concept.title}**:\n\n${concept.definition}\n\nInti yang perlu diingat: ${concept.keyPoints[0] || 'Perhatikan kata kunci utama rujukan materimu.'}`,
        pedagogicalStage: 'EXPLAIN',
        followupQuestion: `Sekarang coba sebutkan: apa contoh nyata dari ${concept.title} yang paling kamu ingat?`,
        suggestedFollowups: ['Beri contoh konkret', 'Kasih petunjuk', 'Uji aku'],
        isAiGenerated: false,
      };

    case 'give_example':
      return {
        message: `Contoh konkret untuk memahami **${concept.title}**:\n\n👉 *"${concept.example || 'Penerapan konsep dalam konteks nyata / soal ujian.'}"*\n\nPerhatikan bagaimana contoh ini secara langsung menunjukkan ciri khas dari konsep tersebut.`,
        pedagogicalStage: 'ASK',
        followupQuestion: `Bisakah kamu mengenali unsur ${concept.keyPoints[0] || 'utamanya'} dalam contoh di atas?`,
        suggestedFollowups: ['Jelaskan lebih sederhana', 'Uji pemahamanku', 'Bandingkan konsep mirip'],
        isAiGenerated: false,
      };

    case 'give_hint':
      return {
        message: `💡 **Petunjuk Kunci:**\nJangan menghafal semua kalimat. Fokus pada pembeda utama:\n- ${concept.keyPoints.slice(0, 2).join('\n- ')}\n${concept.sources[0]?.snippet ? `\nCatatan Rujukan: "${concept.sources[0].snippet}"` : ''}`,
        pedagogicalStage: 'RETRIEVE',
        followupQuestion: `Berdasarkan petunjuk di atas, apa kata kunci yang membedakan konsep ini dari materi sebelumnya?`,
        suggestedFollowups: ['Coba jelaskan dengan kata sendiri', 'Beri contoh soal', 'Bantu aku ngerti'],
        isAiGenerated: false,
      };

    case 'test_me':
      return {
        message: `🎯 **Uji Ingatan Cepat (Active Recall):**\n\nTanpa melihat catatan, jika ada yang bertanya kepadamu apa itu **${concept.title}**, bagaimana caramu menjelaskannya dalam 1 kalimat?`,
        pedagogicalStage: 'RETRIEVE',
        followupQuestion: `Tuliskan kalimat singkatmu di sini:`,
        suggestedFollowups: ['Kasih petunjuk', 'Jelaskan lebih sederhana', 'Lihat rujukan catatan'],
        isAiGenerated: false,
      };

    case 'compare':
      return {
        message: `⚖️ **Perbandingan Pembeda Konsep:**\n\nKonsep **${concept.title}**:\n${concept.definition}\n\n⚠️ ${recentMistake?.misconceptionDescription || 'Kekeliruan umum adalah tertukar antara istilah subjek dengan sifat atau metode penjelasannya.'}`,
        pedagogicalStage: 'CORRECT',
        followupQuestion: `Sudah jelas letak perbedaannya, atau perlu contoh perbandingan lain?`,
        suggestedFollowups: ['Beri contoh konkret', 'Uji aku', 'Selesai'],
        isAiGenerated: false,
      };

    default:
      return {
        message: `Materi **${concept.title}** memiliki acuan utama:\n\n"${concept.definition}"\n\nPoin kunci:\n- ${concept.keyPoints.join('\n- ')}`,
        pedagogicalStage: 'EXPLAIN',
        suggestedFollowups: ['Jelaskan lebih sederhana', 'Beri contoh', 'Kasih petunjuk'],
        isAiGenerated: false,
      };
  }
}

// ----------------------------------------------------
// 2. GROUNDED GEMINI STUDY ASSISTANT
// ----------------------------------------------------
export async function askStudyAssistant(ctx: StudyAssistantContext): Promise<StudyAssistantResponse> {
  const deterministicFallback = generateDeterministicSocraticResponse(ctx);

  if (!budgetGuard.canMakeRequest()) {
    return deterministicFallback;
  }

  const apiKey = budgetGuard.getApiKey();
  if (!apiKey) {
    return deterministicFallback;
  }

  const cacheKey = `study_${ctx.concept.id}_${ctx.action}_${(ctx.studentQuery || '').slice(0, 30)}`;
  const cached = budgetGuard.getCachedResult(cacheKey);
  if (cached) return cached;

  try {
    const client = new GoogleGenAI({ apiKey });
    budgetGuard.recordRequest();

    const prompt = `Anda adalah "Teman Belajar" di PAHAM (Sistem Belajar Adaptif Pelajar Indonesia).
Prinsip Utama: Pedagogis Socratic (EXPLAIN -> ASK -> RETRIEVE -> CORRECT -> PRACTICE). Jangan langsung membocorkan jawaban secara mentah; bimbing siswa agar benar-benar paham konsep intinya.

Materi Pokok: ${ctx.concept.title}
Definisi Acuan: ${ctx.concept.definition}
Contoh Rujukan: ${ctx.concept.example}
Poin Kunci: ${ctx.concept.keyPoints.join(', ')}
${ctx.concept.sources[0]?.snippet ? `Kutipan Catatan Guru: "${ctx.concept.sources[0].snippet}" (Hal. ${ctx.concept.sources[0].pageNumber})` : ''}
${ctx.recentMistake ? `Kekeliruan Siswa Sebelumnya: "${ctx.recentMistake.misconceptionDescription}" (Jawaban siswa: "${ctx.recentMistake.userGivenAnswer}")` : ''}
${ctx.questionContext ? `Soal Latihan Terkait: "${ctx.questionContext.prompt}" | Jawaban Siswa: "${ctx.studentAnswerGiven || ''}"` : ''}

Tindakan yang diminta siswa: "${ctx.action}"
${ctx.studentQuery ? `Pertanyaan spesifik siswa: "${ctx.studentQuery}"` : ''}

Berikan respon dalam JSON valid:
{
  "message": "Penjelasan ramah, terstruktur, berbasis kurikulum Indonesia (maksimal 3 paragraf pendek atau poin jelas)...",
  "pedagogicalStage": "EXPLAIN" | "ASK" | "RETRIEVE" | "CORRECT" | "PRACTICE",
  "followupQuestion": "Satu pertanyaan tindak lanjut yang memancing siswa berpikir aktif...",
  "suggestedFollowups": ["Pilihan 1", "Pilihan 2", "Pilihan 3"]
}`;

    const interaction = await client.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
    });

    const raw = interaction.output_text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const result: StudyAssistantResponse = {
        message: parsed.message || deterministicFallback.message,
        pedagogicalStage: parsed.pedagogicalStage || deterministicFallback.pedagogicalStage,
        followupQuestion: parsed.followupQuestion || deterministicFallback.followupQuestion,
        suggestedFollowups: parsed.suggestedFollowups || deterministicFallback.suggestedFollowups,
        isAiGenerated: true,
      };
      budgetGuard.setCachedResult(cacheKey, result);
      return result;
    }

    return deterministicFallback;
  } catch (err) {
    console.warn('[StudyAssistant] Gemini call failed, using deterministic response:', err);
    return deterministicFallback;
  }
}
