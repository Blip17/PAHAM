// PAHAM Centralized Realtime Provider & React Context
// Initializes server-backed SSE streaming, manages active subscriptions, and dispatches global notifications

import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtimeClient, RealtimeConnectionStatus, RealtimeServerEvent } from './realtimeClient';
import { UserProfile } from '../../core/types';

interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  lastEvent: RealtimeServerEvent | null;
  unreadNotifications: any[];
  dismissNotification: (id: string) => Promise<boolean>;
  refreshInbox: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'DISCONNECTED',
  lastEvent: null,
  unreadNotifications: [],
  dismissNotification: async () => false,
  refreshInbox: async () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider: React.FC<{
  userProfile?: UserProfile | null;
  children: React.ReactNode;
}> = ({ userProfile, children }) => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>(realtimeClient.getStatus());
  const [lastEvent, setLastEvent] = useState<RealtimeServerEvent | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

  const activeUserId = userProfile?.id || 'guest-anonymous';

  // Connect to server-backed SSE stream on mount or when user changes
  useEffect(() => {
    const unsubStatus = realtimeClient.onStatusChange(newStatus => {
      setStatus(newStatus);
    });

    realtimeClient.connect(activeUserId);

    // Initial inbox fetch for persistent notifications across page reloads
    refreshInbox();

    // Listen for incoming server notifications
    const unsubNotif = realtimeClient.subscribe('pami.notification', (event) => {
      setLastEvent(event);
      refreshInbox();
    });

    const unsubState = realtimeClient.subscribe('pami.state_change', (event) => {
      setLastEvent(event);
    });

    const unsubAnnounce = realtimeClient.subscribe('announcement.created', (event) => {
      setLastEvent(event);
      refreshInbox();
    });

    return () => {
      unsubStatus();
      unsubNotif();
      unsubState();
      unsubAnnounce();
      realtimeClient.disconnect();
    };
  }, [activeUserId]);

  const refreshInbox = async () => {
    const notifs = await realtimeClient.fetchInbox(activeUserId);
    setUnreadNotifications(notifs);
  };

  const handleDismissNotification = async (notificationId: string): Promise<boolean> => {
    const ok = await realtimeClient.dismissNotification(notificationId, activeUserId);
    if (ok) {
      setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
    return ok;
  };

  return (
    <RealtimeContext.Provider
      value={{
        status,
        lastEvent,
        unreadNotifications,
        dismissNotification: handleDismissNotification,
        refreshInbox,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
