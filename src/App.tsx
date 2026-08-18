// Main Application Root for PAHAM
// Personal Adaptive Learning System for Indonesian Students

import React, { useState, useEffect } from 'react';
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
import { initializeDatabaseSeed } from './core/db';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>('c-penokohan');
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>('exam-bind-1');
  
  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [timerConceptTitle, setTimerConceptTitle] = useState<string>('Penokohan (Karakterisasi)');
  const [timerPlannedMinutes, setTimerPlannedMinutes] = useState<number>(8);

  // Background active timer tracker for layout
  const [activeTimerConcept, setActiveTimerConcept] = useState<string | null>(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number>(480);

  useEffect(() => {
    async function init() {
      await initializeDatabaseSeed();
    }
    init();
  }, []);

  const handleStartStudy = (conceptId?: string) => {
    if (conceptId) setSelectedConceptId(conceptId);
    setCurrentTab('learn');
  };

  const handleOpenQuiz = (conceptId?: string) => {
    if (conceptId) setSelectedConceptId(conceptId);
    setCurrentTab('quiz');
  };

  const handleOpenExam = (examId: string) => {
    setSelectedExamId(examId);
    setCurrentTab('exam');
  };

  const handleOpenTimer = (conceptTitle?: string, minutes?: number) => {
    if (conceptTitle) setTimerConceptTitle(conceptTitle);
    if (minutes) setTimerPlannedMinutes(minutes);
    setIsTimerModalOpen(true);
  };

  const handleMaterialCreated = (newMaterialId: string) => {
    setCurrentTab('materials');
  };

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onOpenScan={() => setIsScanModalOpen(true)}
      onStartStudy={handleStartStudy}
      onOpenTimer={handleOpenTimer}
      activeTimerConcept={activeTimerConcept}
      activeTimerSeconds={activeTimerSeconds}
    >
      {/* 1. HOME / TODAY */}
      {currentTab === 'home' && (
        <HomeView
          onStartStudy={handleStartStudy}
          onOpenScan={() => setIsScanModalOpen(true)}
          onOpenQuiz={handleOpenQuiz}
          onOpenExam={handleOpenExam}
          onOpenMaterials={() => setCurrentTab('materials')}
        />
      )}

      {/* 2. LEARN ACTIVE CANVAS */}
      {currentTab === 'learn' && (
        <LearnView
          initialConceptId={selectedConceptId}
          onFinishSession={() => setCurrentTab('home')}
          onOpenTimer={handleOpenTimer}
        />
      )}

      {/* 3. MATERIAL LIBRARY & ARCHIVE */}
      {currentTab === 'materials' && (
        <MaterialsView
          onStartStudyConcept={handleStartStudy}
          onOpenScanModal={() => setIsScanModalOpen(true)}
        />
      )}

      {/* 4. QUIZ ACTIVE DRILL */}
      {currentTab === 'quiz' && (
        <QuizView
          initialConceptId={selectedConceptId}
          onFinishQuiz={() => setCurrentTab('home')}
          onStartLearnConcept={handleStartStudy}
        />
      )}

      {/* 5. EXAM SIMULATION */}
      {currentTab === 'exam' && (
        <ExamSimulationView
          initialExamId={selectedExamId}
          onFinishExam={() => setCurrentTab('home')}
          onStartLearnConcept={handleStartStudy}
        />
      )}

      {/* 6. PROGRESS & EVIDENCE */}
      {currentTab === 'progress' && (
        <ProgressView
          onStartLearnConcept={handleStartStudy}
        />
      )}

      {/* 7. SETTINGS & PROFILE */}
      {currentTab === 'settings' && (
        <SettingsView />
      )}

      {/* MODALS */}
      <ScanFlowModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onMaterialCreated={handleMaterialCreated}
      />

      <StudyTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        conceptTitle={timerConceptTitle}
        plannedMinutes={timerPlannedMinutes}
      />
    </AppShell>
  );
}

export default App;
