// Server-Side Persistent Event & Notification Store for PAHAM
// Maintains persistent event logs, notification inboxes, and active SSE client connections

import { PahamEnvironment, sanitizeDevPayload } from '../dev/_auth';

export type EventTargetType = 'ALL_ONLINE_USERS' | 'ALL_USERS' | 'SPECIFIC_USER' | 'TEST_USERS' | 'ENVIRONMENT';

export type EventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface PahamServerEvent {
  eventId: string;
  eventType: string;
  createdAt: string;
  createdBy: string;
  environment: PahamEnvironment;
  targetType: EventTargetType;
  targetId?: string;
  payload: Record<string, any>;
  priority: EventPriority;
  expiresAt: string;
  status: 'PUBLISHED' | 'DELIVERED' | 'EXPIRED';
  deliveryStats: {
    targetCount: number;
    deliveredCount: number;
    deliveredClientIds: string[];
  };
}

export interface UserNotificationRecord {
  id: string;
  eventId: string;
  userId: string;
  eventType: string;
  title?: string;
  message: string;
  mascotState?: string;
  priority: EventPriority;
  payload: Record<string, any>;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  dismissedAt?: string;
  status: 'PENDING' | 'DELIVERED' | 'READ' | 'DISMISSED';
}

export interface ConnectedClient {
  clientId: string;
  userId: string;
  environment: PahamEnvironment;
  isTestUser: boolean;
  connectedAt: string;
  lastSeenAt: string;
  send: (eventData: string) => void;
}

// In-Memory global singleton store that survives across hot reloads and serverless invocations
declare global {
  var __paham_server_events: PahamServerEvent[] | undefined;
  var __paham_user_notifications: UserNotificationRecord[] | undefined;
  var __paham_active_clients: Map<string, ConnectedClient> | undefined;
}

if (!globalThis.__paham_server_events) {
  globalThis.__paham_server_events = [];
}
if (!globalThis.__paham_user_notifications) {
  globalThis.__paham_user_notifications = [];
}
if (!globalThis.__paham_active_clients) {
  globalThis.__paham_active_clients = new Map();
}

export class ServerEventStore {
  /**
   * Register a new SSE connected client
   */
  public static registerClient(client: ConnectedClient): () => void {
    const clients = globalThis.__paham_active_clients!;
    clients.set(client.clientId, client);

    return () => {
      clients.delete(client.clientId);
    };
  }

  /**
   * Get all currently online clients
   */
  public static getOnlineClients(): ConnectedClient[] {
    return Array.from(globalThis.__paham_active_clients!.values());
  }

  /**
   * Get total online clients count
   */
  public static getOnlineCount(env?: PahamEnvironment): number {
    const clients = Array.from(globalThis.__paham_active_clients!.values());
    if (env) {
      return clients.filter(c => c.environment === env).length;
    }
    return clients.length;
  }

  /**
   * Publish an event to the server store and broadcast in real-time to matching connected clients
   */
  public static publishEvent(eventData: Omit<PahamServerEvent, 'eventId' | 'createdAt' | 'status' | 'deliveryStats'>): PahamServerEvent {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();

    const newEvent: PahamServerEvent = {
      ...eventData,
      eventId,
      createdAt,
      status: 'PUBLISHED',
      deliveryStats: {
        targetCount: 0,
        deliveredCount: 0,
        deliveredClientIds: [],
      },
    };

    // Store in historical event ledger (keep last 500 events)
    globalThis.__paham_server_events!.unshift(newEvent);
    if (globalThis.__paham_server_events!.length > 500) {
      globalThis.__paham_server_events!.pop();
    }

    // Determine target clients and broadcast in realtime
    const clients = this.getOnlineClients();
    const matchingClients = clients.filter(client => {
      // Filter by environment if specified
      if (client.environment !== newEvent.environment && newEvent.environment !== 'DEVELOPMENT') {
        return false;
      }

      switch (newEvent.targetType) {
        case 'ALL_ONLINE_USERS':
        case 'ALL_USERS':
          return true;
        case 'SPECIFIC_USER':
          return client.userId === newEvent.targetId;
        case 'TEST_USERS':
          return client.isTestUser || client.userId.startsWith('dev-sim-') || client.userId.startsWith('test-');
        case 'ENVIRONMENT':
          return client.environment === newEvent.targetId;
        default:
          return true;
      }
    });

    newEvent.deliveryStats.targetCount = matchingClients.length;

    // Realtime Server Push to connected clients via SSE
    const sseFormattedData = `event: ${newEvent.eventType}\ndata: ${JSON.stringify(sanitizeDevPayload(newEvent))}\n\n`;

    matchingClients.forEach(client => {
      try {
        client.send(sseFormattedData);
        newEvent.deliveryStats.deliveredCount++;
        newEvent.deliveryStats.deliveredClientIds.push(client.clientId);
      } catch {
        // Client might have disconnected
      }
    });

    if (newEvent.deliveryStats.deliveredCount > 0) {
      newEvent.status = 'DELIVERED';
    }

    // Persist as notification for user inbox if it's a notification/announcement
    if (newEvent.eventType.startsWith('pami.') || newEvent.eventType.startsWith('announcement.') || newEvent.eventType.startsWith('recommendation.')) {
      this.createPersistentNotification(newEvent);
    }

    return newEvent;
  }

  /**
   * Persists a notification for users so it survives page reloads
   */
  private static createPersistentNotification(event: PahamServerEvent) {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notif: UserNotificationRecord = {
      id: notifId,
      eventId: event.eventId,
      userId: event.targetId || 'ALL',
      eventType: event.eventType,
      title: event.payload.title || (event.eventType === 'pami.notification' ? 'Pesan dari Piko' : 'Pemberitahuan Sistem'),
      message: event.payload.message || '',
      mascotState: event.payload.mascotState || event.payload.expression || 'happy',
      priority: event.priority,
      payload: event.payload,
      createdAt: event.createdAt,
      status: 'DELIVERED',
    };

    globalThis.__paham_user_notifications!.unshift(notif);
    if (globalThis.__paham_user_notifications!.length > 500) {
      globalThis.__paham_user_notifications!.pop();
    }
  }

  /**
   * Get active persistent notifications for a specific user upon page reload
   */
  public static getActiveNotificationsForUser(userId: string): UserNotificationRecord[] {
    const now = new Date().getTime();
    return (globalThis.__paham_user_notifications || []).filter(n => {
      // Must be targeted to ALL or this specific user
      const isTargetMatch = n.userId === 'ALL' || n.userId === userId || userId.startsWith('dev-sim-');
      const isNotDismissed = n.status !== 'DISMISSED';
      // Check expiration (default 24h)
      const createdTime = new Date(n.createdAt).getTime();
      const isNotExpired = (now - createdTime) < 24 * 60 * 60 * 1000;

      return isTargetMatch && isNotDismissed && isNotExpired;
    });
  }

  /**
   * Dismiss a notification
   */
  public static dismissNotification(notificationId: string, userId: string): boolean {
    const notif = (globalThis.__paham_user_notifications || []).find(n => n.id === notificationId);
    if (notif) {
      notif.status = 'DISMISSED';
      notif.dismissedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get complete event log history for Dev Cockpit
   */
  public static getEvents(limit = 100, eventType?: string): PahamServerEvent[] {
    let list = globalThis.__paham_server_events || [];
    if (eventType) {
      list = list.filter(e => e.eventType === eventType);
    }
    return list.slice(0, limit);
  }
}
