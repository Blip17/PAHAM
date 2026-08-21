// PAHAM User Simulator View
// 9 Synthetic Student Archetypes with instant dataset generation and live impersonation

import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  Brain, 
  Clock, 
  AlertTriangle,
  Zap,
  Check
} from 'lucide-react';
import { SYNTHETIC_PRESETS, userSimulatorService } from '../services/userSimulatorService';
import { SyntheticUserPreset } from '../types';
import { authService } from '../../services/authService';

export const UserSimulatorView: React.FC<{ onImpersonateUser?: (profile: any) => void }> = ({ onImpersonateUser }) => {
  const [selectedPreset, setSelectedPreset] = useState<SyntheticUserPreset>('STRUGGLING_STUDENT');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerateAndImpersonate = async (preset: SyntheticUserPreset) => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const generated = await userSimulatorService.generateSyntheticUser(preset);
      setActiveProfile(generated);
      setSuccessMessage(`Berhasil membuat dataset simulasi: ${SYNTHETIC_PRESETS[preset].title}`);
      
      if (onImpersonateUser) {
        onImpersonateUser(generated);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Synthetic User Simulator & Impersonation Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Generate realistic student profiles across different mastery levels, mistake profiles, FSRS overdue states, and exam deadlines.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {successMessage}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 font-bold">
            Impersonation Active
          </span>
        </div>
      )}

      {/* Archetype Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(SYNTHETIC_PRESETS).map(meta => {
          const isSelected = selectedPreset === meta.preset;
          return (
            <div
              key={meta.preset}
              className={`p-5 rounded-xl border transition flex flex-col justify-between space-y-4 ${
                isSelected 
                  ? 'bg-zinc-900 border-emerald-500 shadow-lg' 
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}>
                    {meta.preset}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-zinc-100">{meta.title}</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{meta.description}</p>
              </div>

              {/* Stats Preview */}
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div>
                  <span className="text-zinc-500 block">Mapel</span>
                  <span className="font-bold text-zinc-200">{meta.statsPreview.subjectsCount}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Akurasi</span>
                  <span className="font-bold text-emerald-400">{meta.statsPreview.accuracyPercent}%</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Overdue</span>
                  <span className="font-bold text-amber-400">{meta.statsPreview.overdueCards}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPreset(meta.preset);
                  handleGenerateAndImpersonate(meta.preset);
                }}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating && selectedPreset === meta.preset ? 'Generating...' : 'Generate & Impersonate'}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
