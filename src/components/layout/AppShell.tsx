// App Shell Layout for PAHAM
// Editorial desktop vertical rail and responsive mobile navigation

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  FileText, 
  TrendingUp, 
  Settings, 
  Camera, 
  Play
} from 'lucide-react';
import { db } from '../../core/db';
import { UserProfile, DailyStudyPlan, Concept } from '../../core/types';
import { studyPlanner } from '../../core/studyPlannerEngine';

interface AppShellProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenScan: () => void;
  onStartStudy: (conceptId?: string) => void;
  onOpenTimer: (conceptTitle?: string, minutes?: number) => void;
  activeTimerConcept: string | null;
  activeTimerSeconds: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan,
  onStartStudy,
  onOpenTimer,
  activeTimerConcept,
  activeTimerSeconds,
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyStudyPlan | null>(null);

  useEffect(() => {
    async function loadShellData() {
      const p = await db.profiles.toCollection().first();
      if (p) setProfile(p);

      const concepts: Concept[] = await db.concepts.toArray();
      const studentStatesArr = await db.studentConceptStates.toArray();
      const stateMap = new Map(studentStatesArr.map(s => [s.conceptId, s]));
      const subjects = await db.subjects.toArray();
      const chapters = await db.chapters.toArray();
      const exams = await db.exams.toArray();

      const plan = studyPlanner.generateDailyPlan(concepts, stateMap, subjects, chapters, exams);
      setDailyPlan(plan);
    }
    loadShellData();
  }, [currentTab]);

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'learn', label: 'Belajar', icon: BookOpen },
    { id: 'materials', label: 'Materi', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'exam', label: 'Ujian', icon: FileText },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col md:flex-row text-ink-900">
      {/* Desktop Left Rail Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-paper-300 bg-paper-50 shrink-0 sticky top-0 h-screen justify-between p-6">
        <div>
          {/* Logo Brandmark */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-moss-900 text-paper-50 flex items-center justify-center font-display font-semibold text-lg tracking-tight">
                P
              </div>
              <div>
                <span className="font-display font-semibold text-xl tracking-wide text-ink-900 block leading-none">
                  PAHAM
                </span>
                <span className="text-[10px] tracking-wider uppercase text-ink-500 font-medium mt-0.5 block">
                  Beneran Paham
                </span>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-3 font-serif italic">
              "Bukan cuma belajar. Beneran paham."
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="mb-6 flex flex-col gap-2">
            <button
              onClick={() => onStartStudy()}
              className="w-full btn-primary text-sm py-2.5 shadow-sm justify-between group"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 text-paper-50 fill-paper-50" />
                Mulai Belajar
              </span>
              <span className="text-xs font-mono bg-moss-950/40 px-1.5 py-0.5 rounded text-moss-100">
                {dailyPlan?.totalEstimatedMinutes || 21}m
              </span>
            </button>

            <button
              onClick={onOpenScan}
              className="w-full btn-secondary text-sm py-2 justify-center text-ink-800"
            >
              <Camera className="w-4 h-4 text-moss-800" />
              Scan Catatan / Materi
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-paper-200 text-ink-955 font-semibold border-l-2 border-moss-800'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-paper-150'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-moss-800' : 'text-ink-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Section: Active Timer & Settings */}
        <div className="space-y-3 pt-4 border-t border-paper-300">
          {/* Active Contextual Timer Indicator */}
          {activeTimerConcept && (
            <div 
              onClick={() => onOpenTimer()}
              className="bg-moss-100 border border-moss-200 p-2.5 rounded cursor-pointer hover:bg-moss-50 transition"
            >
              <div className="flex items-center justify-between text-xs text-moss-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-moss-600 animate-pulse" />
                  {activeTimerConcept}
                </span>
                <span className="font-mono text-moss-800">{formatTimer(activeTimerSeconds)}</span>
              </div>
            </div>
          )}

          {/* Profile & Settings Trigger */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition ${
              currentTab === 'settings' ? 'bg-paper-200 text-ink-900' : 'text-ink-500 hover:text-ink-800 hover:bg-paper-150'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-ink-400" />
              <div className="text-left">
                <p className="font-medium text-ink-800 truncate">{profile?.name || 'Siswa'}</p>
                <p className="text-[10px] text-ink-400">{profile?.grade || 'Kelas 7'} · {profile?.schoolName || 'SMP'}</p>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-paper-50 border-b border-paper-300 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-moss-900 text-paper-50 flex items-center justify-center font-display font-semibold text-sm">
            P
          </div>
          <span className="font-display font-semibold text-lg tracking-wide text-ink-900">
            PAHAM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScan}
            className="p-1.5 rounded bg-paper-200 text-ink-700 hover:bg-paper-300"
            title="Scan Materi"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartStudy()}
            className="btn-primary text-xs py-1.5 px-3"
          >
            Belajar
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Rail */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-paper-50 border-t border-paper-300 px-2 py-1.5 flex items-center justify-around z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-moss-900 font-semibold' : 'text-ink-500'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-moss-800' : 'text-ink-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
