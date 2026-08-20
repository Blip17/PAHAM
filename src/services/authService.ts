// Authentication Service for PAHAM
// Authoritative Supabase Auth provider + Dexie profile cache synchronization

import { supabase, safeStorage } from './supabaseClient';
import { db } from '../core/db';
import { UserProfile } from '../core/types';

export interface AuthResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';
  const msg = typeof error === 'string' ? error : error.message || '';

  if (msg.includes('User already registered') || msg.includes('already exists') || msg.includes('duplicate key')) {
    return 'Akun dengan email ini sudah ada. Silakan masuk.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials') || msg.includes('Invalid grant')) {
    return 'Email atau kata sandi belum benar.';
  }
  if (msg.includes('Password should be at least') || msg.includes('weak_password') || msg.includes('at least 6 characters')) {
    return 'Kata sandi minimal 6 karakter.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('not confirmed')) {
    return 'Silakan konfirmasi email kamu terlebih dahulu.';
  }
  if (msg.includes('network') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Koneksi sedang bermasalah. Coba lagi beberapa saat lagi.';
  }
  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.';
  }

  return 'Belum berhasil memproses permintaan. Periksa kembali data kamu.';
}

export const authService = {
  /**
   * Register a new user via Supabase Auth and initialize profile
   */
  async signUp(name: string, email: string, password: string, confirmPassword?: string): Promise<AuthResult> {
    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Client-side validation
    if (!trimmedName) {
      return { success: false, error: 'Nama panggilan wajib diisi.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Format email tidak valid.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter.' };
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, error: 'Konfirmasi kata sandi tidak cocok.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            display_name: trimmedName,
          },
        },
      });

      if (error) {
        console.error('[AuthService.signUp] Supabase Auth Error:', error);
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Gagal membuat akun. Silakan coba lagi.' };
      }

      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: data.user.id,
        name: trimmedName,
        displayName: trimmedName,
        email: cleanEmail,
        grade: 'Kelas 10',
        semester: 'Semester 1',
        schoolName: '',
        dailyTimeTargetMinutes: 25,
        educationSystem: 'indonesia',
        curriculum: 'Kurikulum Merdeka',
        preferredLearningMethods: ['latihan_soal'],
        availableStudyTime: '20-30',
        onboardingCompleted: false,
        onboardingVersion: 1,
        hasSeenArrival: false,
        createdAt: now,
        updatedAt: now,
      };

      // 1. Upsert to Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: newProfile.id,
          name: newProfile.name,
          display_name: newProfile.displayName,
          email: newProfile.email,
          grade: newProfile.grade,
          semester: newProfile.semester,
          school_name: newProfile.schoolName,
          onboarding_completed: false,
          onboarding_version: 1,
          updated_at: now,
        });
      } catch (dbErr) {
        console.warn('[AuthService.signUp] Supabase profile upsert error (using local fallback):', dbErr);
      }

      // 2. Cache into local IndexedDB
      try {
        await db.profiles.put(newProfile);
      } catch (dexieErr) {
        console.warn('[AuthService.signUp] Local Dexie caching skipped (headless environment):', dexieErr);
      }

      // 3. Mark session in safeStorage
      safeStorage.setItem('paham_session_user', JSON.stringify({
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
      }));

      return { success: true, profile: newProfile };
    } catch (err) {
      console.error('[AuthService.signUp] Fatal exception:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Log in an existing user with email and password via Supabase Auth
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, error: 'Email dan kata sandi wajib diisi.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.error('[AuthService.signIn] Supabase Auth Error:', error);
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Akun tidak ditemukan. Silakan buat akun baru.' };
      }

      // Load profile from Dexie or construct from Auth metadata
      let profile: UserProfile | undefined = undefined;
      try {
        profile = await db.profiles.get(data.user.id);
      } catch (dexieErr) {
        console.warn('[AuthService.signIn] Dexie read skipped:', dexieErr);
      }

      if (!profile) {
        const metadata = data.user.user_metadata || {};
        const userName = metadata.display_name || metadata.name || cleanEmail.split('@')[0];
        const now = new Date().toISOString();

        profile = {
          id: data.user.id,
          name: userName,
          displayName: userName,
          email: cleanEmail,
          grade: 'Kelas 10',
          semester: 'Semester 1',
          schoolName: '',
          dailyTimeTargetMinutes: 25,
          educationSystem: 'indonesia',
          curriculum: 'Kurikulum Merdeka',
          preferredLearningMethods: ['latihan_soal'],
          availableStudyTime: '20-30',
          onboardingCompleted: true,
          onboardingVersion: 1,
          hasSeenArrival: true,
          createdAt: now,
          updatedAt: now,
        };

        try {
          await db.profiles.put(profile);
        } catch (e) {}
      }

      safeStorage.setItem('paham_session_user', JSON.stringify({
        id: profile.id,
        email: profile.email || cleanEmail,
        name: profile.name,
      }));

      return { success: true, profile };
    } catch (err) {
      console.error('[AuthService.signIn] Fatal exception:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AuthService.signOut] Supabase signOut warning:', e);
    } finally {
      safeStorage.removeItem('paham_session_user');
      safeStorage.removeItem('paham_session');
      safeStorage.removeItem('paham_onboarding_draft');
      safeStorage.removeItem('paham_onboarding_step');
    }
  },

  /**
   * Check active authenticated session on app start
   */
  async getActiveProfile(): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        return null;
      }

      // 1. Check local Dexie first for instant load
      let profile = await db.profiles.get(user.id);
      if (!profile) {
        profile = await db.profiles.toCollection().first();
      }

      if (profile) {
        return profile;
      }

      // 2. Build profile from Auth metadata if not in Dexie yet
      const metadata = user.user_metadata || {};
      const userName = metadata.display_name || metadata.name || (user.email ? user.email.split('@')[0] : 'Siswa');
      const now = new Date().toISOString();

      const newProfile: UserProfile = {
        id: user.id,
        name: userName,
        displayName: userName,
        email: user.email,
        grade: 'Kelas 10',
        semester: 'Semester 1',
        schoolName: '',
        dailyTimeTargetMinutes: 25,
        educationSystem: 'indonesia',
        curriculum: 'Kurikulum Merdeka',
        preferredLearningMethods: ['latihan_soal'],
        availableStudyTime: '20-30',
        onboardingCompleted: false,
        onboardingVersion: 1,
        hasSeenArrival: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.profiles.put(newProfile);
      return newProfile;
    } catch (err) {
      console.error('[AuthService.getActiveProfile] Error getting session:', err);
      return null;
    }
  },

  /**
   * Save canonical profile across Supabase & Dexie
   */
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const updated: UserProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    // 1. Cache to Dexie immediately
    await db.profiles.put(updated);

    // 2. Sync to Supabase in background
    try {
      await supabase.from('profiles').upsert({
        id: updated.id,
        name: updated.name,
        display_name: updated.displayName || updated.name,
        email: updated.email,
        grade: updated.grade,
        semester: updated.semester,
        school_name: updated.schoolName,
        school_city: updated.schoolCity,
        school_province: updated.schoolProvince,
        education_system: updated.educationSystem,
        curriculum: updated.curriculum,
        daily_time_target_minutes: updated.dailyTimeTargetMinutes,
        onboarding_completed: updated.onboardingCompleted,
        onboarding_version: updated.onboardingVersion || 1,
        has_seen_arrival: updated.hasSeenArrival,
        updated_at: updated.updatedAt,
      });
    } catch (e) {
      console.warn('[AuthService.saveProfile] Background sync warning:', e);
    }

    return updated;
  },

  /**
   * Listen to Supabase Auth State changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
