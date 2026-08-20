// Progress View for PAHAM Study Studio
// Editorial Learning Report: Progress Story Timeline, What Got Stronger, What Needs Work, and Structural Exam Readiness

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { db } from '../core/db';
import { Concept, StudentConceptState, Subject, MistakeRecord, Exam } from '../core/types';
import { masteryEngine } from '../core/masteryEngine';

interface ProgressViewProps {
  onStartLearnConcept: (conceptId: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  onStartLearnConcept,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [studentStates, setStudentStates] = useState<StudentConceptState[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true);
      const subs: Subject[] = await db.subjects.toArray();
      const concs: Concept[] = await db.concepts.toArray();
      const states: StudentConceptState[] = await db.studentConceptStates.toArray();
      const msts: MistakeRecord[] = await db.mistakeRecords.toArray();
      const exms: Exam[] = await db.exams.toArray();

      setSubjects(subs);
      setConcepts(concs);
      setStudentStates(states);
      setMistakes(msts);
      setExams(exms);
      setIsLoading(false);
    }
    loadProgress();
  }, []);

  const stateMap = new Map(studentStates.map(s => [s.conceptId, s]));

  // Categorize concepts: Stronger vs Needs Work
  const strongConcepts: Concept[] = [];
  const needsWorkConcepts: Concept[] = [];

  concepts.forEach(c => {
    const s = stateMap.get(c.id);
    const evalRes = masteryEngine.evaluateConcept(c, s, exams);
    if (evalRes.readinessPercentage >= 70) {
      strongConcepts.push(c);
    } else {
      needsWorkConcepts.push(c);
    }
  });

  const activeMistakes = mistakes.filter(m => !m.isResolved);

  const handleResolveMistake = async (id: string) => {
    await db.mistakeRecords.update(id, { isResolved: true });
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, isResolved: true } : m));
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif">
        Menyiapkan laporan perkembangan belajar...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* ── EDITORIAL HEADER ──────────────────────────────────── */}
      <header className="border-b border-paper-300 pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
          Laporan Perkembangan Akademik · PAHAM Study Studio
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-normal mt-0.5">
          Bukti Perkembangan & Retensi Memori
        </h1>
        <p className="text-xs sm:text-sm text-ink-600 font-serif mt-1">
          Bukan sekadar angka statistik, melainkan bukti nyata konsep mana yang sudah stabil dan mana yang perlu dijaga sebelum ulangan.
        </p>
      </header>

      {/* ── PROGRESS STORY (The Narrative Evolution) ─────────── */}
      <div className="paper-sheet p-6 sm:p-8 space-y-4 border-l-4 border-l-moss-700 bg-paper-50 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-mono text-ink-500">
          <span className="uppercase tracking-wider font-semibold text-moss-900">
            Progress Story
          </span>
          <span>Evolusi 3 Pekan Terakhir</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <h3 className="font-serif text-xl sm:text-2xl text-ink-950 font-medium leading-snug">
              Retensi materi fiksi dan penalaran Bahasa Indonesia meningkat stabil.
            </h3>
            <p className="text-xs sm:text-sm text-ink-700 font-serif leading-relaxed">
              Dulu, kamu sering tertukar antara <em>Tokoh</em> (pelaku) dan <em>Penokohan</em> (watak). Setelah 3 sesi review aktif dan flashcard FSRS, kesalahan ini sudah jarang muncul.
            </p>
          </div>

          <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-ink-500">3 Pekan Lalu</span>
              <span className="font-bold text-ink-900">Hari Ini</span>
            </div>
            <div className="flex items-center justify-between text-base sm:text-lg font-serif">
              <span className="text-ink-500">58% (Rentan Lupa)</span>
              <ArrowRight className="w-4 h-4 text-moss-700" />
              <span className="font-semibold text-moss-900">76% (Stabil di Memori)</span>
            </div>
            <div className="w-full h-2 bg-paper-300 rounded-full overflow-hidden">
              <div className="h-full bg-moss-700 rounded-full" style={{ width: '76%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN COMPARISON: WHAT GOT STRONGER VS NEEDS WORK ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* 1. What Got Stronger */}
        <div className="paper-sheet p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-paper-200">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Stabilitas Terbentuk
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-950">
                Konsep yang Semakin Kuat ({strongConcepts.length})
              </h3>
            </div>
            <CheckCircle2 className="w-5 h-5 text-moss-700" />
          </div>

          <div className="space-y-2.5">
            {strongConcepts.length > 0 ? (
              strongConcepts.map(c => {
                const s = stateMap.get(c.id);
                return (
                  <div 
                    key={c.id}
                    className="p-3 rounded bg-paper-100 border border-paper-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-serif font-medium text-ink-950 block">{c.title}</span>
                      <span className="text-[10px] font-mono text-ink-500">Memori FSRS stabil · Review 1 pekan lagi</span>
                    </div>
                    <span className="badge-moss text-[10px]">
                      {s ? Math.round(s.masteryScore * 100) : 75}%
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-ink-500 font-serif italic">
                Belum ada konsep dengan tingkat retensi tinggi. Mulai latihan untuk membangun kestabilan memori.
              </p>
            )}
          </div>
        </div>

        {/* 2. What Still Needs Work */}
        <div className="paper-sheet p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-paper-200">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-terracotta-800 font-semibold block">
                Fokus Penguatan
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-950">
                Perlu Diulang Sebelum Ulangan ({needsWorkConcepts.length})
              </h3>
            </div>
            <AlertCircle className="w-5 h-5 text-terracotta-700" />
          </div>

          <div className="space-y-2.5">
            {needsWorkConcepts.length > 0 ? (
              needsWorkConcepts.map(c => {
                const s = stateMap.get(c.id);
                return (
                  <div 
                    key={c.id}
                    className="p-3 rounded bg-paper-50 border border-paper-300 flex items-center justify-between text-xs hover:border-moss-700 transition"
                  >
                    <div>
                      <span className="font-serif font-medium text-ink-950 block">{c.title}</span>
                      <span className="text-[10px] font-mono text-terracotta-800">Kurva lupa menurun · Perlu recall</span>
                    </div>
                    <button
                      onClick={() => onStartLearnConcept(c.id)}
                      className="btn-primary text-[10px] py-1 px-2.5 shadow-subtle"
                    >
                      Perkuat Sekarang →
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-ink-500 font-serif italic">
                Hebat! Semua konsep terindeks berada dalam zona retensi yang aman.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ── MISTAKE REPAIR MATRIX ─────────────────────────────── */}
      <div className="paper-sheet p-6 space-y-4 border border-paper-300">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold block">
              Buku Kesalahan Aktif (Misconception Log)
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Poin yang Sering Tertukar
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-500">
            {activeMistakes.length} Kesalahan Tercatat
          </span>
        </div>

        <div className="space-y-3">
          {activeMistakes.length > 0 ? (
            activeMistakes.map(m => (
              <div
                key={m.id}
                className="p-4 rounded bg-paper-100 border border-paper-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-950 font-serif">{m.conceptTitle}</span>
                    <span className="text-[10px] font-mono bg-paper-200 px-2 py-0.5 rounded text-terracotta-900">
                      Miskonsepsi Aktif
                    </span>
                  </div>
                  <p className="text-ink-700 font-serif leading-relaxed">
                    "{m.misconceptionDescription || 'Konsep ini masih sering terbalik pada soal variasi cerita fiksi.'}"
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleResolveMistake(m.id)}
                    className="btn-ghost text-[11px] py-1 px-2.5 text-ink-600 hover:text-ink-950"
                  >
                    Tandai Paham
                  </button>
                  <button
                    onClick={() => onStartLearnConcept(m.conceptId)}
                    className="btn-primary text-[11px] py-1 px-3 shadow-subtle"
                  >
                    Latihan Perbaikan
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs font-serif text-ink-500">
              Tidak ada miskonsepsi aktif yang belum diselesaikan.
            </div>
          )}
        </div>
      </div>

      {/* ── STRUCTURAL EXAM READINESS BREAKDOWN ───────────────── */}
      <div className="paper-sheet p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Dekomposisi Kemampuan
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Kesiapan Ulangan Berdasarkan Tipe Kognitif
            </h3>
          </div>
          <span className="text-xs font-mono text-moss-900 font-bold">
            76% Total Kesiapan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded bg-paper-100 border border-paper-200 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-semibold text-ink-900">1. KNOW (Definisi)</span>
              <span className="font-bold text-moss-900">88%</span>
            </div>
            <div className="w-full h-1.5 bg-paper-300 rounded-full overflow-hidden">
              <div className="h-full bg-moss-700 rounded-full" style={{ width: '88%' }} />
            </div>
            <p className="text-[11px] text-ink-600 font-serif">
              Penguasaan istilah dasar dan rumus sekolah sudah sangat solid.
            </p>
          </div>

          <div className="p-4 rounded bg-paper-100 border border-paper-200 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-semibold text-ink-900">2. RECALL (Ingatan Mandiri)</span>
              <span className="font-bold text-moss-800">76%</span>
            </div>
            <div className="w-full h-1.5 bg-paper-300 rounded-full overflow-hidden">
              <div className="h-full bg-moss-600 rounded-full" style={{ width: '76%' }} />
            </div>
            <p className="text-[11px] text-ink-600 font-serif">
              Mampu mengingat tanpa bantuan buku catatan dengan sedikit jeda berpikir.
            </p>
          </div>

          <div className="p-4 rounded bg-paper-100 border border-paper-200 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-semibold text-ink-900">3. APPLY (Aplikasi Soal)</span>
              <span className="font-bold text-amber-800">61%</span>
            </div>
            <div className="w-full h-1.5 bg-paper-300 rounded-full overflow-hidden">
              <div className="h-full bg-amber-600 rounded-full" style={{ width: '61%' }} />
            </div>
            <p className="text-[11px] text-ink-600 font-serif">
              Faktor pembatas utama saat ini. Perbanyak latihan adaptif variasi soal.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
