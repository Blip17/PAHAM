// Interactive First-Time Tutorial for PAHAM
// Guides the student through the complete learning philosophy and active retrieval workflow

import React, { useState } from 'react';
import { 
  Camera, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  HelpCircle, 
  Sparkles,
  X,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TutorialFlowProps {
  onComplete: () => void;
  onOpenScan: () => void;
}

export const TutorialFlow: React.FC<TutorialFlowProps> = ({
  onComplete,
  onOpenScan,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [quizInput, setQuizInput] = useState<string>('');
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);

  const handleFinish = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    onComplete();
  };

  const handleAddMaterial = () => {
    onComplete();
    onOpenScan();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-paper-50 w-full max-w-lg rounded-lg border border-paper-300 shadow-xl overflow-hidden flex flex-col">
        
        {/* Header with Step Counter */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200 text-xs font-mono text-ink-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-ink-950 text-sm">PAHAM</span>
            <span>· Panduan Sistem Belajar</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-moss-800">
              0{currentStep} / 07
            </span>
            <button
              onClick={onComplete}
              className="text-ink-400 hover:text-ink-800 transition p-1"
              title="Lewati Tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          
          {/* STEP 1: Brand Introduction */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Pengenalan
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                Ini PAHAM.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                PAHAM belajar dari materi sekolahmu sendiri — catatan gurumu, fotokopi tugas, dan modul kelasmu — bukan menggantikan guru atau bukumu.
              </p>
              <div className="p-4 bg-paper-100 rounded border border-paper-200 text-xs text-ink-600 font-serif italic">
                "Paham diciptakan agar kamu tahu pasti apa yang harus dipelajari hari ini dan kapan kamu benar-benar siap ujian."
              </div>
            </div>
          )}

          {/* STEP 2: Input Real Materials */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Langkah 1
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                Masukkan materi sekolahmu.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                Kamu bisa memasukkan materi dalam berbagai bentuk yang biasa kamu dapatkan di sekolah:
              </p>
              <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs">
                <div className="p-3 bg-paper-100 rounded border border-paper-200 space-y-1">
                  <Camera className="w-5 h-5 mx-auto text-moss-800" />
                  <span className="font-semibold text-ink-900 block">Foto Catatan</span>
                  <span className="text-[10px] text-ink-500">Buku tulis & papan</span>
                </div>
                <div className="p-3 bg-paper-100 rounded border border-paper-200 space-y-1">
                  <FileText className="w-5 h-5 mx-auto text-moss-800" />
                  <span className="font-semibold text-ink-900 block">Upload PDF</span>
                  <span className="text-[10px] text-ink-500">Modul digital</span>
                </div>
                <div className="p-3 bg-paper-100 rounded border border-paper-200 space-y-1">
                  <BookOpen className="w-5 h-5 mx-auto text-moss-800" />
                  <span className="font-semibold text-ink-900 block">Teks / LKS</span>
                  <span className="text-[10px] text-ink-500">Lembar tugas</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Knowledge Organization */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Langkah 2
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                PAHAM menemukan konsep.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                Catatanmu tetap menjadi sumber utama. PAHAM membaca tulisan tanganmu dan merangkainya menjadi unit-unit konsep belajar.
              </p>
              <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-ink-600">
                  <span>Foto Catatan Guru</span>
                  <span>→</span>
                  <span>Teks Tersaring</span>
                  <span>→</span>
                  <span className="font-semibold text-moss-900">Peta Konsep</span>
                </div>
                <p className="text-[11px] font-serif text-ink-500 pt-2 border-t border-paper-300">
                  Setiap konsep memiliki definisi, contoh soal, dan catatan salah sangka (misconception) agar kamu tidak terkecoh.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Active Retrieval Practice */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Langkah 3 · Prinsip Utama
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                Jangan cuma membaca ulang.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                Coba uji ingatanmu sekarang tanpa melihat catatan:
              </p>

              <div className="p-4 bg-paper-100 rounded border border-moss-300 space-y-2 text-xs">
                <p className="font-serif text-sm font-semibold text-ink-900">
                  "Apa organ pada tumbuhan yang berfungsi fotosintesis?"
                </p>
                {!quizAnswered ? (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Tulis jawabanmu di sini..."
                      value={quizInput}
                      onChange={(e) => setQuizInput(e.target.value)}
                      className="flex-1 bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs text-ink-900"
                    />
                    <button
                      onClick={() => setQuizAnswered(true)}
                      disabled={!quizInput.trim()}
                      className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                    >
                      Cek
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-moss-50 rounded border border-moss-200 text-xs space-y-1">
                    <span className="font-semibold text-moss-900 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Jawaban: Daun (Kloroplas)
                    </span>
                    <p className="font-serif text-ink-700 text-[11px]">
                      Ini disebut <strong>Retrieval Practice</strong>. Mencoba mengingat sebelum melihat jawaban menguatkan jalur saraf di otakmu 3x lebih cepat daripada membaca ulang.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Spaced Repetition (FSRS) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Langkah 4 · Jadwal Memori
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                PAHAM menentukan kapan kamu harus kembali.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                Kamu tidak perlu mengulang semua bab setiap hari. Algoritma FSRS memunculkan materi tepat saat memori mulai terlupakan:
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
                <div className="p-2.5 bg-moss-100 rounded border border-moss-300">
                  <span className="font-bold text-moss-900 block">Hari 1</span>
                  <span className="text-[10px] text-moss-700">Paham Dasar</span>
                </div>
                <div className="p-2.5 bg-paper-100 rounded border border-paper-200">
                  <span className="font-semibold text-ink-900 block">Besok</span>
                  <span className="text-[10px] text-ink-500">Ulangi 5m</span>
                </div>
                <div className="p-2.5 bg-paper-100 rounded border border-paper-200">
                  <span className="font-semibold text-ink-900 block">3 Hari</span>
                  <span className="text-[10px] text-ink-500">Penguatan</span>
                </div>
                <div className="p-2.5 bg-paper-100 rounded border border-paper-200">
                  <span className="font-semibold text-ink-900 block">1 Minggu</span>
                  <span className="text-[10px] text-ink-500">Stabil Ujian</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Habit Formation */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                Langkah 5 · Kebiasaan Harian
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                Membangun kebiasaan belajarmu.
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed">
                Setiap hari kamu cukup membuka Beranda PAHAM dan menyelesaikan target terukur:
              </p>
              <div className="p-4 bg-paper-100 rounded border border-paper-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-ink-800 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-moss-800" /> Target Hari Ini: 15 Menit
                  </span>
                  <span className="badge-moss text-[10px]">Cukup & Terukur</span>
                </div>
                <ul className="text-ink-600 space-y-1 text-[11px] font-serif pt-1 border-t border-paper-200">
                  <li>• 2 konsep review singkat</li>
                  <li>• 4 soal latihan aktif</li>
                  <li>• 1 pembahasan kekeliruan kemarin</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 7: Ready CTA */}
          {currentStep === 7 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-moss-100 border border-moss-300 text-moss-900 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-moss-800" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-ink-950 font-medium leading-tight">
                Siap Memulai?
              </h2>
              <p className="text-sm text-ink-700 font-serif leading-relaxed max-w-sm mx-auto">
                Mulai dari satu catatan yang paling ingin kamu kuasai untuk ulangan minggu ini.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleAddMaterial}
                  className="w-full btn-primary text-xs py-3 justify-center shadow-subtle flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Foto / Upload Catatan Pertama
                </button>
                <button
                  onClick={handleFinish}
                  className="w-full btn-secondary text-xs py-2.5 justify-center"
                >
                  Buka Beranda Belajar Dulu
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 bg-paper-100 border-t border-paper-200 flex items-center justify-between text-xs">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {currentStep < 7 && (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
