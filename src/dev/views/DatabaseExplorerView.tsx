// PAHAM Database Explorer
// Powerful visual table browser and record editor across all 18 IndexedDB tables

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Download, 
  RefreshCw,
  AlertTriangle,
  X
} from 'lucide-react';
import { db } from '../../core/db';
import { devAuditLogger } from '../services/devAuditLogger';

export const DatabaseExplorerView: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [records, setRecords] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editJson, setEditJson] = useState<string>('');
  const [isDeletingRecord, setIsDeletingRecord] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const loadTablesAndCounts = async () => {
    setIsLoading(true);
    const tableNames = db.tables.map(t => t.name);
    setTables(tableNames);

    const counts: Record<string, number> = {};
    for (const table of db.tables) {
      try {
        counts[table.name] = await table.count();
      } catch {
        counts[table.name] = 0;
      }
    }
    setTableCounts(counts);
    await loadTableRecords(selectedTable);
    setIsLoading(false);
  };

  const loadTableRecords = async (tableName: string) => {
    setIsLoading(true);
    try {
      const table = (db as any)[tableName];
      if (table) {
        const all = await table.toArray();
        setRecords(all);
      }
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTablesAndCounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadTableRecords(selectedTable);
  }, [selectedTable]);

  const copyToClipboard = (val: string, keyId: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = records.length > 0 ? Object.keys(records[0]).slice(0, 7) : ['id'];

  const handleSaveEdit = async () => {
    try {
      const parsed = JSON.parse(editJson);
      const table = (db as any)[selectedTable];
      await table.put(parsed);

      devAuditLogger.log({
        developer: 'Developer',
        action: `DB_UPDATE_RECORD: ${selectedTable}`,
        target: `ID: ${parsed.id || 'unknown'}`,
        environment: 'development',
        result: 'SUCCESS',
        details: parsed,
      });

      setEditingRecord(null);
      await loadTableRecords(selectedTable);
    } catch (err: any) {
      alert(`Invalid JSON format: ${err?.message}`);
    }
  };

  const handleDeleteRecord = async (record: any) => {
    const table = (db as any)[selectedTable];
    const key = record.id || record.conceptId || record.key;
    if (key && table) {
      await table.delete(key);

      devAuditLogger.log({
        developer: 'Developer',
        action: `DB_DELETE_RECORD: ${selectedTable}`,
        target: `Key: ${key}`,
        environment: 'development',
        result: 'SUCCESS',
      });

      setIsDeletingRecord(null);
      setSelectedRecord(null);
      await loadTableRecords(selectedTable);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[700px]">
      
      {/* ── Table List Sidebar ────────────────────────── */}
      <div className="w-full lg:w-64 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-400" />
            Tables ({tables.length})
          </span>
          <button
            onClick={loadTablesAndCounts}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
            title="Reload Tables"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[550px] pr-1">
          {tables.map(tableName => {
            const count = tableCounts[tableName] || 0;
            const isSelected = selectedTable === tableName;
            return (
              <button
                key={tableName}
                onClick={() => setSelectedTable(tableName)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition text-left ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{tableName}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded font-bold ${
                  isSelected ? 'bg-blue-500/30 text-blue-200' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Table Content Area ───────────────────── */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
        
        {/* Controls Strip */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search in ${selectedTable}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
            <button
              onClick={() => {
                const sampleNew = { id: `item-${Date.now()}`, createdAt: new Date().toISOString() };
                setEditingRecord(sampleNew);
                setEditJson(JSON.stringify(sampleNew, null, 2));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Record
            </button>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {paginatedRecords.length > 0 ? (
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400">
                  <th className="p-3 w-12 text-center">#</th>
                  {columns.map(col => (
                    <th key={col} className="p-3 font-semibold uppercase tracking-wider text-[10px]">
                      {col}
                    </th>
                  ))}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedRecords.map((record, rIdx) => {
                  const idVal = record.id || record.conceptId || record.key || String(rIdx);
                  return (
                    <tr 
                      key={rIdx}
                      className="hover:bg-zinc-800/40 transition cursor-pointer text-zinc-300"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="p-3 text-center text-zinc-500 text-[10px]">
                        {(currentPage - 1) * pageSize + rIdx + 1}
                      </td>
                      {columns.map(col => {
                        const val = record[col];
                        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                        return (
                          <td key={col} className="p-3 max-w-[180px] truncate" title={valStr}>
                            {valStr || <span className="text-zinc-600 italic">null</span>}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right shrink-0" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(record, null, 2), idVal)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                            title="Copy Record JSON"
                          >
                            {copiedKey === idVal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(record);
                              setEditJson(JSON.stringify(record, null, 2));
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setIsDeletingRecord(record)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 font-mono text-xs">
              <Database className="w-8 h-8 text-zinc-600 mb-2" />
              <span>No records found in table "{selectedTable}".</span>
            </div>
          )}
        </div>

        {/* Pagination Strip */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Showing {filteredRecords.length} records · Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 text-zinc-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 text-zinc-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Record Detail Drawer / Modal ─────────────────── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-200 font-mono">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs">Record Inspector · {selectedTable}</span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-zinc-950/80">
              <pre className="text-xs text-emerald-400 font-mono p-3 bg-zinc-900 rounded-lg border border-zinc-800 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedRecord, null, 2), 'modal-copy')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedKey === 'modal-copy' ? 'Copied JSON!' : 'Copy Record JSON'}
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Edit Modal ─────────────────────────────── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-200 font-mono">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <span className="font-bold text-xs flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                Edit Record in {selectedTable}
              </span>
              <button onClick={() => setEditingRecord(null)} className="p-1 text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 bg-zinc-950">
              <textarea
                value={editJson}
                onChange={e => setEditJson(e.target.value)}
                className="w-full h-80 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2 text-xs">
              <button onClick={() => setEditingRecord(null)} className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deletion Confirmation Modal ────────────────────── */}
      {isDeletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-rose-800/80 rounded-xl p-5 shadow-2xl text-zinc-200 font-mono space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Confirm Record Deletion</h3>
                <p className="text-[11px] text-zinc-400">Table: <strong>{selectedTable}</strong></p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800 leading-relaxed">
              Are you sure you want to delete record <strong>"{isDeletingRecord.id || isDeletingRecord.title || 'selected'}"</strong>? This will permanently remove it from IndexedDB.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setIsDeletingRecord(null)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(isDeletingRecord)}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
