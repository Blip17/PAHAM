// Study Assistant Drawer ("Teman Belajar") Component for PAHAM
// Contextual, Socratic learning panel grounded in student notes and concept definitions

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  Layers, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Concept, Question, MistakeRecord, StudyAssistantAction, StudyAssistantResponse } from '../../core/types';
import { askStudyAssistant } from '../../services/ai/studyAssistant';

interface StudyAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concept: Concept | null;
  initialAction?: StudyAssistantAction;
  questionContext?: Question;
  studentAnswerGiven?: string;
  recentMistake?: MistakeRecord;
}

export const StudyAssistantDrawer: React.FC<StudyAssistantDrawerProps> = ({
  isOpen,
  onClose,
  concept,
  initialAction = 'explain_simple',
  questionContext,
  studentAnswerGiven,
  recentMistake,
}) => {
  const [activeAction, setActiveAction] = useState<StudyAssistantAction>(initialAction);
  const [history, setHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string; followup?: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && concept) {
      handleTriggerAction(initialAction);
    } else {
      setHistory([]);
      setInputText('');
    }
  }, [isOpen, concept?.id, initialAction]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleTriggerAction = async (action: StudyAssistantAction, customQuery?: string) => {
    if (!concept) return;
    setActiveAction(action);
    setIsLoading(true);

    if (customQuery) {
      setHistory(prev => [...prev, { sender: 'user', text: customQuery }]);
    }

    const response: StudyAssistantResponse = await askStudyAssistant({
      concept,
      action,
      studentQuery: customQuery,
      questionContext,
      studentAnswerGiven,
      recentMistake,
    });

    setHistory(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: response.message,
        followup: response.followupQuestion,
      },
    ]);

    setIsLoading(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query || isLoading) return;
    setInputText('');
    handleTriggerAction(activeAction, query);
  };

  if (!isOpen || !concept) return null;

  const quickActions: Array<{ id: StudyAssistantAction; label: string; icon: any }> = [
    { id: 'explain_simple', label: 'Lebih Sederhana', icon: BookOpen },
    { id: 'give_example', label: 'Beri Contoh', icon: Lightbulb },
    { id: 'give_hint', label: 'Kasih Petunjuk', icon: HelpCircle },
    { id: 'test_me', label: 'Uji Aku', icon: CheckCircle2 },
    { id: 'compare', label: 'Bandingkan', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-ink-950/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg h-full bg-paper-50 border-l border-paper-300 flex flex-col justify-between shadow-modal anim-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* ── Top Header ─────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-paper-200 bg-paper-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-moss-900 text-paper-50 flex items-center justify-center font-serif text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-moss-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Teman Belajar PAHAM
              </span>
              <h3 id="assistant-title" className="font-serif text-base text-ink-950 font-medium truncate max-w-[260px]">
                {concept.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-paper-200 text-ink-600 hover:bg-paper-300 transition-colors"
            aria-label="Tutup Teman Belajar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Quick Contextual Action Chips ──────────────────────── */}
        <div className="px-4 py-2.5 border-b border-paper-200 bg-paper-50 flex items-center gap-1.5 overflow-x-auto text-xs">
          {quickActions.map(act => {
            const Icon = act.icon;
            const isSelected = activeAction === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleTriggerAction(act.id)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-sans text-xs shrink-0 transition ${
                  isSelected
                    ? 'bg-moss-900 text-paper-50 font-medium'
                    : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Socratic Conversation Stream ───────────────────────── */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Grounding Source Badge */}
          {concept.sources && concept.sources.length > 0 && (
            <div className="p-2.5 rounded bg-paper-100 border border-paper-200 text-[11px] text-ink-600 font-mono flex items-center gap-2">
              <span className="text-moss-800 font-semibold">📄 Acuan Catatan:</span>
              <span className="truncate">{concept.sources[0].snippet || concept.title}</span>
            </div>
          )}

          {/* Dialogue History */}
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-lg text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans ${
                  msg.sender === 'user'
                    ? 'bg-ink-900 text-paper-50'
                    : 'bg-paper-100 border border-paper-200 text-ink-950 font-serif'
                }`}
              >
                {msg.text}
              </div>

              {/* Socratic Follow-up Question Prompt */}
              {msg.followup && (
                <div className="mt-2 max-w-[90%] p-3 rounded bg-moss-50 border border-moss-200 text-moss-950 text-xs font-sans space-y-1">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider text-moss-800">
                    💡 Coba Pikirkan:
                  </span>
                  <p className="font-serif italic text-xs sm:text-sm leading-snug">{msg.followup}</p>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-3.5 rounded-lg bg-paper-100 border border-paper-200 text-xs text-ink-600 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-moss-700 animate-pulse" />
              <span>Teman Belajar sedang menyusun penjelasan...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Bottom Input & Response Form ───────────────────────── */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-paper-200 bg-paper-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tulis pertanyaanmu atau jawab pertanyaan di atas..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-paper-50 border border-paper-300 rounded px-3 py-2 text-xs sm:text-sm text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-moss-700"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn-primary text-xs py-2 px-3.5 disabled:opacity-40"
              aria-label="Kirim respon"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-ink-400 block font-serif mt-1.5 text-center">
            Paham Teman Belajar membimbing pemahaman tanpa membocorkan jawaban mentah.
          </span>
        </form>

      </div>
    </div>
  );
};
