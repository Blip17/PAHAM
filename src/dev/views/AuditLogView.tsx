// PAHAM Audit Log View
// Complete trail of privileged developer actions and synthetic modifications

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  User 
} from 'lucide-react';
import { devAuditLogger } from '../services/devAuditLogger';
import { DevAuditLogEntry } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<DevAuditLogEntry[]>([]);

  const loadLogs = () => {
    setLogs(devAuditLogger.getLogs(100));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    devAuditLogger.clearLogs();
    loadLogs();
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Developer Privilege & Operation Audit Trail
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable log recording schema updates, event dispatches, simulated user impersonations, and database writes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 text-[10px] uppercase">
              <th className="p-3">Result</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">Developer</th>
              <th className="p-3">Environment</th>
              <th className="p-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-800/30 transition text-zinc-300">
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {log.result}
                  </span>
                </td>
                <td className="p-3 font-bold text-zinc-100">{log.action}</td>
                <td className="p-3 text-zinc-400">{log.target}</td>
                <td className="p-3 text-zinc-400">{log.developer}</td>
                <td className="p-3">
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400">
                    {log.environment}
                  </span>
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
