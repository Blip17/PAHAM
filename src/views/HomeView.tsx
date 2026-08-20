// Home / Today View for PAHAM
// Answers: 'Apa yang harus aku pelajari sekarang?' with quiet, editorial visual focal points and inviting clean-state onboarding

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
  LifeBuoy,
  Camera,
  BookOpen
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
  const [isLoading, setIsLoading] = useState(true);

  // Concepts & Student States for Advisor Modal
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

      if (concepts.length > 0) {
        const plan = studyPlanner.generateDailyPlan(concepts, stateMap, subjects, chapters, exams);
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
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-ink-500 font-serif text-lg">
        Menyiapkan rencana belajarmu hari ini...
      </div>
    );
  }

  const displayName = userProfile.displayName || userProfile.name || 'Siswa';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-300 pb-6">
        <div>
          <span className="text-xs font-mono tracking-wider uppercase text-ink-500 block mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h1 className="text-3xl md:text-4xl text-ink-950 font-serif font-normal">
            Selamat {new Date().getHours() < 12 ? 'pagi' : new Date().getHours() < 15 ? 'siang' : new Date().getHours() < 18 ? 'sore' : 'malam'}, {firstName}.
          </h1>
          <p className="text-ink-600 text-base mt-1 font-serif">
            {userProfile.schoolName ? `${userProfile.schoolName} · ${userProfile.grade} (${userProfile.semester})` : 'Apa yang mau kamu pahami hari ini?'}
          </p>
        </div>

        {/* Mode Advisor Trigger */}
        {allConcepts.length > 0 && (
          <button
            onClick={() => setIsAdvisorOpen(true)}
            className="btn-secondary text-xs py-2 px-3.5 self-start sm:self-auto border-moss-300 bg-moss-50/60 text-moss-900 hover:bg-moss-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-moss-800" />
            "Aku harus belajar gimana?"
          </button>
        )}
      </header>

      {/* FRESH USER WELCOME / EMPTY STATE */}
      {totalMaterialsCount === 0 && allConcepts.length === 0 ? (
        <div className="paper-sheet p-8 sm:p-10 border-l-4 border-l-moss-800 space-y-6 text-left">
          <div className="space-y-2">
            <span className="badge-moss text-xs">Mulai Belajar</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium">
              Siap Memahami Catatan Sekolahmu?
            </h2>
            <p className="text-sm sm:text-base text-ink-700 font-serif leading-relaxed max-w-2xl">
              Paham bekerja dengan mengubah catatan guru, fotokopi, dan lembar kerjamu menjadi sistem belajar adaptif pribadi. Belum ada materi yang diunggah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">1. Foto Catatan Guru</span>
              <p className="text-ink-600 font-serif">Ambil foto buku catatan atau fotokopi tugas dari sekolah.</p>
            </div>
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">2. Ekstraksi Konsep</span>
              <p className="text-ink-600 font-serif">PAHAM merapikan tulisan tangan & menghubungkan konsep penting.</p>
            </div>
            <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-1 text-xs">
              <span className="font-semibold text-ink-900 block text-sm">3. Paham & Uji Ingatan</span>
              <p className="text-ink-600 font-serif">Latihan terfokus dengan algoritma memori FSRS & simulasi ujian.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScan}
              className="btn-primary text-sm py-2.5 px-6 shadow-subtle flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Scan / Upload Catatan Pertamaku
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
        /* Main Grid Layout (Asymmetrical Hierarchy) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Daily Focus Hero & Secondary Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Focal Point: Today's Focus Card */}
            {heroItem ? (
              <div className="paper-sheet p-6 sm:p-7 border-l-4 border-l-moss-800 relative group transition hover:border-paper-400">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-xs font-mono font-medium tracking-wider uppercase text-moss-800 bg-moss-100 px-2 py-0.5 rounded border border-moss-200">
                    Fokus Hari Ini
                  </span>
                  <span className="text-xs font-mono text-ink-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {heroItem.estimatedMinutes} menit
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-0.5">
                    {heroItem.subjectName} · {heroItem.chapterTitle.split('—')[0]}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium">
                    {heroItem.conceptTitle}
                  </h2>
                </div>

                <p className="text-ink-700 text-sm sm:text-base leading-relaxed mb-6 font-serif italic bg-paper-100 p-3.5 rounded border border-paper-200">
                  "{heroItem.reason}"
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onStartStudy(heroItem.conceptId)}
                    className="btn-primary px-5 py-2.5 text-sm shadow-subtle flex-1 sm:flex-initial"
                  >
                    <Play className="w-4 h-4 fill-paper-50" />
                    Mulai Belajar Sekarang
                  </button>

                  <button
                    onClick={() => onOpenQuiz(heroItem.conceptId)}
                    className="btn-secondary px-4 py-2.5 text-sm"
                  >
                    <HelpCircle className="w-4 h-4 text-ink-600" />
                    Latihan Soal
                  </button>
                </div>
              </div>
            ) : (
              <div className="paper-sheet p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-moss-700 mx-auto mb-2" />
                <p className="font-serif text-lg text-ink-900">Semua target belajar hari ini selesai!</p>
                <p className="text-xs text-ink-500 mt-1">Kamu bisa mengulang materi atau scan catatan baru.</p>
              </div>
            )}

            {/* Secondary Daily Breakdown List */}
            {dailyPlan && dailyPlan.items.length > 0 && (
              <div className="paper-sheet p-6">
                <div className="flex items-center justify-between border-b border-paper-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg text-ink-900 font-medium">
                      Agenda Hari Ini
                    </h3>
                    <span className="text-xs font-mono bg-paper-200 text-ink-700 px-2 py-0.5 rounded">
                      Total {dailyPlan?.totalEstimatedMinutes || 21} min
                    </span>
                  </div>
                  <span className="text-xs text-ink-500">
                    {dailyPlan?.items.length || 0} target terukur
                  </span>
                </div>

                <div className="space-y-3">
                  {dailyPlan?.items.map((item: DailyStudyItem) => {
                    let badgeClass = 'badge-moss';
                    let priorityDot = 'bg-moss-700';
                    let priorityLabel = 'Pemeliharaan';

                    if (item.priorityType === 'urgent_exam' || item.urgencyLevel === 'high') {
                      badgeClass = 'badge-terracotta';
                      priorityDot = 'bg-terracotta-700';
                      priorityLabel = 'Prioritas Ulangan';
                    } else if (item.priorityType === 'fsrs_due') {
                      badgeClass = 'badge-amber';
                      priorityDot = 'bg-amber-700';
                      priorityLabel = 'FSRS Review';
                    }

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded bg-paper-50 hover:bg-paper-150 border border-paper-200 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${priorityDot} mt-1.5 shrink-0`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-ink-900 truncate">
                                {item.conceptTitle}
                              </p>
                              <span className={badgeClass}>{priorityLabel}</span>
                            </div>
                            <p className="text-xs text-ink-500 truncate mt-0.5">
                              {item.subjectName} · Mode: {item.mode.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono text-ink-500">{item.estimatedMinutes}m</span>
                          <button
                            onClick={() => onStartStudy(item.conceptId)}
                            className="p-1.5 rounded hover:bg-paper-200 text-ink-700"
                            title="Buka modul"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence-Based Learning Memory */}
            {recentMistakes.length > 0 && (
              <div className="paper-sheet-subtle p-5 border border-paper-300 rounded">
                <div className="flex items-center gap-2 text-ink-800 text-xs font-semibold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-terracotta-700" />
                  Catatan Kekeliruan Aktif
                </div>
                <p className="text-xs text-ink-600 font-serif leading-relaxed">
                  "Ada {recentMistakes.length} konsep yang sempat keliru pada sesi sebelumnya. Paham sudah menyesuaikan jadwal latihan agar kamu tidak mengulang kesalahan yang sama."
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentMistakes.map(m => (
                    <span key={m.id} className="badge-neutral text-xs bg-paper-50">
                      ⚠ {m.conceptTitle}: {m.misconceptionDescription}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Signature Exam Readiness & Quick Nav (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Signature Exam Readiness Widget */}
            {upcomingExam && examReadiness && (
              <div className="paper-sheet p-6 border-t-4 border-t-moss-800 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold tracking-wider uppercase text-ink-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-moss-800" />
                    Ulangan Terdekat
                  </span>
                  <span className="text-xs font-mono bg-terracotta-100 text-terracotta-800 border border-terracotta-200 px-2 py-0.5 rounded font-medium">
                    {examReadiness.diffDays === 0 ? 'Hari Ini!' : `${examReadiness.diffDays} hari lagi`}
                  </span>
                </div>

                <h3 className="text-xl font-serif text-ink-950 font-medium leading-snug">
                  {upcomingExam.title}
                </h3>
                <p className="text-xs text-ink-500 mt-1 mb-5">
                  Durasi {upcomingExam.durationMinutes} menit · {upcomingExam.totalQuestions} soal
                </p>

                {/* Readiness Score Presentation */}
                <div className="bg-paper-100 p-4 rounded border border-paper-200 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-ink-500 block">
                      Kesiapan Terhitung
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-serif font-bold text-moss-900">
                        {examReadiness.overallReadiness}%
                      </span>
                      <span className="text-xs font-medium text-moss-800 uppercase tracking-wide">
                        SIAP
                      </span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-28 h-2 bg-paper-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-moss-700 rounded-full"
                      style={{ width: `${examReadiness.overallReadiness}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onOpenExam(upcomingExam.id)}
                    className="w-full btn-primary py-2.5 text-sm justify-center shadow-subtle"
                  >
                    <FileText className="w-4 h-4" />
                    Mulai Simulasi Ujian
                  </button>

                  {examReadiness.diffDays <= 3 && allConcepts.length > 0 && (() => {
                    // Find the weakest concept by mastery score for real rescue targeting
                    const weakestConcept = allConcepts.reduce((weakest, c) => {
                      const stateA = studentStatesMap.get(c.id);
                      const stateB = studentStatesMap.get(weakest.id);
                      const scoreA = stateA?.masteryScore ?? 0;
                      const scoreB = stateB?.masteryScore ?? 0;
                      return scoreA < scoreB ? c : weakest;
                    }, allConcepts[0]);
                    return (
                      <button
                        onClick={() => onStartStudy(weakestConcept.id)}
                        className="w-full btn-secondary py-2 text-xs justify-center text-terracotta-900 border-terracotta-300 bg-terracotta-50/50 hover:bg-terracotta-100"
                      >
                        <LifeBuoy className="w-3.5 h-3.5 text-terracotta-700" />
                        Sesi Penyelamatan: {weakestConcept.title}
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Quick Study Navigation Cards */}
            <div className="paper-sheet p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-ink-500 font-semibold mb-3">
                Akses Cepat Belajar
              </h4>

              <div 
                onClick={onOpenScan}
                className="p-3 rounded bg-paper-50 hover:bg-paper-150 border border-paper-200 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-moss-100 text-moss-800">
                    <Camera className="w-4 h-4 text-moss-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">Scan Materi Baru</p>
                    <p className="text-xs text-ink-500">Foto catatan guru, fotokopi, atau PDF</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400" />
              </div>

              <div 
                onClick={onOpenMaterials}
                className="p-3 rounded bg-paper-50 hover:bg-paper-150 border border-paper-200 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-100 text-amber-800">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">Arsip Materiku</p>
                    <p className="text-xs text-ink-500">Lihat semua catatan dan konsep terstruktur</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400" />
              </div>

              <div 
                onClick={() => onOpenQuiz()}
                className="p-3 rounded bg-paper-50 hover:bg-paper-150 border border-paper-200 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-paper-200 text-ink-800">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">Latihan Mandiri (Quiz)</p>
                    <p className="text-xs text-ink-500">Drill soal sesuai konsep terdaftar</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400" />
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
        onStartStudy={onStartStudy}
      />
    </div>
  );
};
