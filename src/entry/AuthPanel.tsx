// PAHAM Auth Panel — Supabase Authentication Interface
// Web form standards: semantic <form>, associated <label>, autocomplete attributes,
// accessible show/hide password controls, inline error handling, and loading states.

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../core/types';

interface AuthPanelProps {
  initialMode: 'login' | 'register';
  onBack: () => void;
  onAuthenticated: (profile: UserProfile, isNew: boolean) => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ initialMode, onBack, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsVisible(true);
      firstInputRef.current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Nama panggilan wajib diisi.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Format email belum benar.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok.');
        return;
      }

      setIsLoading(true);
      const res = await authService.signUp(name, email, password, confirmPassword);
      setIsLoading(false);

      if (res.success && res.profile) {
        onAuthenticated(res.profile, true);
      } else {
        setErrorMsg(res.error || 'Gagal mendaftar. Silakan periksa kembali data kamu.');
      }
    } else {
      if (!email.trim()) {
        setErrorMsg('Email wajib diisi.');
        return;
      }
      if (!password) {
        setErrorMsg('Kata sandi wajib diisi.');
        return;
      }

      setIsLoading(true);
      const res = await authService.signIn(email, password);
      setIsLoading(false);

      if (res.success && res.profile) {
        onAuthenticated(res.profile, false);
      } else {
        setErrorMsg(res.error || 'Email atau kata sandi belum benar.');
      }
    }
  };

  const isRegister = mode === 'register';

  return (
    <div
      className="min-h-screen bg-paper-100 flex items-center justify-center p-4 sm:p-6 selection:bg-moss-100 selection:text-moss-950"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="w-full max-w-md paper-sheet p-6 sm:p-8 rounded-lg shadow-subtle border border-paper-300">

        {/* Back navigation & Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-paper-200">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900 font-sans transition-colors group"
            aria-label="Kembali ke halaman awal"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Kembali
          </button>
          <span className="font-serif text-lg font-bold tracking-tight text-ink-950">
            PAHAM
          </span>
        </div>

        {/* Form Title */}
        <div className="mb-6 space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl text-ink-950 font-normal">
            {isRegister ? 'Buat Akun Belajar' : 'Masuk ke Paham'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 font-serif">
            {isRegister
              ? 'Mulai belajar adaptif berbasis materi sekolahmu.'
              : 'Lanjutkan progres pemahaman dan latihanmu.'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 p-3 rounded bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 leading-relaxed font-sans"
          >
            {errorMsg}
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Name Field (Sign Up only) */}
          {isRegister && (
            <div className="space-y-1">
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-ink-800 uppercase tracking-wider font-sans"
              >
                Nama Panggilan <span className="text-terracotta-700">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={firstInputRef}
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  required
                  placeholder="Misal: Josh, Satria, Rania"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-moss-700 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-ink-800 uppercase tracking-wider font-sans"
            >
              Email <span className="text-terracotta-700">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={!isRegister ? firstInputRef : undefined}
                id="auth-email"
                name="email"
                type="email"
                autoComplete={isRegister ? 'email' : 'username'}
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-moss-700 focus:bg-white transition-colors font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-ink-800 uppercase tracking-wider font-sans"
              >
                Kata Sandi <span className="text-terracotta-700">*</span>
              </label>
              {isRegister && (
                <span className="text-[10px] text-ink-400 font-mono">Min. 6 karakter</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-10 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-moss-700 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 transition-colors"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {isRegister && (
            <div className="space-y-1">
              <label
                htmlFor="auth-confirm-password"
                className="block text-xs font-semibold text-ink-800 uppercase tracking-wider font-sans"
              >
                Ulangi Kata Sandi <span className="text-terracotta-700">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full bg-paper-50 border border-paper-300 rounded pl-9 pr-10 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-moss-700 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 transition-colors"
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 px-4 text-sm font-medium shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-paper-50 border-t-transparent rounded-full animate-spin" />
                  {isRegister ? 'Membuat akun...' : 'Memeriksa...'}
                </span>
              ) : (
                <span>{isRegister ? 'Daftar Sekarang' : 'Masuk'}</span>
              )}
            </button>
          </div>

        </form>

        {/* Toggle Mode Switcher */}
        <div className="mt-6 pt-5 border-t border-paper-200 text-center text-xs text-ink-600 font-sans">
          {isRegister ? (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className="text-moss-800 font-semibold hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className="text-moss-800 font-semibold hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
