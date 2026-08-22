import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../dev/_auth';
import { ServerEventStore } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  // GET: Fetch active notifications for user
  if (req.method === 'GET') {
    const { userId = 'guest-anonymous' } = req.query;

    const notifications = ServerEventStore.getActiveNotificationsForUser(String(userId));

    return res.status(200).json({
      success: true,
      userId: String(userId),
      notifications,
      unreadCount: notifications.filter((n: any) => n.status !== 'READ').length,
      timestamp: new Date().toISOString(),
    });
  }

  // POST: Dismiss or mark as read
  if (req.method === 'POST') {
    const { notificationId, action = 'DISMISS', userId = 'guest-anonymous' } = req.body || {};

    if (!notificationId) {
      return res.status(400).json({ success: false, error: 'notificationId is required.' });
    }

    const success = ServerEventStore.dismissNotification(notificationId, String(userId));

    return res.status(200).json({
      success,
      notificationId,
      action,
      message: success ? `Notification ${notificationId} marked as ${action}.` : 'Notification not found or already dismissed.',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
