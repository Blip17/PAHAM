// PAHAM Centralized Realtime Client
// Connects to server-backed SSE event stream, manages reconnects, and dispatches server events

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
  private status: RealtimeConnectionStatus = 'DISCONNECTED';
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<(status: RealtimeConnectionStatus) => void> = new Set();
  private currentUserId: string = 'guest-anonymous';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private activePollingInterval: any = null;

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
   * Dispatch incoming server event to matching subscribers
   */
  public dispatch(eventType: string, eventData: any) {
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
   * Connect to server-sent events stream with user context
   */
  public connect(userId = 'guest-anonymous') {
    this.currentUserId = userId || 'guest-anonymous';

    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setStatus('CONNECTING');

    try {
      const url = `/api/events/stream?userId=${encodeURIComponent(this.currentUserId)}&env=${import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`;
      const es = new EventSource(url);
      this.eventSource = es;

      es.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.stopPollingFallback();
      };

      // Listen for system handshake
      es.addEventListener('system.handshake', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('system.handshake', data);
        } catch {}
      });

      // Listen for Pami notifications
      es.addEventListener('pami.notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('pami.notification', data);
        } catch {}
      });

      // Listen for Pami state changes
      es.addEventListener('pami.state_change', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('pami.state_change', data);
        } catch {}
      });

      // Listen for recommendations
      es.addEventListener('recommendation.created', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('recommendation.created', data);
        } catch {}
      });

      // Listen for general announcements
      es.addEventListener('announcement.created', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('announcement.created', data);
        } catch {}
      });

      // Listen for developer test events
      es.addEventListener('developer.test_event', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch('developer.test_event', data);
        } catch {}
      });

      // Generic message handler
      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const type = data.eventType || 'message';
          this.dispatch(type, data);
        } catch {}
      };

      es.onerror = () => {
        this.setStatus('RECONNECTING');
        es.close();
        this.eventSource = null;
        this.scheduleReconnect();
        this.startPollingFallback();
      };

    } catch {
      this.setStatus('ERROR');
      this.startPollingFallback();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentUserId);
    }, delay);
  }

  /**
   * Resilient polling fallback if SSE is disconnected
   */
  private startPollingFallback() {
    if (this.activePollingInterval) return;

    this.activePollingInterval = setInterval(async () => {
      try {
        const notifs = await this.fetchInbox(this.currentUserId);
        if (notifs && notifs.length > 0) {
          notifs.forEach(notif => {
            this.dispatch(notif.eventType || 'pami.notification', {
              eventId: notif.eventId,
              eventType: notif.eventType,
              priority: notif.priority,
              payload: notif.payload,
              createdAt: notif.createdAt,
            });
          });
        }
      } catch {}
    }, 8000);
  }

  private stopPollingFallback() {
    if (this.activePollingInterval) {
      clearInterval(this.activePollingInterval);
      this.activePollingInterval = null;
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPollingFallback();
    this.setStatus('DISCONNECTED');
  }

  /**
   * Fetch active persistent notifications for user across page reloads
   */
  public async fetchInbox(userId = this.currentUserId): Promise<any[]> {
    try {
      const res = await fetch(`/api/events/inbox?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
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
      const res = await fetch('/api/events/inbox', {
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
