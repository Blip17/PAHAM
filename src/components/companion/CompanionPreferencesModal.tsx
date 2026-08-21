// Companion Preferences Modal for PAHAM
// Student controls for notification priorities, quiet hours, and suppressed rules

import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Sliders, 
  Trash2, 
  RotateCcw, 
  Check, 
  X,
  ShieldCheck
} from 'lucide-react';
import { CompanionNotificationPreferences } from '../../core/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface CompanionPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: CompanionNotificationPreferences;
  onSavePreferences: (updated: CompanionNotificationPreferences) => Promise<void>;
}

export const CompanionPreferencesModal: React.FC<CompanionPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [currentPrefs, setCurrentPrefs] = useState<CompanionNotificationPreferences>(preferences);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleToggle = (key: keyof CompanionNotificationPreferences) => {
    setCurrentPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetSuppressed = () => {
    setCurrentPrefs(prev => ({
      ...prev,
      suppressedRuleIds: [],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePreferences(currentPrefs);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan Teman Belajar (Piko)"
      description="Sesuaikan bagaimana Piko memberikan rekomendasi dan pengingat belajar."
      maxWidth="md"
    >
      <div className="space-y-5 text-xs text-ink-900 font-sans">
        
        {/* Priority Toggles */}
        <div className="space-y-3 border-b border-paper-200 pb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
            Tingkat Rekomendasi
          </span>

          <label className="flex items-start justify-between gap-3 p-3 rounded bg-paper-100/80 border border-paper-200 cursor-pointer hover:bg-paper-150 transition">
            <div className="space-y-0.5">
              <span className="font-semibold text-ink-950 block">Prioritas Tinggi (High Priority)</span>
              <p className="text-ink-600 font-serif leading-relaxed">
                Pengingat ulangan yang sudah dekat (&le; 5 hari) dan kartu flashcard FSRS yang jatuh tempo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={currentPrefs.enableHighPriority}
              onChange={() => handleToggle('enableHighPriority')}
              className="mt-1 w-4 h-4 accent-moss-800 cursor-pointer"
            />
          </label>

          <label className="flex items-start justify-between gap-3 p-3 rounded bg-paper-100/80 border border-paper-200 cursor-pointer hover:bg-paper-150 transition">
            <div className="space-y-0.5">
              <span className="font-semibold text-ink-950 block">Saran Terarah (Medium Priority)</span>
              <p className="text-ink-600 font-serif leading-relaxed">
                Perbaikan miskonsepsi berulang, catatan materi baru, dan target mingguan yang perlu dikejar.
              </p>
            </div>
            <input
              type="checkbox"
              checked={currentPrefs.enableMediumPriority}
              onChange={() => handleToggle('enableMediumPriority')}
              className="mt-1 w-4 h-4 accent-moss-800 cursor-pointer"
            />
          </label>

          <label className="flex items-start justify-between gap-3 p-3 rounded bg-paper-100/80 border border-paper-200 cursor-pointer hover:bg-paper-150 transition">
            <div className="space-y-0.5">
              <span className="font-semibold text-ink-950 block">Eksplorasi & Penguatan (Low Priority)</span>
              <p className="text-ink-600 font-serif leading-relaxed">
                Pengecekan memori konsep lama dan eksplorasi topik tambahan.
              </p>
            </div>
            <input
              type="checkbox"
              checked={currentPrefs.enableLowPriority}
              onChange={() => handleToggle('enableLowPriority')}
              className="mt-1 w-4 h-4 accent-moss-800 cursor-pointer"
            />
          </label>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3 border-b border-paper-200 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              Jam Tenang (Quiet Hours)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-mono text-ink-600">
              <input
                type="checkbox"
                checked={currentPrefs.quietHoursEnabled}
                onChange={() => handleToggle('quietHoursEnabled')}
                className="w-3.5 h-3.5 accent-moss-800 cursor-pointer"
              />
              <span>Aktifkan</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-ink-500 block mb-1">Mulai Jam Tenang</label>
              <input
                type="time"
                value={currentPrefs.quietHoursStart}
                onChange={(e) => setCurrentPrefs(p => ({ ...p, quietHoursStart: e.target.value }))}
                className="w-full bg-paper-100 border border-paper-300 rounded p-2 text-xs font-mono text-ink-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-ink-500 block mb-1">Selesai Jam Tenang</label>
              <input
                type="time"
                value={currentPrefs.quietHoursEnd}
                onChange={(e) => setCurrentPrefs(p => ({ ...p, quietHoursEnd: e.target.value }))}
                className="w-full bg-paper-100 border border-paper-300 rounded p-2 text-xs font-mono text-ink-900"
              />
            </div>
          </div>
          <p className="text-[11px] text-ink-500 font-serif">
            Selama jam tenang, Piko tidak akan memunculkan gelembung notifikasi untuk menjaga istirahatmu.
          </p>
        </div>

        {/* Suppressed Rules Management */}
        {currentPrefs.suppressedRuleIds && currentPrefs.suppressedRuleIds.length > 0 && (
          <div className="space-y-2 border-b border-paper-200 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-terracotta-900 font-semibold block">
                Saran yang Dinonaktifkan ({currentPrefs.suppressedRuleIds.length})
              </span>
              <button
                type="button"
                onClick={handleResetSuppressed}
                className="text-moss-800 text-[11px] hover:underline flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                Aktifkan Kembali Semua
              </button>
            </div>
            <p className="text-[11px] text-ink-500 font-serif">
              Kamu telah menonaktifkan {currentPrefs.suppressedRuleIds.length} tipe saran sebelumnya.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSave}
            rightIcon={<Check className="w-3.5 h-3.5" />}
          >
            Simpan Pengaturan
          </Button>
        </div>

      </div>
    </Modal>
  );
};
