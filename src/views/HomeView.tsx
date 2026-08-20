// Home View for PAHAM Study Studio
// 5-Layer Editorial Learning Architecture: Greeting -> Hero Focus -> Expected Outcome -> Learning Path -> Goals & Timetable

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  FileText,
  LifeBuoy,
  Target,
  Flame,
  Zap,
  Award,
  Check
} from 'lucide-react';
import { db } from '../core/db';
import { 
  UserProfile, 
  Concept, 
  Subject, 
  Chapter, 
  Exam, 
  StudentConceptState, 
  DailyStudyPlan,
  DailyStudyItem,
  MistakeRecord,
  Flashcard,
  StudyGoal
} from '../core/types';
import { studyPlanner } from '../core/studyPlannerEngine';
import { learningMethodSelector } from '../learning/engine/learningMethodSelector';
import { flashcardService } from '../learning/flashcards/flashcardService';
import { goalPlanner } from '../learning/goals/goalPlanner';
import { scheduleService } from '../learning/schedule/scheduleService';

interface HomeViewProps {
  userProfile: UserProfile;
  onStartStudy: (conceptId?: string) => void;
  onOpenScan: () => void;
  onOpenQuiz: (conceptId?: string) => void;
  onOpenExam: (examId: string) => void;
  onOpenMaterials: () => void;
  onOpenFlashcards?: () => void;
  onOpenSchedule?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onStartStudy,
  onOpenScan,
  onOpenQuiz,
  onOpenExam,
  onOpenMaterials,
  onOpenFlashcards,
  onOpenSchedule,
}) => {
  const [studyPlan, setStudyPlan] = useState<DailyStudyPlan | null>(null);
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [studentStatesMap, setStudentStatesMap] = useState<Map<string, StudentConceptState>>(new Map());
  const [recentMistakes, setRecentMistakes] = useState<MistakeRecord[]>([]);
  const [dueCardsCount, setDueCardsCount] = useState<number>(0);
  const [activeGoals, setActiveGoals] = useState<StudyGoal[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [showRescueBanner, setShowRescueBanner] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      const concepts = await db.concepts.toArray();
      const subjects = await db.subjects.toArray();
      const chapters = await db.chapters.toArray();
      const exams = await db.exams.toArray();
      const states = await db.studentConceptStates.toArray();
      const mistakes = await db.mistakeRecords.toArray();
      const cards = await flashcardService.ensureCardsSeeded();
      const goals = await goalPlanner.ensureGoalsSeeded();

      setAllConcepts(concepts);
      setAllSubjects(subjects);
      setAllChapters(chapters);
      setAllExams(exams);
      setActiveGoals(goals);
      setRecentMistakes(mistakes.filter(m => !m.isResolved));

      const statesMap = new Map<string, StudentConceptState>();
      states.forEach(s => statesMap.set(s.conceptId, s));
      setStudentStatesMap(statesMap);

      // Count due cards
      const now = new Date();
      const dueCount = cards.filter(c => new Date(c.fsrs.due) <= now).length;
      setDueCardsCount(dueCount);

      // Generate today's plan
      const plan = studyPlanner.generateDailyPlan(
        concepts, 
        statesMap, 
        subjects, 
        chapters, 
        exams, 
        userProfile.dailyTimeTargetMinutes || 24
      );
      setStudyPlan(plan);

      // Check if student missed days -> Study Rescue
      const lastStudiedStates = states.filter(s => s.lastStudied);
      if (lastStudiedStates.length > 0) {
        const latestDate = Math.max(...lastStudiedStates.map(s => new Date(s.lastStudied!).getTime()));
        const daysSinceLastStudy = (Date.now() - latestDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastStudy > 3) {
          setShowRescueBanner(true);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [userProfile]);

  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const primaryTask: DailyStudyItem | undefined = studyPlan?.items[0];
  const primaryConcept = allConcepts.find(c => c.id === primaryTask?.conceptId);
  const primarySubject = allSubjects.find(s => s.id === primaryTask?.subjectId);
  const primaryState = primaryConcept ? studentStatesMap.get(primaryConcept.id) : undefined;

  // Selected method evaluation from deterministic selector
  const recommendation = primaryConcept ? learningMethodSelector.selectMethod({
    concept: primaryConcept,
    studentState: primaryState,
    recentMistakes,
    upcomingExams: allExams,
    availableMinutes: userProfile.dailyTimeTargetMinutes || 24,
  }) : null;

  // Upcoming closest exam
  const closestExam = allExams
    .map(e => ({
      ...e,
      daysRemaining: Math.ceil((new Date(e.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    .filter(e => e.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  const totalTimeEstimated = studyPlan?.totalEstimatedMinutes || userProfile.dailyTimeTargetMinutes || 24;
  const displayName = userProfile.displayName || userProfile.name || 'Siswa';

  if (isLoading) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif">
        Menyiapkan meja belajar PAHAM Study Studio...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">

      {/* ── LAYER 1: PERSONAL GREETING & HONEST DURATION ─────── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-paper-300 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
            PAHAM Study Studio · Meja Belajar Personal
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-normal mt-0.5">
            Selamat belajar, {displayName}.
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-600 bg-paper-100 px-3 py-1.5 rounded border border-paper-200">
          <Clock className="w-3.5 h-3.5 text-moss-700" />
          <span>
            <strong className="text-ink-900">{totalTimeEstimated} menit</strong> worth using today
          </span>
        </div>
      </div>

      {/* ── STUDY RESCUE BANNER (Gentle Re-entry) ─────────────── */}
      {showRescueBanner && (
        <div className="p-4 bg-paper-100 border-l-4 border-moss-700 rounded-r shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-ink-900 font-medium text-xs">
              <LifeBuoy className="w-4 h-4 text-moss-800" />
              <span>Mulai lagi pelan-pelan</span>
            </div>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              Kamu tidak perlu mengejar semuanya sekaligus. PAHAM telah memilih bagian yang paling penting terlebih dahulu.
            </p>
          </div>
          <button
            onClick={() => onStartStudy(primaryTask?.conceptId)}
            className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap shadow-subtle"
          >
            Mulai 10 Menit Saja
          </button>
        </div>
      )}

      {/* ── 5-LAYER ASYMMETRICAL EDITORIAL SPREAD ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT / LARGE AREA (8 COLS): HERO FOCUS & OUTCOMES ── */}
        <div className="lg:col-span-8 space-y-6">

          {primaryTask && primaryConcept ? (
            <div className="paper-sheet p-6 sm:p-8 border-2 border-moss-800/80 shadow-md relative overflow-hidden space-y-6 bg-paper-50">
              
              {/* Layer 2 Header: Subject & Mode Badge */}
              <div className="flex items-center justify-between text-xs font-mono text-ink-500 border-b border-paper-200 pb-3">
                <span className="uppercase tracking-wider font-semibold text-moss-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-moss-700" />
                  YOUR NEXT FOCUS
                </span>
                <span className="bg-moss-100 text-moss-900 px-2 py-0.5 rounded font-medium text-[11px]">
                  {primarySubject?.name || 'Mata Pelajaran'}
                </span>
              </div>

              {/* Concept Title & Big Typographic Duration */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-ink-500 block">
                    {recommendation?.methodLabel || 'Recall → Practice'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-snug">
                    {primaryConcept.title}
                  </h2>
                </div>

                <div className="flex items-baseline gap-1 text-ink-900 font-mono">
                  <span className="text-3xl sm:text-4xl font-bold text-moss-900">
                    {String(primaryTask.estimatedMinutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-ink-500 uppercase">Min</span>
                </div>
              </div>

              {/* Transparent "Why This Task?" Rationale */}
              <div className="p-3.5 bg-paper-100 rounded border border-paper-300 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                  Kenapa tugas ini dipilih?
                </span>
                <p className="text-xs text-ink-700 font-serif leading-relaxed">
                  "{recommendation?.reason || primaryTask.reason}"
                </p>
              </div>

              {/* ── LAYER 3: EXPECTED OUTCOME (Honest Objectives) ── */}
              <div className="p-4 bg-paper-100/90 rounded border border-moss-200/80 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-moss-900 font-semibold block">
                  Target Hasil Sesi (Expected Outcome):
                </span>
                <div className="space-y-1.5 text-xs font-serif text-ink-800">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-moss-700 mt-0.5 shrink-0" />
                    <span>Mampu menjelaskan intisari {primaryConcept.title} tanpa membuka buku catatan.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-moss-700 mt-0.5 shrink-0" />
                    <span>Membedakan istilah kunci agar tidak tertukar saat ulangan.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-moss-700 mt-0.5 shrink-0" />
                    <span>Menyelesaikan 3 butir soal latihan adaptif tingkat menengah.</span>
                  </div>
                </div>
              </div>

              {/* Dominant Primary Action Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onStartStudy(primaryConcept.id)}
                  className="btn-primary text-sm py-3 px-6 shadow-md flex items-center gap-2 bg-moss-900 hover:bg-moss-950 text-paper-50 w-full sm:w-auto justify-center"
                >
                  <span>MULAI SEKARANG</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onOpenFlashcards && (
                  <button
                    onClick={onOpenFlashcards}
                    className="btn-ghost text-xs py-2 px-3 text-ink-600 hover:text-ink-900"
                  >
                    Buka Kartu Flashcard →
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="paper-sheet p-8 text-center space-y-4 font-serif">
              <FileText className="w-10 h-10 text-ink-400 mx-auto" />
              <h3 className="text-lg text-ink-900 font-medium">Belum ada materi aktif.</h3>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                Foto catatan guru atau upload modul pelajaranmu agar PAHAM dapat menyiapkan rencana belajar.
              </p>
              <button
                onClick={onOpenScan}
                className="btn-primary text-xs py-2 px-4 shadow-subtle inline-flex items-center gap-1.5"
              >
                <span>Upload Catatan Pertama</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── LAYER 4: TODAY'S LEARNING PATH (Curved/Vertical Path) ── */}
          <div className="paper-sheet p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
                  Signature Learning Path
                </span>
                <h3 className="font-serif text-lg font-medium text-ink-950">
                  Alur Belajar Hari Ini
                </h3>
              </div>
              <span className="text-xs font-mono text-ink-500">
                {completedTaskIds.size} / {studyPlan?.items.length || 0} Selesai
              </span>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-moss-700/40 ml-2">
              {studyPlan?.items.map((item, index) => {
                const isDone = completedTaskIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative p-3.5 rounded border transition flex items-center justify-between gap-3 ${
                      isDone 
                        ? 'bg-paper-100/60 border-paper-200 opacity-60' 
                        : index === 0 
                        ? 'bg-moss-50/60 border-moss-300' 
                        : 'bg-paper-50 border-paper-200 hover:border-paper-300'
                    }`}
                  >
                    {/* Path Node Indicator */}
                    <div 
                      className={`absolute -left-[23px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                        isDone 
                          ? 'bg-moss-700 border-moss-700' 
                          : index === 0 
                          ? 'bg-paper-50 border-moss-700 animate-pulse' 
                          : 'bg-paper-50 border-paper-400'
                      }`}
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(item.id)}
                        className="text-ink-400 hover:text-moss-700"
                      >
                        <CheckCircle2 className={`w-5 h-5 ${isDone ? 'text-moss-700 fill-moss-100' : 'text-paper-400'}`} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-serif font-medium ${isDone ? 'line-through text-ink-500' : 'text-ink-950'}`}>
                            {item.conceptTitle}
                          </span>
                          <span className="text-[10px] font-mono text-ink-400">
                            · {item.subjectName}
                          </span>
                        </div>
                        <span className="text-[11px] font-serif text-ink-500 block">
                          {item.reason}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-ink-500">
                        {item.estimatedMinutes}m
                      </span>
                      <button
                        onClick={() => onStartStudy(item.conceptId)}
                        className="p-1.5 text-ink-500 hover:text-moss-900 rounded"
                        title="Mulai tugas ini"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT / NARROW COLUMN (4 COLS): EXAM, GOALS, TIMETABLE ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. Exam Readiness Signal */}
          {closestExam ? (
            <div className="paper-sheet p-5 space-y-4 border border-paper-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                  Kesiapan Ulangan Terdekat
                </span>
                <span className="text-[11px] font-mono text-terracotta-800 font-medium">
                  {closestExam.daysRemaining === 0 ? 'Hari ini!' : `${closestExam.daysRemaining} hari lagi`}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-medium text-ink-950 leading-tight">
                  {closestExam.title}
                </h3>
                <span className="text-xs font-serif text-ink-500 block mt-0.5">
                  {closestExam.durationMinutes} menit · {closestExam.totalQuestions} butir soal
                </span>
              </div>

              {/* 3 Structural Signals: KNOW, RECALL, APPLY */}
              <div className="space-y-2.5 pt-2 border-t border-paper-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-ink-700">
                    <span>KNOW (Definisi)</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div className="h-full bg-moss-700 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-ink-700">
                    <span>RECALL (Uji Ingatan)</span>
                    <span>76%</span>
                  </div>
                  <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div className="h-full bg-moss-600 rounded-full" style={{ width: '76%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-ink-700">
                    <span>APPLY (Aplikasi Soal)</span>
                    <span>61%</span>
                  </div>
                  <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: '61%' }} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenExam(closestExam.id)}
                className="w-full btn-secondary text-xs py-2 px-3 justify-center text-ink-900 border-paper-300 flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                Simulasi Ulangan Sekarang
              </button>
            </div>
          ) : (
            <div className="paper-sheet p-5 space-y-3 border border-paper-200 text-center font-serif">
              <CalendarIcon className="w-6 h-6 text-ink-400 mx-auto" />
              <h4 className="text-sm text-ink-900 font-medium">Belum Ada Jadwal Ulangan</h4>
              <p className="text-xs text-ink-500">
                Tambahkan jadwal ulangan sekolah di menu Ujian untuk memprogram prioritas otomatis.
              </p>
            </div>
          )}

          {/* 2. My Goals Preview Strip */}
          <div className="paper-sheet p-5 space-y-3 border border-paper-300 bg-paper-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Target Belajar Aktif
              </span>
              {onOpenSchedule && (
                <button
                  onClick={onOpenSchedule}
                  className="text-xs font-mono text-ink-500 hover:text-moss-900"
                >
                  Kelola →
                </button>
              )}
            </div>

            {activeGoals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="p-2.5 rounded bg-paper-100 border border-paper-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-medium text-ink-950">{goal.title}</span>
                  <span className="font-mono text-[11px] text-moss-900 font-bold">{goal.progressPercentage}%</span>
                </div>
                <div className="w-full h-1 bg-paper-300 rounded-full overflow-hidden">
                  <div className="h-full bg-moss-700 rounded-full" style={{ width: `${goal.progressPercentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* 3. Flashcard Queue Access */}
          <div className="paper-sheet p-5 space-y-3 bg-paper-100 border border-paper-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 font-semibold block">
                Antrean Flashcard FSRS
              </span>
              <span className="badge-moss text-[10px]">
                {dueCardsCount} Due
              </span>
            </div>

            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              {dueCardsCount > 0 
                ? `${dueCardsCount} kartu memori perlu direview sebelum kurva lupa menurun.`
                : 'Semua kartu untuk hari ini sudah selesai diulang.'}
            </p>

            {onOpenFlashcards && (
              <button
                onClick={onOpenFlashcards}
                className="w-full btn-primary text-xs py-2 px-3 justify-center shadow-subtle flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Review Flashcard Sekarang
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ── LAYER 5: SECONDARY LEARNING AREAS & TIMETABLE QUICK LINKS ── */}
      <section className="space-y-4 pt-4 border-t border-paper-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400 font-semibold block">
              Akses Langsung Mandiri
            </span>
            <h3 className="text-lg font-serif text-ink-900 font-medium">
              Eksplorasi Studio Belajar
            </h3>
          </div>

          {onOpenSchedule && (
            <button
              onClick={onOpenSchedule}
              className="text-xs font-mono text-moss-900 hover:underline flex items-center gap-1"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Buka Jadwal & Target Lengkap →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenFlashcards}
            className="paper-sheet p-4 hover:border-moss-700 text-left transition space-y-2 group"
          >
            <Layers className="w-5 h-5 text-moss-800 group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-xs font-semibold text-ink-950">Flashcard</h4>
              <p className="text-[11px] text-ink-500 font-serif">Spaced repetition FSRS</p>
            </div>
          </button>

          <button
            onClick={() => onOpenQuiz()}
            className="paper-sheet p-4 hover:border-moss-700 text-left transition space-y-2 group"
          >
            <Target className="w-5 h-5 text-moss-800 group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-xs font-semibold text-ink-950">Latihan Adaptif</h4>
              <p className="text-[11px] text-ink-500 font-serif">Multi-level practice</p>
            </div>
          </button>

          <button
            onClick={() => onStartStudy()}
            className="paper-sheet p-4 hover:border-moss-700 text-left transition space-y-2 group"
          >
            <BookOpen className="w-5 h-5 text-moss-800 group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-xs font-semibold text-ink-950">Belajar Konsep</h4>
              <p className="text-[11px] text-ink-500 font-serif">Intisari & teach-back</p>
            </div>
          </button>

          <button
            onClick={() => onOpenExam(closestExam?.id || '')}
            className="paper-sheet p-4 hover:border-moss-700 text-left transition space-y-2 group"
          >
            <Award className="w-5 h-5 text-moss-800 group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-xs font-semibold text-ink-950">Simulasi Ujian</h4>
              <p className="text-[11px] text-ink-500 font-serif">Format dan timer resmi</p>
            </div>
          </button>
        </div>
      </section>

    </div>
  );
};
