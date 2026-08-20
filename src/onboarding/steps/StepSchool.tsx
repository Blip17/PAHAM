// Step 2 — School
// "Kamu sekolah di mana?"

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StepSchoolProps {
  schoolName: string;
  schoolCity: string;
  schoolProvince: string;
  onChange: (updates: { schoolName?: string; schoolCity?: string; schoolProvince?: string }) => void;
  onNext: () => void;
}

const INDONESIAN_PROVINCES = [
  'Aceh', 'Bali', 'Bangka Belitung', 'Banten', 'Bengkulu',
  'D.I. Yogyakarta', 'D.K.I. Jakarta', 'Gorontalo',
  'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah',
  'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Riau',
  'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya',
  'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah',
  'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah',
  'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat',
  'Sumatera Selatan', 'Sumatera Utara',
];

export const StepSchool: React.FC<StepSchoolProps> = ({
  schoolName, schoolCity, schoolProvince, onChange, onNext,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 2 — Sekolah
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          Kamu sekolah di mana?
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          Ini membantu Paham menyesuaikan konten dengan konteks sekolahmu.
          Kamu bisa lewati kalau belum ingin mengisi.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-5">

        <div className="space-y-1.5">
          <label
            htmlFor="school-name"
            className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
          >
            Nama sekolah
          </label>
          <input
            id="school-name"
            type="text"
            placeholder="Misal: SMA Negeri 1 Bandung, MAN 2 Jakarta…"
            value={schoolName}
            onChange={(e) => onChange({ schoolName: e.target.value })}
            className="
              w-full bg-paper-50 border border-paper-300 rounded
              px-4 py-3 text-sm text-ink-950
              placeholder:text-ink-300
              focus:outline-none focus:border-ink-700 focus:bg-white
              transition-colors duration-150 font-sans
            "
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="school-city"
              className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
            >
              Kota / Kabupaten
            </label>
            <input
              id="school-city"
              type="text"
              placeholder="Misal: Surabaya"
              value={schoolCity}
              onChange={(e) => onChange({ schoolCity: e.target.value })}
              className="
                w-full bg-paper-50 border border-paper-300 rounded
                px-4 py-3 text-sm text-ink-950
                placeholder:text-ink-300
                focus:outline-none focus:border-ink-700 focus:bg-white
                transition-colors duration-150 font-sans
              "
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="school-province"
              className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
            >
              Provinsi
            </label>
            <select
              id="school-province"
              value={schoolProvince}
              onChange={(e) => onChange({ schoolProvince: e.target.value })}
              className="
                w-full bg-paper-50 border border-paper-300 rounded
                px-4 py-3 text-sm text-ink-950
                focus:outline-none focus:border-ink-700
                transition-colors duration-150 font-sans
              "
            >
              <option value="">— Pilih —</option>
              {INDONESIAN_PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNext}
          className="text-xs text-ink-500 hover:text-ink-800 font-sans transition-colors"
        >
          Lewati dulu
        </button>
        <button
          type="submit"
          className="btn-primary py-3 px-6 text-sm"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </form>
  );
};
