// PAHAM Real-Time Live Remote & Web Synchronization Service
// Allows developers in /dev to remotely control live student tabs (expressions, speech bubbles, surprise announcements)

import { MascotState } from '../../components/mascot/PahamMascot';

export type MascotLiveExpression = MascotState;

export interface LiveBroadcastPayload {
  id: string;
  expression: MascotLiveExpression;
  message?: string;
  displayMode: 'TOP_BANNER' | 'CORNER_BUBBLE' | 'BOTH';
  durationSeconds: number; // 0 = permanent until cleared
  playSound?: boolean;
  senderName?: string;
  timestamp: string;
}

class LiveRemoteService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((payload: LiveBroadcastPayload | null) => void)[] = [];
  private currentOverride: LiveBroadcastPayload | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('paham_live_remote_channel');
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'LIVE_BROADCAST') {
          this.handleIncomingBroadcast(event.data.payload);
        } else if (event.data?.type === 'CLEAR_BROADCAST') {
          this.handleIncomingBroadcast(null);
        }
      };
    }

    // Also listen to window storage event for multi-tab fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'paham_live_broadcast_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.handleIncomingBroadcast(parsed);
          } catch {}
        } else if (e.key === 'paham_live_broadcast_event' && !e.newValue) {
          this.handleIncomingBroadcast(null);
        }
      });
    }
  }

  /**
   * Broadcasts a live state change to all running tabs and windows
   */
  public broadcast(payload: Omit<LiveBroadcastPayload, 'id' | 'timestamp'>): LiveBroadcastPayload {
    const fullPayload: LiveBroadcastPayload = {
      ...payload,
      id: `live-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    this.currentOverride = fullPayload;

    // 1. Post to BroadcastChannel
    try {
      this.channel?.postMessage({ type: 'LIVE_BROADCAST', payload: fullPayload });
    } catch {}

    // 2. Write to localStorage for cross-tab storage event
    try {
      localStorage.setItem('paham_live_broadcast_event', JSON.stringify(fullPayload));
    } catch {}

    // 3. Dispatch local DOM custom event for current window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paham:live-broadcast', { detail: fullPayload }));
    }

    this.notifyListeners(fullPayload);
    return fullPayload;
  }

  /**
   * Clears any active live override and returns to normal heuristic state
   */
  public clearOverride() {
    this.currentOverride = null;
    try {
      this.channel?.postMessage({ type: 'CLEAR_BROADCAST' });
      localStorage.removeItem('paham_live_broadcast_event');
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paham:live-broadcast-clear'));
    }

    this.notifyListeners(null);
  }

  /**
   * Subscribes to live remote broadcasts
   */
  public subscribe(callback: (payload: LiveBroadcastPayload | null) => void): () => void {
    this.listeners.push(callback);
    // Send current active state immediately if exists
    if (this.currentOverride) {
      callback(this.currentOverride);
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getCurrentOverride(): LiveBroadcastPayload | null {
    return this.currentOverride;
  }

  private handleIncomingBroadcast(payload: LiveBroadcastPayload | null) {
    this.currentOverride = payload;
    this.notifyListeners(payload);
  }

  private notifyListeners(payload: LiveBroadcastPayload | null) {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('[LiveRemoteService] Listener error:', err);
      }
    }
  }
}

export const liveRemoteService = new LiveRemoteService();
