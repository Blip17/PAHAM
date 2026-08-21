// Recommendation Card for PAHAM Personal Learning Companion
// Editorial card with mascot feedback, transparent rationale, priority badge, and non-intrusive actions

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Clock, 
  X, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  MoreHorizontal,
  BellOff
} from 'lucide-react';
import { CompanionRecommendation } from '../../core/types';
import { PahamMascot } from '../mascot/PahamMascot';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface RecommendationCardProps {
  recommendation: CompanionRecommendation;
  onAccept: (rec: CompanionRecommendation) => void;
  onDismiss: (rec: CompanionRecommendation, suppressRule?: boolean) => void;
  onSnooze: (rec: CompanionRecommendation, hours?: number) => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAccept,
  onDismiss,
  onSnooze,
  className = '',
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(false);

  const priorityBadgeVariant = {
    HIGH: 'terracotta' as const,
    MEDIUM: 'amber' as const,
    LOW: 'moss' as const,
  }[recommendation.priority];

  const getActionLabel = () => {
    switch (recommendation.actionType) {
      case 'REVIEW_FLASHCARDS': return 'Review Flashcard';
      case 'SIMULATE_EXAM': return 'Buka Simulasi Ujian';
      case 'TAKE_QUIZ': return 'Mulai Latihan';
      case 'READ_MATERIAL': return 'Buka Catatan';
      case 'RESCUE_STUDY': return 'Mulai 5 Menit Saja';
      default: return 'Mulai Sesi Belajar';
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-lg bg-paper-50 border border-paper-300 shadow-elevated space-y-3.5 relative transition-all duration-200 ${className}`}>
      
      {/* Header: Mascot, Priority & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PahamMascot
            size="sm"
            state={recommendation.mascotState}
            bubbleText={recommendation.bubblePrompt}
            bubblePosition="right"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant={priorityBadgeVariant} size="xs" dot>
                {recommendation.priority === 'HIGH' ? 'Prioritas Tinggi' : recommendation.priority === 'MEDIUM' ? 'Saran Terarah' : 'Eksplorasi'}
              </Badge>
              {recommendation.subjectName && (
                <span className="text-[10px] font-mono text-ink-500">
                  {recommendation.subjectName}
                </span>
              )}
            </div>
            <h4 className="font-serif font-medium text-sm sm:text-base text-ink-950 leading-snug">
              {recommendation.title}
            </h4>
          </div>
        </div>

        {/* Options Trigger / Dismiss Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowOptions(prev => !prev)}
            className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-paper-200 transition"
            aria-label="Opsi Rekomendasi"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-paper-50 border border-paper-300 rounded shadow-elevated py-1 z-30 text-xs font-serif animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  onSnooze(recommendation, 2);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-paper-150 flex items-center gap-2 text-ink-700"
              >
                <Clock className="w-3.5 h-3.5 text-ink-500" />
                <span>Ingatkan 2 jam lagi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  onDismiss(recommendation, false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-paper-150 flex items-center gap-2 text-ink-700"
              >
                <X className="w-3.5 h-3.5 text-ink-500" />
                <span>Tutup saran ini</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptions(false);
                  onDismiss(recommendation, true);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-paper-150 flex items-center gap-2 text-terracotta-800 border-t border-paper-200"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Jangan ingatkan tipe ini</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Body */}
      <p className="text-xs text-ink-700 font-serif leading-relaxed">
        {recommendation.message}
      </p>

      {/* Transparent Reason Banner */}
      <div className="p-2 rounded bg-paper-100 border border-paper-200 text-[11px] font-serif text-ink-600 space-y-0.5">
        <span className="font-semibold text-moss-900 font-mono text-[10px] uppercase block tracking-wider">
          Alasan Rekomendasi:
        </span>
        <p className="italic">"{recommendation.reason}"</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSnooze(recommendation, 2)}
          className="text-xs font-mono text-ink-500 hover:text-ink-900 px-2 py-1 transition"
        >
          Nanti Saja
        </button>

        <Button
          onClick={() => onAccept(recommendation)}
          size="sm"
          variant="primary"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          {getActionLabel()}
        </Button>
      </div>

    </div>
  );
};
