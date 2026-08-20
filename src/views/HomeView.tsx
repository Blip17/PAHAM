// Home / Main Study Daily View for PAHAM
// Answers: 'Kalau aku buka PAHAM sekarang, apa yang harus aku lakukan?'
// Features: Today's Primary Study Focus, Transparent 'Kenapa Ini?' reasoning, Gentle Study Rescue, Evidence-Based Progress

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  FileText, 
  Calendar, 
  Sparkles, 
  Camera, 
  BookOpen,
  RotateCcw,
  Zap,
  TrendingUp
} from 'lucide-react';
import { db } from '../core/db';
import { 
  UserProfile, 
  DailyStudyPlan, 
  DailyStudyItem, 
  Exam, 
  Concept, 
  StudentConceptState,
  MistakeRecord,
  Subject,
  Chapter
} from '../core/types';
import { studyPlanner } from '../core/studyPlannerEngine';
import { masteryEngine } from '../core/masteryEngine';
import { StudyAdvisorModal } from './StudyAdvisorModal';

interface HomeViewProps {
  userProfile: UserProfile;
  onStartStudy: (conceptId: string) => void;
  onOpenScan: () => void;
  onOpenQuiz: (conceptId?: string) => void;
  onOpenExam: (examId: string) => void;
  onOpenMaterials: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onStartStudy,
  onOpenScan,
  onOpenQuiz,
  onOpenExam,
  onOpenMaterials,
}) => {
  const [dailyPlan, setDailyPlan] = useState<DailyStudyPlan | null>(null);
  const [heroItem, setHeroItem] = useState<DailyStudyItem | null>(null);
  const [upcomingExam, setUpcomingExam] = useState<Exam | null>(null);
  const [examReadiness, setExamReadiness] = useState<any | null>(null);
  const [recentMistakes, setRecentMistakes] = useState<MistakeRecord[]>([]);
  const [totalMaterialsCount, setTotalMaterialsCount] = useState<number>(0);
  const [daysSinceLastStudy, setDaysSinceLastStudy] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Concepts & Student States for Advisor & Reasoning
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [studentStatesMap, setStudentStatesMap] = useState<Map<string, StudentConceptState>>(new Map());
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const matsCount = await db.materials.count();
      setTotalMaterialsCount(matsCount);

      const concepts: Concept[] = await db.concepts.toArray();
      const studentStates: StudentConceptState[] = await db.studentConceptStates.toArray();
      const stateMap = new Map(studentStates.map(s => [s.conceptId, s]));
      const subjects: Subject[] = await db.subjects.toArray();
      const chapters: Chapter[] = await db.chapters.toArray();
      const exams: Exam[] = await db.exams.toArray();

      setAllConcepts(concepts);
      setStudentStatesMap(stateMap);
      setAllSubjects(subjects);
      setAllChapters(chapters);
      setAllExams(exams);

      // Check last learning event for Study Rescue calculation
      const events = await db.learningEvents.orderBy('timestamp').reverse().toArray();
      if (events.length > 0) {
        const lastEventDate = new Date(events[0].timestamp);
        const diffDays = Math.floor((Date.now() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
        setDaysSinceLastStudy(Math.max(0, diffDays));
      } else {
        setDaysSinceLastStudy(0);
      }

      if (concepts.length > 0) {
        const plan = studyPlanner.generateDailyPlan(
          concepts, 
          stateMap, 
          subjects, 
          chapters, 
          exams, 
          userProfile.dailyTimeTargetMinutes || 25
        );
        setDailyPlan(plan);

        if (plan.items.length > 0) {
          setHeroItem(plan.items[0]);
        }
      }

      // Find closest exam
      const now = new Date();
      const activeExams = exams
        .map((e: Exam) => ({ exam: e, diffDays: Math.ceil((new Date(e.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }))
        .filter((e) => e.diffDays >= 0)
        .sort((a, b) => a.diffDays - b.diffDays);

      if (activeExams.length > 0) {
        const closest = activeExams[0].exam;
        setUpcomingExam(closest);
        const readiness = masteryEngine.evaluateExamReadiness(closest, concepts, stateMap);
        setExamReadiness({ ...readiness, diffDays: activeExams[0].diffDays });
      }

      const mistakes = await db.mistakeRecords.where('isResolved').equals(0).toArray();
      setRecentMistakes(mistakes);

      setIsLoading(false);
    }
    loadData();
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif text-base">
        Menyiapkan rencana belajarmu hari ini...
      </div>
    );
  }

  const displayName = userProfile.displayName || userProfile.name || 'Siswa';
  const firstName = displayName.split(' ')[0];

  // Count concepts needing review vs mastered
  const dueReviewsCount = allConcepts.filter(c => {
    const s = studentStatesMap.get(c.id);
    return s && new Date(s.fsrs.due) <= new Date();
  }).length;

  const weakConceptsCount = allConcepts.filter(c => {
    const s = studentStatesMap.get(c.id);
    return s && s.masteryScore < 0.6;
  }).length;

  return (
    <div className="space-y-8">
      
      {/* ── Editorial Header ──────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-300 pb-6">
        <div>
          <span className="text-xs font-mono tracking-wider uppercase text-ink-500 block mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h1 className="text-3xl md:text-4xl text-ink-950 font-serif font-normal">
            Selamat {new Date().getHours() < 12 ? 'pagi' : new Date().getHours() < 15 ? 'siang' : new Date().getHours() < 18 ? 'sore' : 'malam'}, {firstName}.
          </h1>
          <p className="text-ink-600 text-base mt-1 font-serif">
            {userProfile.schoolName 
              ? `${userProfile.schoolName} · ${userProfile.grade} (${userProfile.semester})` 
              : 'Yuk selesaikan rencana belajar hari ini.'}
          </p>
        </div>

        {/* Mode Advisor Quick Trigger */}
        {allConcepts.length > 0 && (
          <button
            onClick={() => setIsAdvisorOpen(true)}
            className="btn-secondary text-xs py-2 px-3.5 self-start sm:self-auto border-moss-300 bg-moss-50/60 text-moss-900 hover:bg-moss-100 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-moss-800" />
            "Aku harus belajar apa?"
          </button>
        )}
      </header>

      {/* ── EMPTY STATE (NO MATERIALS YET) ────────────────────── */}
      {totalMaterialsCount === 0 && allConcepts.length === 0 ? (
        <div className="paper-sheet p-8 sm:p-10 border-l-4 border-l-moss-800 space-y-6 text-left">
          <div className="space-y-2">
            <span className="badge-moss text-xs">Mulai Belajar</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium">
              Belum Ada Catatan Sekolah
            </h2>
            <p className="text-sm sm:text-base text-ink-700 font-serif leading-relaxed max-w-2xl">
              Foto catatan gurumu di papan tulis, fotokopi lembar tugas, atau modul PDF. PAHAM akan mengubahnya menjadi rencana belajar dan latihan terfokus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">1. Foto Catatanmu</span>
              <p className="text-ink-600 font-serif">Buku tulis atau fotokopi yang dipakai gurumu di kelas.</p>
            </div>
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">2. Ekstraksi Konsep</span>
              <p className="text-ink-600 font-serif">PAHAM menemukan konsep penting tanpa mengubah intisari catatanmu.</p>
            </div>
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">3. Active Retrieval</span>
              <p className="text-ink-600 font-serif">Uji ingatan teratur dan pengulangan FSRS menjelang ujian.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScan}
              className="btn-primary text-sm py-2.5 px-6 shadow-subtle flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Foto / Upload Catatan Pertama
            </button>

            <button
              onClick={onOpenMaterials}
              className="btn-secondary text-sm py-2.5 px-4"
            >
              <BookOpen className="w-4 h-4" />
              Lihat Daftar Mapel ({allSubjects.length})
            </button>
          </div>
        </div>
      ) : (
        /* ── MAIN PRODUCT GRID ─────────────────────────────────── */
        <div className="space-y-6">

          {/* STUDY RESCUE (GENTLE RE-ENTRY IF MISSED DAYS) */}
          {daysSinceLastStudy >= 3 && (
            <div className="p-5 bg-amber-50 rounded border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold block">
                  Re-Entry · Sesi Penyelamatan
                </span>
                <p className="font-serif text-sm sm:text-base text-ink-950 font-medium">
                  Mulai lagi pelan-pelan. Kamu tidak perlu mengejar semuanya sekaligus.
                </p>
                <p className="text-xs text-ink-600 font-serif">
                  PAHAM telah memilah bagian paling penting hari ini agar tidak membebani memorimu.
                </p>
              </div>
              {heroItem && (
                <button
                  onClick={() => onStartStudy(heroItem.conceptId)}
                  className="btn-primary text-xs py-2 px-4 shrink-0 bg-moss-900 text-paper-50"
                >
                  Mulai 10 Menit Saja →
                </button>
              )}
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Today's Focus Hero Card (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Primary Focus Card */}
              {heroItem ? (
                <div className="paper-sheet p-6 sm:p-8 border-l-4 border-l-moss-800 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-mono font-medium tracking-wider uppercase text-moss-800 bg-moss-100 px-2.5 py-0.5 rounded border border-moss-200">
                      HARI INI · TARGET UTAMA
                    </span>
                    <span className="text-xs font-mono text-ink-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-moss-800" />
                      {heroItem.estimatedMinutes} menit cukup
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-1">
                      {heroItem.subjectName} · {heroItem.chapterTitle.split('—')[0]}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                      {heroItem.conceptTitle}
                    </h2>
                  </div>

                  {/* Transparent 'Kenapa Ini?' Box */}
                  <div className="p-4 bg-paper-100 rounded border border-paper-300 space-y-1 text-xs">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-moss-800 font-semibold block">
                      Kenapa tugas ini?
                    </span>
                    <p className="font-serif text-ink-800 text-sm leading-relaxed italic">
                      "{heroItem.reason}"
                    </p>
                  </div>

                  {/* Summary Metric Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-paper-200">
                    <div className="p-2 bg-paper-50 rounded">
                      <span className="font-bold text-ink-900 block font-mono">{dueReviewsCount}</span>
                      <span className="text-[10px] text-ink-500">Perlu Diulang</span>
                    </div>
                    <div className="p-2 bg-paper-50 rounded">
                      <span className="font-bold text-ink-900 block font-mono">{weakConceptsCount}</span>
                      <span className="text-[10px] text-ink-500">Konsep Lemah</span>
                    </div>
                    <div className="p-2 bg-paper-50 rounded">
                      <span className="font-bold text-ink-900 block font-mono">5 Soal</span>
                      <span className="text-[10px] text-ink-500">Latihan Aktif</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => onStartStudy(heroItem.conceptId)}
                      className="btn-primary px-6 py-3 text-sm shadow-subtle flex-1 sm:flex-initial flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-paper-50" />
                      Mulai Sesi Belajar ({heroItem.estimatedMinutes}m)
                    </button>

                    <button
                      onClick={() => onOpenQuiz(heroItem.conceptId)}
                      className="btn-secondary px-4 py-3 text-sm flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-4 h-4 text-ink-600" />
                      Latihan Soal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="paper-sheet p-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-moss-700 mx-auto" />
                  <h3 className="font-serif text-xl text-ink-900">Semua target belajar hari ini selesai!</h3>
                  <p className="text-xs text-ink-600 font-serif">Bagus. Besok kita cek lagi sesuai jadwal pengulangan FSRS.</p>
                </div>
              )}

              {/* Secondary Agenda Schedule List */}
              {dailyPlan && dailyPlan.items.length > 1 && (
                <div className="paper-sheet p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-paper-200 pb-3">
                    <h3 className="font-serif text-base text-ink-900 font-medium">
                      Rencana Lengkap Hari Ini
                    </h3>
                    <span className="text-xs font-mono text-ink-500">
                      Total ~{dailyPlan.totalEstimatedMinutes} menit
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dailyPlan.items.slice(1).map((item: DailyStudyItem) => (
                      <div
                        key={item.id}
                        className="p-3 rounded bg-paper-50 hover:bg-paper-100 border border-paper-200 flex items-center justify-between gap-3 transition text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink-900 truncate">{item.conceptTitle}</span>
                            <span className="badge-neutral text-[10px]">{item.subjectName}</span>
                          </div>
                          <p className="text-ink-500 font-serif text-[11px] truncate mt-0.5">{item.reason}</p>
                        </div>
                        <button
                          onClick={() => onStartStudy(item.conceptId)}
                          className="btn-secondary text-[11px] py-1 px-2.5 shrink-0"
                        >
                          {item.estimatedMinutes}m →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence-Based Progress / Mistake Alert */}
              {recentMistakes.length > 0 && (
                <div className="paper-sheet p-5 space-y-2 border-l-4 border-l-terracotta-700 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-terracotta-900 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-terracotta-700" />
                    Catatan Kekeliruan Aktif ({recentMistakes.length})
                  </div>
                  <p className="text-ink-700 font-serif leading-relaxed">
                    Paham mencatat kekeliruan konsep sebelumnya agar kamu tidak terjebak di soal ulangan:
                  </p>
                  <div className="space-y-1 pt-1">
                    {recentMistakes.slice(0, 3).map(m => (
                      <div key={m.id} className="p-2 bg-terracotta-50 rounded border border-terracotta-200">
                        <span className="font-semibold text-ink-900">{m.conceptTitle}: </span>
                        <span className="text-ink-700 font-serif">{m.misconceptionDescription}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Exam Readiness & Progress Context (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Upcoming Exam Card */}
              {upcomingExam && examReadiness ? (
                <div className="paper-sheet p-6 border-t-4 border-t-moss-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold tracking-wider uppercase text-ink-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-moss-800" />
                      Ulangan Terdekat
                    </span>
                    <span className="badge-terracotta text-[10px]">
                      {examReadiness.diffDays === 0 ? 'Hari Ini!' : `${examReadiness.diffDays} hari lagi`}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-serif text-ink-950 font-medium leading-snug">
                      {upcomingExam.title}
                    </h3>
                    <p className="text-xs text-ink-500 mt-1">
                      {upcomingExam.durationMinutes} menit · {upcomingExam.totalQuestions} soal
                    </p>
                  </div>

                  {/* Readiness Progress Meter */}
                  <div className="bg-paper-100 p-4 rounded border border-paper-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 block">
                        Kesiapan Terhitung
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-3xl font-serif font-bold text-moss-900">
                          {examReadiness.overallReadiness}%
                        </span>
                        <span className="text-xs font-medium text-moss-800 uppercase tracking-wide">
                          {examReadiness.overallReadiness >= 75 ? 'SIAP' : 'PERLU REVIEW'}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 h-2 bg-paper-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-moss-700 rounded-full"
                        style={{ width: `${examReadiness.overallReadiness}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenExam(upcomingExam.id)}
                    className="w-full btn-primary py-2.5 text-xs justify-center shadow-subtle flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Mulai Simulasi Ujian
                  </button>
                </div>
              ) : (
                <div className="paper-sheet p-6 space-y-3">
                  <div className="flex items-center gap-2 text-ink-600 text-xs font-mono uppercase">
                    <Calendar className="w-3.5 h-3.5 text-moss-800" />
                    Simulasi Ulangan
                  </div>
                  <h4 className="font-serif text-ink-900 font-medium text-base">Siapkan Simulasi Ujian</h4>
                  <p className="text-xs text-ink-600 font-serif leading-relaxed">
                    Atur tanggal ulangan sekolahmu untuk menghitung skor kesiapan harian dan rekomendasi sesi penyelamatan.
                  </p>
                  <button
                    onClick={() => onOpenExam(allExams[0]?.id || '')}
                    className="w-full btn-secondary text-xs py-2 justify-center"
                  >
                    Buka Menu Simulasi Ujian →
                  </button>
                </div>
              )}

              {/* Quick Action Cards */}
              <div className="paper-sheet p-5 space-y-3 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-moss-800 font-semibold block">
                  Aksi Cepat
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onOpenScan}
                    className="p-3 bg-paper-50 rounded border border-paper-200 hover:bg-paper-100 text-left transition space-y-1"
                  >
                    <Camera className="w-4 h-4 text-moss-800" />
                    <span className="font-semibold text-ink-900 block">Tambah Catatan</span>
                    <span className="text-[10px] text-ink-500">Scan tulisan guru</span>
                  </button>
                  <button
                    onClick={() => onOpenQuiz()}
                    className="p-3 bg-paper-50 rounded border border-paper-200 hover:bg-paper-100 text-left transition space-y-1"
                  >
                    <Zap className="w-4 h-4 text-moss-800" />
                    <span className="font-semibold text-ink-900 block">Latihan Cepat</span>
                    <span className="text-[10px] text-ink-500">Active recall mix</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Mode Advisor Modal */}
      <StudyAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        concepts={allConcepts}
        studentStates={studentStatesMap}
        subjects={allSubjects}
        chapters={allChapters}
        exams={allExams}
        onStartStudy={(conceptId: string) => {
          setIsAdvisorOpen(false);
          onStartStudy(conceptId);
        }}
      />

    </div>
  );
};
