// Schedule & Goals View for PAHAM Study Studio
// Manages weekly academic timetables, study goals, custom study windows, and notification reminders

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Target, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Bell, 
  BellOff, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Flame,
  AlertCircle
} from 'lucide-react';
import { db } from '../core/db';
import { 
  ScheduledStudyBlock, 
  StudyGoal, 
  StudyWindow, 
  NotificationPreference, 
  Subject, 
  GoalType 
} from '../core/types';
import { scheduleService, DEFAULT_STUDY_WINDOWS } from '../learning/schedule/scheduleService';
import { goalPlanner } from '../learning/goals/goalPlanner';
import { notificationService, DEFAULT_NOTIFICATION_PREFS } from '../learning/notifications/notificationService';

interface ScheduleViewProps {
  onStartStudyConcept: (conceptId: string) => void;
}

type ScheduleTab = 'timeline' | 'weekly' | 'goals' | 'windows' | 'reminders';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  onStartStudyConcept,
}) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('timeline');
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledStudyBlock[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [studyWindows, setStudyWindows] = useState<StudyWindow[]>(DEFAULT_STUDY_WINDOWS);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference>(DEFAULT_NOTIFICATION_PREFS);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState<boolean>(false);

  // New Goal Form State
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalSubjectId, setGoalSubjectId] = useState<string>('');
  const [goalType, setGoalType] = useState<GoalType>('EXAM_GOAL');
  const [goalTargetDays, setGoalTargetDays] = useState<number>(7);
  const [goalOutcome, setGoalOutcome] = useState<string>('');
  const [goalFrequency, setGoalFrequency] = useState<number>(3);
  const [goalDuration, setGoalDuration] = useState<number>(20);

  useEffect(() => {
    async function loadScheduleData() {
      setIsLoading(true);
      const subs = await db.subjects.toArray();
      setSubjects(subs);
      if (subs.length > 0 && !goalSubjectId) {
        setGoalSubjectId(subs[0].id);
      }

      const blocks = await scheduleService.ensureWeeklyScheduleSeeded();
      const loadedGoals = await goalPlanner.ensureGoalsSeeded();

      setScheduledBlocks(blocks);
      setGoals(loadedGoals);
      setIsLoading(false);
    }
    loadScheduleData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const targetDate = new Date(Date.now() + goalTargetDays * 24 * 60 * 60 * 1000).toISOString();
    const created = await goalPlanner.createGoal({
      title: goalTitle,
      subjectId: goalSubjectId || subjects[0]?.id || 'sub-bind',
      goalType,
      targetDate,
      desiredOutcome: goalOutcome || 'Penguasaan konsep materi secara menyeluruh.',
      weeklyFrequency: goalFrequency,
      availableMinutesPerSession: goalDuration,
      priority: 'high',
      status: 'ACTIVE',
    });

    setGoals(prev => [created, ...prev]);
    setIsNewGoalModalOpen(false);
    setGoalTitle('');
    setGoalOutcome('');
  };

  const handleRequestNotifications = async () => {
    const perm = await notificationService.requestPermission();
    setNotificationPrefs(prev => ({
      ...prev,
      enabled: perm === 'granted',
      permissionState: perm,
    }));
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-ink-500 font-serif">
        Menyiapkan jadwal akademik dan target belajarmu...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="border-b border-paper-300 pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
            Jadwal & Target Belajar · PAHAM Study Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-normal mt-0.5">
            Jadwal & Target Akademik
          </h1>
        </div>

        <button
          onClick={() => setIsNewGoalModalOpen(true)}
          className="btn-primary text-xs py-2 px-3.5 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Target Baru</span>
        </button>
      </header>

      {/* ── NAVIGATION TABS ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-paper-200">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-2 rounded-t font-medium transition flex items-center gap-1.5 ${
            activeTab === 'timeline' ? 'bg-moss-900 text-paper-50 font-bold' : 'text-ink-700 hover:bg-paper-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Jadwal Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-3 py-2 rounded-t font-medium transition flex items-center gap-1.5 ${
            activeTab === 'weekly' ? 'bg-moss-900 text-paper-50 font-bold' : 'text-ink-700 hover:bg-paper-200'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Jadwal Mingguan
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-3 py-2 rounded-t font-medium transition flex items-center gap-1.5 ${
            activeTab === 'goals' ? 'bg-moss-900 text-paper-50 font-bold' : 'text-ink-700 hover:bg-paper-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Target Belajar ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('windows')}
          className={`px-3 py-2 rounded-t font-medium transition flex items-center gap-1.5 ${
            activeTab === 'windows' ? 'bg-moss-900 text-paper-50 font-bold' : 'text-ink-700 hover:bg-paper-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Waktu Belajar Rutin
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3 py-2 rounded-t font-medium transition flex items-center gap-1.5 ${
            activeTab === 'reminders' ? 'bg-moss-900 text-paper-50 font-bold' : 'text-ink-700 hover:bg-paper-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Pengingat
        </button>
      </div>

      {/* ── TAB 1: TODAY'S TIMELINE & EXPECTED OUTCOMES ──────── */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-ink-500 uppercase tracking-wider">
              Sesi Terjadwal Hari Ini
            </span>
            <span className="text-xs font-mono text-moss-800">
              {scheduledBlocks.filter(b => b.status === 'COMPLETED').length} / {scheduledBlocks.length} Selesai
            </span>
          </div>

          <div className="space-y-4">
            {scheduledBlocks.map((block) => (
              <div
                key={block.id}
                className="paper-sheet p-6 space-y-4 border border-paper-300 hover:border-paper-400 transition"
              >
                {/* Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-paper-200 px-2 py-0.5 rounded text-ink-900 font-bold">
                      {block.startTime} – {block.endTime}
                    </span>
                    <span className="text-xs font-medium text-moss-900 bg-moss-100 px-2 py-0.5 rounded">
                      {block.subjectName}
                    </span>
                  </div>

                  <span className={`text-xs font-mono ${block.status === 'COMPLETED' ? 'text-moss-800 font-semibold' : 'text-ink-500'}`}>
                    {block.status === 'COMPLETED' ? '✓ Sudah Diselesaikan' : `${block.plannedDurationMinutes} Menit`}
                  </span>
                </div>

                {/* Concept & Reason */}
                <div>
                  <h3 className="font-serif text-xl font-medium text-ink-950">
                    {block.conceptTitle}
                  </h3>
                  <p className="text-xs text-ink-600 font-serif mt-1">
                    "{block.reason}"
                  </p>
                </div>

                {/* Concrete Expected Outcomes Checklist */}
                <div className="p-3.5 bg-paper-100 rounded border border-paper-200 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                    Target Hasil Nyata Sesi (Expected Outcome):
                  </span>
                  <div className="space-y-1.5">
                    {block.expectedOutcomes.map((outcome) => (
                      <div key={outcome.id} className="flex items-start gap-2 text-xs font-serif text-ink-800">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${outcome.isAchieved ? 'text-moss-700 fill-moss-100' : 'text-paper-400'}`} />
                        <span>{outcome.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-ink-500">
                    Metode: {block.mode}
                  </span>
                  <button
                    onClick={() => onStartStudyConcept(block.conceptIds[0])}
                    className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
                  >
                    <span>Mulai Sesi Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: WEEKLY ACADEMIC TIMETABLE ─────────────────── */}
      {activeTab === 'weekly' && (
        <div className="paper-sheet p-6 space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Rencana Mingguan
            </span>
            <h2 className="font-serif text-xl font-medium text-ink-950">
              Jadwal Belajar Pekan Ini
            </h2>
            <p className="text-xs text-ink-600 font-serif mt-0.5">
              Alokasi seimbang antara persiapan ulangan, review FSRS jatuh tempo, dan materi baru.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { day: 'Senin', subject: 'Bahasa Indonesia', mins: 15, mode: 'Recall', status: 'done' },
              { day: 'Selasa', subject: 'Matematika', mins: 20, mode: 'Latihan Adaptif', status: 'planned' },
              { day: 'Rabu', subject: 'IPA / Biologi', mins: 25, mode: 'Konsep Baru', status: 'planned' },
              { day: 'Kamis', subject: 'Matematika', mins: 20, mode: 'Latihan Campuran', status: 'planned' },
              { day: 'Jumat', subject: 'Review FSRS', mins: 15, mode: 'Flashcard Due', status: 'planned' },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded border space-y-2 ${
                  item.status === 'done' ? 'bg-moss-50/60 border-moss-300' : 'bg-paper-50 border-paper-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-500">
                  <span className="font-bold text-ink-900">{item.day}</span>
                  <span>{item.mins}m</span>
                </div>
                <div className="text-xs font-serif font-medium text-ink-950">
                  {item.subject}
                </div>
                <span className="text-[10px] font-mono text-moss-800 block">
                  {item.mode}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: TARGET & GOALS DASHBOARD ──────────────────── */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const sub = subjects.find(s => s.id === goal.subjectId);
              return (
                <div
                  key={goal.id}
                  className="paper-sheet p-6 space-y-4 border border-paper-300 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-ink-500">
                      <span className="bg-paper-200 px-2 py-0.5 rounded text-ink-900 font-medium">
                        {sub?.name || 'Mata Pelajaran'}
                      </span>
                      <span className="text-terracotta-800 font-semibold">
                        Target: {new Date(goal.targetDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-ink-950 leading-snug">
                      {goal.title}
                    </h3>

                    <p className="text-xs text-ink-600 font-serif leading-relaxed">
                      Target Hasil: "{goal.desiredOutcome}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-paper-200">
                    <div className="flex justify-between text-[11px] font-mono text-ink-700">
                      <span>Progres Kesiapan</span>
                      <span className="font-bold">{goal.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-moss-700 rounded-full transition-all"
                        style={{ width: `${goal.progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-ink-500 pt-1">
                      <span>{goal.weeklyFrequency}x sesi / pekan</span>
                      <span>{goal.availableMinutesPerSession} menit / sesi</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: STUDY WINDOWS PREFERENCES ─────────────────── */}
      {activeTab === 'windows' && (
        <div className="paper-sheet p-6 space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Preferensi Waktu Belajar
            </span>
            <h2 className="font-serif text-xl font-medium text-ink-950">
              Waktu Luang Mingguan
            </h2>
            <p className="text-xs text-ink-600 font-serif mt-0.5">
              PAHAM akan memprogram alokasi materi tepat di jendela waktu yang kamu tentukan.
            </p>
          </div>

          <div className="space-y-3">
            {studyWindows.map((win, idx) => (
              <div
                key={win.day}
                className="flex items-center justify-between p-3 rounded bg-paper-100 border border-paper-200 text-xs"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={win.isEnabled}
                    onChange={(e) => {
                      const updated = [...studyWindows];
                      updated[idx].isEnabled = e.target.checked;
                      setStudyWindows(updated);
                    }}
                    className="rounded text-moss-800 focus:ring-moss-700"
                  />
                  <span className="font-semibold text-ink-950 uppercase w-20">
                    {win.day === 'mon' ? 'Senin' : win.day === 'tue' ? 'Selasa' : win.day === 'wed' ? 'Rabu' : win.day === 'thu' ? 'Kamis' : win.day === 'fri' ? 'Jumat' : win.day === 'sat' ? 'Sabtu' : 'Minggu'}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-ink-700">
                  <span>{win.startTime}</span>
                  <span>–</span>
                  <span>{win.endTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: NOTIFICATIONS & QUIET HOURS ───────────────── */}
      {activeTab === 'reminders' && (
        <div className="paper-sheet p-6 space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Pengingat & Notifikasi
            </span>
            <h2 className="font-serif text-xl font-medium text-ink-950">
              Pengingat Jadwal Belajar
            </h2>
            <p className="text-xs text-ink-600 font-serif mt-0.5">
              Notifikasi akademik yang tenang tanpa pesan spam atau rasa bersalah.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded bg-paper-100 border border-paper-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-ink-950 block">Status Izin Perangkat</span>
                <p className="text-xs text-ink-600 font-serif">
                  {notificationPrefs.permissionState === 'granted' 
                    ? '✓ Notifikasi aktif di perangkat ini.' 
                    : 'Aktifkan izin peramban agar PAHAM dapat memberi tahu saat sesi dimulai.'}
                </p>
              </div>

              {notificationPrefs.permissionState !== 'granted' && (
                <button
                  onClick={handleRequestNotifications}
                  className="btn-primary text-xs py-2 px-4 shadow-subtle whitespace-nowrap"
                >
                  Aktifkan Pengingat
                </button>
              )}
            </div>

            <div className="p-4 rounded bg-paper-50 border border-paper-200 text-xs space-y-2">
              <span className="font-semibold text-ink-900 block">Jam Tenang (Quiet Hours):</span>
              <p className="text-ink-600 font-serif">
                22:00 – 06:30 (Tidak ada pengingat yang akan dikirim pada rentang waktu istirahat).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE NEW STUDY GOAL ─────────────────────── */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-50 border border-paper-300 rounded-lg max-w-md w-full p-6 space-y-5 shadow-xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <h3 className="font-serif text-lg font-medium text-ink-950">
                Tambah Target Belajar
              </h3>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="text-ink-400 hover:text-ink-800 text-xs font-mono"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-medium text-ink-800 mb-1">Judul Target</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Siap Ulangan Harian Fisika Bab 3"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded p-2.5 text-xs text-ink-950 font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink-800 mb-1">Mata Pelajaran</label>
                  <select
                    value={goalSubjectId}
                    onChange={(e) => setGoalSubjectId(e.target.value)}
                    className="w-full bg-paper-100 border border-paper-300 rounded p-2 text-xs"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink-800 mb-1">Tenggat Waktu</label>
                  <select
                    value={goalTargetDays}
                    onChange={(e) => setGoalTargetDays(Number(e.target.value))}
                    className="w-full bg-paper-100 border border-paper-300 rounded p-2 text-xs"
                  >
                    <option value={3}>3 Hari Lagi</option>
                    <option value={7}>1 Minggu Lagi</option>
                    <option value={14}>2 Minggu Lagi</option>
                    <option value={30}>1 Bulan Lagi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-800 mb-1">Hasil Nyata yang Diharapkan (Expected Outcome)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Hafal rumus Hukum Newton dan lancar menjawab 5 variasi soal grafik."
                  value={goalOutcome}
                  onChange={(e) => setGoalOutcome(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded p-2.5 text-xs text-ink-950 font-serif"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4 shadow-subtle"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
