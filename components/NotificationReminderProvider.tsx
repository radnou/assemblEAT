'use client';

import { useNotificationReminder } from '@/lib/hooks/useNotificationReminder';

export function NotificationReminderProvider() {
  useNotificationReminder();
  return null;
}
