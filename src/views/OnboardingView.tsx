// Onboarding & Initial Profile Setup for PAHAM
// Mandatory first-time user profile setup: Name, School, Grade Level, Subjects, and Study Target

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  School, 
  User, 
  Clock, 
  GraduationCap,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { db, DEFAULT_INDONESIAN_SUBJECTS } from '../core/db';
import { UserProfile, GradeLevel, Semester, Subject } from '../core/types';

interface OnboardingViewProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1: Identity & School
  const [name, setName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [grade, setGrade] = useState<GradeLevel>('Kelas 10');
  const [semester, setSemester] = useState<Semester>('Semester 1');
  const [dailyTimeTarget, setDailyTimeTarget] = useState<number>(25);

  // Step 2: Subject Selection
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(DEFAULT_INDONESIAN_SUBJECTS);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(DEFAULT_INDONESIAN_SUBJECTS.map(s => s.id))
  );

  useEffect(() => {
    async function loadSubjects() {
      const subs = await db.subjects.toArray();
      if (subs.length > 0) {
        setAvailableSubjects(subs);
        setSelectedSubjectIds(new Set(subs.map(s => s.id)));
      } else {
        await db.subjects.bulkAdd(DEFAULT_INDONESIAN_SUBJECTS);
        setAvailableSubjects(DEFAULT_INDONESIAN_SUBJECTS);
        setSelectedSubjectIds(new Set(DEFAULT_INDONESIAN_SUBJECTS.map(s => s.id)));
      }
    }
    loadSubjects();
  }, []);

  const toggleSubject = (subId: string) => {
    setSelectedSubjectIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) {
        if (next.size > 1) next.delete(subId); // keep at least 1
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedSubjectIds(new Set(availableSubjects.map(s => s.id)));
    } else {
      setSelectedSubjectIds(new Set([availableSubjects[0].id]));
    }
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: UserProfile = {
      id: 'user-profile',
      name: name.trim(),
      grade,
      semester,
      schoolName: schoolName.trim() || 'Sekolah Menengah',
      dailyTimeTargetMinutes: dailyTimeTarget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save profile to database
    await db.profiles.put(newProfile);

    // Delete unselected subjects to keep their catalog clean
    const allSubs = await db.subjects.toArray();
    for (const sub of allSubs) {
      if (!selectedSubjectIds.has(sub.id)) {
        await db.subjects.delete(sub.id);
      }
    }

    onComplete(newProfile);
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center p-4 selection:bg-moss-100 selection:text-moss-950">
      <div className="max-w-xl w-full paper-sheet p-6 sm:p-8 space-y-6 shadow-modal border border-paper-300">
        
        {/* Brandmark */}
        <div className="flex items-center justify-between border-b border-paper-300 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink-950">
              PAHAM
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-moss-800 bg-moss-100 border border-moss-200 px-1.5 py-0.5 rounded font-semibold">
              Persiapan Akun
            </span>
          </div>
          <span className="text-xs font-mono text-ink-500">
            Langkah {step} dari 2
          </span>
        </div>

        {/* STEP 1: SISWA & SEKOLAH */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStep(2);
            }}
            className="space-y-5"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-ink-950 font-normal">
                Selamat Datang di Paham.
              </h1>
              <p className="text-xs sm:text-sm text-ink-600 font-serif mt-1">
                Bukan cuma belajar. Beneran paham. Masukkan profil belajarmu untuk memulai.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-800 uppercase tracking-wider block mb-1">
                  Nama Lengkap / Nama Panggilan *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Misal: Satria Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-3 py-2 text-sm text-ink-950 placeholder:text-ink-400 focus:border-moss-700 focus:bg-paper-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-800 uppercase tracking-wider block mb-1">
                  Nama Sekolah
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Misal: SMA Negeri 1 / SMP Negeri 2"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-3 py-2 text-sm text-ink-950 placeholder:text-ink-400 focus:border-moss-700 focus:bg-paper-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-800 uppercase tracking-wider block mb-1">
                    Jenjang & Kelas
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as GradeLevel)}
                      className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-3 py-2 text-xs text-ink-950 focus:border-moss-700 font-medium"
                    >
                      <optgroup label="Sekolah Menengah Pertama (SMP)">
                        <option value="Kelas 7">Kelas 7 (SMP)</option>
                        <option value="Kelas 8">Kelas 8 (SMP)</option>
                        <option value="Kelas 9">Kelas 9 (SMP)</option>
                      </optgroup>
                      <optgroup label="Sekolah Menengah Atas (SMA/SMK)">
                        <option value="Kelas 10">Kelas 10 (SMA/SMK)</option>
                        <option value="Kelas 11">Kelas 11 (SMA/SMK)</option>
                        <option value="Kelas 12">Kelas 12 (SMA/SMK)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-800 uppercase tracking-wider block mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as Semester)}
                    className="w-full bg-paper-50 border border-paper-300 rounded px-3 py-2 text-xs text-ink-950 focus:border-moss-700 font-medium"
                  >
                    <option value="Semester 1">Semester 1 (Ganjil)</option>
                    <option value="Semester 2">Semester 2 (Genap)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-800 uppercase tracking-wider block mb-1">
                  Target Waktu Belajar Mandiri Harian
                </label>
                <div className="flex items-center gap-2">
                  {[15, 25, 40, 60].map(mins => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setDailyTimeTarget(mins)}
                      className={`flex-1 py-1.5 rounded border text-xs font-mono font-medium transition ${
                        dailyTimeTarget === mins
                          ? 'bg-moss-900 text-paper-50 border-moss-950 font-bold'
                          : 'bg-paper-50 text-ink-700 border-paper-300 hover:bg-paper-200'
                      }`}
                    >
                      {mins} Menit
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-paper-200 flex justify-end">
              <button
                type="submit"
                disabled={!name.trim()}
                className="btn-primary text-xs py-2.5 px-6 shadow-subtle text-sm disabled:opacity-50"
              >
                Lanjutkan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PILIH MATA PELAJARAN */}
        {step === 2 && (
          <form onSubmit={handleFinishOnboarding} className="space-y-5">
            <div>
              <h2 className="text-2xl font-serif text-ink-950 font-medium">
                Pilih Mata Pelajaranmu
              </h2>
              <p className="text-xs text-ink-600 font-serif mt-0.5">
                Centang mata pelajaran yang sedang kamu pelajari di sekolah ({selectedSubjectIds.size} dipilih).
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pb-1 border-b border-paper-200">
              <span className="text-ink-500 font-mono text-[11px]">
                {availableSubjects.length} Mata Pelajaran Standar
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-moss-800 font-medium hover:underline text-[11px]"
                >
                  Pilih Semua
                </button>
                <span className="text-ink-300">·</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-ink-500 hover:underline text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Grid of Subject Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {availableSubjects.map(sub => {
                const isSelected = selectedSubjectIds.has(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`p-2.5 rounded border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-moss-50 border-moss-700 text-ink-950 font-medium'
                        : 'bg-paper-50 border-paper-200 text-ink-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper-200 text-ink-800">
                        {sub.code}
                      </span>
                      <span className="truncate">{sub.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-moss-700 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost text-xs py-2 px-3 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>

              <button
                type="submit"
                className="btn-primary text-xs py-2.5 px-6 shadow-subtle text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Mulai Belajar di PAHAM
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
