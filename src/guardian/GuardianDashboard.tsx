// PAHAM Development-Only Quality Guardian Dashboard
// Real-time QA cockpit reporting on UX flows, Frontend, Backend, Security, and Performance

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  Zap, 
  Lock, 
  Layers, 
  Layout, 
  X,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  Compass
} from 'lucide-react';
import { GuardianReport, GuardianCategory, GuardianFinding } from './types';
import { qualityGuardian } from './qualityGuardian';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const GuardianDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [report, setReport] = useState<GuardianReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<GuardianCategory | 'ALL'>('ALL');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const res = await qualityGuardian.runFullAudit();
      setReport(res);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAudit();

    // Listen for Ctrl+Shift+Q shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredFindings = report?.findings.filter(f => {
    if (activeCategory === 'ALL') return true;
    return f.category === activeCategory;
  }) || [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-moss-800 bg-moss-50 border-moss-300';
    if (score >= 70) return 'text-amber-800 bg-amber-50 border-amber-300';
    return 'text-terracotta-800 bg-terracotta-50 border-terracotta-300';
  };

  return (
    <>
      {/* Floating Trigger in Bottom-Left Corner */}
      <div className="fixed bottom-6 left-6 z-50 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="group flex items-center gap-2 p-2 px-3 rounded-full bg-ink-950 text-paper-50 border border-ink-800 shadow-modal hover:shadow-elevated hover:scale-105 active:scale-95 transition-all text-xs font-mono"
          title="Buka Paham Quality Guardian (Ctrl+Shift+Q)"
        >
          <ShieldCheck className="w-4 h-4 text-moss-400 group-hover:rotate-12 transition-transform" />
          <span className="font-bold">QA Guardian</span>
          {report && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              report.failCount > 0 ? 'bg-terracotta-600 text-white' : 'bg-moss-700 text-white'
            }`}>
              {report.score}%
            </span>
          )}
        </button>
      </div>

      {/* Expanded Modal Dashboard */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl bg-paper-50 border border-paper-300 rounded-xl shadow-modal flex flex-col max-h-[88vh] overflow-hidden text-ink-950">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-paper-200 flex items-center justify-between bg-paper-100/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-ink-950 text-paper-50">
                  <ShieldCheck className="w-5 h-5 text-moss-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-base sm:text-lg text-ink-950">
                      PAHAM Quality Guardian
                    </h2>
                    <Badge variant="neutral" size="xs">Dev Environment</Badge>
                  </div>
                  <p className="text-xs text-ink-500 font-serif">
                    Sistem audit kualitas berkelanjutan: Pengalaman Siswa, Frontend, Backend, Keamanan & Performa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={runAudit}
                  isLoading={isRunning}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Audit Ulang
                </Button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded text-ink-400 hover:text-ink-900 hover:bg-paper-200 transition"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score & KPI Strip */}
            {report && (
              <div className="p-4 border-b border-paper-200 bg-paper-50 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
                <div className={`p-3 rounded border flex flex-col justify-center ${getScoreColor(report.score)}`}>
                  <span className="text-2xl font-bold">{report.score}/100</span>
                  <span className="text-[10px] uppercase font-semibold">Skor Kesehatan</span>
                </div>
                <div className="p-3 rounded bg-moss-50/80 border border-moss-200 text-moss-900 flex flex-col justify-center">
                  <span className="text-xl font-bold">{report.passCount}</span>
                  <span className="text-[10px] uppercase font-semibold">Lolos (Pass)</span>
                </div>
                <div className="p-3 rounded bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col justify-center">
                  <span className="text-xl font-bold">{report.warnCount}</span>
                  <span className="text-[10px] uppercase font-semibold">Peringatan (Warn)</span>
                </div>
                <div className="p-3 rounded bg-terracotta-50/80 border border-terracotta-200 text-terracotta-900 flex flex-col justify-center">
                  <span className="text-xl font-bold">{report.failCount}</span>
                  <span className="text-[10px] uppercase font-semibold">Gagal (Fail)</span>
                </div>
                <div className="p-3 rounded bg-paper-100 border border-paper-200 text-ink-700 col-span-2 sm:col-span-1 flex flex-col justify-center">
                  <span className="text-sm font-bold">{report.auditDurationMs} ms</span>
                  <span className="text-[10px] uppercase font-semibold">Durasi Audit</span>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-paper-200 bg-paper-100/40 flex flex-wrap gap-1.5 text-xs font-mono">
              {[
                { id: 'ALL', label: 'Semua Kategori' },
                { id: 'USER_FLOW', label: 'User Flow' },
                { id: 'FRONTEND', label: 'Frontend' },
                { id: 'VISUAL_QA', label: 'Visual QA' },
                { id: 'BACKEND', label: 'Backend & DB' },
                { id: 'SECURITY', label: 'Keamanan' },
                { id: 'PERFORMANCE', label: 'Performa' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded transition ${
                    activeCategory === tab.id
                      ? 'bg-ink-950 text-paper-50 font-bold shadow-subtle'
                      : 'bg-paper-200/70 text-ink-600 hover:bg-paper-200 hover:text-ink-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Findings List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {filteredFindings.length > 0 ? (
                filteredFindings.map(finding => {
                  const isExpanded = expandedFindingId === finding.id;
                  const statusBadge = {
                    PASS: <Badge variant="moss" size="xs" dot>PASS</Badge>,
                    WARN: <Badge variant="amber" size="xs" dot>WARN</Badge>,
                    FAIL: <Badge variant="terracotta" size="xs" dot>FAIL</Badge>,
                  }[finding.status];

                  return (
                    <div 
                      key={finding.id}
                      className="p-4 rounded-lg bg-paper-50 border border-paper-200 shadow-subtle text-xs space-y-2 transition hover:border-paper-400"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">{statusBadge}</div>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-ink-950 text-xs sm:text-sm font-serif block">
                              {finding.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-ink-500">
                              <span>Komponen: <strong>{finding.affectedComponent}</strong></span>
                              {finding.metricValue && (
                                <span className="px-1.5 py-0.2 rounded bg-paper-200 text-ink-800">
                                  {finding.metricValue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                          className="p-1 rounded text-ink-400 hover:text-ink-900"
                          aria-label="Detail Temuan"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded Reproduction & Recommendation */}
                      {isExpanded && (
                        <div className="pt-2 mt-2 border-t border-paper-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-serif bg-paper-100/50 p-3 rounded">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-[10px] text-ink-600 uppercase block">
                              Informasi Pengujian:
                            </span>
                            <p className="text-ink-700 leading-relaxed font-mono text-[10px]">
                              {finding.reproductionInfo}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-[10px] text-moss-900 uppercase block">
                              Solusi Rekomendasi:
                            </span>
                            <p className="text-ink-700 leading-relaxed">
                              {finding.recommendedFix}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-ink-500 font-serif">
                  Tidak ada temuan pada kategori ini.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-paper-200 bg-paper-100/60 flex items-center justify-between text-[11px] font-mono text-ink-500">
              <span>Shortcut: <kbd className="px-1 py-0.5 rounded bg-paper-200 border border-paper-300">Ctrl+Shift+Q</kbd></span>
              <span className="flex items-center gap-1.5 text-moss-900 font-bold">
                <ShieldCheck className="w-4 h-4" />
                PAHAM Verified
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
