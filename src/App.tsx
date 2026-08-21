// PAHAM Application Root
// Authoritative Supabase Auth + Canonical Profile State + Full 3-State Routing Engine

import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AppShell } from './components/layout/AppShell';
import { HomeView } from './views/HomeView';
import { MaterialsView } from './views/MaterialsView';
import { LearnView } from './views/LearnView';
import { FlashcardsView } from './views/FlashcardsView';
import { ScheduleView } from './views/ScheduleView';
import { QuizView } from './views/QuizView';
import { ExamSimulationView } from './views/ExamSimulationView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { ScanFlowModal } from './views/ScanFlowModal';
import { StudyTimerModal } from './views/StudyTimerModal';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
// Entry experience
import { EntryView } from './entry/EntryView';
import { AuthPanel } from './entry/AuthPanel';
// Onboarding sequence
import { OnboardingShell } from './onboarding/OnboardingShell';
import { BrandTransition } from './onboarding/BrandTransition';
import { ArrivalScreen } from './onboarding/ArrivalScreen';
import { TutorialFlow } from './tutorial/TutorialFlow';
// Services
import { authService } from './services/authService';
import { initializeDatabaseSeed } from './core/db';
import { UserProfile } from './core/types';

export type AppState =
  | 'loading'      // Checking Supabase Auth Session
  | 'entry'        // Brand intro + "Mulai / Masuk" buttons
  | 'auth'         // Auth panel (Name, Email, Password form)
  | 'onboarding'   // 7-step personalized setup
  | 'transition'   // Signature brand animation
  | 'arrival'      // Personalized "Selamat datang, [name]" screen
  | 'app';         // Main PAHAM dashboard

export function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Tab + navigation state for the main app
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [activeTimerConceptTitle, setActiveTimerConceptTitle] = useState<string | null>(null);
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number>(25);
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>(undefined);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);

  // ── Bootstrap: authoritative session & profile initialization ────────────
  useEffect(() => {
    async function bootstrap() {
      await initializeDatabaseSeed();

      const profile = await authService.getActiveProfile();

      if (!profile) {
        setAppState('entry');
        return;
      }

      setUserProfile(profile);

      if (!profile.onboardingCompleted) {
        setAppState('onboarding');
      } else if (!profile.hasSeenArrival) {
        setAppState('arrival');
      } else {
        setAppState('app');
      }
    }

    bootstrap();

    // Listen to Supabase Auth State changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUserProfile(null);
        setAppState('entry');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Canonical Profile Update Handler (Reactive everywhere) ────────────────
  const handleUpdateProfile = useCallback(async (updated: UserProfile) => {
    const saved = await authService.saveProfile(updated);
    setUserProfile(saved);
  }, []);

  // ── Sign Out Handler ──────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await authService.signOut();
    setUserProfile(null);
    setActiveTab('home');
    setAppState('entry');
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
    const saved = await authService.saveProfile(updatedProfile);
    setUserProfile(saved);
    // Trigger signature brand transition before arrival
    setAppState('transition');
  };

  const handleTransitionComplete = () => {
    setAppState('arrival');
  };

  const handleEnterApp = async () => {
    if (userProfile) {
      const updated = { ...userProfile, hasSeenArrival: true };
      const saved = await authService.saveProfile(updated);
      setUserProfile(saved);
    }
    setAppState('app');
    setIsTutorialOpen(true);
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
          initialMode={authMode}
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
      <ToastProvider>
        <ErrorBoundary>
          <AppShell
            userProfile={userProfile}
            currentTab={activeTab}
            onSelectTab={(tab: string) => {
              setActiveTab(tab);
              if (tab !== 'learn') setSelectedConceptId(undefined);
              if (tab !== 'exam') setSelectedExamId(undefined);
            }}
            onOpenScan={() => setIsScanModalOpen(true)}
            onStartStudy={handleStartStudy}
            onOpenTimer={handleOpenTimer}
            onLogout={handleLogout}
            activeTimerConcept={activeTimerConceptTitle}
            activeTimerSeconds={activeTimerMinutes * 60}
          >
            {activeTab === 'home' && (
              <HomeView
                userProfile={userProfile}
                onStartStudy={handleStartStudy}
                onOpenScan={() => setIsScanModalOpen(true)}
                onOpenQuiz={handleOpenQuiz}
                onOpenExam={handleOpenExam}
                onOpenMaterials={() => setActiveTab('materials')}
                onOpenFlashcards={() => setActiveTab('flashcards')}
                onOpenSchedule={() => setActiveTab('schedule')}
              />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardsView
                initialConceptId={selectedConceptId}
                onStartLearnConcept={handleStartStudy}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleView
                onStartStudyConcept={handleStartStudy}
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
            {activeTab === 'settings' && (
              <SettingsView
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                onReplayTutorial={() => setIsTutorialOpen(true)}
              />
            )}
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
          {isTutorialOpen && (
            <TutorialFlow
              onComplete={() => setIsTutorialOpen(false)}
              onOpenScan={() => {
                setIsTutorialOpen(false);
                setIsScanModalOpen(true);
              }}
            />
          )}
          <Analytics />
        </ErrorBoundary>
      </ToastProvider>
    );
  }

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center">
      <span className="font-serif text-ink-500 text-sm">Memuat…</span>
    </div>
  );
}

export default App;
