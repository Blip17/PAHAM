// PAHAM Internal Developer Cockpit Shell (/dev)
// Professional high-density developer control center, database explorer, event lab & user simulator

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  Layers, 
  Zap, 
  Users, 
  Smile, 
  Sliders, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  FileText, 
  Search, 
  X, 
  ArrowLeft,
  Lock,
  Sparkles,
  Command
} from 'lucide-react';
import { DevCockpitTab } from './types';
import { DevHomeView } from './views/DevHomeView';
import { DatabaseExplorerView } from './views/DatabaseExplorerView';
import { DatabaseSchemaView } from './views/DatabaseSchemaView';
import { EventLabView } from './views/EventLabView';
import { EventSequenceView } from './views/EventSequenceView';
import { UserSimulatorView } from './views/UserSimulatorView';
import { MascotLabView } from './views/MascotLabView';
import { RecommendationLabView } from './views/RecommendationLabView';
import { AiDebuggerView } from './views/AiDebuggerView';
import { ErrorCenterView } from './views/ErrorCenterView';
import { FeatureFlagView } from './views/FeatureFlagView';
import { SecurityCenterView } from './views/SecurityCenterView';
import { ApiExplorerView } from './views/ApiExplorerView';
import { JobMonitorView } from './views/JobMonitorView';
import { AuditLogView } from './views/AuditLogView';
import { DevCommandPalette } from './components/DevCommandPalette';
import { UserProfile } from '../core/types';

interface DevCockpitProps {
  onExit: () => void;
  onImpersonateUser?: (profile: UserProfile) => void;
  activeProfile?: UserProfile | null;
}

export const DevCockpit: React.FC<DevCockpitProps> = ({ 
  onExit, 
  onImpersonateUser,
  activeProfile 
}) => {
  const [activeTab, setActiveTab] = useState<DevCockpitTab>('overview');
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [authPin, setAuthPin] = useState<string>('');

  // Listen for Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navGroups: {
    groupName: string;
    items: { id: DevCockpitTab; label: string; icon: React.ReactNode; badge?: string }[];
  }[] = [
    {
      groupName: 'SYSTEM & OBSERVABILITY',
      items: [
        { id: 'overview', label: 'Dev Home / Telemetry', icon: <Cpu className="w-4 h-4 text-emerald-400" /> },
        { id: 'errors', label: 'Error Center', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
        { id: 'security', label: 'Security & Auth', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
        { id: 'jobs', label: 'Background Jobs', icon: <Activity className="w-4 h-4 text-purple-400" /> },
        { id: 'audit', label: 'Audit Log Trail', icon: <FileText className="w-4 h-4 text-blue-400" /> },
      ],
    },
    {
      groupName: 'DATA & SCHEMA',
      items: [
        { id: 'database', label: 'Database Explorer', icon: <Database className="w-4 h-4 text-blue-400" />, badge: '18 tables' },
        { id: 'schema', label: 'Schema & ER Graph', icon: <Layers className="w-4 h-4 text-emerald-400" /> },
      ],
    },
    {
      groupName: 'LABS & SIMULATION',
      items: [
        { id: 'simulator', label: 'User Simulator', icon: <Users className="w-4 h-4 text-amber-400" />, badge: '9 presets' },
        { id: 'events', label: 'Event Lab', icon: <Zap className="w-4 h-4 text-purple-400" /> },
        { id: 'scenarios', label: 'Event Sequence', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: 'mascot', label: 'Piko Mascot Lab', icon: <Smile className="w-4 h-4 text-emerald-400" /> },
        { id: 'recommendations', label: 'Recommendation Lab', icon: <Sliders className="w-4 h-4 text-emerald-400" /> },
      ],
    },
    {
      groupName: 'INFERENCE & CONFIG',
      items: [
        { id: 'ai', label: 'AI Debugger', icon: <Zap className="w-4 h-4 text-emerald-400" /> },
        { id: 'api', label: 'API Explorer', icon: <Terminal className="w-4 h-4 text-blue-400" /> },
        { id: 'flags', label: 'Feature Flags', icon: <Sliders className="w-4 h-4 text-blue-400" /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-mono selection:bg-emerald-800 selection:text-white">
      
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        
        {/* Left: Branding & Return Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition"
            title="Return to Student Application"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit to App</span>
          </button>

          <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
            <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
              P
            </div>
            <span className="font-bold text-xs tracking-wider text-zinc-100 uppercase">
              PAHAM DEV COCKPIT
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 hidden sm:inline-block">
              /dev
            </span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span>Search tools or actions...</span>
            <kbd className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right: Telemetry Strip & Active Session */}
        <div className="flex items-center gap-2.5 text-xs">
          {activeProfile && (
            <span className="text-[11px] text-zinc-400 hidden lg:inline-block">
              Impersonating: <strong className="text-emerald-300">{activeProfile.displayName || activeProfile.name}</strong>
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
            DEV MODE
          </span>
        </div>

      </header>

      {/* ── Main Layout (Sidebar + Tab View) ───────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Rail */}
        <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-900/60 p-3 hidden md:flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {navGroups.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-2 block">
                  {grp.groupName}
                </span>
                {grp.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition text-left ${
                        isActive
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                          : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
            Paham Internal Engineering Suite
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && <DevHomeView onNavigateTab={setActiveTab} />}
            {activeTab === 'database' && <DatabaseExplorerView />}
            {activeTab === 'schema' && <DatabaseSchemaView />}
            {activeTab === 'events' && <EventLabView />}
            {activeTab === 'scenarios' && <EventSequenceView />}
            {activeTab === 'simulator' && <UserSimulatorView onImpersonateUser={onImpersonateUser} />}
            {activeTab === 'mascot' && <MascotLabView />}
            {activeTab === 'recommendations' && <RecommendationLabView />}
            {activeTab === 'ai' && <AiDebuggerView />}
            {activeTab === 'errors' && <ErrorCenterView />}
            {activeTab === 'flags' && <FeatureFlagView />}
            {activeTab === 'security' && <SecurityCenterView />}
            {activeTab === 'api' && <ApiExplorerView />}
            {activeTab === 'jobs' && <JobMonitorView />}
            {activeTab === 'audit' && <AuditLogView />}
          </div>
        </main>

      </div>

      {/* ── Developer Command Palette (Ctrl+K) ────────────────── */}
      <DevCommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigateTab={setActiveTab}
      />

    </div>
  );
};
