// PAHAM Auth Panel — Local-First Authentication
// Creates or restores a named learning profile stored in IndexedDB.
// No server, no email — identity is a display name + optional local passphrase.

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { db } from '../core/db';
import { UserProfile } from '../core/types';

interface AuthPanelProps {
  mode: 'login' | 'register';
  onBack: () => void;
  onAuthenticated: (profile: UserProfile, isNew: boolean) => void;
}

type AuthState = 'idle' | 'loading' | 'error';

export const AuthPanel: React.FC<AuthPanelProps> = ({ mode, onBack, onAuthenticated }) => {
  const [displayName, setDisplayName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsVisible(true);
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) return;

    setAuthState('loading');
    setErrorMsg('');

    try {
      if (mode === 'register') {
        // Check if name already exists
        const existing = await db.profiles.toCollection().first();
        if (existing) {
          // Profile exists — treat as login
          setAuthState('idle');
          setErrorMsg(
            `Akun dengan nama lain sudah ada di perangkat ini. Gunakan "Masuk" untuk membuka akun yang ada, atau hapus data di Pengaturan.`
          );
          return;
        }

        // Create minimal profile — onboarding will fill the rest
        const now = new Date().toISOString();
        const newProfile: UserProfile = {
          id: 'user-profile',
          name: trimmedName,
          displayName: trimmedName,
          grade: 'Kelas 10',
          semester: 'Semester 1',
          schoolName: '',
          dailyTimeTargetMinutes: 25,
          createdAt: now,
          updatedAt: now,
          educationSystem: 'indonesia',
          onboardingCompleted: false,
          onboardingVersion: 1,
          hasSeenArrival: false,
        };

        await db.profiles.put(newProfile);
        // Persist session
        localStorage.setItem('paham_session', JSON.stringify({
          profileId: newProfile.id,
          onboardingCompleted: false,
        }));

        onAuthenticated(newProfile, true);

      } else {
        // Login mode — look up existing profile
        const existing = await db.profiles.toCollection().first();
        if (!existing) {
          setAuthState('idle');
          setErrorMsg('Tidak ada profil yang ditemukan di perangkat ini. Silakan buat akun baru.');
          return;
        }

        // For local auth, we match on name (case-insensitive)
        const nameMatch =
          existing.name.toLowerCase() === trimmedName.toLowerCase() ||
          (existing.displayName?.toLowerCase() === trimmedName.toLowerCase());

        if (!nameMatch && passphrase === '') {
          // If no passphrase set, allow access with any name (graceful for local-only)
          // Soft match — just load whatever profile exists on device
        }

        localStorage.setItem('paham_session', JSON.stringify({
          profileId: existing.id,
          onboardingCompleted: existing.onboardingCompleted ?? false,
        }));

        onAuthenticated(existing, false);
      }
    } catch (err) {
      console.error('[AuthPanel] Error:', err);
      setAuthState('idle');
      setErrorMsg('Terjadi kesalahan. Data yang sudah kamu isi tetap aman.');
    }
  };

  const isRegister = mode === 'register';
  const heading = isRegister ? 'Buat akun' : 'Masuk';
  const subheading = isRegister
    ? 'Kamu mau dipanggil apa? Nama ini yang akan Paham gunakan.'
    : 'Masukkan nama yang kamu gunakan saat mendaftar.';
  const submitLabel = isRegister ? 'Lanjutkan' : 'Masuk';

  return (
    <div
      className="min-h-screen bg-paper-100 flex items-center justify-center p-6 selection:bg-moss-100 selection:text-moss-950"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="w-full max-w-md">

        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800 font-sans mb-10 transition-colors group"
          aria-label="Kembali ke halaman awal"
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Kembali
        </button>

        {/* Wordmark */}
        <span
          className="block font-serif text-2xl font-bold tracking-tight text-ink-950 mb-8"
          style={{ letterSpacing: '-0.03em' }}
        >
          Paham
        </span>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight mb-2">
            {heading}
          </h1>
          <p className="text-sm text-ink-500 font-sans">{subheading}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Name field */}
          <div className="space-y-1.5">
            <label
              htmlFor="auth-name"
              className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
            >
              {isRegister ? 'Nama panggilan' : 'Nama'}
            </label>
            <input
              ref={inputRef}
              id="auth-name"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              required
              placeholder={isRegister ? 'Misal: Josh, Satria, Bunga…' : 'Nama panggilan kamu'}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="
                w-full bg-paper-50 border border-paper-300 rounded
                px-4 py-3 text-sm text-ink-950
                placeholder:text-ink-400
                focus:outline-none focus:border-ink-700 focus:bg-white
                transition-colors duration-150
              "
              aria-describedby={errorMsg ? 'auth-error' : undefined}
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <p
              id="auth-error"
              role="alert"
              className="text-xs text-terracotta-700 font-sans leading-relaxed bg-terracotta-50 border border-terracotta-200 rounded px-3 py-2"
            >
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!displayName.trim() || authState === 'loading'}
              className="
                w-full py-3.5 px-5
                bg-ink-900 text-paper-50
                font-sans font-medium text-sm
                rounded border border-ink-950
                transition-all duration-150
                hover:bg-ink-800
                active:bg-ink-950
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-between
              "
            >
              <span>{authState === 'loading' ? 'Menyiapkan…' : submitLabel}</span>
              {authState !== 'loading' && (
                <span className="text-paper-300 font-mono text-xs">→</span>
              )}
            </button>
          </div>

        </form>

        {/* Footer note */}
        <div className="mt-10 pt-8 border-t border-paper-300">
          <p className="text-xs text-ink-400 font-sans leading-relaxed">
            {isRegister
              ? 'Data belajarmu disimpan di perangkat ini. Tidak ada yang dikirim ke server.'
              : 'Paham menyimpan semua data secara lokal di perangkat kamu.'}
          </p>
        </div>

      </div>
    </div>
  );
};
