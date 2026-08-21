// PAHAM Developer Command Palette (Ctrl+K / Cmd+K)
// Ultra-fast launcher for navigation and developer actions

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Database, 
  Zap, 
  Users, 
  Smile, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { DevCockpitTab } from '../types';
import { devEventBus } from '../services/devEventBus';
import { userSimulatorService } from '../services/userSimulatorService';

interface PaletteCommand {
  id: string;
  title: string;
  category: 'NAVIGATION' | 'ACTION';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const DevCommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: DevCockpitTab) => void;
}> = ({ isOpen, onClose, onNavigateTab }) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const commands: PaletteCommand[] = [
    {
      id: 'nav-overview',
      title: 'Dev Home / System Telemetry',
      category: 'NAVIGATION',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('overview'); onClose(); },
    },
    {
      id: 'nav-database',
      title: 'Database Explorer (18 Tables)',
      category: 'NAVIGATION',
      icon: <Database className="w-4 h-4 text-blue-400" />,
      action: () => { onNavigateTab('database'); onClose(); },
    },
    {
      id: 'nav-schema',
      title: 'Database Schema & Relational Graph',
      category: 'NAVIGATION',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('schema'); onClose(); },
    },
    {
      id: 'nav-events',
      title: 'Event Lab (Manual Dispatcher)',
      category: 'NAVIGATION',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      action: () => { onNavigateTab('events'); onClose(); },
    },
    {
      id: 'nav-scenarios',
      title: 'Event Sequence & Scenario Builder',
      category: 'NAVIGATION',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      action: () => { onNavigateTab('scenarios'); onClose(); },
    },
    {
      id: 'nav-simulator',
      title: 'User Simulator (9 Student Archetypes)',
      category: 'NAVIGATION',
      icon: <Users className="w-4 h-4 text-amber-400" />,
      action: () => { onNavigateTab('simulator'); onClose(); },
    },
    {
      id: 'nav-mascot',
      title: 'Piko Mascot Lab & Companion Reactions',
      category: 'NAVIGATION',
      icon: <Smile className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('mascot'); onClose(); },
    },
    {
      id: 'nav-recommendations',
      title: 'Recommendation Signal Lab',
      category: 'NAVIGATION',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('recommendations'); onClose(); },
    },
    {
      id: 'nav-ai',
      title: 'AI Debugger & Latency Inspector',
      category: 'NAVIGATION',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('ai'); onClose(); },
    },
    {
      id: 'nav-errors',
      title: 'Error Center & Runtime Diagnostics',
      category: 'NAVIGATION',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      action: () => { onNavigateTab('errors'); onClose(); },
    },
    {
      id: 'nav-flags',
      title: 'Feature Flag Switchboard',
      category: 'NAVIGATION',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      action: () => { onNavigateTab('flags'); onClose(); },
    },
    {
      id: 'nav-security',
      title: 'Security Center & Cryptographic Posture',
      category: 'NAVIGATION',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('security'); onClose(); },
    },
    {
      id: 'nav-api',
      title: 'API Explorer & Endpoint Tester',
      category: 'NAVIGATION',
      icon: <Terminal className="w-4 h-4 text-blue-400" />,
      action: () => { onNavigateTab('api'); onClose(); },
    },
    {
      id: 'act-trigger-mascot',
      title: 'Quick Action: Trigger Piko Encouragement',
      category: 'ACTION',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        devEventBus.dispatchEvent('mascot.triggered', { expression: 'encouraging', message: 'Hebat! Terus semangat belajar ya.' });
        onClose();
      },
    },
    {
      id: 'act-sim-struggling',
      title: 'Quick Action: Generate Struggling Student Dataset',
      category: 'ACTION',
      icon: <Users className="w-4 h-4 text-rose-400" />,
      action: async () => {
        await userSimulatorService.generateSyntheticUser('STRUGGLING_STUDENT');
        onNavigateTab('simulator');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Search Bar */}
        <div className="p-3.5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to tool... (e.g. database, simulator, mascot)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-zinc-900">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition text-left ${
                    isSelected
                      ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cmd.icon}
                    <span>{cmd.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {cmd.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching developer commands.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Navigate: <kbd className="px-1 bg-zinc-800 rounded">↑</kbd> <kbd className="px-1 bg-zinc-800 rounded">↓</kbd> · Select: <kbd className="px-1 bg-zinc-800 rounded">↵</kbd></span>
          <span className="text-emerald-400 font-bold">PAHAM Dev Command Palette</span>
        </div>

      </div>
    </div>
  );
};
