// Languages Hub Main Portal for PAHAM
// Language-Agnostic Dashboard with English CEFR & Mandarin GF0025 Access Points

import React, { useState } from 'react';
import { 
  Globe, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  Layers, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Volume2,
  CheckCircle2,
  Languages as LanguagesIcon
} from 'lucide-react';
import { languageLearningEngine } from '../core/LanguageLearningEngine';
import { EnglishHubView } from './EnglishHubView';
import { MandarinHubView } from './MandarinHubView';
import { LanguageAssessmentModal } from './LanguageAssessmentModal';
import { LanguageAITutorModal } from './LanguageAITutorModal';
import { PahamMascot } from '../../components/mascot/PahamMascot';

export const LanguageHubView: React.FC = () => {
  const [activeLanguage, setActiveLanguage] = useState<'hub' | 'en' | 'zh-CN'>('hub');
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [assessmentLang, setAssessmentLang] = useState('en');

  if (activeLanguage === 'en') {
    return <EnglishHubView onBack={() => setActiveLanguage('hub')} />;
  }

  if (activeLanguage === 'zh-CN') {
    return <MandarinHubView onBack={() => setActiveLanguage('hub')} />;
  }

  const enMastery = languageLearningEngine.skills.calculateOverallMastery('en', 'A1');
  const zhMastery = languageLearningEngine.skills.calculateOverallMastery('zh-CN', 'Level-1');
  const enReview = languageLearningEngine.reviews.getReviewQueueSummary('user_active', 'en');
  const zhReview = languageLearningEngine.reviews.getReviewQueueSummary('user_active', 'zh-CN');

  const totalDueReviews = enReview.dueCount + zhReview.dueCount;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Hero Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-moss-900 via-moss-950 to-ink-950 text-white border border-moss-800 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-moss-800/80 border border-moss-700 text-xs font-mono text-emerald-300">
            <LanguagesIcon className="w-3.5 h-3.5" />
            <span>PAHAM Foreign Language Learning Engine</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Pusat Bahasa Asing PAHAM
          </h1>

          <p className="text-xs md:text-sm text-moss-200 font-sans leading-relaxed">
            Arsitektur pembelajaran bahasa asing berstandar internasional terintegrasi penuh dengan kurikulum sekolah, pengulangan berjarak FSRS, dan bimbingan tutor AI Piko.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setAssessmentLang('en');
                setIsAssessmentOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tes Penempatan Diagnostik</span>
            </button>

            <button
              onClick={() => setIsTutorOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Konsultasi AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Mascot decoration */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 opacity-90">
          <PahamMascot size="lg" state="thinking" interactive={false} />
        </div>
      </div>

      {/* Language Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* English Card */}
        <div className="p-6 rounded-3xl bg-paper-100 border border-moss-200 hover:border-blue-500/60 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇬🇧</span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-ink-900">
                    Bahasa Inggris (English)
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    CEFR: Pre-A1 s.d C2
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-blue-800">{enMastery}%</span>
                <span className="block text-[10px] text-ink-400">Masteri A1</span>
              </div>
            </div>

            <p className="text-xs text-ink-600 font-sans leading-relaxed">
              Pelajari tatanan tata bahasa komprehensif (Tenses, Conditionals, Passive Voice), kolokasi kosa kata dengan transkripsi fonetik IPA, dan kemampuan reseptif-produktif.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-center">
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">Level</span>
                <strong className="text-ink-900">7 Jenjang</strong>
              </div>
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">FSRS Due</span>
                <strong className="text-blue-800">{enReview.dueCount} Item</strong>
              </div>
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">Kompetensi</span>
                <strong className="text-emerald-800">12 Skill</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveLanguage('en')}
            className="w-full py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Buka Hub Bahasa Inggris</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mandarin Card */}
        <div className="p-6 rounded-3xl bg-paper-100 border border-moss-200 hover:border-red-500/60 transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇨🇳</span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-ink-900">
                    Bahasa Mandarin (中文)
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900 border border-red-300">
                    GF0025-2021: Level 1-6+
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-red-800">{zhMastery}%</span>
                <span className="block text-[10px] text-ink-400">Masteri Lvl 1</span>
              </div>
            </div>

            <p className="text-xs text-ink-600 font-sans leading-relaxed">
              Arsitektur terpisah untuk Pengenalan Hanzi vs Penulisan Karakter, drill 20 kombinasi nada ganda (Tone Pairs), aturan Tone Sandhi, dan tata bahasa kata bantu bilangan (量词).
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-center">
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">Hanzi</span>
                <strong className="text-ink-900">300+ Karakter</strong>
              </div>
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">FSRS Due</span>
                <strong className="text-red-800">{zhReview.dueCount} Item</strong>
              </div>
              <div className="p-2 rounded-xl bg-paper-50 border border-moss-100">
                <span className="text-ink-500 block text-[10px]">Tone Pairs</span>
                <strong className="text-amber-800">20 Drill</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveLanguage('zh-CN')}
            className="w-full py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Buka Hub Bahasa Mandarin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* FSRS Queue Summary Section */}
      <div className="p-5 rounded-2xl bg-paper-100 border border-moss-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-moss-900 text-white flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900">
              Antrean Pengulangan Memori FSRS v4
            </h3>
            <p className="text-xs text-ink-600 font-sans">
              {totalDueReviews > 0
                ? `Terdapat ${totalDueReviews} item bahasa asing yang siap diulang hari ini agar tersimpan di memori jangka panjang.`
                : 'Semua item bahasa telah diulang hari ini. Pertahankan konsistensi Anda!'}
            </p>
          </div>
        </div>

        {totalDueReviews > 0 && (
          <button
            onClick={() => setActiveLanguage('en')}
            className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-950 text-white text-xs font-bold shrink-0 transition shadow-sm"
          >
            Ulang Sekarang
          </button>
        )}
      </div>

      {/* Assessment & Tutor Modals */}
      <LanguageAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        languageId={assessmentLang}
        onAssessmentCompleted={() => {}}
      />

      <LanguageAITutorModal
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        languageId="en"
      />

    </div>
  );
};
