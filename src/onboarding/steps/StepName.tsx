// Step 1 — Name
// "Kamu mau dipanggil apa?"

import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface StepNameProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export const StepName: React.FC<StepNameProps> = ({ value, onChange, onNext }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          Langkah 1 — Identitas
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink-950 font-normal leading-tight">
          Kamu mau dipanggil apa?
        </h2>
        <p className="text-sm text-ink-500 font-sans">
          Nama ini yang akan Paham gunakan selama kamu belajar.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label
          htmlFor="step-name"
          className="block text-xs font-semibold text-ink-700 uppercase tracking-wider font-sans"
        >
          Nama panggilan
        </label>
        <input
          ref={inputRef}
          id="step-name"
          type="text"
          autoComplete="given-name"
          autoCapitalize="words"
          required
          placeholder="Misal: Josh, Satria, Rani…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full bg-paper-50 border border-paper-300 rounded
            px-4 py-3.5 text-base text-ink-950
            placeholder:text-ink-300
            focus:outline-none focus:border-ink-700 focus:bg-white
            transition-colors duration-150 font-sans
          "
        />
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!value.trim()}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-40"
        >
          Lanjutkan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </form>
  );
};
