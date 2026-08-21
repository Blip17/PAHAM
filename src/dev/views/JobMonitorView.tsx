// PAHAM Job / Background Task Monitor View
// Monitors background schedulers, FSRS sync queues, and recommendation evaluators

import React, { useState } from 'react';
import { 
  Activity, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { DevBackgroundJob } from '../types';

const INITIAL_JOBS: DevBackgroundJob[] = [
  {
    id: 'job-1',
    name: 'FSRS Spaced Repetition Sync',
    type: 'FSRS_SYNC',
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - 600000).toISOString(),
    durationMs: 34,
    retryCount: 0,
  },
  {
    id: 'job-2',
    name: 'Signal Recommendation Evaluator',
    type: 'RECOMMENDATION_EVAL',
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    durationMs: 12,
    retryCount: 0,
  },
  {
    id: 'job-3',
    name: 'Study Streak & Daily Goal Verification',
    type: 'STREAK_CHECK',
    status: 'PENDING',
    startedAt: new Date().toISOString(),
    retryCount: 0,
  },
];

export const JobMonitorView: React.FC = () => {
  const [jobs, setJobs] = useState<DevBackgroundJob[]>(INITIAL_JOBS);

  const handleRunJob = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return { ...j, status: 'RUNNING' };
      }
      return j;
    }));

    setTimeout(() => {
      setJobs(prev => prev.map(j => {
        if (j.id === id) {
          return { ...j, status: 'COMPLETED', durationMs: Math.round(15 + Math.random() * 25) };
        }
        return j;
      }));
    }, 800);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Background Jobs & Task Queue Monitor
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Observe background jobs (spaced repetition updates, signal evaluators, streak calculations).
          </p>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map(job => (
          <div
            key={job.id}
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  job.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  job.status === 'RUNNING' ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {job.status}
                </span>
                <h3 className="text-xs font-bold text-zinc-100">{job.name}</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {job.type}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Started: {new Date(job.startedAt).toLocaleTimeString()}
                {job.durationMs && ` · Duration: ${job.durationMs}ms`}
              </div>
            </div>

            <button
              onClick={() => handleRunJob(job.id)}
              disabled={job.status === 'RUNNING'}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Play className="w-3 h-3 fill-zinc-200" />
              Run Now
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
