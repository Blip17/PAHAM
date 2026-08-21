// PAHAM Feature Flag Control View
// Real-time switchboard for toggling experiments, UI modes, and developer tools

import React, { useState } from 'react';
import { 
  ToggleLeft, 
  ToggleRight, 
  RotateCcw, 
  Sliders, 
  CheckCircle, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { featureFlagService } from '../services/featureFlagService';
import { FeatureFlag } from '../types';

export const FeatureFlagView: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>(featureFlagService.getAllFlags());

  const handleToggle = (key: string, currentVal: boolean) => {
    featureFlagService.setFlag(key, !currentVal);
    setFlags(featureFlagService.getAllFlags());
  };

  const handleResetDefaults = () => {
    featureFlagService.resetDefaults();
    setFlags(featureFlagService.getAllFlags());
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Feature Flag & Experimentation Switchboard
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Toggle system capabilities, UI experimental states, and AI providers on the fly without redeployment.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Defaults
        </button>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {flags.map(flag => {
          return (
            <div
              key={flag.key}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                flag.enabled
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-zinc-950 border-zinc-800/80 opacity-75'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-zinc-100">{flag.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                    {flag.key}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    flag.category === 'CORE' ? 'bg-blue-950 text-blue-300' :
                    flag.category === 'AI' ? 'bg-emerald-950 text-emerald-300' :
                    flag.category === 'UI' ? 'bg-purple-950 text-purple-300' :
                    'bg-amber-950 text-amber-300'
                  }`}>
                    {flag.category}
                  </span>
                  {flag.devOnly && (
                    <span className="text-[9px] px-1 rounded bg-zinc-800 text-amber-400 border border-amber-800">
                      DEV ONLY
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{flag.description}</p>
              </div>

              <button
                onClick={() => handleToggle(flag.key, flag.enabled)}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition shrink-0 ${
                  flag.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    ENABLED
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    DISABLED
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
