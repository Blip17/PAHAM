// Subtle Floating Corner Companion for PAHAM
// Non-intrusive floating avatar in bottom-right corner with recommendation drawer & preferences

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Settings, 
  ChevronDown, 
  Layers,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { CompanionRecommendation, CompanionNotificationPreferences } from '../../core/types';
import { companionService, DEFAULT_COMPANION_PREFERENCES } from '../../learning/companion/companionService';
import { liveRemoteService, LiveBroadcastPayload } from '../../dev/services/liveRemoteService';
import { realtimeClient } from '../../services/realtime/realtimeClient';
import { PahamMascot, MascotState } from '../mascot/PahamMascot';
import { RecommendationCard } from './RecommendationCard';
import { CompanionPreferencesModal } from './CompanionPreferencesModal';

export interface MascotCompanionCornerProps {
  onStartStudy?: (conceptId?: string) => void;
  onOpenFlashcards?: () => void;
  onOpenQuiz?: (conceptId?: string) => void;
  onOpenExam?: (examId?: string) => void;
  onOpenMaterials?: () => void;
  currentTab?: string;
}

export const MascotCompanionCorner: React.FC<MascotCompanionCornerProps> = ({
  onStartStudy,
  onOpenFlashcards,
  onOpenQuiz,
  onOpenExam,
  onOpenMaterials,
  currentTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<CompanionRecommendation[]>([]);
  const [preferences, setPreferences] = useState<CompanionNotificationPreferences>(DEFAULT_COMPANION_PREFERENCES);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [, setIsLoading] = useState<boolean>(false);
  const [liveOverride, setLiveOverride] = useState<LiveBroadcastPayload | null>(liveRemoteService.getCurrentOverride());

  // Listen to Server-Backed SSE Realtime Events + Local Fallback
  useEffect(() => {
    // 1. Server SSE State Change / Notification
    const unsubServerNotif = realtimeClient.subscribe('pami.notification', (serverEvent) => {
      const payload = serverEvent.payload || {};
      const mascotExpr: MascotState = payload.mascotState || payload.expression || 'happy';
      setLiveOverride({
        id: serverEvent.eventId || `server_${Date.now()}`,
        expression: mascotExpr,
        message: payload.message || '',
        displayMode: payload.displayMode || 'BOTH',
        durationSeconds: Number(payload.durationSeconds || 10),
        playSound: payload.playSound !== false,
        senderName: serverEvent.createdBy || payload.senderName || 'Developer',
        timestamp: serverEvent.createdAt || new Date().toISOString(),
      });
    });

    const unsubServerState = realtimeClient.subscribe('pami.state_change', (serverEvent) => {
      const payload = serverEvent.payload || {};
      const mascotExpr: MascotState = payload.mascotState || payload.expression || 'happy';
      setLiveOverride({
        id: serverEvent.eventId || `server_${Date.now()}`,
        expression: mascotExpr,
        message: payload.message || '',
        displayMode: payload.displayMode || 'BOTH',
        durationSeconds: Number(payload.durationSeconds || 10),
        playSound: false,
        senderName: serverEvent.createdBy || 'Developer',
        timestamp: serverEvent.createdAt || new Date().toISOString(),
      });
    });

    // 2. Local fallback
    const unsubLocal = liveRemoteService.subscribe((payload) => {
      setLiveOverride(payload);
    });

    return () => {
      unsubServerNotif();
      unsubServerState();
      unsubLocal();
    };
  }, []);

  // Load active recommendations and preferences
  const refreshCompanionData = async () => {
    setIsLoading(true);
    try {
      const prefs = await companionService.getPreferences();
      setPreferences(prefs);

      if (prefs.cornerCompanionVisible) {
        const active = await companionService.getActiveRecommendations();
        setRecommendations(active);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanionData();
  }, [currentTab]);

  const topRec = recommendations[0];

  const handleAccept = async (rec: CompanionRecommendation) => {
    await companionService.acceptRecommendation(rec);
    setRecommendations(prev => prev.filter(r => r.id !== rec.id));
    setIsOpen(false);

    // Route to appropriate view based on action type
    switch (rec.actionType) {
      case 'REVIEW_FLASHCARDS':
        if (onOpenFlashcards) onOpenFlashcards();
        break;
      case 'SIMULATE_EXAM':
        if (onOpenExam) onOpenExam(rec.examId);
        break;
      case 'TAKE_QUIZ':
        if (onOpenQuiz) onOpenQuiz(rec.conceptId);
        break;
      case 'READ_MATERIAL':
        if (onOpenMaterials) onOpenMaterials();
        break;
      case 'RESCUE_STUDY':
      case 'STUDY_CONCEPT':
      default:
        if (onStartStudy) onStartStudy(rec.conceptId);
        break;
    }
  };

  const handleDismiss = async (rec: CompanionRecommendation, suppressRule: boolean = false) => {
    await companionService.dismissRecommendation(rec, suppressRule);
    setRecommendations(prev => prev.filter(r => r.id !== rec.id));
  };

  const handleSnooze = async (rec: CompanionRecommendation, hours: number = 2) => {
    await companionService.snoozeRecommendation(rec, hours);
    setRecommendations(prev => prev.filter(r => r.id !== rec.id));
  };

  const handleSavePreferences = async (updated: CompanionNotificationPreferences) => {
    await companionService.updatePreferences(updated);
    setPreferences(updated);
    refreshCompanionData();
  };

  // If corner companion is disabled in preferences, don't render
  if (!preferences.cornerCompanionVisible) {
    return null;
  }

  // Determine mascot appearance for floating trigger (live override takes precedence)
  const mascotState = liveOverride ? liveOverride.expression : (topRec ? topRec.mascotState : 'idle');
  const hasUnread = recommendations.length > 0;
  const showCornerBubble = liveOverride?.message && (liveOverride.displayMode === 'CORNER_BUBBLE' || liveOverride.displayMode === 'BOTH');

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 select-none">
        
        {/* Floating Speech Bubble Attached to Piko (Live Surprise Chat) */}
        {!isOpen && showCornerBubble && (
          <div className="absolute bottom-full right-0 mb-3 w-64 p-3.5 rounded-2xl bg-paper-50 border-2 border-moss-800 shadow-modal text-ink-950 animate-bounceIn">
            <div className="flex items-start justify-between gap-1.5 pb-1">
              <span className="text-[10px] font-bold font-mono text-moss-800 uppercase">
                {mascotState === 'sleeping' ? 'Piko (Lagi Tidur)' : 'Piko Menyapa'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  liveRemoteService.clearOverride();
                }}
                className="p-0.5 rounded text-ink-400 hover:text-ink-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="font-serif text-xs font-semibold leading-snug text-ink-900">
              "{liveOverride?.message}"
            </p>
            {/* Speech bubble pointer */}
            <div className="absolute top-full right-6 w-3 h-3 -mt-1.5 rotate-45 bg-paper-50 border-r-2 border-b-2 border-moss-800" />
          </div>
        )}

        {/* ── EXPANDED COMPANION DRAWER / CARD ────────────────── */}
        {isOpen ? (
          <div className="w-80 sm:w-96 bg-paper-50 border border-paper-300 rounded-xl shadow-modal p-5 space-y-4 animate-scaleUp text-ink-900 relative">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div className="flex items-center gap-2.5">
                <PahamMascot size="xs" state={mascotState} />
                <div>
                  <span className="font-serif font-bold text-sm text-ink-950 block leading-tight">
                    Piko · Teman Belajar
                  </span>
                  <span className="text-[10px] font-mono text-moss-800 font-medium">
                    {liveOverride ? `Mode Live Aktif: ${liveOverride.expression.toUpperCase()}` : (recommendations.length > 0 ? `${recommendations.length} saran kontekstual aktif` : 'Semua rencana hari ini teratur')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(true)}
                  className="p-1.5 rounded text-ink-400 hover:text-ink-900 hover:bg-paper-200 transition"
                  title="Pengaturan Teman Belajar"
                  aria-label="Pengaturan Piko"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded text-ink-400 hover:text-ink-900 hover:bg-paper-200 transition"
                  title="Tutup Panel"
                  aria-label="Tutup Panel Piko"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recommendations List or Clean Slate */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {recommendations.length > 0 ? (
                recommendations.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onAccept={handleAccept}
                    onDismiss={handleDismiss}
                    onSnooze={handleSnooze}
                  />
                ))
              ) : (
                <div className="py-6 text-center space-y-2 font-serif text-xs text-ink-600">
                  <Compass className="w-8 h-8 text-moss-700 mx-auto" />
                  <p className="font-medium text-ink-900">Belum ada saran mendesak.</p>
                  <p className="text-[11px] text-ink-500 max-w-xs mx-auto leading-relaxed">
                    Belajarmu berjalan dengan baik. Buka materi atau kartu flashcard kapan pun kamu siap.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-2 border-t border-paper-200 flex items-center justify-between text-[11px] font-mono text-ink-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-moss-700" />
                Berdasarkan FSRS & hasil latihanmu
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-moss-800 hover:underline"
              >
                Sembunyikan
              </button>
            </div>

          </div>
        ) : (
          /* ── FLOATING CORNER AVATAR TRIGGER ─────────────────── */
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`group relative flex items-center gap-2.5 p-2 pr-3.5 rounded-full bg-paper-50 border-2 shadow-modal hover:shadow-elevated hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${
              mascotState === 'sleeping' ? 'border-indigo-500' :
              mascotState === 'celebrating' ? 'border-amber-500' :
              mascotState === 'warning' ? 'border-rose-500' :
              'border-moss-800/80'
            }`}
            aria-label="Buka Teman Belajar Piko"
          >
            {/* Mascot Avatar */}
            <PahamMascot
              size="sm"
              state={mascotState}
              interactive={false}
            />

            <div className="text-left font-serif leading-tight pr-1">
              <span className="text-xs font-semibold text-ink-950 block">
                {mascotState === 'sleeping' ? 'Piko (Zzz)' : 'Piko'}
              </span>
              <span className="text-[10px] text-moss-800 font-mono">
                {liveOverride ? 'Live Dev' : (hasUnread ? `${recommendations.length} saran` : 'Siap bantu')}
              </span>
            </div>

            {/* Unread Alert Ping Indicator */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-moss-800 text-paper-50 text-[9px] font-mono font-bold items-center justify-center">
                  {recommendations.length}
                </span>
              </span>
            )}
          </button>
        )}

      </div>

      {/* Preferences Modal */}
      <CompanionPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
      />
    </>
  );
};
