// PAHAM Event Sequence Builder
// Visual scenario creator and sequential event simulation runner

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Zap,
  FastForward,
  Layers
} from 'lucide-react';
import { DevScenarioStep } from '../types';
import { devEventBus } from '../services/devEventBus';

const DEFAULT_SCENARIO: DevScenarioStep[] = [
  {
    id: 'step-1',
    order: 1,
    name: '1. Siswa Baru Mendaftar',
    eventType: 'user.created',
    delayMs: 500,
    payload: { grade: '10 SMA', curriculum: 'Kurikulum Merdeka' },
    status: 'PENDING',
  },
  {
    id: 'step-2',
    order: 2,
    name: '2. Mulai Sesi Belajar Fisika',
    eventType: 'study.started',
    delayMs: 800,
    payload: { subjectId: 'sub-fis', conceptId: 'c-hukum-newton' },
    status: 'PENDING',
  },
  {
    id: 'step-3',
    order: 3,
    name: '3. Menjawab Salah 3 Kali Berturut-turut',
    eventType: 'question.incorrect',
    delayMs: 1000,
    payload: { conceptId: 'c-hukum-newton', chosenOption: 'B', streakMistakes: 3 },
    status: 'PENDING',
  },
  {
    id: 'step-4',
    order: 4,
    name: '4. Mesin Evaluasi Memicu Rekomendasi Penyelamatan',
    eventType: 'recommendation.generated',
    delayMs: 1200,
    payload: { ruleId: 'RULE_STUDY_RESCUE', title: 'Refresher 5 Menit Hukum Newton', priority: 'HIGH' },
    status: 'PENDING',
  },
  {
    id: 'step-5',
    order: 5,
    name: '5. Maskot Piko Muncul dengan Umpan Balik',
    eventType: 'mascot.triggered',
    delayMs: 800,
    payload: { expression: 'encouraging', animation: 'bounce', message: 'Yuk coba 1 soal pembuktian lagi!' },
    status: 'PENDING',
  },
];

export const EventSequenceView: React.FC = () => {
  const [steps, setSteps] = useState<DevScenarioStep[]>(DEFAULT_SCENARIO);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);

  const runEntireSequence = async () => {
    setIsRunning(true);
    const updated = [...steps];

    for (let i = 0; i < updated.length; i++) {
      setCurrentStepIdx(i);
      updated[i].status = 'EXECUTING';
      setSteps([...updated]);

      // Delay execution
      await new Promise(r => setTimeout(r, updated[i].delayMs));

      try {
        const res = await devEventBus.dispatchEvent(
          updated[i].eventType, 
          updated[i].payload, 
          'dev-scenario-user', 
          'SCENARIO_BUILDER'
        );
        updated[i].status = res.status === 'PROCESSED' ? 'SUCCESS' : 'FAILED';
        updated[i].resultSummary = res.resultingActions?.join(', ');
      } catch (err: any) {
        updated[i].status = 'FAILED';
        updated[i].resultSummary = err?.message;
      }

      setSteps([...updated]);
    }

    setIsRunning(false);
  };

  const executeSingleStep = async (idx: number) => {
    const updated = [...steps];
    updated[idx].status = 'EXECUTING';
    setSteps([...updated]);

    try {
      const res = await devEventBus.dispatchEvent(
        updated[idx].eventType, 
        updated[idx].payload, 
        'dev-scenario-user', 
        'SCENARIO_BUILDER'
      );
      updated[idx].status = res.status === 'PROCESSED' ? 'SUCCESS' : 'FAILED';
      updated[idx].resultSummary = res.resultingActions?.join(', ');
    } catch (err: any) {
      updated[idx].status = 'FAILED';
      updated[idx].resultSummary = err?.message;
    }

    setSteps([...updated]);
  };

  const resetSequence = () => {
    setIsRunning(false);
    setCurrentStepIdx(-1);
    setSteps(DEFAULT_SCENARIO.map(s => ({ ...s, status: 'PENDING', resultSummary: undefined })));
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Top Controls */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Event Scenario & Sequence Builder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Build multi-step learning journeys and replay them to test complex multi-event domain chains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSequence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={runEntireSequence}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isRunning ? 'Running Scenario...' : 'Execute Entire Sequence'}
          </button>
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCurrent = currentStepIdx === idx && isRunning;
          const statusColor = {
            PENDING: 'border-zinc-800 bg-zinc-950 text-zinc-400',
            EXECUTING: 'border-purple-500 bg-purple-950/40 text-purple-200 animate-pulse',
            SUCCESS: 'border-emerald-700 bg-emerald-950/40 text-emerald-200',
            FAILED: 'border-rose-700 bg-rose-950/40 text-rose-200',
          }[step.status];

          return (
            <React.Fragment key={step.id}>
              <div className={`p-4 rounded-xl border transition shadow-sm ${statusColor}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center">
                      {step.order}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100">{step.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span className="text-purple-400 font-bold">{step.eventType}</span>
                        <span>· Delay: {step.delayMs}ms</span>
                        {step.resultSummary && (
                          <span className="text-emerald-400">· {step.resultSummary}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => executeSingleStep(idx)}
                      disabled={isRunning}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 font-bold flex items-center gap-1 transition"
                    >
                      <FastForward className="w-3 h-3" />
                      Step Only
                    </button>
                  </div>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center py-1 text-zinc-600">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
};
