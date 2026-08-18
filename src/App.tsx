// Main Application Root for PAHAM
// Integrated with @vercel/analytics/react, Local-First Dexie Database, and First-Time Onboarding Flow

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
import { OnboardingView } from './views/OnboardingView';
import { db, initializeDatabaseSeed } from './core/db';
import { UserProfile } from './core/types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Modal states
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [activeTimerConceptTitle, setActiveTimerConceptTitle] = useState<string | null>(null);
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number>(25);

  // Selected parameters for subviews
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>(undefined);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function checkUserProfile() {
      setIsLoadingProfile(true);
      await initializeDatabaseSeed();

      const existingProfile = await db.profiles.toCollection().first();
      if (existingProfile) {
        setUserProfile(existingProfile);
      }
      setIsLoadingProfile(false);
    }
    checkUserProfile();
  }, []);

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

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-paper-100 flex items-center justify-center font-serif text-ink-600">
        Menyiapkan PAHAM...
      </div>
    );
  }

  // If no user profile exists, present the Onboarding Setup Wizard first
  if (!userProfile) {
    return (
      <>
        <OnboardingView
          onComplete={(newProfile) => {
            setUserProfile(newProfile);
            setActiveTab('home');
          }}
        />
        <Analytics />
      </>
    );
  }

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
          <ProgressView
            onStartLearnConcept={handleStartStudy}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </AppShell>

      {/* Global Modals */}
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

      {/* Vercel Analytics Tracker */}
      <Analytics />
    </>
  );
}

export default App;
