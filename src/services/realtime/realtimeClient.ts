// PAHAM Centralized Realtime Client
// Connects to server-backed SSE event stream, Supabase Realtime Channels, and periodic inbox sync

import { isSupabaseConfigured, supabase } from '../supabaseClient';

export type RealtimeConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export type EventCallback = (eventPayload: any) => void;

export interface RealtimeServerEvent {
  eventId: string;
  eventType: string;
  createdAt: string;
  createdBy?: string;
  environment?: string;
  targetType?: string;
  targetId?: string;
  payload: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isPersistentReplay?: boolean;
}

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private supabaseChannel: any = null;
  private status: RealtimeConnectionStatus = 'DISCONNECTED';
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<(status: RealtimeConnectionStatus) => void> = new Set();
  private currentUserId: string = 'guest-anonymous';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private activePollingInterval: any = null;
  private seenEventIds: Set<string> = new Set();

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: RealtimeConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(listener => {
      try {
        listener(newStatus);
      } catch {}
    });
  }

  public onStatusChange(callback: (status: RealtimeConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Subscribe to a specific event type (e.g. 'pami.notification', 'pami.state_change', or '*' for all)
   */
  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Dispatch incoming server event to matching subscribers with deduplication
   */
  public dispatch(eventType: string, eventData: any) {
    const eventKey = eventData?.eventId || eventData?.id;
    if (eventKey) {
      if (this.seenEventIds.has(eventKey)) {
        return; // Already processed
      }
      this.seenEventIds.add(eventKey);
    }

    // Specific event listeners
    const specific = this.listeners.get(eventType);
    if (specific) {
      specific.forEach(cb => {
        try { cb(eventData); } catch {}
      });
    }

    // Wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach(cb => {
        try { cb(eventData); } catch {}
      });
    }
  }

  /**
   * Connect to server stream and persistent sync
   */
  public connect(userId = 'guest-anonymous') {
    this.currentUserId = userId || 'guest-anonymous';

    if (typeof window === 'undefined') return;

    this.setStatus('CONNECTING');

    // 1. Initialize Supabase Realtime Channel if configured
    try {
      if (isSupabaseConfigured && supabase) {
        if (this.supabaseChannel) {
          supabase.removeChannel(this.supabaseChannel);
        }

        this.supabaseChannel = supabase.channel('paham-global-broadcast')
          .on('broadcast', { event: 'pami.notification' }, (payload: any) => {
            this.dispatch('pami.notification', payload.payload || payload);
          })
          .on('broadcast', { event: 'pami.state_change' }, (payload: any) => {
            this.dispatch('pami.state_change', payload.payload || payload);
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              this.setStatus('CONNECTED');
            }
          });
      }
    } catch {}

    // 2. Initialize SSE stream (with graceful error handling for serverless timeouts)
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const url = `/api/events?action=stream&userId=${encodeURIComponent(this.currentUserId)}`;
      const es = new EventSource(url);
      this.eventSource = es;

      es.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
      };

      es.addEventListener('pami.notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('pami.notification', data);
        } catch {}
      });

      es.addEventListener('pami.state_change', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('pami.state_change', data);
        } catch {}
      });

      es.onerror = () => {
        // SSE closed or timed out by serverless gateway; persistent polling handles seamless delivery
        es.close();
        this.eventSource = null;
      };
    } catch {}

    // 3. Always maintain active inbox synchronization (every 3.5s) to guarantee delivery across serverless lambdas
    this.startActiveSync();
  }

  private startActiveSync() {
    if (this.activePollingInterval) return;

    // Immediately trigger initial sync
    this.syncInbox();

    this.activePollingInterval = setInterval(() => {
      this.syncInbox();
    }, 3500);
  }

  private async syncInbox() {
    try {
      const notifs = await this.fetchInbox(this.currentUserId);
      if (notifs && notifs.length > 0) {
        notifs.forEach(notif => {
          const notifKey = notif.id || notif.eventId;
          if (notifKey && !this.seenEventIds.has(notifKey)) {
            this.dispatch(notif.eventType || 'pami.notification', {
              eventId: notif.eventId || notif.id,
              eventType: notif.eventType,
              priority: notif.priority,
              payload: notif.payload,
              createdAt: notif.createdAt,
            });
          }
        });
      }
      if (this.status !== 'CONNECTED') {
        this.setStatus('CONNECTED');
      }
    } catch {}
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    if (this.activePollingInterval) {
      clearInterval(this.activePollingInterval);
      this.activePollingInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.setStatus('DISCONNECTED');
  }

  /**
   * Fetch active persistent notifications for user across page reloads
   */
  public async fetchInbox(userId = this.currentUserId): Promise<any[]> {
    try {
      // Primary: Unified endpoint /api/events?action=inbox
      const res = await fetch(`/api/events?action=inbox&userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.notifications || [];
      }
    } catch {}

    // Fallback: /api/events/inbox
    try {
      const fallbackRes = await fetch(`/api/events/inbox?userId=${encodeURIComponent(userId)}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.notifications || [];
      }
    } catch {}

    return [];
  }

  /**
   * Dismiss persistent notification on server
   */
  public async dismissNotification(notificationId: string, userId = this.currentUserId): Promise<boolean> {
    try {
      const res = await fetch('/api/events?action=dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'DISMISS', userId }),
      });
      return res.ok;
    } catch {}
    return false;
  }
}

export const realtimeClient = new RealtimeClient();
