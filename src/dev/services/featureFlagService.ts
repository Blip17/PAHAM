// PAHAM Feature Flag Control Service
// Centralized feature flag evaluation and real-time developer override management

import { FeatureFlag } from '../types';
import { devAuditLogger } from './devAuditLogger';

const STORAGE_KEY_FLAGS = 'paham_dev_feature_flags_v1';

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'new_dashboard',
    name: 'Home Studio V2 (Tactile Experience)',
    description: 'Mengaktifkan antarmuka visual high-end Home Studio dengan jadwal adaptif harian.',
    enabled: true,
    category: 'UI',
    devOnly: false,
  },
  {
    key: 'pami_mascot',
    name: 'Piko Mascot Companion',
    description: 'Menampilkan maskot kontekstual di pojok kanan bawah dengan notifikasi cerdas.',
    enabled: true,
    category: 'UI',
    devOnly: false,
  },
  {
    key: 'recommendation_engine',
    name: 'Deterministic Recommendation Engine',
    description: 'Evaluasi signal performa (mistakes, FSRS overdue, gap hari) untuk saran belajar terarah.',
    enabled: true,
    category: 'CORE',
    devOnly: false,
  },
  {
    key: 'gemini_byok',
    name: 'Gemini BYOK (Use My API Key)',
    description: 'Integrasi pengisian kunci Gemini pribadi dengan enkripsi Web Crypto AES-GCM-256.',
    enabled: true,
    category: 'AI',
    devOnly: false,
  },
  {
    key: 'ocr_fallback',
    name: 'Deterministic Offline OCR Fallback',
    description: 'Ekstraksi catatan guru secara lokal tanpa ketergantungan koneksi saat offline.',
    enabled: true,
    category: 'CORE',
    devOnly: false,
  },
  {
    key: 'fsrs',
    name: 'FSRS Spaced Repetition Scheduler',
    description: 'Model memori FSRS untuk penentuan interval optimal kartu kilas.',
    enabled: true,
    category: 'CORE',
    devOnly: false,
  },
  {
    key: 'new_quiz_ui',
    name: 'Tactile Adaptive Quiz Interface',
    description: 'Antarmuka kuis adaptif dengan umpan balik taktil dan kalibrasi otomatis.',
    enabled: true,
    category: 'UI',
    devOnly: false,
  },
  {
    key: 'experimental_ai',
    name: 'Experimental Deep Reasoning (Pro Model)',
    description: 'Penalaran multi-langkah dan dekonstruksi miskonsepsi kompleks tingkat lanjut.',
    enabled: false,
    category: 'EXPERIMENTAL',
    devOnly: true,
  },
  {
    key: 'dev_cockpit_full',
    name: 'Internal Dev Cockpit Suite (/dev)',
    description: 'Pusat kontrol teknis, database explorer, event lab, dan simulator pengguna.',
    enabled: true,
    category: 'CORE',
    devOnly: true,
  },
];

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.loadFlags();
  }

  private loadFlags(): void {
    let saved: Record<string, boolean> = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_FLAGS);
        if (raw) saved = JSON.parse(raw);
      } catch {}
    }

    DEFAULT_FLAGS.forEach(flag => {
      const isEnabled = saved[flag.key] !== undefined ? saved[flag.key] : flag.enabled;
      this.flags.set(flag.key, { ...flag, enabled: isEnabled });
    });
  }

  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    return flag ? flag.enabled : false;
  }

  public setFlag(key: string, enabled: boolean): void {
    const existing = this.flags.get(key);
    if (!existing) return;

    existing.enabled = enabled;
    this.flags.set(key, existing);

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const state: Record<string, boolean> = {};
        this.flags.forEach((f, k) => { state[k] = f.enabled; });
        localStorage.setItem(STORAGE_KEY_FLAGS, JSON.stringify(state));
      } catch {}
    }

    devAuditLogger.log({
      developer: 'Developer',
      action: `TOGGLE_FEATURE_FLAG: ${key}`,
      target: key,
      environment: 'development',
      result: 'SUCCESS',
      details: { newState: enabled },
    });
  }

  public resetDefaults(): void {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY_FLAGS); } catch {}
    }
    this.flags.clear();
    DEFAULT_FLAGS.forEach(flag => this.flags.set(flag.key, { ...flag }));
  }
}

export const featureFlagService = new FeatureFlagService();
