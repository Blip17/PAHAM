// PAHAM Event Lab
// Generates, edits, validates, and dispatches events into the real application event pipeline

import React, { useState } from 'react';
import { 
  Zap, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Play, 
  Layers, 
  User, 
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { devEventBus } from '../services/devEventBus';
import { DevEventRecord } from '../types';

const EVENT_PRESETS: Record<string, Record<string, any>> = {
  'user.created': { email: 'student.dev@paham.id', grade: '10 SMA', curriculum: 'Kurikulum Merdeka' },
  'study.completed': { conceptId: 'c-hukum-newton', subjectId: 'sub-fis', minutes: 25, rating: 3 },
  'question.incorrect': { questionId: 'q-mat-diskriminan', conceptId: 'c-diskriminan', chosenOption: 'C', correctOption: 'A' },
  'question.correct': { questionId: 'q-mat-diskriminan', conceptId: 'c-diskriminan', timeSpentSeconds: 14 },
  'material.uploaded': { title: 'Catatan Bab 2 Termodinamika', fileType: 'image/jpeg', detectedConceptsCount: 4 },
  'review.due': { conceptId: 'c-penokohan', daysOverdue: 2, retrievability: 0.62 },
  'recommendation.generated': { ruleId: 'RULE_STUDY_RESCUE', title: 'Perbaiki Miskonsepsi Fisika', priority: 'HIGH', reason: 'Terdapat 3 kesalahan berulang' },
  'mascot.triggered': { expression: 'encouraging', animation: 'bounce', message: 'Tetap semangat! Coba 1 soal lagi ya.' },
  'gemini.quota_exceeded': { provider: 'gemini', model: 'gemini-2.5-flash', errorCategory: 'QUOTA_EXCEEDED' },
};

export const EventLabView: React.FC = () => {
  const [selectedEventType, setSelectedEventType] = useState<string>('study.completed');
  const [selectedUserId, setSelectedUserId] = useState<string>('dev-test-user-1');
  const [payloadString, setPayloadString] = useState<string>(JSON.stringify(EVENT_PRESETS['study.completed'], null, 2));
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [lastDispatchedEvent, setLastDispatchedEvent] = useState<DevEventRecord | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectEventType = (type: string) => {
    setSelectedEventType(type);
    setPayloadString(JSON.stringify(EVENT_PRESETS[type] || {}, null, 2));
    setValidationError(null);
  };

  const handleDispatch = async () => {
    setValidationError(null);
    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = JSON.parse(payloadString);
    } catch (err: any) {
      setValidationError(`Invalid JSON Payload: ${err?.message}`);
      return;
    }

    setIsDispatching(true);
    try {
      const res = await devEventBus.dispatchEvent(selectedEventType, parsedPayload, selectedUserId, 'DEV_LAB');
      setLastDispatchedEvent(res);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          Event Lab · Interactive Event Dispatcher
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manually trigger application events to test downstream domain side-effects (FSRS scheduling, mistake records, and Piko recommendations).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Event Type Picker */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Select Event Type ({Object.keys(EVENT_PRESETS).length})
          </span>
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {Object.keys(EVENT_PRESETS).map(eventType => {
              const isSelected = selectedEventType === eventType;
              return (
                <button
                  key={eventType}
                  onClick={() => handleSelectEventType(eventType)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition text-left ${
                    isSelected
                      ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{eventType}</span>
                  <Activity className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-zinc-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Payload Editor & Dispatch */}
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs text-zinc-400 block">Target Event:</span>
                <span className="text-sm font-bold text-purple-300">{selectedEventType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">Target User:</span>
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 text-xs focus:outline-none focus:border-purple-500 w-36"
                />
              </div>
            </div>

            {/* JSON Payload Editor */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Event Payload (JSON)
              </span>
              <textarea
                value={payloadString}
                onChange={e => setPayloadString(e.target.value)}
                rows={9}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
              />
              {validationError && (
                <div className="p-2 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Strip */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              Dispatches directly into Paham Event Bus & IndexedDB
            </span>
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs shadow-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
              {isDispatching ? 'Dispatching...' : 'Dispatch Event'}
            </button>
          </div>

          {/* Dispatched Result Feedback */}
          {lastDispatchedEvent && (
            <div className="p-4 rounded-lg bg-zinc-950 border border-emerald-800/80 space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Event Dispatched Successfully ({lastDispatchedEvent.id})
                </span>
                <span className="text-zinc-500 text-[10px]">
                  {new Date(lastDispatchedEvent.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs space-y-1 text-zinc-300">
                <span className="text-[11px] text-zinc-400 font-semibold block">Resulting Actions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {lastDispatchedEvent.resultingActions?.map((act, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px]">
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
