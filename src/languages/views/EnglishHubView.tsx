// English CEFR Learning Hub for PAHAM
// Complete CEFR Proficiency Dashboard: Competencies, Vocabulary with IPA, Grammar Formulas, and FSRS Reviews

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Play, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Layers, 
  HelpCircle,
  TrendingUp,
  Volume2,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { ENGLISH_CURRICULUM_UNITS } from '../english/curriculum';
import { LanguagePracticeModal } from './LanguagePracticeModal';
import { LanguageAITutorModal } from './LanguageAITutorModal';
import { LanguageAssessmentModal } from './LanguageAssessmentModal';

interface EnglishHubViewProps {
  onBack: () => void;
}

export const EnglishHubView: React.FC<EnglishHubViewProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [activeTab, setActiveTab] = useState<'learn' | 'vocab' | 'grammar' | 'skills'>('learn');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [practiceExerciseType, setPracticeExerciseType] = useState<string | undefined>(undefined);

  const levels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const competencies = languageLearningEngine.skills.getCompetenciesByLevel('en', selectedLevel);
  const vocabItems = languageLearningEngine.vocabulary.search('en', searchQuery).filter(
    v => !selectedLevel || v.proficiencyLevel === selectedLevel
  );
  const grammarItems = languageLearningEngine.grammar.getGrammarByLevel('en', selectedLevel);
  const overallMastery = languageLearningEngine.skills.calculateOverallMastery('en', selectedLevel);
  const reviewSummary = languageLearningEngine.reviews.getReviewQueueSummary('user_active', 'en');

  const handleLaunchPractice = (type?: string) => {
    setPracticeExerciseType(type);
    setIsPracticeModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-moss-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-paper-100 hover:bg-paper-200 border border-moss-200 text-ink-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇬🇧</span>
              <h1 className="text-xl font-serif font-bold text-ink-900">
                Bahasa Inggris (English Core)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-900 text-blue-200 border border-blue-700">
                CEFR Standard
              </span>
            </div>
            <p className="text-xs text-ink-500 font-sans mt-0.5">
              Kerangka Kompetensi Eropa: Pre-A1 hingga C2 dengan latihan tatanan tata bahasa & kolokasi
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAssessmentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-paper-100 hover:bg-moss-100 border border-moss-300 text-xs font-bold text-ink-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <GraduationCap className="w-3.5 h-3.5 text-moss-800" />
            <span>Tes Penempatan</span>
          </button>

          <button
            onClick={() => setIsTutorModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tutor AI Piko</span>
          </button>
        </div>
      </div>

      {/* CEFR Level Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {levels.map(lvl => {
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition shrink-0 border ${
                isSelected
                  ? 'bg-blue-900 border-blue-600 text-white shadow-md'
                  : 'bg-paper-100 border-moss-200 text-ink-700 hover:bg-paper-200'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Level Mastery Card */}
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-600 font-medium">
            <span>Masteri Level {selectedLevel}</span>
            <span className="font-mono font-bold text-blue-800">{overallMastery}%</span>
          </div>
          <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 rounded-full"
              style={{ width: `${overallMastery}%` }}
            />
          </div>
          <p className="text-[11px] text-ink-500 font-sans">
            Dihitung berdasarkan pembuktian kompetensi & akurasi latihan aktual.
          </p>
        </div>

        {/* FSRS Review Queue Card */}
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-ink-600 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-700" />
              <span>Review FSRS Due</span>
            </div>
            <div className="text-lg font-mono font-bold text-ink-900">
              {reviewSummary.dueCount} <span className="text-xs font-normal text-ink-500">item siap ulang</span>
            </div>
          </div>
          <button
            onClick={() => handleLaunchPractice('VOCABULARY')}
            className="px-3.5 py-2 rounded-xl bg-moss-900 hover:bg-moss-950 text-white text-xs font-bold shadow-sm transition"
          >
            Review Sekarang
          </button>
        </div>

        {/* Quick Practice Starter Card */}
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-ink-600 font-medium flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-700" />
              <span>Latihan Cepat</span>
            </div>
            <div className="text-xs text-ink-500 font-sans">
              Soal tata bahasa & kosa kata
            </div>
          </div>
          <button
            onClick={() => handleLaunchPractice()}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            <span>Mulai</span>
          </button>
        </div>

      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex border-b border-moss-200 gap-6">
        {[
          { id: 'learn', label: 'Unit Kurikulum', count: ENGLISH_CURRICULUM_UNITS.filter(u => u.level === selectedLevel).length },
          { id: 'vocab', label: 'Kosa Kata & IPA', count: vocabItems.length },
          { id: 'grammar', label: 'Tata Bahasa & Pola', count: grammarItems.length },
          { id: 'skills', label: 'Kompetensi CEFR', count: competencies.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 relative ${
              activeTab === tab.id
                ? 'text-blue-900 border-b-2 border-blue-700'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-paper-200 text-ink-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content: Curriculum Units */}
      {activeTab === 'learn' && (
        <div className="space-y-4">
          {ENGLISH_CURRICULUM_UNITS.filter(u => !selectedLevel || u.level === selectedLevel).map(unit => (
            <div
              key={unit.id}
              className="p-5 rounded-2xl bg-paper-100 border border-moss-200 hover:border-moss-400 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      {unit.level}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-ink-900">
                      {unit.title}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-600 font-sans leading-relaxed">
                    {unit.description}
                  </p>
                </div>

                <button
                  onClick={() => handleLaunchPractice()}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Pelajari Unit</span>
                </button>
              </div>

              {/* Can-do goal indicator */}
              <div className="p-3 rounded-xl bg-paper-50 border border-moss-100 text-[11px] text-ink-700 flex items-center gap-2 font-serif">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span><strong>Target Capaian:</strong> {unit.targetCanDo}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Vocabulary with IPA & Collocations */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari kosa kata Inggris atau arti Bahasa Indonesia..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-paper-100 border border-moss-200 rounded-xl text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-blue-600 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabItems.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-serif text-ink-900">
                        {item.word}
                      </span>
                      {item.ipa && (
                        <span className="text-xs font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.ipa}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-ink-500 italic font-serif">
                      ({item.partOfSpeech}) • {item.translation}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    {item.proficiencyLevel}
                  </span>
                </div>

                <p className="text-xs text-ink-700 font-sans leading-relaxed">
                  {item.definition}
                </p>

                {/* Collocations */}
                {item.collocations && item.collocations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
                      Kolokasi Alami:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.collocations.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-paper-50 border border-moss-200 text-[11px] text-ink-800 font-mono"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example sentence */}
                {item.exampleSentences.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-paper-50 border border-moss-100 text-[11px] text-ink-700 font-serif italic">
                    "{item.exampleSentences[0].original}"
                    <p className="text-[10px] text-ink-500 not-italic mt-0.5 font-sans">
                      {item.exampleSentences[0].translation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Grammar Formulas */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          {grammarItems.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-paper-100 border border-moss-200 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-ink-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-600 font-sans mt-0.5">
                    {item.explanation}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  {item.proficiencyLevel}
                </span>
              </div>

              {/* Pattern Formula */}
              <div className="p-3.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-100 font-mono text-xs shadow-inner">
                <span className="text-[10px] text-blue-400 block mb-1 uppercase font-bold">
                  Formula Struktur:
                </span>
                {item.patternFormula}
              </div>

              {/* Common Mistakes */}
              {item.commonMistakes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-paper-50 border border-rose-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-rose-900 block">
                    ⚠️ Kesalahan Umum Siswa:
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="text-rose-800 line-through text-[11px]">
                      ✗ {item.commonMistakes[0].incorrect}
                    </p>
                    <p className="text-emerald-800 font-bold text-[11px]">
                      ✓ {item.commonMistakes[0].correct}
                    </p>
                    <p className="text-[11px] text-ink-600 font-sans">
                      {item.commonMistakes[0].explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: CEFR Competencies */}
      {activeTab === 'skills' && (
        <div className="space-y-3">
          {competencies.map(comp => (
            <div
              key={comp.id}
              className="p-4 rounded-2xl bg-paper-100 border border-moss-200 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss-900 text-white">
                    {comp.skillType}
                  </span>
                  <h4 className="text-xs font-bold text-ink-900">
                    {comp.title}
                  </h4>
                </div>
                <p className="text-[11px] text-ink-600 font-serif">
                  "{comp.canDoStatement}"
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-blue-800">
                  {comp.masteryScore}%
                </span>
                <span className="block text-[10px] text-ink-400 font-mono">
                  {comp.evidenceCount} bukti
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <LanguagePracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        languageId="en"
        level={selectedLevel}
        exerciseType={practiceExerciseType}
      />

      <LanguageAITutorModal
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
        languageId="en"
        level={selectedLevel}
      />

      <LanguageAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        languageId="en"
        onAssessmentCompleted={res => setSelectedLevel(res.recommendedLevel)}
      />

    </div>
  );
};
