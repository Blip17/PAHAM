// PAHAM Top Live Surprise Chat Bubble & Announcement Component
// Renders live developer broadcasts, surprise messages, and companion speech bubbles at top of screen

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Moon, 
  PartyPopper, 
  Volume2, 
  VolumeX,
  MessageCircle,
  Zap
} from 'lucide-react';
import { liveRemoteService, LiveBroadcastPayload } from '../../dev/services/liveRemoteService';
import { realtimeClient } from '../../services/realtime/realtimeClient';
import { PahamMascot, MascotState } from '../mascot/PahamMascot';

// Web Audio API chime synthesis for surprise alerts
function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export const TopLiveAnnouncementBubble: React.FC = () => {
  const [broadcast, setBroadcast] = useState<LiveBroadcastPayload | null>(null);
  const [activeNotifId, setActiveNotifId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // 1. Subscribe to Live Server SSE Push Events
    const unsubServerNotif = realtimeClient.subscribe('pami.notification', (serverEvent) => {
      const payload = serverEvent.payload || {};
      const displayMode = payload.displayMode || 'BOTH';

      if (displayMode === 'TOP_BANNER' || displayMode === 'BOTH') {
        const mascotExpr: MascotState = payload.mascotState || payload.expression || 'happy';
        const msg = payload.message || 'Halo! Piko menyapamu!';
        const dur = payload.durationSeconds !== undefined ? Number(payload.durationSeconds) : 10;
        const playSound = payload.playSound !== false;

        setBroadcast({
          id: serverEvent.eventId || `server_${Date.now()}`,
          expression: mascotExpr,
          message: msg,
          displayMode,
          durationSeconds: dur,
          playSound,
          senderName: serverEvent.createdBy || payload.senderName || 'Piko AI',
          timestamp: serverEvent.createdAt || new Date().toISOString(),
        });
        setActiveNotifId(serverEvent.id || serverEvent.eventId || null);
        setIsVisible(true);

        if (playSound) {
          playChimeSound();
        }

        if (dur > 0) {
          const timer = setTimeout(() => {
            setIsVisible(false);
          }, dur * 1000);
          return () => clearTimeout(timer);
        }
      }
    });

    // 2. Subscribe to local BroadcastChannel fallback
    const unsubLocal = liveRemoteService.subscribe((payload) => {
      if (payload && (payload.displayMode === 'TOP_BANNER' || payload.displayMode === 'BOTH')) {
        setBroadcast(payload);
        setIsVisible(true);

        if (payload.playSound) {
          playChimeSound();
        }

        if (payload.durationSeconds > 0) {
          const timer = setTimeout(() => {
            setIsVisible(false);
          }, payload.durationSeconds * 1000);
          return () => clearTimeout(timer);
        }
      } else {
        setIsVisible(false);
      }
    });

    return () => {
      unsubServerNotif();
      unsubLocal();
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (activeNotifId) {
      realtimeClient.dismissNotification(activeNotifId);
    }
  };

  if (!isVisible || !broadcast) {
    return null;
  }

  const isSleepy = broadcast.expression === 'sleeping';
  const isCelebration = broadcast.expression === 'celebrating';
  const isWarning = broadcast.expression === 'warning';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto animate-bounceIn select-none">
      
      {/* Speech Bubble Card */}
      <div className={`relative p-4 rounded-2xl shadow-elevated border-2 transition-all flex items-start gap-3.5 backdrop-blur-md ${
        isSleepy 
          ? 'bg-zinc-900/95 border-indigo-500/80 text-zinc-100 shadow-indigo-950/40' :
        isCelebration 
          ? 'bg-amber-950/95 border-amber-400 text-amber-50 shadow-amber-900/40' :
        isWarning 
          ? 'bg-rose-950/95 border-rose-400 text-rose-50 shadow-rose-900/40' :
          'bg-paper-50/98 border-moss-800 text-ink-950 shadow-moss-950/20'
      }`}>
        
        {/* Animated Mascot Avatar */}
        <div className="relative shrink-0 pt-0.5">
          <PahamMascot 
            size="sm" 
            state={broadcast.expression} 
            interactive={false} 
          />
          {isSleepy && (
            <span className="absolute -top-2 -right-1 text-xs font-mono font-bold text-indigo-400 animate-pulse">
              Zzz...
            </span>
          )}
          {isCelebration && (
            <span className="absolute -top-2 -right-1 text-xs animate-bounce">
              ✨
            </span>
          )}
        </div>

        {/* Content & Message */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isSleepy ? 'bg-indigo-900 text-indigo-200 border border-indigo-700' :
                isCelebration ? 'bg-amber-800 text-amber-100 border border-amber-600' :
                isWarning ? 'bg-rose-900 text-rose-100 border border-rose-700' :
                'bg-moss-100 text-moss-900 border border-moss-300 font-mono'
              }`}>
                {isSleepy ? 'Piko Sedang Tidur (Zzz)' :
                 isCelebration ? 'Pemberitahuan Seru!' :
                 'Pesan dari Piko'}
              </span>
              {broadcast.senderName && (
                <span className="text-[10px] opacity-70 font-mono">({broadcast.senderName})</span>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full opacity-60 hover:opacity-100 transition"
              aria-label="Tutup Pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-serif text-xs sm:text-sm font-semibold leading-snug pt-0.5">
            "{broadcast.message || 'Halo! Piko menyapamu!'}"
          </p>

          {broadcast.durationSeconds > 0 && (
            <div className="pt-1">
              <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-current h-full opacity-60 animate-shrink" 
                  style={{ animationDuration: `${broadcast.durationSeconds}s` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Downward Speech Bubble Pointer */}
      <div className={`w-3 h-3 rotate-45 mx-auto -mt-1.5 border-r-2 border-b-2 ${
        isSleepy ? 'bg-zinc-900 border-indigo-500/80' :
        isCelebration ? 'bg-amber-950 border-amber-400' :
        isWarning ? 'bg-rose-950 border-rose-400' :
        'bg-paper-50 border-moss-800'
      }`} />

    </div>
  );
};
