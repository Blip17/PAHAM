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
import { PahamMascot } from '../mascot/PahamMascot';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // Determine mascot appearance for floating trigger
  const mascotState = topRec ? topRec.mascotState : 'idle';
  const hasUnread = recommendations.length > 0;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 select-none">
        
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
                    {recommendations.length > 0 ? `${recommendations.length} saran kontekstual aktif` : 'Semua rencana hari ini teratur'}
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
            className="group relative flex items-center gap-2.5 p-2 pr-3.5 rounded-full bg-paper-50 border-2 border-moss-800/80 shadow-modal hover:shadow-elevated hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Buka Teman Belajar Piko"
          >
            {/* Mascot Avatar */}
            <PahamMascot
              size="sm"
              state={mascotState}
              interactive={false}
            />

            <div className="text-left font-serif leading-tight pr-1">
              <span className="text-xs font-semibold text-ink-950 block">Piko</span>
              <span className="text-[10px] text-moss-800 font-mono">
                {hasUnread ? `${recommendations.length} saran` : 'Siap bantu'}
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
