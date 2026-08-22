// PAHAM Replay Studio
// Time-travel learning journey player, state inspector, and synthetic user simulation engine

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  FastForward, 
  Clock, 
  Compass, 
  Sparkles, 
  Zap, 
  User, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  ChevronRight,
  Brain,
  Sliders,
  History
} from 'lucide-react';
import { PahamMascot, MascotState } from '../../components/mascot/PahamMascot';
import { devApiClient } from '../services/devApiClient';

interface JourneyStep {
  stepIndex: number;
  stageName: string;
  eventType: string;
  timestampOffsetSeconds: number;
  payload: Record<string, any>;
  stateSnapshot: {
    accuracy: number;
    mistakesCount: number;
    overdueCards: number;
    activeRuleId?: string;
    pikoEmotion: MascotState;
    pikoSpeech: string;
    conceptMastery: Record<string, number>;
  };
  explanation: string;
}

interface JourneyPreset {
  id: string;
  title: string;
  description: string;
  syntheticUser: {
    id: string;
    name: string;
    archetype: string;
  };
  steps: JourneyStep[];
}

const DEFAULT_JOURNEYS: JourneyPreset[] = [
  {
    id: 'STRUGGLING_STUDENT_RESCUE',
    title: 'Siswa Butuh Bantuan (5x Salah → Rescue Rule → Piko Zzz/Prompt)',
    description: 'Siswa baru menjawab pertanyaan salah berturut-turut pada topik Fungsi Kuadrat. Mesin rekomendasi mengaktifkan RULE_STUDY_RESCUE dan memicu notifikasi intervensi Piko.',
    syntheticUser: {
      id: 'dev-sim-struggling-01',
      name: '[Dev Sim] Siswa Butuh Bantuan',
      archetype: 'STRUGGLING_STUDENT',
    },
    steps: [
      {
        stepIndex: 1,
        stageName: 'USER CREATED',
        eventType: 'user.created',
        timestampOffsetSeconds: 0,
        payload: { grade: 'Kelas 11', curriculum: 'Kurikulum Merdeka' },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'idle',
          pikoSpeech: 'Halo! Piko siap temani belajarmu hari ini.',
          conceptMastery: {},
        },
        explanation: 'Akun siswa diinisialisasi dengan kurikulum SMA Kelas 11.',
      },
      {
        stepIndex: 2,
        stageName: 'MATERIAL UPLOADED & OCR',
        eventType: 'material.imported',
        timestampOffsetSeconds: 45,
        payload: { title: 'Catatan Guru - Fungsi Kuadrat & Diskriminan', pages: 2 },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'thinking',
          pikoSpeech: 'Piko sedang membaca catatan tulisan tangan gurumu...',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Catatan guru diunggah dan konsep inti diekstraksi ke basis pengetahuan.',
      },
      {
        stepIndex: 3,
        stageName: 'QUIZ STARTED',
        eventType: 'quiz.started',
        timestampOffsetSeconds: 90,
        payload: { conceptId: 'c-diskriminan', difficulty: 2 },
        stateSnapshot: {
          accuracy: 100,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'encouraging',
          pikoSpeech: 'Yuk coba uji pemahamanmu dengan kuis singkat!',
          conceptMastery: { 'c-diskriminan': 0.2 },
        },
        explanation: 'Sesi latihan adaptif dimulai untuk menguji daya ingat awal.',
      },
      {
        stepIndex: 4,
        stageName: 'QUESTION 1 INCORRECT',
        eventType: 'question.answered',
        timestampOffsetSeconds: 130,
        payload: { questionId: 'q-1', isCorrect: false, chosen: 'C', correct: 'A', conceptId: 'c-diskriminan' },
        stateSnapshot: {
          accuracy: 0,
          mistakesCount: 1,
          overdueCards: 0,
          pikoEmotion: 'encouraging',
          pikoSpeech: 'Jangan khawatir, perhatikan rumus D = b² - 4ac ya.',
          conceptMastery: { 'c-diskriminan': 0.15 },
        },
        explanation: 'Siswa salah menghitung tanda diskriminan.',
      },
      {
        stepIndex: 5,
        stageName: 'MULTIPLE WRONG ANSWERS (SPIKE)',
        eventType: 'question.answered',
        timestampOffsetSeconds: 210,
        payload: { questionId: 'q-2', isCorrect: false, chosen: 'B', correct: 'D', conceptId: 'c-diskriminan' },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          pikoEmotion: 'warning',
          pikoSpeech: 'Sepertinya ada kebingungan di konsep titik potong sumbu X.',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Lonjakan kesalahan terdeteksi pada konsep yang sama.',
      },
      {
        stepIndex: 6,
        stageName: 'RECOMMENDATION GENERATED',
        eventType: 'recommendation.generated',
        timestampOffsetSeconds: 260,
        payload: { ruleId: 'RULE_STUDY_RESCUE', priority: 'HIGH', actionType: 'RESCUE_STUDY' },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          activeRuleId: 'RULE_STUDY_RESCUE',
          pikoEmotion: 'recommending',
          pikoSpeech: 'Piko sarankan review 5 menit konsep Diskriminan sebelum lanjut.',
          conceptMastery: { 'c-diskriminan': 0.1 },
        },
        explanation: 'Engine mengevaluasi sinyal dan membangkitkan intervensi penyelamatan.',
      },
      {
        stepIndex: 7,
        stageName: 'PIKO NOTIFICATION ACCEPTED',
        eventType: 'recommendation.accepted',
        timestampOffsetSeconds: 300,
        payload: { recommendationId: 'rec-rescue-1', durationMinutes: 5 },
        stateSnapshot: {
          accuracy: 25,
          mistakesCount: 3,
          overdueCards: 0,
          pikoEmotion: 'celebrating',
          pikoSpeech: 'Keren! Mari kita pelajari bersama sampai benar-benar paham.',
          conceptMastery: { 'c-diskriminan': 0.4 },
        },
        explanation: 'Siswa menerima rekomendasi dan memasuki mini-sesi penyelamatan konsep.',
      },
      {
        stepIndex: 8,
        stageName: 'FSRS REVIEW SCHEDULED',
        eventType: 'fsrs.card_created',
        timestampOffsetSeconds: 420,
        payload: { conceptId: 'c-diskriminan', due: '2026-08-23', stability: 1.5, difficulty: 4.2 },
        stateSnapshot: {
          accuracy: 60,
          mistakesCount: 0,
          overdueCards: 0,
          pikoEmotion: 'idle',
          pikoSpeech: 'Kartu review dijadwalkan besok untuk mengunci retensi otakmu.',
          conceptMastery: { 'c-diskriminan': 0.65 },
        },
        explanation: 'Siklus belajar tuntas: konsep diperbaiki dan kartu pengulangan FSRS dijadwalkan.',
      },
    ],
  },
  {
    id: 'EXAM_CRUNCH_TIMELINE',
    title: 'Ujian Besok (Exam Crunch Mode → Countdown → Drill)',
    description: 'Siswa memiliki jadwal Penilaian Akhir Semester (PAS) dalam 24 jam. Paham mengaktifkan mode drill intensif.',
    syntheticUser: {
      id: 'dev-sim-exam-02',
      name: '[Dev Sim] Siswa Mode Ujian',
      archetype: 'EXAM_TOMORROW',
    },
    steps: [
      {
        stepIndex: 1,
        stageName: 'EXAM CREATED (H-1)',
        eventType: 'exam.created',
        timestampOffsetSeconds: 0,
        payload: { title: 'PAS Fisika & Matematika', daysRemaining: 1, totalQuestions: 25 },
        stateSnapshot: {
          accuracy: 75,
          mistakesCount: 0,
          overdueCards: 2,
          activeRuleId: 'RULE_EXAM_PREPARATION',
          pikoEmotion: 'warning',
          pikoSpeech: 'Ujian tinggal 1 hari lagi! Fokus latihan soal terarah ya.',
          conceptMastery: { 'c-newton': 0.7, 'c-diskriminan': 0.6 },
        },
        explanation: 'Jadwal ujian terdaftar, Piko mengaktifkan banner persiapan intensif.',
      },
      {
        stepIndex: 2,
        stageName: 'EXAM SIMULATION DRILL',
        eventType: 'exam.started',
        timestampOffsetSeconds: 300,
        payload: { examId: 'exam-pas-1', questionsCount: 20 },
        stateSnapshot: {
          accuracy: 75,
          mistakesCount: 0,
          overdueCards: 2,
          pikoEmotion: 'thinking',
          pikoSpeech: 'Kerjakan dengan tenang, perhatikan alokasi waktu per soal.',
          conceptMastery: { 'c-newton': 0.75, 'c-diskriminan': 0.65 },
        },
        explanation: 'Simulasi ujian berjalan dengan penghitung waktu.',
      },
      {
        stepIndex: 3,
        stageName: 'SIMULATION SUBMITTED & REVIEWED',
        eventType: 'exam.submitted',
        timestampOffsetSeconds: 1800,
        payload: { score: 85, correct: 17, total: 20 },
        stateSnapshot: {
          accuracy: 85,
          mistakesCount: 3,
          overdueCards: 0,
          pikoEmotion: 'celebrating',
          pikoSpeech: 'Skor 85! Pemahamanmu sangat siap untuk ujian besok!',
          conceptMastery: { 'c-newton': 0.88, 'c-diskriminan': 0.82 },
        },
        explanation: 'Simulasi selesai dan rekomendasi penguatan akhir dibangkitkan.',
      },
    ],
  },
];

export const ReplayStudioView: React.FC = () => {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('STRUGGLING_STUDENT_RESCUE');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [isEditingPayload, setIsEditingPayload] = useState<boolean>(false);
  const [customPayloadJson, setCustomPayloadJson] = useState<string>('');

  const activeJourney = DEFAULT_JOURNEYS.find(j => j.id === selectedJourneyId) || DEFAULT_JOURNEYS[0];
  const activeStep = activeJourney.steps.find(s => s.stepIndex === currentStepIndex) || activeJourney.steps[0];

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      const intervalMs = Math.round(2500 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= activeJourney.steps.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, activeJourney.steps.length]);

  // Sync payload editor with active step
  useEffect(() => {
    setCustomPayloadJson(JSON.stringify(activeStep.payload, null, 2));
  }, [activeStep]);

  const handleSelectJourney = (journeyId: string) => {
    setSelectedJourneyId(journeyId);
    setCurrentStepIndex(1);
    setIsPlaying(false);
  };

  const handleStepJump = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header & Simulation Guard */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              PAHAM Replay Studio & Learning Journey Time-Travel
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
              Simulation Mode Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Reproduce complete student learning journeys, inspect step-by-step state snapshots ("What did Paham know?"), and test recommendation reasoning in a sandboxed timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">Preset:</span>
          <select
            value={selectedJourneyId}
            onChange={e => handleSelectJourney(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
          >
            {DEFAULT_JOURNEYS.map(j => (
              <option key={j.id} value={j.id}>{j.title.split(' (')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Player Scrubber Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        
        {/* Scrubber Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepJump(1)}
              disabled={currentStepIndex === 1}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition text-zinc-300"
              title="Reset ke Awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentStepIndex(prev => Math.max(1, prev - 1))}
              disabled={currentStepIndex === 1}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition text-zinc-300"
              title="Langkah Sebelumnya"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={() => setCurrentStepIndex(prev => Math.min(activeJourney.steps.length, prev + 1))}
              disabled={currentStepIndex === activeJourney.steps.length}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition text-zinc-300"
              title="Langkah Berikutnya"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed & Step Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
              <span className="text-zinc-500">Speed:</span>
              {[1, 2, 5].map(spd => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    playbackSpeed === spd ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              Langkah <strong className="text-purple-400">{currentStepIndex}</strong> dari {activeJourney.steps.length}
            </div>
          </div>

        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {activeJourney.steps.map(step => {
            const isCurrent = step.stepIndex === currentStepIndex;
            const isPast = step.stepIndex < currentStepIndex;

            return (
              <button
                key={step.stepIndex}
                onClick={() => handleStepJump(step.stepIndex)}
                className={`p-2 rounded-lg text-left transition border text-[11px] flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-md'
                    : isPast
                    ? 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    : 'bg-zinc-950/30 border-zinc-900 text-zinc-600 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] opacity-70">#{step.stepIndex}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
                </div>
                <div className="truncate font-sans font-semibold pt-1">
                  {step.stageName}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Split-Pane Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Event & Payload Inspector (6 Cols) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-wider block">
                Tahap Aktif #{activeStep.stepIndex} (+{activeStep.timestampOffsetSeconds}s)
              </span>
              <h3 className="text-sm font-bold text-zinc-100 font-sans mt-0.5">
                {activeStep.stageName}
              </h3>
            </div>

            <span className="text-[10px] font-mono bg-zinc-950 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
              {activeStep.eventType}
            </span>
          </div>

          {/* Explanation Banner */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs font-serif text-zinc-300 leading-relaxed">
            <span className="font-bold text-purple-300 font-sans block text-[11px] mb-0.5">Diagnostik Pipeline:</span>
            {activeStep.explanation}
          </div>

          {/* Event Payload Viewer / Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Event Payload Data
              </span>
              <button
                onClick={() => setIsEditingPayload(!isEditingPayload)}
                className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                {isEditingPayload ? 'Selesai Edit' : 'Edit Payload'}
              </button>
            </div>

            {isEditingPayload ? (
              <textarea
                rows={6}
                value={customPayloadJson}
                onChange={e => setCustomPayloadJson(e.target.value)}
                className="w-full p-3 bg-zinc-950 border border-purple-500 rounded-lg font-mono text-xs text-purple-200 focus:outline-none"
              />
            ) : (
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-48">
                {JSON.stringify(activeStep.payload, null, 2)}
              </pre>
            )}
          </div>

          {/* Synthetic User Badge */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="font-bold text-zinc-200">{activeJourney.syntheticUser.name}</span>
                <span className="text-[10px] text-zinc-500 block font-mono">{activeJourney.syntheticUser.id}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {activeJourney.syntheticUser.archetype}
            </span>
          </div>

        </div>

        {/* Right: State Inspector ("What did Paham know?") (6 Cols) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              State Inspector ("What Did Paham Know?")
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Snapshot OK</span>
          </div>

          {/* Student Mastery Telemetry Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <span className="text-[10px] text-zinc-500 block">Akurasi Latihan</span>
              <strong className="text-sm font-bold text-emerald-400">{activeStep.stateSnapshot.accuracy}%</strong>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <span className="text-[10px] text-zinc-500 block">Lonjakan Salah</span>
              <strong className="text-sm font-bold text-rose-400">{activeStep.stateSnapshot.mistakesCount}x</strong>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
              <span className="text-[10px] text-zinc-500 block">FSRS Overdue</span>
              <strong className="text-sm font-bold text-amber-400">{activeStep.stateSnapshot.overdueCards} kartu</strong>
            </div>
          </div>

          {/* Piko Companion Reaction Card */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-4">
            <div className="shrink-0 pt-1">
              <PahamMascot
                size="md"
                state={activeStep.stateSnapshot.pikoEmotion}
                interactive={false}
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Piko: {activeStep.stateSnapshot.pikoEmotion.toUpperCase()}
                </span>
              </div>
              <p className="font-serif text-xs text-zinc-200 italic leading-snug pt-1">
                "{activeStep.stateSnapshot.pikoSpeech}"
              </p>
            </div>
          </div>

          {/* Active Recommendation Rule Trigger */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400">Aturan Rekomendasi Terpicu:</span>
              <span className="font-mono text-[10px] text-purple-400 font-bold">
                {activeStep.stateSnapshot.activeRuleId || 'TIDAK ADA (NORMAL)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              {activeStep.stateSnapshot.activeRuleId
                ? 'Sinyal lonjakan kesalahan memenuhi ambang batas intervensi otomatis.'
                : 'Belum ada intervensi darurat yang dibutuhkan; siswa belajar mandiri.'}
            </p>
          </div>

          {/* Concept Mastery Snapshot */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 block">Penguasaan Konsep (Mastery State):</span>
            <div className="space-y-1.5">
              {Object.entries(activeStep.stateSnapshot.conceptMastery).length > 0 ? (
                Object.entries(activeStep.stateSnapshot.conceptMastery).map(([cid, score]) => (
                  <div key={cid} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>{cid}</span>
                      <span>{Math.round(score * 100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(score * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[10px] text-zinc-600 italic">Belum ada konsep yang diuji pada tahap ini.</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
