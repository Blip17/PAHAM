// Mandarin Chinese GF0025-2021 Learning Hub for PAHAM
// Decoupled Hanzi Recognition vs Writing, 4 Tones & Tone Pairs, Measure Words, and FSRS Reviews

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  Play, 
  Layers, 
  Volume2, 
  CheckCircle2, 
  Award, 
  BookOpen,
  Split,
  Eye,
  PenTool,
  Music
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { MANDARIN_CURRICULUM_UNITS } from '../mandarin/curriculum';
import { MANDARIN_TONE_SANDHI_RULES } from '../mandarin/pinyinToneData';
import { LanguagePracticeModal } from './LanguagePracticeModal';
import { LanguageAITutorModal } from './LanguageAITutorModal';
import { LanguageAssessmentModal } from './LanguageAssessmentModal';

interface MandarinHubViewProps {
  onBack: () => void;
}

export const MandarinHubView: React.FC<MandarinHubViewProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('Level-1');
  const [activeTab, setActiveTab] = useState<'learn' | 'characters' | 'tones' | 'vocab' | 'grammar'>('learn');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [practiceExerciseType, setPracticeExerciseType] = useState<string | undefined>(undefined);

  const levels = ['Level-1', 'Level-2', 'Level-3', 'Level-4', 'Level-5', 'Level-6'];

  const characters = languageLearningEngine.characters.getCharactersByLevel(selectedLevel);
  const tonePairs = languageLearningEngine.pronunciation.getAllTonePairs();
  const tones = languageLearningEngine.pronunciation.getMandarinTones();
  const initials = languageLearningEngine.pronunciation.getMandarinInitials();
  const vocabItems = languageLearningEngine.vocabulary.search('zh-CN', searchQuery).filter(
    v => !selectedLevel || v.proficiencyLevel === selectedLevel
  );
  const grammarItems = languageLearningEngine.grammar.getGrammarByLevel('zh-CN', selectedLevel);
  const overallMastery = languageLearningEngine.skills.calculateOverallMastery('zh-CN', selectedLevel);
  const reviewSummary = languageLearningEngine.reviews.getReviewQueueSummary('user_active', 'zh-CN');

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
              <span className="text-2xl">🇨🇳</span>
              <h1 className="text-xl font-serif font-bold text-ink-900">
                Bahasa Mandarin (普通话 / 中文)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                GF0025-2021 Standard
              </span>
            </div>
            <p className="text-xs text-ink-500 font-sans mt-0.5">
              Standar Kemahiran Bahasa Mandarin Internasional: Pemisahan Mengenal vs Menulis Hanzi & Latihan 4 Nada
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
            className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tutor AI Piko</span>
          </button>
        </div>
      </div>

      {/* GF0025 Level Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {levels.map(lvl => {
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition shrink-0 border ${
                isSelected
                  ? 'bg-red-900 border-red-600 text-white shadow-md'
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
            <span>Kemajuan {selectedLevel}</span>
            <span className="font-mono font-bold text-red-800">{overallMastery}%</span>
          </div>
          <div className="w-full h-2 bg-paper-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-500 rounded-full"
              style={{ width: `${overallMastery}%` }}
            />
          </div>
          <p className="text-[11px] text-ink-500 font-sans">
            Menghitung akumulasi bukti Hanzi, nada, dan kosa kata aktif.
          </p>
        </div>

        {/* FSRS Review Queue Card */}
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-ink-600 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-700" />
              <span>Review FSRS Mandarin</span>
            </div>
            <div className="text-lg font-mono font-bold text-ink-900">
              {reviewSummary.dueCount} <span className="text-xs font-normal text-ink-500">karakter & kata</span>
            </div>
          </div>
          <button
            onClick={() => handleLaunchPractice('CHARACTER_RECOGNITION')}
            className="px-3.5 py-2 rounded-xl bg-moss-900 hover:bg-moss-950 text-white text-xs font-bold shadow-sm transition"
          >
            Ulang Sekarang
          </button>
        </div>

        {/* Quick Tone Drill Card */}
        <div className="p-4 rounded-2xl bg-paper-100 border border-moss-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-ink-600 font-medium flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-red-700" />
              <span>Latihan Nada (Tones)</span>
            </div>
            <div className="text-xs text-ink-500 font-sans">
              20 Kombinasi Pasangan Nada
            </div>
          </div>
          <button
            onClick={() => handleLaunchPractice('TONE_PAIR')}
            className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            <span>Drill Nada</span>
          </button>
        </div>

      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex border-b border-moss-200 gap-6 overflow-x-auto">
        {[
          { id: 'learn', label: 'Unit Kurikulum', count: MANDARIN_CURRICULUM_UNITS.filter(u => u.level === selectedLevel).length },
          { id: 'characters', label: 'Hanzi (Karakter)', count: characters.length },
          { id: 'tones', label: 'Pinyin & 4 Nada', count: 20 },
          { id: 'vocab', label: 'Kosa Kata & HSK', count: vocabItems.length },
          { id: 'grammar', label: 'Tata Bahasa & 量词', count: grammarItems.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'text-red-900 border-b-2 border-red-700'
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
          {MANDARIN_CURRICULUM_UNITS.filter(u => !selectedLevel || u.level === selectedLevel).map(unit => (
            <div
              key={unit.id}
              className="p-5 rounded-2xl bg-paper-100 border border-moss-200 hover:border-moss-400 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900 border border-red-300">
                      {unit.level}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-ink-900">
                      {unit.title}
                    </h3>
                  </div>
                  <p className="text-xs text-red-900 font-serif font-semibold">
                    {unit.chineseTitle}
                  </p>
                  <p className="text-xs text-ink-600 font-sans leading-relaxed">
                    {unit.description}
                  </p>
                </div>

                <button
                  onClick={() => handleLaunchPractice()}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Pelajari Unit</span>
                </button>
              </div>

              {/* Target & Pinyin Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-ink-700">
                <div className="p-2.5 rounded-xl bg-paper-50 border border-moss-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><strong>Target:</strong> {unit.targetCanDo}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-paper-50 border border-moss-100 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-red-700 shrink-0" />
                  <span><strong>Fokus Pinyin:</strong> {unit.pinyinFocus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Characters (Hanzi) with Recognition vs Writing Decoupled */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-serif flex items-center gap-2">
            <Split className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Arsitektur Dualitas Hanzi:</strong> PAHAM membedakan Masteri Mengenal (Recognition) dan Masteri Menulis (Production) secara terpisah untuk setiap karakter.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {characters.map(char => (
              <div
                key={char.character}
                className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-serif font-bold text-ink-900">
                    {char.character}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-red-800">
                      {char.pinyin} (Nada {char.tone})
                    </span>
                    <span className="block text-[10px] text-ink-500">
                      Radikal: {char.radical} • {char.strokeCount} goresan
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-700 font-sans">
                  <strong>Arti:</strong> {char.meaning}
                </p>

                {/* Dual Mastery Bars */}
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-ink-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-600" /> Mengenal (Recognition)
                    </span>
                    <span className="font-mono font-bold text-blue-700">{char.recognitionMastery}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${char.recognitionMastery}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-ink-600 pt-1">
                    <span className="flex items-center gap-1">
                      <PenTool className="w-3 h-3 text-emerald-600" /> Menulis (Writing)
                    </span>
                    <span className="font-mono font-bold text-emerald-700">{char.writingMastery}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${char.writingMastery}%` }} />
                  </div>
                </div>

                {/* Example Words */}
                <div className="pt-1 border-t border-moss-100">
                  <span className="text-[10px] text-ink-500 font-bold uppercase block mb-1">
                    Contoh Kata:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {char.exampleWords.map((w, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-paper-50 border border-moss-100 text-[10px] text-ink-800">
                        {w.hanzi} ({w.pinyin}): {w.translation}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Pinyin & 4 Tones & Tone Pairs */}
      {activeTab === 'tones' && (
        <div className="space-y-6">
          
          {/* 4 Tones Definition Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-serif font-bold text-ink-900">
              4 Nada Utama Bahasa Mandarin (四声)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {tones.slice(0, 4).map(t => (
                <div
                  key={t.toneNumber}
                  className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900">
                      Nada {t.toneNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-red-800">
                      Kontur {t.pitchContour}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-ink-900">{t.name}</h4>
                  <p className="text-[11px] text-ink-600 font-sans leading-relaxed">{t.pitchDescription}</p>
                  <div className="p-2 rounded-lg bg-paper-50 border border-moss-100 text-[11px] font-mono text-red-950 font-bold text-center">
                    {t.diacriticExample}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tone Sandhi Rules */}
          <div className="space-y-3">
            <h3 className="text-sm font-serif font-bold text-ink-900">
              Aturan Perubahan Nada (Tone Sandhi Rules)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MANDARIN_TONE_SANDHI_RULES.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl bg-paper-100 border border-moss-200 space-y-2 text-xs">
                  <h4 className="font-bold text-ink-900">{rule.name}</h4>
                  <p className="text-[11px] text-ink-600 font-sans">{rule.explanation}</p>
                  <div className="p-2 rounded-xl bg-paper-50 border border-moss-100 space-y-1 font-serif text-[11px]">
                    {rule.examples.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span>{ex.original}</span>
                        <span className="font-mono text-red-800 font-bold">→ {ex.spokenPinyin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 20 Tone Pairs Drill Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-ink-900">
                Kombinasi Pasangan Nada (2-Syllable Tone Pairs)
              </h3>
              <button
                onClick={() => handleLaunchPractice('TONE_PAIR')}
                className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-sm transition"
              >
                Latihan Semua Nada
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {tonePairs.map(pair => (
                <div
                  key={pair.id}
                  className="p-3 rounded-xl bg-paper-100 border border-moss-200 text-center space-y-1 hover:border-red-400 transition"
                >
                  <span className="text-lg font-serif font-bold text-ink-900 block">
                    {pair.hanzi}
                  </span>
                  <span className="text-xs font-mono text-red-800 font-bold block">
                    {pair.pinyin}
                  </span>
                  <span className="text-[10px] font-mono text-ink-500 block">
                    Nada [{pair.tonePair[0]}, {pair.tonePair[1]}]
                  </span>
                  <span className="text-[10px] text-ink-600 block truncate">
                    {pair.meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab Content: Vocabulary */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari kata Mandarin (Hanzi, Pinyin, atau Bahasa Indonesia)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-paper-100 border border-moss-200 rounded-xl text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-red-600 font-sans"
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
                      <span className="text-xl font-bold font-serif text-ink-900">
                        {item.hanzi || item.word}
                      </span>
                      <span className="text-xs font-mono text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {item.pinyin}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-500 italic font-serif">
                      ({item.partOfSpeech}) • {item.translation}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900 border border-red-300">
                    {item.proficiencyLevel}
                  </span>
                </div>

                <p className="text-xs text-ink-700 font-sans">
                  {item.definition}
                </p>

                {/* Example sentence */}
                {item.exampleSentences.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-paper-50 border border-moss-100 text-[11px] text-ink-700 font-serif space-y-0.5">
                    <p className="font-bold text-ink-900">{item.exampleSentences[0].original}</p>
                    {item.exampleSentences[0].pinyin && (
                      <p className="text-[10px] font-mono text-red-800">{item.exampleSentences[0].pinyin}</p>
                    )}
                    <p className="text-[10px] text-ink-500 not-italic font-sans">
                      {item.exampleSentences[0].translation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Grammar & Measure Words */}
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
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900 border border-red-300">
                  {item.proficiencyLevel}
                </span>
              </div>

              {/* Pattern Formula */}
              <div className="p-3.5 rounded-xl bg-red-950 border border-red-800 text-red-100 font-mono text-xs shadow-inner">
                <span className="text-[10px] text-red-400 block mb-1 uppercase font-bold">
                  Formula Struktur Mandarin:
                </span>
                {item.patternFormula}
              </div>

              {/* Measure Words List if present */}
              {item.measureWords && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-ink-500 uppercase">Contoh Kata Bantu Bilangan:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.measureWords.map((mw, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-paper-50 border border-moss-200 text-xs text-ink-800 font-serif">
                        {mw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {item.commonMistakes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-paper-50 border border-rose-200 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-rose-900 block">
                    ⚠️ Kesalahan Tata Bahasa Umum:
                  </span>
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
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <LanguagePracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        languageId="zh-CN"
        level={selectedLevel}
        exerciseType={practiceExerciseType}
      />

      <LanguageAITutorModal
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
        languageId="zh-CN"
        level={selectedLevel}
      />

      <LanguageAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        languageId="zh-CN"
        onAssessmentCompleted={res => setSelectedLevel(res.recommendedLevel)}
      />

    </div>
  );
};
