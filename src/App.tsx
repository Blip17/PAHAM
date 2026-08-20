// PAHAM Application Root
// Full state machine: entry → auth → onboarding → transition → arrival → app
// Local-first: all state stored in IndexedDB + localStorage session.

import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AppShell } from './components/layout/AppShell';
import { HomeView } from './views/HomeView';
import { MaterialsView } from './views/MaterialsView';
import { LearnView } from './views/LearnView';
import { QuizView } from './views/QuizView';
import { ExamSimulationView } from './views/ExamSimulationView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { ScanFlowModal } from './views/ScanFlowModal';
import { StudyTimerModal } from './views/StudyTimerModal';
// Entry experience
import { EntryView } from './entry/EntryView';
import { AuthPanel } from './entry/AuthPanel';
// Onboarding sequence
import { OnboardingShell } from './onboarding/OnboardingShell';
import { BrandTransition } from './onboarding/BrandTransition';
import { ArrivalScreen } from './onboarding/ArrivalScreen';
// Data
import { db, initializeDatabaseSeed } from './core/db';
import { UserProfile } from './core/types';

// ─────────────────────────────────────────────────────────────────────────────
// App state machine
// ─────────────────────────────────────────────────────────────────────────────
type AppState =
  | 'loading'      // Checking IndexedDB + localStorage session
  | 'entry'        // Brand intro + "Mulai / Masuk" buttons
  | 'auth'         // Auth panel (name entry)
  | 'onboarding'   // 7-step personalized setup
  | 'transition'   // Signature brand animation
  | 'arrival'      // Personalized "Selamat datang" screen
  | 'app';         // Main PAHAM dashboard

export function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Tab + navigation state for the main app
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [activeTimerConceptTitle, setActiveTimerConceptTitle] = useState<string | null>(null);
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number>(25);
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>(undefined);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);

  // ── Bootstrap: determine where user is in the flow ──────────────────────
  useEffect(() => {
    async function bootstrap() {
      await initializeDatabaseSeed();

      const session = localStorage.getItem('paham_session');
      const profile = await db.profiles.toCollection().first();

      if (!profile || !session) {
        // No profile → fresh user → show entry
        setAppState('entry');
        return;
      }

      if (!profile.onboardingCompleted) {
        // Profile exists but onboarding not done → resume onboarding
        setUserProfile(profile);
        setAppState('onboarding');
        return;
      }

      if (!profile.hasSeenArrival) {
        // Onboarding done but haven't seen arrival yet
        setUserProfile(profile);
        setAppState('arrival');
        return;
      }

      // Fully onboarded → main app
      setUserProfile(profile);
      setAppState('app');
    }

    bootstrap();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStartAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAppState('auth');
  };

  const handleAuthenticated = (profile: UserProfile, isNew: boolean) => {
    setUserProfile(profile);
    if (isNew || !profile.onboardingCompleted) {
      setAppState('onboarding');
    } else if (!profile.hasSeenArrival) {
      setAppState('arrival');
    } else {
      setAppState('app');
    }
  };

  const handleOnboardingComplete = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    // Trigger the signature brand transition before arrival
    setAppState('transition');
  };

  const handleTransitionComplete = () => {
    setAppState('arrival');
  };

  const handleEnterApp = async () => {
    // Mark arrival as seen
    if (userProfile) {
      const updated = { ...userProfile, hasSeenArrival: true, updatedAt: new Date().toISOString() };
      await db.profiles.put(updated);
      setUserProfile(updated);
    }
    setAppState('app');
  };

  // Main app navigation
  const handleStartStudy = (conceptId?: string) => {
    setSelectedConceptId(conceptId);
    setActiveTab('learn');
  };

  const handleOpenQuiz = (conceptId?: string) => {
    setSelectedConceptId(conceptId);
    setActiveTab('quiz');
  };

  const handleOpenExam = (examId: string) => {
    setSelectedExamId(examId);
    setActiveTab('exam');
  };

  const handleMaterialCreated = (_newMaterialId: string) => {
    setActiveTab('materials');
  };

  const handleOpenTimer = (conceptTitle?: string, minutes?: number) => {
    if (conceptTitle) setActiveTimerConceptTitle(conceptTitle);
    if (minutes) setActiveTimerMinutes(minutes);
    setIsTimerModalOpen(true);
  };

  // ── Render by state ──────────────────────────────────────────────────────

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-paper-100 flex items-center justify-center">
        <span className="font-serif text-ink-500 text-sm">Menyiapkan Paham…</span>
      </div>
    );
  }

  if (appState === 'entry') {
    return (
      <>
        <EntryView onStartAuth={handleStartAuth} />
        <Analytics />
      </>
    );
  }

  if (appState === 'auth') {
    return (
      <>
        <AuthPanel
          mode={authMode}
          onBack={() => setAppState('entry')}
          onAuthenticated={handleAuthenticated}
        />
        <Analytics />
      </>
    );
  }

  if (appState === 'onboarding' && userProfile) {
    return (
      <>
        <OnboardingShell
          initialProfile={userProfile}
          onComplete={handleOnboardingComplete}
        />
        <Analytics />
      </>
    );
  }

  if (appState === 'transition') {
    return (
      <>
        <BrandTransition onComplete={handleTransitionComplete} />
        <Analytics />
      </>
    );
  }

  if (appState === 'arrival' && userProfile) {
    return (
      <>
        <ArrivalScreen profile={userProfile} onEnter={handleEnterApp} />
        <Analytics />
      </>
    );
  }

  // ── Main PAHAM application ───────────────────────────────────────────────
  if (appState === 'app' && userProfile) {
    return (
      <>
        <AppShell
          currentTab={activeTab}
          onSelectTab={(tab: string) => {
            setActiveTab(tab);
            if (tab !== 'learn') setSelectedConceptId(undefined);
            if (tab !== 'exam') setSelectedExamId(undefined);
          }}
          onOpenScan={() => setIsScanModalOpen(true)}
          onStartStudy={handleStartStudy}
          onOpenTimer={handleOpenTimer}
          activeTimerConcept={activeTimerConceptTitle}
          activeTimerSeconds={activeTimerMinutes * 60}
        >
          {activeTab === 'home' && (
            <HomeView
              onStartStudy={handleStartStudy}
              onOpenScan={() => setIsScanModalOpen(true)}
              onOpenQuiz={handleOpenQuiz}
              onOpenExam={handleOpenExam}
              onOpenMaterials={() => setActiveTab('materials')}
            />
          )}
          {activeTab === 'materials' && (
            <MaterialsView
              onStartStudyConcept={handleStartStudy}
              onOpenScanModal={() => setIsScanModalOpen(true)}
            />
          )}
          {activeTab === 'learn' && (
            <LearnView
              initialConceptId={selectedConceptId}
              onFinishSession={() => setActiveTab('home')}
              onOpenTimer={handleOpenTimer}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizView
              initialConceptId={selectedConceptId}
              onFinishQuiz={() => setActiveTab('home')}
              onStartLearnConcept={handleStartStudy}
            />
          )}
          {activeTab === 'exam' && (
            <ExamSimulationView
              initialExamId={selectedExamId}
              onFinishExam={() => setActiveTab('home')}
              onStartLearnConcept={handleStartStudy}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressView onStartLearnConcept={handleStartStudy} />
          )}
          {activeTab === 'settings' && <SettingsView />}
        </AppShell>

        <ScanFlowModal
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          onMaterialCreated={handleMaterialCreated}
        />
        <StudyTimerModal
          isOpen={isTimerModalOpen}
          onClose={() => setIsTimerModalOpen(false)}
          conceptTitle={activeTimerConceptTitle || 'Sesi Belajar Terfokus'}
          plannedMinutes={activeTimerMinutes}
        />
        <Analytics />
      </>
    );
  }

  // Fallback (should not reach)
  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center">
      <span className="font-serif text-ink-500 text-sm">Memuat…</span>
    </div>
  );
}

export default App;
