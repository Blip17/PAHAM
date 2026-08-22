// Developer Cockpit Inspector for PAHAM Language Architecture
// Diagnostics, Registry Inspection, FSRS Memory Queues, and Exercise Generation Testing

import React, { useState } from 'react';
import { 
  Languages, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Code, 
  Database,
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';

export const LanguageDevView: React.FC = () => {
  const [selectedLangId, setSelectedLangId] = useState<string>('en');
  const [testResult, setTestResult] = useState<string | null>(null);

  const health = languageLearningEngine.getHealthStatus();
  const allLanguages = languageLearningEngine.registry.getAllLanguages();
  const currentLang = languageLearningEngine.registry.getLanguage(selectedLangId);
  const competencies = languageLearningEngine.skills.getCompetenciesByLanguage(selectedLangId);
  const vocabCount = languageLearningEngine.vocabulary.getItemsByLanguage(selectedLangId).length;
  const grammarCount = languageLearningEngine.grammar.getGrammarByLanguage(selectedLangId).length;
  const exerciseCount = languageLearningEngine.exercises.getExercises(selectedLangId).length;
  const reviewSummary = languageLearningEngine.reviews.getReviewQueueSummary('user_active', selectedLangId);

  const handleRunDiagnostic = () => {
    const testEx = languageLearningEngine.exercises.getExercises(selectedLangId)[0];
    if (testEx) {
      const evalRes = languageLearningEngine.exercises.evaluateAttempt(
        testEx.id,
        Array.isArray(testEx.correctAnswer) ? testEx.correctAnswer[0] : testEx.correctAnswer,
        3
      );
      setTestResult(JSON.stringify(evalRes, null, 2));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-paper-100 border border-moss-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-moss-800" />
            <h2 className="text-sm font-bold text-ink-900">
              Language Learning Engine Developer Inspector
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {health.status}
            </span>
          </div>
          <p className="text-xs text-ink-500 font-sans mt-0.5">
            Inspeksi registri bahasa, pohon kompetensi CEFR/GF0025, kosa kata IPA/Hanzi, dan antrean FSRS v4.
          </p>
        </div>

        <button
          onClick={handleRunDiagnostic}
          className="px-3.5 py-2 rounded-xl bg-moss-900 hover:bg-moss-950 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Uji Evaluator Soal</span>
        </button>
      </div>

      {/* Language Switcher */}
      <div className="flex items-center gap-2">
        {allLanguages.map(lang => (
          <button
            key={lang.id}
            onClick={() => setSelectedLangId(lang.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              selectedLangId === lang.id
                ? 'bg-moss-900 border-moss-950 text-white shadow-sm'
                : 'bg-paper-100 border-moss-200 text-ink-700 hover:bg-paper-200'
            }`}
          >
            <span>{lang.flagEmoji}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
        <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200">
          <span className="text-[10px] text-ink-500 block uppercase">Kompetensi</span>
          <strong className="text-base text-ink-900">{competencies.length}</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200">
          <span className="text-[10px] text-ink-500 block uppercase">Kosa Kata</span>
          <strong className="text-base text-blue-800">{vocabCount}</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200">
          <span className="text-[10px] text-ink-500 block uppercase">Tata Bahasa</span>
          <strong className="text-base text-emerald-800">{grammarCount}</strong>
        </div>
        <div className="p-3.5 rounded-xl bg-paper-100 border border-moss-200">
          <span className="text-[10px] text-ink-500 block uppercase">Soal Latihan</span>
          <strong className="text-base text-purple-800">{exerciseCount}</strong>
        </div>
      </div>

      {/* Language Metadata JSON Viewer */}
      {currentLang && (
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2">
          <h3 className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-moss-800" />
            <span>Spesifikasi Registri: {currentLang.name}</span>
          </h3>
          <pre className="p-3.5 rounded-xl bg-paper-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
            {JSON.stringify(currentLang, null, 2)}
          </pre>
        </div>
      )}

      {/* Diagnostic Evaluation Result Output */}
      {testResult && (
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2">
          <h3 className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>Hasil Eksekusi Evaluator:</span>
          </h3>
          <pre className="p-3.5 rounded-xl bg-paper-900 text-amber-300 font-mono text-[11px] overflow-x-auto">
            {testResult}
          </pre>
        </div>
      )}

    </div>
  );
};
