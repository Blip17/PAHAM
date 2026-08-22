// App Shell Layout for PAHAM
// Editorial desktop vertical rail and 2-tap responsive mobile navigation menu

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
  Play, 
  Menu, 
  X, 
  LogOut, 
  GraduationCap, 
  Sparkles,
  Calendar,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { db } from '../../core/db';
import { UserProfile, DailyStudyPlan, Concept } from '../../core/types';
import { studyPlanner } from '../../core/studyPlannerEngine';
import { PahamMascot } from '../mascot/PahamMascot';

interface AppShellProps {
  userProfile: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenScan: () => void;
  onStartStudy: (conceptId?: string) => void;
  onOpenTimer: (conceptTitle?: string, minutes?: number) => void;
  onLogout: () => void;
  activeTimerConcept: string | null;
  activeTimerSeconds: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  userProfile,
  currentTab,
  onSelectTab,
  onOpenScan,
  onStartStudy,
  onOpenTimer,
  onLogout,
  activeTimerConcept,
  activeTimerSeconds,
  children,
}) => {
  const [dailyPlan, setDailyPlan] = useState<DailyStudyPlan | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadShellData() {
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

  const desktopNavItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'learn', label: 'Belajar', icon: BookOpen },
    { id: 'languages', label: 'Bahasa Asing', icon: Globe },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'schedule', label: 'Jadwal & Target', icon: Calendar },
    { id: 'materials', label: 'Materi', icon: FileText },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'exam', label: 'Ujian', icon: GraduationCap },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const mobileBottomItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'learn', label: 'Belajar', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  ];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayName = userProfile.displayName || userProfile.name || 'Siswa';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col md:flex-row text-ink-900 selection:bg-moss-100 selection:text-moss-950">
      
      {/* ── DESKTOP LEFT RAIL NAVIGATION ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-paper-300 bg-paper-50 shrink-0 sticky top-0 h-screen justify-between p-6 overflow-y-auto">
        <div>
          {/* Logo Brandmark with Paham Mascot */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <PahamMascot size="sm" state="idle" className="shrink-0" />
              <div>
                <span className="font-serif font-bold text-xl tracking-tight text-ink-950 block leading-none">
                  PAHAM
                </span>
                <span className="text-[10px] tracking-wider uppercase text-moss-800 font-semibold mt-0.5 block">
                  Beneran Paham
                </span>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-2.5 font-serif italic">
              "Bukan cuma belajar. Beneran paham."
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="mb-6 flex flex-col gap-2">
            <button
              onClick={() => onStartStudy()}
              className="w-full btn-primary text-xs py-2.5 shadow-subtle justify-between group"
            >
              <span className="flex items-center gap-2 font-medium">
                <Play className="w-3.5 h-3.5 fill-paper-50 text-paper-50" />
                Mulai Belajar
              </span>
              <span className="text-[11px] font-mono bg-moss-950/40 px-1.5 py-0.5 rounded text-moss-100">
                {dailyPlan?.totalEstimatedMinutes || 25}m
              </span>
            </button>

            <button
              onClick={onOpenScan}
              className="w-full btn-secondary text-xs py-2 justify-center text-ink-800"
            >
              <Camera className="w-3.5 h-3.5 text-moss-800" />
              Scan Catatan / Materi
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="space-y-1" aria-label="Navigasi Utama">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-paper-200 text-ink-950 font-semibold border-l-2 border-moss-800'
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

        {/* Desktop Bottom Rail Section: Contextual Timer & Profile Card */}
        <div className="space-y-3 pt-4 border-t border-paper-300">
          {/* Active Contextual Timer */}
          {activeTimerConcept && (
            <div 
              onClick={() => onOpenTimer()}
              className="bg-moss-100 border border-moss-200 p-2.5 rounded cursor-pointer hover:bg-moss-50 transition"
              role="button"
              tabIndex={0}
              aria-label={`Timer aktif: ${activeTimerConcept}`}
            >
              <div className="flex items-center justify-between text-xs text-moss-900 font-semibold">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-moss-600 animate-pulse shrink-0" />
                  <span className="truncate">{activeTimerConcept}</span>
                </span>
                <span className="font-mono text-moss-800 shrink-0">{formatTimer(activeTimerSeconds)}</span>
              </div>
            </div>
          )}

          {/* User Identity Card & Quick Actions */}
          <div className="p-3 bg-paper-100 rounded border border-paper-200 space-y-2.5">
            <div 
              onClick={() => onSelectTab('settings')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
              role="button"
              tabIndex={0}
            >
              <div className="w-8 h-8 rounded-full bg-moss-800 text-paper-50 flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs text-ink-950 truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-ink-500 truncate mt-0.5">
                  {userProfile.grade} {userProfile.schoolName ? `· ${userProfile.schoolName}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-paper-200/80 text-[11px]">
              <button
                onClick={() => onSelectTab('settings')}
                className="text-ink-600 hover:text-ink-950 font-medium flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Pengaturan
              </button>
              <button
                onClick={onLogout}
                className="text-terracotta-700 hover:text-terracotta-900 font-medium flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                Keluar
              </button>
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-guardian-dashboard'))}
              className="w-full pt-1.5 border-t border-paper-200/80 text-[10px] font-mono flex items-center justify-between text-ink-600 hover:text-ink-950 transition"
              title="Buka Quality Guardian Cockpit (Ctrl+Shift+Q)"
            >
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-moss-600" />
                QA Guardian Cockpit
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-moss-100 text-moss-900 font-bold">
                Ctrl+Shift+Q
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ────────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-paper-50 border-b border-paper-300 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <PahamMascot size="xs" state="idle" className="shrink-0" />
          <span className="font-serif font-bold text-base tracking-tight text-ink-950">
            PAHAM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-guardian-dashboard'))}
            className="p-1.5 rounded bg-ink-950 text-paper-50"
            title="Quality Guardian"
            aria-label="Quality Guardian"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-moss-400" />
          </button>
          <button
            onClick={onOpenScan}
            className="p-2 rounded bg-paper-200 text-ink-700 hover:bg-paper-300 active:bg-paper-400"
            title="Scan Catatan / Materi"
            aria-label="Scan Materi"
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

      {/* ── MAIN CONTENT VIEWPORT ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* ── MOBILE 5-ITEM BOTTOM NAVIGATION BAR ──────────────────────────── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-paper-50 border-t border-paper-300 px-2 py-1 flex items-center justify-around z-30 shadow-subtle"
        aria-label="Navigasi Bawah"
      >
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onSelectTab(item.id);
              }}
              className={`flex flex-col items-center py-1.5 px-3 text-[11px] font-medium transition min-w-[56px] ${
                isActive ? 'text-moss-900 font-semibold' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-moss-800' : 'text-ink-400'}`} />
              {item.label}
            </button>
          );
        })}

        {/* 5th Item: Menu Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center py-1.5 px-3 text-[11px] font-medium transition min-w-[56px] ${
            isMobileMenuOpen || currentTab === 'exam' || currentTab === 'progress' || currentTab === 'settings'
              ? 'text-moss-900 font-semibold'
              : 'text-ink-500 hover:text-ink-800'
          }`}
          aria-expanded={isMobileMenuOpen}
          aria-label="Menu navigasi lengkap"
        >
          <Menu className="w-4 h-4 mb-0.5 text-ink-600" />
          Menu
        </button>
      </nav>

      {/* ── MOBILE MENU SHEET (2-TAP ACCESS TO SETTINGS, EXAM, LOGOUT) ─────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end bg-ink-950/40 backdrop-blur-xs">
          <div 
            className="bg-paper-50 border-t border-paper-300 rounded-t-xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-modal anim-fade-up"
          >
            {/* Sheet Header with Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-paper-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-moss-800 text-paper-50 flex items-center justify-center font-serif text-base font-semibold">
                  {initial}
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink-950 leading-tight">{displayName}</p>
                  <p className="text-xs text-ink-500 mt-0.5 font-sans">
                    {userProfile.grade} {userProfile.schoolName ? `· ${userProfile.schoolName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-paper-200 text-ink-600 hover:bg-paper-300"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 text-sm font-sans">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectTab('schedule');
                }}
                className={`w-full flex items-center gap-3 p-3 rounded text-left transition ${
                  currentTab === 'schedule' ? 'bg-paper-200 font-semibold text-ink-950' : 'hover:bg-paper-150 text-ink-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-moss-800" />
                <span>Jadwal & Target Belajar</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectTab('materials');
                }}
                className={`w-full flex items-center gap-3 p-3 rounded text-left transition ${
                  currentTab === 'materials' ? 'bg-paper-200 font-semibold text-ink-950' : 'hover:bg-paper-150 text-ink-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-moss-800" />
                <span>Katalog Materi & Catatan</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectTab('exam');
                }}
                className={`w-full flex items-center gap-3 p-3 rounded text-left transition ${
                  currentTab === 'exam' ? 'bg-paper-200 font-semibold text-ink-950' : 'hover:bg-paper-150 text-ink-800'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-moss-800" />
                <span>Simulasi Ujian</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectTab('progress');
                }}
                className={`w-full flex items-center gap-3 p-3 rounded text-left transition ${
                  currentTab === 'progress' ? 'bg-paper-200 font-semibold text-ink-950' : 'hover:bg-paper-150 text-ink-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-moss-800" />
                <span>Progres & Memori FSRS</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectTab('settings');
                }}
                className={`w-full flex items-center gap-3 p-3 rounded text-left transition ${
                  currentTab === 'settings' ? 'bg-paper-200 font-semibold text-ink-950' : 'hover:bg-paper-150 text-ink-800'
                }`}
              >
                <Settings className="w-4 h-4 text-moss-800" />
                <span>Pengaturan Profil & Mapel</span>
              </button>
            </div>

            {/* Log Out Button */}
            <div className="pt-3 border-t border-paper-200">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded bg-terracotta-50 border border-terracotta-200 text-terracotta-800 text-sm font-medium hover:bg-terracotta-100 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
