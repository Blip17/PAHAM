// PAHAM AI Debugger View
// Sanitized AI request telemetry, latency inspector, token estimates, and provider status

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Cpu,
  Filter
} from 'lucide-react';
import { devAiLogger } from '../services/devAiLogger';
import { DevAiLogEntry } from '../types';
import { aiSecurityVault } from '../../services/ai/aiProvider';

export const AiDebuggerView: React.FC = () => {
  const [logs, setLogs] = useState<DevAiLogEntry[]>([]);
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeConfig, setActiveConfig] = useState<any | null>(null);

  const loadLogs = async () => {
    setLogs(devAiLogger.getLogs(50));
    const cfg = await aiSecurityVault.getConfig();
    setActiveConfig(cfg);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (providerFilter !== 'ALL' && log.provider !== providerFilter) return false;
    if (!searchQuery) return true;
    return log.feature.toLowerCase().includes(searchQuery.toLowerCase()) || 
           log.promptSnippet.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            AI Inference Telemetry & Sanitized Debugger
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Observe model latencies, token consumption, and fallback events. Raw keys and secrets are strictly redacted.
          </p>
        </div>

        {activeConfig && (
          <div className="flex items-center gap-2 text-xs bg-zinc-950 p-2.5 px-3 rounded-lg border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active: <strong className="text-emerald-300">{activeConfig.activeProvider.toUpperCase()}</strong></span>
            <span className="text-zinc-500">· Model: {activeConfig.selectedModel}</span>
          </div>
        )}
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">Provider:</span>
          {['ALL', 'paham', 'gemini'].map(p => (
            <button
              key={p}
              onClick={() => setProviderFilter(p)}
              className={`px-2.5 py-1 rounded text-xs uppercase font-bold transition ${
                providerFilter === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter by feature or prompt..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
        />
      </div>

      {/* Request Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 text-[10px] uppercase">
              <th className="p-3">Status</th>
              <th className="p-3">Feature</th>
              <th className="p-3">Provider / Model</th>
              <th className="p-3">Latency</th>
              <th className="p-3">Tokens Est.</th>
              <th className="p-3">Prompt Snippet</th>
              <th className="p-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-800/30 transition text-zinc-300">
                <td className="p-3">
                  {log.success ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold text-[10px]">
                      <XCircle className="w-3.5 h-3.5" />
                      {log.errorCategory || 'FAIL'}
                    </span>
                  )}
                </td>
                <td className="p-3 font-bold text-zinc-100">{log.feature}</td>
                <td className="p-3">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                    {log.provider} · {log.model}
                  </span>
                </td>
                <td className="p-3 text-emerald-400 font-bold">{log.latencyMs} ms</td>
                <td className="p-3 text-zinc-400">{log.estimatedTokens || 120} tok</td>
                <td className="p-3 max-w-xs truncate text-zinc-400" title={log.promptSnippet}>
                  "{log.promptSnippet}"
                </td>
                <td className="p-3 text-right text-[10px] text-zinc-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
