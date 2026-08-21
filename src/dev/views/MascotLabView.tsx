// PAHAM Mascot Lab & Live Web Remote Controller
// Remotely controls live student screens in real-time (expressions, sleep mode, top surprise chat bubbles)

import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Sparkles, 
  Send, 
  Radio, 
  RotateCcw, 
  Moon, 
  Volume2, 
  VolumeX, 
  Layers, 
  Check, 
  MessageSquare,
  PartyPopper,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { PahamMascot, MascotState, MascotSize } from '../../components/mascot/PahamMascot';
import { liveRemoteService, LiveBroadcastPayload } from '../services/liveRemoteService';

interface StateOption {
  id: MascotState;
  label: string;
  emoji: string;
  defaultText: string;
  badgeColor: string;
}

const STATE_OPTIONS: StateOption[] = [
  { id: 'sleeping', label: 'Tidur (Sleeping/Zzz)', emoji: '😴', defaultText: 'Zzz... Piko lagi tidur pulas nih...', badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  { id: 'celebrating', label: 'Merayakan (Celebrating)', emoji: '🎉', defaultText: 'Luar biasa! Kamu hebat banget hari ini!', badgeColor: 'bg-amber-950 text-amber-300 border-amber-800' },
  { id: 'encouraging', label: 'Semangat (Encouraging)', emoji: '✨', defaultText: 'Semangat terus! Kamu pasti bisa kuasai materi ini!', badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { id: 'thinking', label: 'Menganalisis (Thinking)', emoji: '💡', defaultText: 'Piko lagi mikir dan menganalisis polamu...', badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  { id: 'recommending', label: 'Saran (Recommending)', emoji: '📢', defaultText: 'Ada konsep penting yang perlu kamu review!', badgeColor: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'warning', label: 'Peringatan (Warning)', emoji: '⚠️', defaultText: 'Perhatian: Kartu flashcardmu sudah jatuh tempo!', badgeColor: 'bg-rose-950 text-rose-300 border-rose-800' },
  { id: 'success', label: 'Berhasil (Success)', emoji: '🏆', defaultText: 'Bagus sekali! Jawabanmu 100% tepat!', badgeColor: 'bg-green-950 text-green-300 border-green-800' },
  { id: 'curious', label: 'Ingin Tahu (Curious)', emoji: '❓', defaultText: 'Coba ceritakan caramu menyelesaikan soal tadi?', badgeColor: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'idle', label: 'Siaga (Idle)', emoji: '🦉', defaultText: 'Halo! Piko siap temani belajarmu.', badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
];

export const MascotLabView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<MascotState>('sleeping');
  const [selectedSize, setSelectedSize] = useState<MascotSize>('lg');
  const [customMessage, setCustomMessage] = useState<string>(STATE_OPTIONS[0].defaultText);
  const [displayMode, setDisplayMode] = useState<'TOP_BANNER' | 'CORNER_BUBBLE' | 'BOTH'>('BOTH');
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [playSound, setPlaySound] = useState<boolean>(true);
  const [senderName, setSenderName] = useState<string>('Developer');
  
  const [activeBroadcast, setActiveBroadcast] = useState<LiveBroadcastPayload | null>(
    liveRemoteService.getCurrentOverride()
  );
  const [justBroadcasted, setJustBroadcasted] = useState<boolean>(false);

  useEffect(() => {
    const unsub = liveRemoteService.subscribe((payload) => {
      setActiveBroadcast(payload);
    });
    return () => unsub();
  }, []);

  const handleSelectState = (opt: StateOption) => {
    setSelectedState(opt.id);
    setCustomMessage(opt.defaultText);
  };

  // Instant broadcast to live website across all tabs
  const handleBroadcastLive = () => {
    const payload = liveRemoteService.broadcast({
      expression: selectedState,
      message: customMessage.trim(),
      displayMode,
      durationSeconds,
      playSound,
      senderName: senderName.trim() || undefined,
    });

    setActiveBroadcast(payload);
    setJustBroadcasted(true);
    setTimeout(() => setJustBroadcasted(false), 2000);
  };

  const handleClearOverride = () => {
    liveRemoteService.clearOverride();
    setActiveBroadcast(null);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Header with Live Broadcast Status */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Live Web Remote Controller & Mascot Broadcaster
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Remotely control the live running student screen in real-time. Change Piko's expression (e.g. Sleepy) or broadcast surprise chat bubbles at the top!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeBroadcast ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE ACTIVE: <strong className="uppercase">{activeBroadcast.expression}</strong></span>
              <button
                onClick={handleClearOverride}
                className="ml-2 text-[10px] underline hover:text-white"
              >
                Clear
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              Live Sync Ready
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Remote Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          
          {/* 1. Quick Emotion Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              1. Pilih Ekspresi Piko Live:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATE_OPTIONS.map(opt => {
                const isSelected = selectedState === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectState(opt)}
                    className={`p-2.5 rounded-lg text-left text-xs transition border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span className="truncate">{opt.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Surprise Chat Message */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                2. Tulis Pesan Bubble Chat (Surprise Text):
              </span>
              <span className="text-[10px] text-zinc-500">Muncul di Bubble Chat Atas</span>
            </div>
            <textarea
              rows={3}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Ketik pesan kejutan untuk temanmu..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
            />
          </div>

          {/* 3. Display Mode & Sound Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Target Tampilan Bubble:
              </span>
              <select
                value={displayMode}
                onChange={e => setDisplayMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="BOTH">Top Banner + Corner Piko (Both)</option>
                <option value="TOP_BANNER">Top Screen Bubble Chat Saja</option>
                <option value="CORNER_BUBBLE">Corner Piko Speech Bubble Saja</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Durasi Tayang:
              </span>
              <select
                value={durationSeconds}
                onChange={e => setDurationSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 Detik</option>
                <option value={10}>10 Detik (Disarankan)</option>
                <option value={30}>30 Detik</option>
                <option value={0}>Tetap Muncul (Sampai di-Clear)</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={playSound}
                onChange={e => setPlaySound(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Mainkan Audio Chime saat Muncul</span>
            </label>
          </div>

          {/* 4. Action Trigger Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleBroadcastLive}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>{justBroadcasted ? '✓ Berhasil Dikirim ke Web Live!' : 'Kirim Live ke Layar Siswa Sekarang!'}</span>
            </button>

            <button
              onClick={handleClearOverride}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Normal</span>
            </button>
          </div>

        </div>

        {/* Right: Live Vector Preview & Sandbox (5 Cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Live Vector Avatar Preview
              </span>
              <div className="flex items-center gap-1">
                {(['sm', 'md', 'lg', 'xl'] as MascotSize[]).map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition ${
                      selectedSize === sz
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="py-10 px-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              
              {/* Preview Mascot */}
              <div className="relative">
                <PahamMascot
                  size={selectedSize}
                  state={selectedState}
                  interactive={true}
                />
              </div>

              {/* Preview Speech Bubble */}
              <div className="mt-4 max-w-xs text-center p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-serif shadow">
                "{customMessage}"
              </div>

            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 space-y-1">
            <div className="font-bold text-zinc-300">💡 Cara Menguji:</div>
            <p>
              1. Buka tab baru ke <strong className="text-emerald-400">http://localhost:5173/</strong>.<br />
              2. Di tab Dev ini, pilih <strong className="text-indigo-400">Tidur (Sleeping)</strong> dan ketik pesan kejutan.<br />
              3. Klik <strong>"Kirim Live ke Layar Siswa Sekarang!"</strong> dan lihat animasi tidur & bubble chat di layar aplikasi secara instan!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
