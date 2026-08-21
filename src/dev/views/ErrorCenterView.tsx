// PAHAM Error Center View
// Centralized error aggregation, stack trace viewer, and resolution manager

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Check, 
  RefreshCw, 
  Code, 
  Clock, 
  Layers
} from 'lucide-react';
import { devErrorTracker } from '../services/devErrorTracker';
import { DevErrorEntry } from '../types';

export const ErrorCenterView: React.FC = () => {
  const [errors, setErrors] = useState<DevErrorEntry[]>([]);
  const [selectedError, setSelectedError] = useState<DevErrorEntry | null>(null);

  const loadErrors = () => {
    setErrors(devErrorTracker.getErrors());
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const handleResolve = (id: string) => {
    devErrorTracker.markResolved(id);
    loadErrors();
  };

  const handleClearAll = () => {
    devErrorTracker.clearErrors();
    loadErrors();
    setSelectedError(null);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Runtime Error Aggregator & Diagnostics
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Aggregates uncaught exceptions, promise rejections, and component failures grouped by frequency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadErrors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Error Log
          </button>
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-3">
        {errors.length > 0 ? (
          errors.map(err => {
            const isResolved = err.resolved;
            return (
              <div
                key={err.id}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  isResolved 
                    ? 'bg-zinc-950/60 border-zinc-800/60 opacity-60' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                      err.severity === 'HIGH' || err.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {err.severity}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100">{err.message}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                        <span>Route: <strong className="text-zinc-300">{err.route}</strong></span>
                        <span>· Component: <strong className="text-zinc-300">{err.component}</strong></span>
                        <span>· Occurrences: <strong className="text-amber-400">{err.occurrences}x</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {!isResolved ? (
                      <button
                        onClick={() => handleResolve(err.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold hover:bg-emerald-900 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 font-bold">Resolved</span>
                    )}
                  </div>
                </div>

                {err.stack && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <pre className="text-[10px] text-zinc-400 font-mono p-2.5 bg-zinc-950 rounded border border-zinc-800 overflow-x-auto">
                      {err.stack}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>Semua sistem bersih. Tidak ada error runtime aktif.</span>
          </div>
        )}
      </div>

    </div>
  );
};
