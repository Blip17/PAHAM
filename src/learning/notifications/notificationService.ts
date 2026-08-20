// Notification & Study Reminder Service for PAHAM Study Studio
// Grounded in Web Platform capabilities, Service Worker push, and quiet-hours enforcement

import { NotificationPreference } from '../../core/types';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreference = {
  enabled: true,
  studyReminders: true,
  examReminders: true,
  reviewReminders: true,
  dailyPlanning: true,
  reminderLeadMinutes: 5,
  frequency: 'normal',
  quietHoursStart: '22:00',
  quietHoursEnd: '06:30',
  permissionState: 'default',
};

export const notificationService = {
  /**
   * Checks browser notification capabilities
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Gets the current device permission state
   */
  getPermissionState(): NotificationPreference['permissionState'] {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPreference['permissionState'];
  },

  /**
   * Requests notification permission with user intention
   */
  async requestPermission(): Promise<NotificationPreference['permissionState']> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPreference['permissionState'];
    } catch {
      return 'denied';
    }
  },

  /**
   * Checks if current time is within quiet hours (e.g. 22:00 to 06:30)
   */
  isInsideQuietHours(prefs: NotificationPreference): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotal = currentHour * 60 + currentMin;

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal > endTotal) {
      // Crosses midnight (e.g. 22:00 to 06:30)
      return currentTotal >= startTotal || currentTotal < endTotal;
    } else {
      return currentTotal >= startTotal && currentTotal < endTotal;
    }
  },

  /**
   * Sends a helpful, academic reminder notification if permissions and quiet hours allow
   */
  async sendStudyReminder(
    title: string, 
    body: string, 
    prefs: NotificationPreference = DEFAULT_NOTIFICATION_PREFS
  ): Promise<boolean> {
    if (!prefs.enabled || this.isInsideQuietHours(prefs)) {
      return false;
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'paham-study-reminder',
          });
          return true;
        } else {
          new Notification(title, { body, icon: '/icon-192.png' });
          return true;
        }
      } catch (err) {
        console.warn('Notification delivery fallback to in-app:', err);
      }
    }
    return false;
  }
};
