// Study Timer Modal for PAHAM
// Contextual timer tied directly to active learning task with milestone feedback

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../core/db';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptTitle?: string;
  plannedMinutes?: number;
  onSessionComplete?: (usedMinutes: number) => void;
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  conceptTitle = 'Penokohan (Karakterisasi)',
  plannedMinutes = 8,
  onSessionComplete,
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(plannedMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(plannedMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(plannedMinutes * 60);
      setSecondsLeft(plannedMinutes * 60);
      setIsRunning(true);
      setIsCompleted(false);
    }
  }, [isOpen, plannedMinutes]);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);
            setIsCompleted(true);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const handleComplete = async () => {
    const usedMin = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    await db.learningEvents.add({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'STUDY_SESSION_COMPLETED',
      metadata: { conceptTitle, usedMinutes: usedMin },
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    if (onSessionComplete) onSessionComplete(usedMin);
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-paper-50 border border-paper-300 rounded shadow-modal max-w-md w-full p-6 sm:p-8 relative text-ink-900 text-center space-y-6">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block mb-1">
            Sesi Belajar Terfokus
          </span>
          <h2 className="text-2xl font-serif font-medium text-ink-950">
            {conceptTitle}
          </h2>
          <p className="text-xs text-ink-500 font-serif mt-1">
            "Fokus pada pemahaman mendasar dan hindari distraksi."
          </p>
        </div>

        {/* Large Minimal Timer Display */}
        <div className="py-6 space-y-3">
          <div className="text-6xl font-mono font-medium text-ink-950 tracking-tight">
            {formatTime(secondsLeft)}
          </div>
          
          {/* Subtle Progress Bar */}
          <div className="w-48 h-1.5 bg-paper-200 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-moss-700 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* State Information */}
        {isCompleted ? (
          <div className="p-3.5 bg-moss-50 border border-moss-200 rounded text-xs text-moss-900 font-serif space-y-1">
            <CheckCircle className="w-5 h-5 text-moss-700 mx-auto mb-1" />
            <p className="font-semibold">Sesi Belajar Selesai!</p>
            <p className="text-[11px] text-ink-600">
              {plannedMinutes} menit tercapai dengan baik untuk materi {conceptTitle}.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="btn-primary text-xs py-2 px-6 text-sm"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-paper-50" />}
              {isRunning ? 'Jeda' : 'Lanjutkan'}
            </button>

            <button
              onClick={() => {
                setSecondsLeft(totalSeconds);
                setIsRunning(false);
              }}
              className="btn-secondary text-xs py-2 px-3"
              title="Reset waktu"
            >
              <RotateCcw className="w-4 h-4 text-ink-500" />
            </button>
          </div>
        )}

        {isCompleted && (
          <button
            onClick={onClose}
            className="w-full btn-primary text-xs py-2.5 justify-center"
          >
            Tutup & Kembali ke Rencana
          </button>
        )}

      </div>
    </div>
  );
};
