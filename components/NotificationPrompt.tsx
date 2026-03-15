'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications/notificationManager';

const DISMISSED_KEY = 'notification-prompt-dismissed';

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (getNotificationPermission() !== 'default') return;

    // Check if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Show after 30 seconds — non-aggressive
    const timer = setTimeout(() => {
      // Re-check: user may have granted/denied in another tab
      if (getNotificationPermission() === 'default') {
        setVisible(true);
      }
    }, 30_000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setVisible(false);
    if (!granted) {
      // Permission denied or dismissed — mark session so we don't re-show
      sessionStorage.setItem(DISMISSED_KEY, '1');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm p-3 flex items-center gap-3 max-w-5xl mx-auto">
      <Bell size={20} className="text-[var(--color-cta)] shrink-0" />
      <p className="flex-1 text-sm font-medium">Activer les rappels de repas ?</p>
      <Button
        size="sm"
        className="bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta)]/90 shrink-0"
        onClick={handleEnable}
      >
        Activer
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600"
        aria-label="Plus tard"
      >
        <X size={18} />
      </button>
    </div>
  );
}
