// Settings View for PAHAM
// School profile, Subject & Chapter Manager, Gemini API Manager, Local Database Backup, and Account Management

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Plus, 
  Trash2, 
  LogOut, 
  User,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { db, initializeDatabaseSeed } from '../core/db';
import { UserProfile, GradeLevel, Semester, Subject, Chapter } from '../core/types';
import { budgetGuard } from '../services/ai/budgetGuard';
import { GoogleGenAI } from '@google/genai';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onLogout: () => void;
  onReplayTutorial: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onLogout,
  onReplayTutorial,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [budgetUsage, setBudgetUsage] = useState<any>(null);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Subject & Chapter Management
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubCode, setNewSubCode] = useState<string>('');
  const [newSubDesc, setNewSubDesc] = useState<string>('');

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    async function loadSettings() {
      const existingKey = budgetGuard.getApiKey();
      if (existingKey) {
        setApiKeyInput(existingKey);
        setIsApiKeySaved(true);
      }

      setBudgetUsage(budgetGuard.getUsageState());

      const subs = await db.subjects.toArray();
      const chaps = await db.chapters.toArray();
      setSubjects(subs);
      setChapters(chaps);
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: UserProfile = {
      ...profile,
      name: profile.name.trim() || 'Siswa',
      displayName: (profile.displayName || profile.name).trim() || 'Siswa',
      schoolName: profile.schoolName.trim(),
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProfile(updated);
    setIsSaving(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleAddNewSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase() || newSubName.slice(0, 3).toUpperCase(),
      color: '#2D5A43',
      iconName: 'BookOpen',
      description: newSubDesc.trim() || 'Mata pelajaran',
    };

    await db.subjects.add(newSub);
    setSubjects(prev => [...prev, newSub]);

    setIsAddSubjectOpen(false);
    setNewSubName('');
    setNewSubCode('');
    setNewSubDesc('');
  };

  const handleDeleteSubject = async (subId: string) => {
    if (confirm('Yakin ingin menghapus mata pelajaran ini?')) {
      await db.subjects.delete(subId);
      setSubjects(prev => prev.filter(s => s.id !== subId));
    }
  };

  const handleSaveApiKey = () => {
    budgetGuard.setApiKey(apiKeyInput);
    setIsApiKeySaved(Boolean(apiKeyInput.trim()));
    setBudgetUsage(budgetGuard.getUsageState());
    setTestResult(null);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsTestingKey(true);
    setTestResult(null);

    try {
      const client = new GoogleGenAI({ apiKey: apiKeyInput.trim() });
      const interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: 'Katakan "OK" untuk tes koneksi.',
      });

      if (interaction.output_text) {
        setTestResult({
          success: true,
          message: 'Koneksi ke Gemini 3.6 Flash berhasil terverifikasi!',
        });
        budgetGuard.setApiKey(apiKeyInput);
        setIsApiKeySaved(true);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi gagal. Periksa kembali API Key kamu.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleResetSeedData = async () => {
    if (confirm('Muat ulang seluruh mata pelajaran dan contoh kurikulum? (Data akan direset ke default 17 mapel)')) {
      await db.delete();
      await db.open();
      await initializeDatabaseSeed();
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    const data = {
      profile: await db.profiles.toArray(),
      subjects: await db.subjects.toArray(),
      chapters: await db.chapters.toArray(),
      materials: await db.materials.toArray(),
      concepts: await db.concepts.toArray(),
      studentStates: await db.studentConceptStates.toArray(),
      questions: await db.questions.toArray(),
      exams: await db.exams.toArray(),
      mistakes: await db.mistakeRecords.toArray(),
      events: await db.learningEvents.toArray(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paham-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      <header className="border-b border-paper-300 pb-5">
        <h1 className="text-3xl font-serif text-ink-950 font-normal">
          Pengaturan
        </h1>
        <p className="text-sm text-ink-600 font-serif mt-0.5">
          Profil siswa, kurikulum ({subjects.length} mapel), konfigurasi AI, dan akun.
        </p>
      </header>

      {/* 1. Akun & Sesi Pengguna */}
      <div className="paper-sheet p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              Autentikasi & Sesi
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Akun PAHAM
            </h3>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary text-xs py-1.5 px-3 text-terracotta-800 border-terracotta-200 hover:bg-terracotta-50 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Akun
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-paper-100 rounded border border-paper-200 text-xs">
          <div className="w-10 h-10 rounded-full bg-moss-900 text-paper-50 flex items-center justify-center font-serif text-base font-semibold">
            {(profile.displayName || profile.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink-900 text-sm">{profile.displayName || profile.name}</p>
            <p className="text-ink-500 font-mono text-[11px]">{profile.email || 'Akun Belajar Terdaftar'}</p>
          </div>
        </div>
      </div>

      {/* 2. Profil Sekolah & Siswa */}
      <form onSubmit={handleSaveProfile} className="paper-sheet p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              Identitas Belajar
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Profil Sekolah & Personalisasi
            </h3>
          </div>
          {isSavedToast && (
            <span className="badge-moss text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-700 block mb-1">Nama Panggilan</label>
            <input
              type="text"
              required
              value={profile.displayName || profile.name}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value, name: e.target.value })}
              className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-700 block mb-1">Nama Sekolah</label>
            <input
              type="text"
              value={profile.schoolName}
              onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
              className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-700 block mb-1">Jenjang & Kelas</label>
            <select
              value={profile.grade}
              onChange={(e) => setProfile({ ...profile, grade: e.target.value as GradeLevel })}
              className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
            >
              <option value="Kelas 7">Kelas 7 (SMP)</option>
              <option value="Kelas 8">Kelas 8 (SMP)</option>
              <option value="Kelas 9">Kelas 9 (SMP)</option>
              <option value="Kelas 10">Kelas 10 (SMA/SMK)</option>
              <option value="Kelas 11">Kelas 11 (SMA/SMK)</option>
              <option value="Kelas 12">Kelas 12 (SMA/SMK)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-700 block mb-1">Semester</label>
            <select
              value={profile.semester}
              onChange={(e) => setProfile({ ...profile, semester: e.target.value as Semester })}
              className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
            >
              <option value="Semester 1">Semester 1 (Ganjil)</option>
              <option value="Semester 2">Semester 2 (Genap)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-700 block mb-1">
            Target Belajar Harian (Menit)
          </label>
          <input
            type="number"
            min={10}
            max={120}
            value={profile.dailyTimeTargetMinutes}
            onChange={(e) => setProfile({ ...profile, dailyTimeTargetMinutes: Number(e.target.value) })}
            className="w-full sm:w-32 bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700 font-mono"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="btn-primary text-xs py-2 px-4 shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>

      {/* 3. Manajemen Mata Pelajaran */}
      <div className="paper-sheet p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              Kurikulum Terdaftar
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Daftar Mata Pelajaran ({subjects.length})
            </h3>
          </div>
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Mapel
          </button>
        </div>

        {/* Add Subject Inline Modal */}
        {isAddSubjectOpen && (
          <form onSubmit={handleAddNewSubject} className="p-4 bg-paper-100 rounded border border-moss-300 space-y-3 text-xs">
            <h4 className="font-medium text-ink-900">Tambah Mata Pelajaran</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Nama Mapel (misal: Sosiologi)..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Kode Singkatan (misal: SOS)..."
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                className="bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs uppercase"
              />
            </div>
            <input
              type="text"
              placeholder="Deskripsi singkat materi..."
              value={newSubDesc}
              onChange={(e) => setNewSubDesc(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                className="btn-ghost text-xs py-1 px-3"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1 px-3"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Grid of Subjects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {subjects.map(s => {
            const chapCount = chapters.filter(c => c.subjectId === s.id).length;
            return (
              <div key={s.id} className="p-3 bg-paper-50 rounded border border-paper-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink-900">{s.name}</span>
                    <span className="text-[10px] font-mono text-ink-500">({s.code})</span>
                  </div>
                  <span className="text-[11px] text-ink-500 font-serif block mt-0.5">
                    {chapCount > 0 ? `${chapCount} Bab terdaftar` : 'Belum ada bab'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSubject(s.id)}
                  className="p-1 text-ink-400 hover:text-terracotta-700"
                  title="Hapus Mapel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Integrasi Google Gemini API & Budget Guard */}
      <div className="paper-sheet p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              AI Accelerator (Optional)
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Google Gemini 3.6 Flash
            </h3>
          </div>
          {isApiKeySaved ? (
            <span className="badge-moss text-xs">Aktif</span>
          ) : (
            <span className="badge-neutral text-xs">Mode Offline / Local</span>
          )}
        </div>

        <p className="text-xs text-ink-600 font-serif leading-relaxed">
          PAHAM berjalan 100% lokal dengan basis data IndexedDB dan mesin FSRS. Jika kamu menambahkan Google Gemini API Key, fitur pembaca tulisan tangan guru buram dan penjelasan mendalam akan semakin cerdas.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-700 block mb-1">Gemini API Key</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={!apiKeyInput.trim() || isTestingKey}
                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
              >
                {isTestingKey ? 'Menguji...' : 'Uji Koneksi'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-3 rounded border text-xs flex items-start gap-2 ${
              testResult.success 
                ? 'bg-moss-50 border-moss-200 text-moss-950' 
                : 'bg-terracotta-50 border-terracotta-200 text-terracotta-900'
            }`}>
              {testResult.success ? <CheckCircle className="w-4 h-4 text-moss-700 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-terracotta-700 shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Budget Guard Usage Monitor */}
          {budgetUsage && (
            <div className="p-3.5 bg-paper-100 rounded border border-paper-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-ink-700 font-mono text-[11px]">
                <span>Penggunaan Kuota Hari Ini</span>
                <span>{budgetUsage.callsToday} / {budgetUsage.dailyLimit} panggilan</span>
              </div>
              <div className="w-full h-1.5 bg-paper-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-moss-700 rounded-full"
                  style={{ width: `${Math.min(100, (budgetUsage.callsToday / budgetUsage.dailyLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-ink-400 block font-serif">
                Proteksi otomatis menjaga agar aplikasi tidak melampaui batas kuota gratis API.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Manajemen Database & Backup */}
      <div className="paper-sheet p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 font-semibold block">
              Penyimpanan Data
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Cadangan & Reset
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportData}
            className="btn-secondary text-xs py-2 px-3"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Data Saya (.JSON)
          </button>

          <button
            onClick={handleResetSeedData}
            className="btn-secondary text-xs py-2 px-3 text-terracotta-800 border-terracotta-200 hover:bg-terracotta-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang 17 Mapel Standar
          </button>
        </div>
      </div>

      {/* 6. Panduan & Tutorial Replay */}
      <div className="paper-sheet p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
              Panduan Cara Belajar
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-950">
              Tutorial & Prinsip PAHAM
            </h3>
          </div>
        </div>

        <p className="text-xs text-ink-600 font-serif leading-relaxed">
          Pelajari kembali bagaimana PAHAM menggunakan Retrieval Practice, penjadwalan memori FSRS, dan ekstraksi konsep dari catatan sekolahmu.
        </p>

        <button
          onClick={onReplayTutorial}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-moss-900 border-moss-300 hover:bg-moss-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Ulangi Tutorial PAHAM
        </button>
      </div>

    </div>
  );
};
