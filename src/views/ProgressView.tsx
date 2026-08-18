// Progress View for PAHAM
// Meaningful learning evidence, FSRS memory stability curve, and active mistake matrix

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ArrowUpRight
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

  useEffect(() => {
    async function loadProgress() {
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
    }
    loadProgress();
  }, []);

  const stateMap = new Map(studentStates.map(s => [s.conceptId, s]));

  // Calculate subject readiness
  const subjectProgress = subjects.map(sub => {
    const subConcepts = concepts.filter(c => c.subjectId === sub.id);
    if (subConcepts.length === 0) return { subject: sub, readiness: 50, conceptCount: 0, stableCount: 0 };

    let totalScore = 0;
    let stable = 0;
    subConcepts.forEach(c => {
      const state = stateMap.get(c.id);
      const evalRes = masteryEngine.evaluateConcept(c, state, exams);
      totalScore += evalRes.readinessPercentage;
      if (evalRes.readinessPercentage >= 75) stable++;
    });

    return {
      subject: sub,
      readiness: Math.round(totalScore / subConcepts.length),
      conceptCount: subConcepts.length,
      stableCount: stable,
    };
  });

  const handleResolveMistake = async (id: string) => {
    await db.mistakeRecords.update(id, { isResolved: true });
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, isResolved: true } : m));
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <header className="border-b border-paper-300 pb-5">
        <h1 className="text-3xl font-serif text-ink-950 font-normal">
          Bukti Perkembangan Belajar
        </h1>
        <p className="text-sm text-ink-600 font-serif mt-0.5">
          Data nyata tentang apa yang sudah kamu pahami dan apa yang perlu dijaga daya ingatnya.
        </p>
      </header>

      {/* Subject Readiness Cards Grid */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold block mb-3">
          Tingkat Kesiapan per Mata Pelajaran
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjectProgress.map(({ subject, readiness, conceptCount, stableCount }) => (
            <div key={subject.id} className="paper-sheet p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-moss-800 font-semibold">
                  {subject.code}
                </span>
                <span className="text-xs font-mono font-bold text-ink-900 bg-paper-200 px-2 py-0.5 rounded">
                  {readiness}% SIAP
                </span>
              </div>

              <h3 className="font-serif text-lg font-medium text-ink-950">
                {subject.name}
              </h3>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-moss-700 rounded-full transition-all duration-500"
                  style={{ width: `${readiness}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-ink-500 pt-1">
                <span>{stableCount} dari {conceptCount} konsep stabil</span>
                <span>FSRS Aktif</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Dual Grid: Concept Memory Matrix (Left) & Active Mistakes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Concept Retention Stability Matrix (7 cols) */}
        <div className="lg:col-span-7 paper-sheet p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-paper-200">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                FSRS Memory Engine
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-950">
                Status Ketahanan Memori Konsep
              </h3>
            </div>
            <span className="text-xs font-mono text-ink-500">
              {concepts.length} Konsep Terindeks
            </span>
          </div>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {concepts.map(concept => {
              const state = stateMap.get(concept.id);
              const evalRes = masteryEngine.evaluateConcept(concept, state, exams);
              
              let badge = 'badge-moss';
              if (evalRes.readinessPercentage < 50) badge = 'badge-terracotta';
              else if (evalRes.readinessPercentage < 75) badge = 'badge-amber';

              return (
                <div
                  key={concept.id}
                  className="p-3 rounded bg-paper-50 hover:bg-paper-150 border border-paper-200 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {concept.title}
                      </p>
                      <span className={badge}>{evalRes.readinessPercentage}% Readiness</span>
                    </div>
                    <p className="text-[11px] text-ink-500 truncate mt-0.5">
                      Stabilitas FSRS: {state?.fsrs.stability || 0} hari · Status: {evalRes.statusLabel}
                    </p>
                  </div>

                  <button
                    onClick={() => onStartLearnConcept(concept.id)}
                    className="btn-ghost text-xs py-1 px-2.5 shrink-0"
                    title="Buka modul"
                  >
                    Belajar <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Misconceptions & Mistake Records (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="paper-sheet p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-terracotta-800 font-semibold block">
                  Log Kekeliruan Aktif
                </span>
                <h3 className="font-serif text-lg font-medium text-ink-950">
                  Riwayat Mispersepsi ({mistakes.filter(m => !m.isResolved).length})
                </h3>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {mistakes.map(m => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded border text-xs transition ${
                    m.isResolved
                      ? 'bg-paper-100/50 border-paper-200 opacity-60'
                      : 'bg-terracotta-50/70 border-terracotta-200 text-terracotta-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-ink-900">{m.conceptTitle}</span>
                    <span className="text-[10px] font-mono text-ink-400">
                      {new Date(m.dateOccurred).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed mb-2 font-serif">
                    <strong>Penyebab:</strong> {m.misconceptionDescription}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-paper-200/60">
                    <span className="text-[10px] text-ink-500">
                      {m.isResolved ? '✓ Sudah dikuasai' : '⚠ Perlu latihan ulang'}
                    </span>
                    {!m.isResolved && (
                      <button
                        onClick={() => handleResolveMistake(m.id)}
                        className="text-[10px] text-moss-800 font-semibold hover:underline"
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {mistakes.length === 0 && (
                <p className="text-xs text-ink-500 italic text-center py-6">
                  Tidak ada catatan kekeliruan aktif.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
