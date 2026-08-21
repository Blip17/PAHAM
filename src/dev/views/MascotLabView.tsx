// PAHAM Mascot Lab
// Visual sandbox and state controller for PIKO (The Scholarly Ink-Spirit Owl companion)

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bell, 
  MessageSquare, 
  Smile, 
  Flame, 
  Moon, 
  Zap,
  Play,
  RotateCcw
} from 'lucide-react';
import { PahamMascot, MascotState, MascotSize } from '../../components/mascot/PahamMascot';
import { devEventBus } from '../services/devEventBus';

const MASCOT_STATE_DESCRIPTIONS: Record<MascotState, { label: string; triggerEvent: string; defaultMessage: string }> = {
  idle: {
    label: 'Idle (Tenang & Siaga)',
    triggerEvent: 'App start, tab browsing',
    defaultMessage: 'Halo! Siap belajar apa hari ini?',
  },
  thinking: {
    label: 'Thinking (Sedang Menganalisis)',
    triggerEvent: 'ai.requested, ocr.processing',
    defaultMessage: 'Piko sedang menganalisis catatanmu...',
  },
  recommending: {
    label: 'Recommending (Memberi Saran)',
    triggerEvent: 'recommendation.generated',
    defaultMessage: 'Ada materi Fisika yang butuh sedikit penguatan nih!',
  },
  success: {
    label: 'Success (Jawaban Benar / Selesai)',
    triggerEvent: 'question.correct, study.completed',
    defaultMessage: 'Bagus sekali! Pemahamanmu makin tajam!',
  },
  encouraging: {
    label: 'Encouraging (Menyemangati saat Salah)',
    triggerEvent: 'question.incorrect',
    defaultMessage: 'Jangan khawatir, dari kesalahan kita belajar konsep intinya.',
  },
  warning: {
    label: 'Warning (FSRS Jatuh Tempo)',
    triggerEvent: 'review.overdue, exam.approaching',
    defaultMessage: 'Perhatian: Ada 5 kartu kilas yang sudah jatuh tempo review!',
  },
  celebrating: {
    label: 'Celebrating (Streak Milestone)',
    triggerEvent: 'streak.achieved, exam.passed',
    defaultMessage: 'Luar biasa! Kamu berhasil menjaga streak belajar 7 hari berturut-turut!',
  },
  sleeping: {
    label: 'Sleeping (Mode Malam / Istirahat)',
    triggerEvent: 'quiet_hours, long_idle',
    defaultMessage: 'Zzz... Waktunya istirahat agar otak menyerap pelajaran dengan baik.',
  },
  curious: {
    label: 'Curious (Feynman Teach-Back)',
    triggerEvent: 'feynman.explain_prompt',
    defaultMessage: 'Coba jelaskan dengan bahasamu sendiri, Piko ingin dengar!',
  },
};

export const MascotLabView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<MascotState>('recommending');
  const [selectedSize, setSelectedSize] = useState<MascotSize>('lg');
  const [customMessage, setCustomMessage] = useState<string>(MASCOT_STATE_DESCRIPTIONS.recommending.defaultMessage);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  const handleStateChange = (state: MascotState) => {
    setSelectedState(state);
    setCustomMessage(MASCOT_STATE_DESCRIPTIONS[state].defaultMessage);
    setIsDispatched(false);
  };

  const handleTriggerLiveCompanion = () => {
    devEventBus.dispatchEvent('mascot.triggered', {
      expression: selectedState,
      message: customMessage,
    }, 'dev-user', 'DEV_LAB');
    setIsDispatched(true);
    setTimeout(() => setIsDispatched(false), 2500);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Smile className="w-4 h-4 text-emerald-400" />
          Piko Mascot & Companion Interaction Lab
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Test live vector expressions, speech bubble positions, emotion states, and trigger companion reactions across the application shell.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Controls & State Matrix */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          
          {/* Expression Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Mascot State Matrix ({Object.keys(MASCOT_STATE_DESCRIPTIONS).length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(MASCOT_STATE_DESCRIPTIONS) as MascotState[]).map(stateKey => {
                const info = MASCOT_STATE_DESCRIPTIONS[stateKey];
                const isSelected = selectedState === stateKey;
                return (
                  <button
                    key={stateKey}
                    onClick={() => handleStateChange(stateKey)}
                    className={`p-3 rounded-lg text-left transition border ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs block capitalize">{stateKey}</span>
                    <span className="text-[9px] text-zinc-500 block truncate mt-0.5">{info.triggerEvent}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Mascot Render Scale
            </span>
            <div className="flex gap-2">
              {(['xs', 'sm', 'md', 'lg', 'xl'] as MascotSize[]).map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition border ${
                    selectedSize === sz
                      ? 'bg-zinc-100 text-zinc-950 border-white'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Editor */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Speech Bubble Dialogue (Indonesian)
            </span>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Dispatch Live Companion Button */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-[10px] text-zinc-500">
              Triggers live companion bubble in the bottom right corner
            </span>
            <button
              onClick={handleTriggerLiveCompanion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
              {isDispatched ? 'Triggered Live!' : 'Trigger Live Companion'}
            </button>
          </div>

        </div>

        {/* Right: Live Mascot Interactive Stage */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
          <div className="absolute top-3 left-3 text-[10px] text-zinc-500 font-bold uppercase">
            Stage Preview · State: <span className="text-emerald-400">{selectedState}</span>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <PahamMascot
              state={selectedState}
              size={selectedSize}
              bubbleText={customMessage}
              bubblePosition="top"
              interactive={true}
            />
          </div>

          <div className="absolute bottom-3 text-center text-[10px] text-zinc-500">
            Click on Piko to test interactive click reactions
          </div>
        </div>

      </div>

    </div>
  );
};
