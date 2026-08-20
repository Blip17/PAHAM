// PAHAM Introduction & Product Entry View
// Editorial typography, academic restraint, and interactive product workflow demonstration

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Layers, 
  Sparkles,
  ChevronRight,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface EntryViewProps {
  onStartAuth: (mode: 'login' | 'register') => void;
}

export const EntryView: React.FC<EntryViewProps> = ({ onStartAuth }) => {
  // Interactive Product Demo State
  const [demoStep, setDemoStep] = useState<number>(1);
  const [demoUserAnswer, setDemoUserAnswer] = useState<string>('');
  const [demoAnswerSubmitted, setDemoAnswerSubmitted] = useState<boolean>(false);
  const [demoSelectedOption, setDemoSelectedOption] = useState<string | null>(null);

  // Auto demo stepper timer
  useEffect(() => {
    if (demoStep === 2) {
      const timer = setTimeout(() => setDemoStep(3), 1600);
      return () => clearTimeout(timer);
    }
  }, [demoStep]);

  return (
    <div className="min-h-screen bg-paper-100 text-ink-950 selection:bg-moss-100 selection:text-moss-950 font-sans">
      
      {/* ── Top Navigation ──────────────────────────────────── */}
      <header className="border-b border-paper-300 bg-paper-50/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink-950">
              Paham
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-widest text-ink-500 bg-paper-200 px-2 py-0.5 rounded border border-paper-300">
              Sistem Belajar Pribadi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartAuth('login')}
              className="text-xs font-medium text-ink-700 hover:text-ink-950 px-3 py-2 transition"
            >
              Masuk
            </button>
            <button
              onClick={() => onStartAuth('register')}
              className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5"
            >
              <span>Mulai Belajar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 border-b border-paper-300">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Kurikulum Sekolah & Catatan Kamu
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-ink-950 font-normal tracking-tight leading-[1.1]">
              Belajar dari materi kamu.
              <br />
              <span className="italic text-ink-600">Bukan materi yang random.</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-700 font-serif leading-relaxed max-w-xl">
              Foto catatanmu, masukkan fotokopi atau PDF dari sekolah, dan PAHAM bantu kamu tahu apa yang harus dipelajari, kapan harus mengulang, dan kapan kamu benar-benar siap menghadapi ujian.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onStartAuth('register')}
                className="btn-primary text-sm py-3.5 px-7 justify-center shadow-subtle text-center"
              >
                Mulai Belajar Sekarang
              </button>
              <a
                href="#cara-kerja"
                className="btn-secondary text-sm py-3.5 px-6 justify-center text-center text-ink-700 hover:bg-paper-200"
              >
                Lihat Cara Kerjanya
              </a>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-ink-500 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-moss-700" />
                Catatan Guru
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-moss-700" />
                Active Retrieval
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-moss-700" />
                Jadwal FSRS
              </span>
            </div>
          </div>

          {/* Right Hero Product Workflow Demonstration */}
          <div className="lg:col-span-6">
            <div className="paper-sheet p-6 sm:p-7 border-2 border-paper-300 shadow-md relative overflow-hidden">
              
              {/* Demo Window Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-paper-200 text-xs text-ink-500 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-paper-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-paper-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-paper-400" />
                  <span className="ml-2 font-serif text-ink-900 font-medium">Simulasi Alur Belajar PAHAM</span>
                </div>
                <span className="bg-paper-200 px-2 py-0.5 rounded text-[10px]">
                  Langkah {demoStep} / 6
                </span>
              </div>

              {/* Step 1: Note Enters */}
              {demoStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-moss-800 font-semibold uppercase">
                    <Camera className="w-4 h-4" /> 01 · Catatan Sekolah Masuk
                  </div>
                  <div className="p-4 bg-paper-50 rounded border border-paper-300 space-y-2">
                    <span className="text-xs font-mono text-ink-500 block">Foto Catatan Guru — Biologi Bab 3</span>
                    <p className="font-serif italic text-ink-900 text-sm leading-relaxed border-l-2 border-moss-700 pl-3">
                      "Fotosintesis terjadi di kloroplas. Reaksi terang terjadi di membran tilakoid membutuhkan cahaya matahari dan air, menghasilkan ATP, NADPH, dan melepaskan Oksigen..."
                    </p>
                  </div>
                  <button
                    onClick={() => setDemoStep(2)}
                    className="w-full btn-primary text-xs py-2.5 justify-center"
                  >
                    Proses Materi & Ekstraksi Konsep →
                  </button>
                </div>
              )}

              {/* Step 2: Processing */}
              {demoStep === 2 && (
                <div className="py-8 space-y-4 text-center">
                  <div className="w-10 h-10 border-2 border-moss-800 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h4 className="font-serif text-ink-900 font-medium text-base">Menemukan konsep dari catatan...</h4>
                    <p className="text-xs text-ink-500 font-serif mt-1">Membaca tulisan tangan, memetakan definisi, dan merangkai peta belajar.</p>
                  </div>
                </div>
              )}

              {/* Step 3: Concepts Extracted */}
              {demoStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-moss-800 font-semibold uppercase">
                    <span>02 · Peta Konsep Terbentuk</span>
                    <span className="text-[10px] text-ink-500">3 Konsep Ditemukan</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-paper-50 rounded border border-moss-300 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-900">1. Reaksi Terang (Tilakoid)</span>
                      <span className="badge-moss text-[10px]">Perlu Dipelajari</span>
                    </div>
                    <div className="p-2.5 bg-paper-50 rounded border border-paper-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-900">2. Siklus Calvin / Gelap (Stroma)</span>
                      <span className="badge-neutral text-[10px]">Terjadwal</span>
                    </div>
                    <div className="p-2.5 bg-paper-50 rounded border border-paper-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-900">3. Klorofil & Fotolisis Air</span>
                      <span className="badge-neutral text-[10px]">Terjadwal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDemoStep(4)}
                    className="w-full btn-primary text-xs py-2.5 justify-center"
                  >
                    Mulai Uji Ingatan (Retrieval Practice) →
                  </button>
                </div>
              )}

              {/* Step 4: Active Retrieval Question */}
              {demoStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-moss-800 font-semibold uppercase">
                    <HelpCircle className="w-4 h-4" /> 03 · Uji Ingatan Tanpa Melihat Catatan
                  </div>
                  <div className="p-3.5 bg-paper-50 rounded border border-paper-300 space-y-2 text-xs">
                    <p className="font-serif text-sm text-ink-900 font-medium">
                      Di bagian kloroplas manakah reaksi terang fotosintesis berlangsung?
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => setDemoSelectedOption('stroma')}
                        className={`w-full p-2 text-left rounded border text-xs transition ${
                          demoSelectedOption === 'stroma' ? 'bg-terracotta-100 border-terracotta-400' : 'bg-paper-100 border-paper-300'
                        }`}
                      >
                        A. Stroma
                      </button>
                      <button
                        onClick={() => setDemoSelectedOption('tilakoid')}
                        className={`w-full p-2 text-left rounded border text-xs transition ${
                          demoSelectedOption === 'tilakoid' ? 'bg-moss-100 border-moss-400' : 'bg-paper-100 border-paper-300'
                        }`}
                      >
                        B. Membran Tilakoid
                      </button>
                    </div>
                  </div>
                  <button
                    disabled={!demoSelectedOption}
                    onClick={() => setDemoStep(5)}
                    className="w-full btn-primary text-xs py-2.5 justify-center disabled:opacity-50"
                  >
                    Konfirmasi Jawaban →
                  </button>
                </div>
              )}

              {/* Step 5: Stepwise Feedback */}
              {demoStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-moss-800 font-semibold uppercase">
                    <span>04 · Umpan Balik Bertahap</span>
                  </div>
                  <div className="p-4 bg-paper-50 rounded border border-moss-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-moss-900">
                      <CheckCircle2 className="w-4 h-4 text-moss-700" />
                      Jawaban Tepat: Membran Tilakoid
                    </div>
                    <p className="font-serif text-ink-700 leading-relaxed">
                      Reaksi terang membutuhkan klorofil yang tertanam di membran tilakoid untuk menangkap foton cahaya. Stroma adalah tempat reaksi gelap (Siklus Calvin).
                    </p>
                  </div>
                  <button
                    onClick={() => setDemoStep(6)}
                    className="w-full btn-primary text-xs py-2.5 justify-center"
                  >
                    Lihat Jadwal Review Ingatan (FSRS) →
                  </button>
                </div>
              )}

              {/* Step 6: Spaced Review Card */}
              {demoStep === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-moss-800 font-semibold uppercase">
                    <Clock className="w-4 h-4" /> 05 · Jadwal Memori FSRS Ditetapkan
                  </div>
                  <div className="p-4 bg-moss-50 rounded border border-moss-300 space-y-2 text-center">
                    <span className="text-[11px] font-mono uppercase text-moss-800 font-semibold block">
                      Stabilitas Memori Meningkat
                    </span>
                    <p className="font-serif text-lg font-medium text-ink-950">
                      Ulangi Besok (1 Hari)
                    </p>
                    <p className="text-xs text-ink-600 font-serif">
                      PAHAM akan memasukkan konsep ini ke agenda belajar esok hari sebelum memori memudar.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDemoStep(1);
                        setDemoSelectedOption(null);
                      }}
                      className="btn-secondary text-xs py-2 px-3 flex-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Ulangi Demo
                    </button>
                    <button
                      onClick={() => onStartAuth('register')}
                      className="btn-primary text-xs py-2 px-4 flex-1 shadow-subtle"
                    >
                      Mulai Akun Saya →
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 01: REAL SCHOOL MATERIALS ────────────────── */}
      <section id="cara-kerja" className="py-20 px-6 border-b border-paper-300 max-w-6xl mx-auto">
        <div className="space-y-4 max-w-2xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-moss-800 font-semibold block">
            Bagian 01 · Sumber Materi Nyata
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-ink-950 font-normal">
            Masukkan materi yang benar-benar kamu pakai di sekolah.
          </h2>
          <p className="text-sm sm:text-base text-ink-600 font-serif leading-relaxed">
            Tidak ada silabus generik atau materi asing. PAHAM langsung menyerap apa yang ditulis gurumu di papan tulis, modul fotokopi kelas, atau buku paket sekolahmu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="paper-sheet p-5 space-y-3">
            <div className="w-9 h-9 rounded bg-moss-50 border border-moss-200 flex items-center justify-center text-moss-900">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-medium text-ink-900 text-base">Tulisan Tangan Guru</h3>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              Foto papan tulis atau buku catatan tulisan tanganmu saat pelajaran berlangsung di kelas.
            </p>
          </div>

          <div className="paper-sheet p-5 space-y-3">
            <div className="w-9 h-9 rounded bg-moss-50 border border-moss-200 flex items-center justify-center text-moss-900">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-medium text-ink-900 text-base">Lembar Fotokopi & LKS</h3>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              Scan lembar tugas fotokopian, modul ringkas guru, dan latihan soal mingguan.
            </p>
          </div>

          <div className="paper-sheet p-5 space-y-3">
            <div className="w-9 h-9 rounded bg-moss-50 border border-moss-200 flex items-center justify-center text-moss-900">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-medium text-ink-900 text-base">Buku Paket Kurikulum</h3>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              Bab dari buku cetak Kurikulum Merdeka atau K13 yang menjadi acuan resmi ujian.
            </p>
          </div>

          <div className="paper-sheet p-5 space-y-3">
            <div className="w-9 h-9 rounded bg-moss-50 border border-moss-200 flex items-center justify-center text-moss-900">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-medium text-ink-900 text-base">Catatan Digital & PDF</h3>
            <p className="text-xs text-ink-600 font-serif leading-relaxed">
              Unggah file materi PDF yang dibagikan guru lewat Google Classroom atau WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 02: KNOWLEDGE MAP ────────────────────────── */}
      <section className="py-20 px-6 border-b border-paper-300 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-moss-800 font-semibold block">
              Bagian 02 · Struktur Pengetahuan
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-ink-950 font-normal">
              PAHAM mengubah tumpukan catatan menjadi peta belajar terstruktur.
            </h2>
            <p className="text-sm sm:text-base text-ink-600 font-serif leading-relaxed">
              Setiap catatan dipecah menjadi unit konsep yang jelas, dilengkapi hubungan sebab-akibat dan tingkat kesulitan nyata.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="paper-sheet p-6 space-y-3 font-mono text-xs">
              <div className="p-3 bg-paper-50 rounded border border-paper-300 flex items-center justify-between">
                <span className="text-moss-900 font-semibold">Mata Pelajaran: Matematika</span>
                <span className="text-[10px] text-ink-500">Kelas 10 SMA</span>
              </div>
              <div className="pl-4 border-l-2 border-moss-800 space-y-2 font-sans">
                <div className="p-3 bg-paper-100 rounded border border-paper-200">
                  <span className="font-serif text-sm font-semibold text-ink-900 block">Bab 3: Sistem Persamaan Linear Tiga Variabel</span>
                  <span className="text-[11px] text-ink-500 font-mono">Relevansi Ulangan: TINGGI</span>
                </div>
                <div className="pl-4 border-l-2 border-moss-400 space-y-2 text-xs font-sans">
                  <div className="p-2.5 bg-paper-50 rounded border border-moss-300 flex items-center justify-between">
                    <span>• Metode Eliminasi Gauss</span>
                    <span className="badge-moss text-[10px]">Dikuasai</span>
                  </div>
                  <div className="p-2.5 bg-paper-50 rounded border border-terracotta-300 flex items-center justify-between">
                    <span>• Pemodelan Soal Cerita Campuran</span>
                    <span className="badge-terracotta text-[10px]">Perlu Latihan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 03: COGNITIVE SCIENCE METHODS ─────────────── */}
      <section className="py-20 px-6 border-b border-paper-300 max-w-6xl mx-auto">
        <div className="space-y-4 max-w-2xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-moss-800 font-semibold block">
            Bagian 03 · Metode Belajar Terbukti
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-ink-950 font-normal">
            Belajar bukan cuma membaca ulang.
          </h2>
          <p className="text-sm sm:text-base text-ink-600 font-serif leading-relaxed">
            Membaca ulang catatan berulang kali memberi ilusi paham semu. PAHAM menggunakan strategi belajar berbasis bukti kognitif (evidence-based learning) yang benar-benar membangun daya ingat jangka panjang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="paper-sheet p-6 space-y-3">
            <span className="text-xs font-mono uppercase text-moss-800 font-semibold block">
              01 · Retrieval Practice
            </span>
            <h3 className="font-serif font-medium text-ink-900 text-lg">Mengambil dari Ingatan</h3>
            <p className="text-xs text-ink-700 font-serif leading-relaxed">
              Sebelum membaca kunci jawaban, kamu diminta mencoba mengingat dan menjawab terlebih dahulu. Upaya mengingat inilah yang memperkuat sambungan saraf di otak.
            </p>
          </div>

          <div className="paper-sheet p-6 space-y-3">
            <span className="text-xs font-mono uppercase text-moss-800 font-semibold block">
              02 · Spaced Repetition (FSRS)
            </span>
            <h3 className="font-serif font-medium text-ink-900 text-lg">Pengulangan Terjadwal</h3>
            <p className="text-xs text-ink-700 font-serif leading-relaxed">
              Kamu tidak perlu mengulang semua bab setiap hari. PAHAM menghitung kurva lupa dan hanya memunculkan konsep saat memori mulai memudar.
            </p>
          </div>

          <div className="paper-sheet p-6 space-y-3">
            <span className="text-xs font-mono uppercase text-moss-800 font-semibold block">
              03 · Interleaved Practice
            </span>
            <h3 className="font-serif font-medium text-ink-900 text-lg">Latihan Campuran</h3>
            <p className="text-xs text-ink-700 font-serif leading-relaxed">
              Alih-alih mengerjakan 10 soal dengan rumus yang sama, PAHAM mencampur variasi soal sehingga kamu terlatih memilih strategi yang tepat saat ujian.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ──────────────────────────────────── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif text-ink-950 font-normal">
          Mulai atur cara belajarmu hari ini.
        </h2>
        <p className="text-base text-ink-600 font-serif max-w-lg mx-auto">
          Gratis, berjalan di browsermu, dan langsung terhubung dengan kurikulum sekolahmu.
        </p>
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onStartAuth('register')}
            className="btn-primary text-sm py-3.5 px-8 shadow-subtle"
          >
            Buat Akun Siswa Gratis
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-paper-300 py-8 px-6 bg-paper-50 text-xs text-ink-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-ink-900 font-semibold text-sm">Paham</span>
            <span>· Sistem Belajar Mandiri Pelajar Indonesia</span>
          </div>
          <span>Kurikulum Merdeka & K13 · Berbasis Sains Kognitif</span>
        </div>
      </footer>

    </div>
  );
};
