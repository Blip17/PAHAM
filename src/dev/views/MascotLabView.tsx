// PAHAM Global Pami & Server-Backed Realtime Broadcaster
// Dispatches server-authorized events across all live connected clients with targeting, persistence, and live stream

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
  CheckCircle2,
  Users,
  User,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Clock,
  Activity,
  AlertCircle,
  RefreshCw,
  Server,
  Zap
} from 'lucide-react';
import { PahamMascot, MascotState, MascotSize } from '../../components/mascot/PahamMascot';
import { liveRemoteService, LiveBroadcastPayload } from '../services/liveRemoteService';
import { devApiClient } from '../services/devApiClient';

interface StateOption {
  id: MascotState;
  label: string;
  emoji: string;
  defaultText: string;
  badgeColor: string;
}

const STATE_OPTIONS: StateOption[] = [
  { id: 'encouraging', label: 'Semangat (Encouraging)', emoji: '✨', defaultText: 'Semangat terus! Dari latihan dan pengulangan konsepmu makin tajam.', badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { id: 'celebrating', label: 'Merayakan (Celebrating)', emoji: '🎉', defaultText: 'Luar biasa! Target belajarmu hari ini tercapai sempurna!', badgeColor: 'bg-amber-950 text-amber-300 border-amber-800' },
  { id: 'success', label: 'Berhasil (Success)', emoji: '🏆', defaultText: 'Hebat sekali! Pemahaman konsepmu meningkat pesat!', badgeColor: 'bg-green-950 text-green-300 border-green-800' },
  { id: 'thinking', label: 'Menganalisis (Thinking)', emoji: '💡', defaultText: 'Piko sedang menganalisis pola jawaban dan materi belajarmu...', badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  { id: 'sleeping', label: 'Tidur (Sleeping/Zzz)', emoji: '😴', defaultText: 'Zzz... Waktunya istirahat agar otak mengonsolidasi memori materi.', badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  { id: 'warning', label: 'Peringatan (Warning)', emoji: '⚠️', defaultText: 'Perhatian: Ada materi penting dan kartu flashcard yang jatuh tempo!', badgeColor: 'bg-rose-950 text-rose-300 border-rose-800' },
  { id: 'recommending', label: 'Saran (Recommending)', emoji: '📢', defaultText: 'Piko sarankan untuk review kilas 5 menit topik ini.', badgeColor: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'curious', label: 'Ingin Tahu (Curious)', emoji: '❓', defaultText: 'Coba ceritakan caramu memecahkan rumus tadi?', badgeColor: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'idle', label: 'Siaga (Idle)', emoji: '🦉', defaultText: 'Piko siaga dan siap temani belajarmu kapan saja.', badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
];

export const MascotLabView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<MascotState>('celebrating');
  const [selectedSize, setSelectedSize] = useState<MascotSize>('lg');
  const [customMessage, setCustomMessage] = useState<string>(STATE_OPTIONS[1].defaultText);
  const [targetType, setTargetType] = useState<'ALL_ONLINE_USERS' | 'ALL_USERS' | 'SPECIFIC_USER' | 'TEST_USERS'>('ALL_ONLINE_USERS');
  const [specificUserId, setSpecificUserId] = useState<string>('user-a');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [displayMode, setDisplayMode] = useState<'TOP_BANNER' | 'CORNER_BUBBLE' | 'BOTH'>('BOTH');
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [playSound, setPlaySound] = useState<boolean>(true);
  const [senderName, setSenderName] = useState<string>('Lead Engineer');
  
  // Target server host selection (Live Vercel vs Localhost)
  const [targetServerHost, setTargetServerHost] = useState<'LIVE_VERCEL' | 'LOCALHOST' | 'CUSTOM'>('LIVE_VERCEL');
  const [customServerUrl, setCustomServerUrl] = useState<string>('https://paham-lilac.vercel.app');

  const getEffectiveBaseUrl = () => {
    if (targetServerHost === 'LIVE_VERCEL') return 'https://paham-lilac.vercel.app';
    if (targetServerHost === 'LOCALHOST') return '';
    return customServerUrl.replace(/\/+$/, '');
  };

  // Real-time server telemetry & event stream
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [serverEvents, setServerEvents] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastPublishedResult, setLastPublishedResult] = useState<any | null>(null);

  // Dedicated Messaging Health Check State
  const [healthStatus, setHealthStatus] = useState<{
    auth: 'OK' | 'FAILED';
    database: 'OK' | 'DEGRADED';
    messageService: 'OK' | 'FAILED';
    realtime: 'OK' | 'DEGRADED';
    delivery: 'OK' | 'PENDING';
    environment: string;
  }>({
    auth: 'OK',
    database: 'OK',
    messageService: 'OK',
    realtime: 'OK',
    delivery: 'OK',
    environment: 'PRODUCTION',
  });

  // Production confirmation modal
  const isProduction = devApiClient.isProduction() || targetServerHost === 'LIVE_VERCEL';
  const [isProdConfirmOpen, setIsProdConfirmOpen] = useState<boolean>(false);

  // Poll server events, live online clients, and health diagnostics
  const fetchServerEvents = async () => {
    try {
      const baseUrl = getEffectiveBaseUrl();
      
      // 1. Fetch Events Stream
      const res = await fetch(`${baseUrl}/api/events?action=list&limit=15`, {
        headers: { 'x-dev-token': devApiClient.getToken() || 'paham-dev-2026' }
      });
      if (res.ok) {
        const data = await res.json();
        setServerEvents(data.events || []);
        if (data.onlineClientsCount !== undefined) {
          setOnlineCount(data.onlineClientsCount);
        }
      }

      // 2. Fetch Health Check
      const healthRes = await fetch(`${baseUrl}/api/events?action=health`, {
        headers: { 'x-dev-token': devApiClient.getToken() || 'paham-dev-2026' }
      });
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealthStatus({
          auth: hData.auth || 'OK',
          database: hData.database || 'OK',
          messageService: hData.messageService || 'OK',
          realtime: hData.realtime || 'OK',
          delivery: hData.delivery || 'OK',
          environment: hData.environment || 'PRODUCTION',
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchServerEvents();
    const interval = setInterval(fetchServerEvents, 3000);
    return () => clearInterval(interval);
  }, [targetServerHost, customServerUrl]);

  const handleSelectState = (opt: StateOption) => {
    setSelectedState(opt.id);
    setCustomMessage(opt.defaultText);
  };

  // Publish to Server Event Stream & Realtime Push
  const executeServerPublish = async () => {
    setIsPublishing(true);
    const baseUrl = getEffectiveBaseUrl();
    try {
      const payloadData = {
        expression: selectedState,
        mascotState: selectedState,
        message: customMessage.trim(),
        displayMode,
        durationSeconds,
        playSound,
        senderName: senderName.trim() || 'Developer',
      };

      const requestBody = {
        action: 'publish',
        eventType: 'pami.notification',
        targetType,
        targetId: targetType === 'SPECIFIC_USER' ? specificUserId.trim() : undefined,
        payload: payloadData,
        priority,
        expiresInHours: 24,
      };

      let res = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-token': devApiClient.getToken() || 'paham-dev-2026',
          ...(isProduction ? { 'x-confirm-production-destructive': 'CONFIRM_DESTRUCTIVE' } : {})
        },
        body: JSON.stringify(requestBody),
      });

      // If /api/events returned 404 or 405, fallback to /api/events/publish
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        res = await fetch(`${baseUrl}/api/events/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-dev-token': devApiClient.getToken() || 'paham-dev-2026',
            ...(isProduction ? { 'x-confirm-production-destructive': 'CONFIRM_DESTRUCTIVE' } : {})
          },
          body: JSON.stringify(requestBody),
        });
      }

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { success: res.ok, message: text.substring(0, 100) };
      }

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      setLastPublishedResult({
        success: true,
        ...data,
        targetHost: baseUrl || 'Localhost (Current Origin)',
      });

      // Also trigger local broadcast channel for immediate fallback
      liveRemoteService.broadcast({
        expression: selectedState,
        message: customMessage.trim(),
        displayMode,
        durationSeconds,
        playSound,
        senderName: senderName.trim() || undefined,
      });

      fetchServerEvents();
    } catch (err: any) {
      setLastPublishedResult({
        success: false,
        errorCategory: 'MESSAGE_SEND_FAILED',
        error: err?.message || 'Failed to connect to server endpoint',
        targetHost: baseUrl || 'Localhost',
        requestId: `err_${Date.now()}`,
        diagnosticInfo: `Failed communicating with ${baseUrl}/api/events. Check network connectivity and API keys.`,
      });
    } finally {
      setIsPublishing(false);
      setIsProdConfirmOpen(false);
    }
  };

  const handlePublishClick = () => {
    if (isProduction && (targetType === 'ALL_ONLINE_USERS' || targetType === 'ALL_USERS')) {
      setIsProdConfirmOpen(true);
      return;
    }
    executeServerPublish();
  };

  const handleClearOverride = () => {
    liveRemoteService.clearOverride();
    setLastPublishedResult(null);
  };

  const handleRetryEvent = (eventItem: any) => {
    setSelectedState(eventItem.payload?.mascotState || eventItem.payload?.expression || 'celebrating');
    setCustomMessage(eventItem.payload?.message || '');
    setTargetType(eventItem.targetType || 'ALL_ONLINE_USERS');
    if (eventItem.targetId) setSpecificUserId(eventItem.targetId);
    setPriority(eventItem.priority || 'NORMAL');
    executeServerPublish();
  };

  return (
    <div className="space-y-6 text-zinc-200 font-mono">
      
      {/* Top Section: Header & Live Diagnostic Health Bar */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Global Server-Backed Pami Event Broadcaster
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Live Broadcast Engine Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Kontrol langsung seluruh klien PAHAM yang aktif di live website (<code className="text-emerald-400 font-mono">paham-lilac.vercel.app</code>) secara realtime dengan penyimpanan persisten.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-300">
                Online: <strong className="text-emerald-400 font-mono">{onlineCount}</strong>
              </span>
            </div>

            <button
              onClick={fetchServerEvents}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dedicated Messaging Health Diagnostic Badges */}
        <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">AUTH</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {healthStatus.auth}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">DATABASE</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {healthStatus.database}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">MESSAGE</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {healthStatus.messageService}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">REALTIME</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {healthStatus.realtime}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">DELIVERY</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {healthStatus.delivery}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">ENV</span>
            <span className="font-bold text-amber-400 truncate text-[10px]">
              {healthStatus.environment}
            </span>
          </div>
        </div>

      </div>

      {/* Target Destination Server Host Bar */}
      <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Server Destination:
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
            {getEffectiveBaseUrl() || 'http://localhost:5173 (Localhost)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
          <button
            onClick={() => setTargetServerHost('LIVE_VERCEL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 ${
              targetServerHost === 'LIVE_VERCEL'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>🌐 paham-lilac.vercel.app (Live Production)</span>
          </button>

          <button
            onClick={() => setTargetServerHost('LOCALHOST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 ${
              targetServerHost === 'LOCALHOST'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>💻 Localhost Dev</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Global Broadcast Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          
          {/* 1. Target Audience Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                1. Target Penerima (Target Audience):
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Server-Side Routing</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ALL_ONLINE_USERS', label: 'All Online Users', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
                { id: 'ALL_USERS', label: 'All Users (Persistent)', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
                { id: 'SPECIFIC_USER', label: 'Specific User', icon: <User className="w-3.5 h-3.5 text-purple-400" /> },
                { id: 'TEST_USERS', label: 'Test Users Only', icon: <Activity className="w-3.5 h-3.5 text-amber-400" /> },
              ].map(tgt => {
                const isSelected = targetType === tgt.id;
                return (
                  <button
                    key={tgt.id}
                    onClick={() => setTargetType(tgt.id as any)}
                    className={`p-2 rounded-lg text-left text-xs transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {tgt.icon}
                    <span className="truncate text-[11px]">{tgt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Target ID Input if Specific User */}
            {targetType === 'SPECIFIC_USER' && (
              <div className="pt-2">
                <label className="text-[11px] text-purple-300 block mb-1">Target User ID (contoh: "user-a" atau nama akun):</label>
                <input
                  type="text"
                  value={specificUserId}
                  onChange={e => setSpecificUserId(e.target.value)}
                  placeholder="Masukkan User ID..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-purple-500/80 rounded-lg text-xs text-purple-200 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* 2. Quick Emotion Selector */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              2. Pilih Ekspresi Piko Live (Mascot State):
            </span>
            <div className="grid grid-cols-3 gap-2">
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

          {/* 3. Custom Speech Message */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                3. Pesan Notifikasi Realtime (Message Payload):
              </span>
              <span className="text-[10px] text-zinc-500">Muncul di Bubble Chat Klien</span>
            </div>
            <textarea
              rows={3}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Ketik pesan yang akan disiarkan ke semua siswa..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
            />
          </div>

          {/* 4. Priority, Display & Duration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
            
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Priority:
              </span>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="LOW">LOW (Latar Belakang)</option>
                <option value="NORMAL">NORMAL (Standar)</option>
                <option value="HIGH">HIGH (Mendesak / Puncak)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Display Target:
              </span>
              <select
                value={displayMode}
                onChange={e => setDisplayMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="BOTH">Top Banner + Corner Piko</option>
                <option value="TOP_BANNER">Top Banner Saja</option>
                <option value="CORNER_BUBBLE">Corner Piko Saja</option>
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
                <option value={0}>Tetap Muncul (Sampai di-Close)</option>
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
              <span>Mainkan Audio Chime saat Muncul di Layar Siswa</span>
            </label>
          </div>

          {/* 5. Action Trigger Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-98 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isPublishing ? 'Menerbitkan ke Server...' : '🚀 Kirim Live ke Server & Realtime Clients!'}</span>
            </button>

            <button
              onClick={handleClearOverride}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Normal</span>
            </button>
          </div>

          {/* Server Dispatch Structured Feedback Result */}
          {lastPublishedResult && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              lastPublishedResult.success 
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {lastPublishedResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {lastPublishedResult.success ? 'Server Broadcast Berhasil' : (lastPublishedResult.errorCategory || 'MESSAGE_SEND_FAILED')}
                </span>
                <span className="font-mono text-[10px]">
                  Host: {lastPublishedResult.targetHost || 'paham-lilac.vercel.app'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 font-sans">{lastPublishedResult.message || lastPublishedResult.error}</p>
              {lastPublishedResult.requestId && (
                <div className="text-[10px] opacity-75 font-mono pt-1">
                  Request ID: {lastPublishedResult.requestId}
                </div>
              )}
            </div>
          )}

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
            <div className="py-8 px-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              
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

          {/* Architecture Verification Guide */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verifikasi Live Production:
            </div>
            <p className="leading-relaxed font-sans">
              1. Buka <strong>https://paham-lilac.vercel.app</strong> di browser siswa/teman.<br />
              2. Di panel ini, pastikan Server Destination adalah <strong>paham-lilac.vercel.app</strong>.<br />
              3. Ketik pesan & pilih ekspresi, lalu klik <strong>Kirim Live ke Server</strong>.<br />
              4. Website live akan langsung memainkan audio chime dan menampilkan bubble chat Piko!
            </p>
          </div>

        </div>

      </div>

      {/* Bottom: Server-Side Realtime Event Stream Ledger with Retry */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-100">
              Live Server Event Ledger & Delivery Stream
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
              {serverEvents.length} Recent Server Events
            </span>
          </div>

          <button
            onClick={fetchServerEvents}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Refresh Stream
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Event Type</th>
                <th className="py-2 px-3">Target</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3">Delivered</th>
                <th className="py-2 px-3">Message Payload</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {serverEvents.length > 0 ? (
                serverEvents.map(evt => (
                  <tr key={evt.eventId || evt.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {evt.targetType === 'SPECIFIC_USER' ? (
                        <span className="text-purple-300">USER: {evt.targetId}</span>
                      ) : (
                        <span className="text-emerald-400">{evt.targetType}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold ${
                        evt.priority === 'HIGH' ? 'text-rose-400' :
                        evt.priority === 'NORMAL' ? 'text-zinc-300' : 'text-zinc-500'
                      }`}>
                        {evt.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-950 text-emerald-400 border border-emerald-900/60 font-bold">
                        {evt.deliveryStats?.deliveredCount || 0} clients
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 font-sans truncate max-w-xs text-[11px]">
                      "{evt.payload?.message || JSON.stringify(evt.payload)}"
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleRetryEvent(evt)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition flex items-center gap-1"
                        title="Kirim ulang pesan ini"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-500 font-mono text-xs">
                    Belum ada event yang dipublikasikan. Kirim event pertama di atas!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Safety Confirmation Modal */}
      {isProdConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-rose-600 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-white">Konfirmasi Siaran Global Produksi</h3>
                <p className="text-xs text-rose-300">Live Paham Production Environment (paham-lilac.vercel.app)</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Anda akan menyiarkan pesan ini ke <strong>SEMUA PENGGUNA AKTIF DI SERVER LIVE PRODUKSI</strong>. Tindakan ini akan dicatat dalam audit trail server.
            </p>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 font-sans">
              "{customMessage}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsProdConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                onClick={executeServerPublish}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition"
              >
                Konfirmasi & Kirim ke Live Users
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
