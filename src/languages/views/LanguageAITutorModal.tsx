// Pedagogical Language AI Tutor Interactive Chat Modal
// Delivers progressive hints, grammar breakdown, pronunciation tips, and conversational practice

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  BookOpen, 
  RotateCcw,
  Bot,
  User,
  Lightbulb
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { PahamMascot } from '../../components/mascot/PahamMascot';

interface MessageEntry {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  stage?: string;
  suggestedFollowUp?: string[];
  timestamp: string;
}

interface LanguageAITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageId: string;
  level?: string;
}

export const LanguageAITutorModal: React.FC<LanguageAITutorModalProps> = ({
  isOpen,
  onClose,
  languageId,
  level = 'A1',
}) => {
  const isMandarin = languageId === 'zh-CN';
  const langName = isMandarin ? 'Bahasa Mandarin' : 'Bahasa Inggris';

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageEntry[]>([
    {
      id: 'init_1',
      sender: 'tutor',
      text: isMandarin
        ? `Halo! Piko siap temani kamu belajar Bahasa Mandarin (${level}). Kamu bisa tanya arti Hanzi, latihan nada Pinyin, atau membuat kalimat bersama!`
        : `Hello! I'm Piko, your dedicated English learning coach (${level}). Ask me about grammar formulas, vocabulary collocations, or let's practice conversation!`,
      suggestedFollowUp: isMandarin
        ? [
            'Bagaimana cara membedakan nada 2 dan nada 3?',
            'Kapan kita memakai partikel 了 (le)?',
            'Bantu saya susun 1 kalimat Mandarin',
          ]
        : [
            'Explain the difference between Present Perfect and Past Simple',
            'What are common collocations for "decision"?',
            'Let\'s practice a short dialogue!',
          ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage.trim();
    if (!message || isLoading) return;

    const userEntry: MessageEntry = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userEntry]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await languageLearningEngine.tutor.respondToLearner(
        message,
        languageId,
        level,
        { stage: 'HINT' }
      );

      const tutorEntry: MessageEntry = {
        id: `tut_${Date.now()}`,
        sender: 'tutor',
        text: response.tutorResponse,
        stage: response.pedagogicalStage,
        suggestedFollowUp: response.suggestedFollowUp,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, tutorEntry]);
    } catch {
      const fallbackEntry: MessageEntry = {
        id: `tut_${Date.now()}`,
        sender: 'tutor',
        text: isMandarin
          ? 'Perhatikan rumus dasar kalimat: Subjek + Waktu + Tempat + Kata Kerja + Objek. Coba kamu buat satu contoh sederhana!'
          : 'Remember the core English pattern: Subject + Verb + Object. Make sure the verb matches the subject!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-50 border border-moss-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-[620px] max-h-[92vh] animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-moss-100 bg-paper-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PahamMascot size="sm" state="thinking" interactive={false} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <span>Piko AI {langName} Tutor</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-900 text-white">
                  {level}
                </span>
              </h3>
              <p className="text-[11px] text-ink-500 font-sans">
                Pendamping belajar dengan panduan bertahap & koreksi ramah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-500 hover:text-ink-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-paper-50">
          {messages.map(msg => {
            const isTutor = msg.sender === 'tutor';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isTutor ? 'items-start' : 'items-end justify-end'}`}
              >
                {isTutor && (
                  <div className="w-7 h-7 rounded-full bg-moss-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4 text-emerald-300" />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${isTutor ? '' : 'text-right'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isTutor
                        ? 'bg-paper-100 border border-moss-200 text-ink-900 font-sans shadow-sm whitespace-pre-line'
                        : 'bg-moss-900 text-white font-sans rounded-br-none shadow-md'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Suggested Follow-up Prompts */}
                  {isTutor && msg.suggestedFollowUp && msg.suggestedFollowUp.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedFollowUp.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="px-2.5 py-1 rounded-lg bg-paper-100 hover:bg-moss-100 border border-moss-200 text-[11px] text-moss-900 font-serif transition flex items-center gap-1 text-left"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-ink-400 font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {!isTutor && (
                  <div className="w-7 h-7 rounded-full bg-moss-700 text-white flex items-center justify-center shrink-0 mb-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-moss-800 italic pt-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Piko sedang menganalisis konsep dan merangkai panduan...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-moss-100 bg-paper-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isMandarin
                ? 'Tulis pertanyaanmu (contoh: "Bagaimana cara pakai kata 把?")...'
                : 'Ask a question or type a sentence to practice...'
            }
            className="flex-1 px-4 py-2.5 bg-paper-50 border border-moss-200 rounded-xl text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-moss-600 font-sans"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-moss-900 hover:bg-moss-950 disabled:opacity-40 text-white shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
