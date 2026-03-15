'use client';

import { useEffect } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { scheduleReminder } from '@/lib/notifications/notificationManager';

export function useNotificationReminder() {
  const { feedbacks, todayLunch, todayDinner } = useMealStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    // Check if it's meal time and no validation today
    const hour = new Date().getHours();
    const today = new Date().toLocaleDateString('en-CA');
    const todayFeedbacks = feedbacks.filter((f) => f.date === today);

    // Lunch reminder: 12:00-13:00, no lunch validated
    if (hour >= 12 && hour < 13 && !todayLunch?.validated && todayFeedbacks.length === 0) {
      scheduleReminder(
        "🍽️ C'est l'heure de manger !",
        'N\'oublie pas de valider ton déjeuner sur AssemblEat.',
        'lunch-reminder-' + today
      );
    }

    // Dinner reminder: 19:00-20:00, no dinner validated
    if (hour >= 19 && hour < 20 && !todayDinner?.validated) {
      scheduleReminder(
        '🌙 Bon appétit !',
        'Pense à valider ton dîner et donner ton feedback.',
        'dinner-reminder-' + today
      );
    }

    // Streak reminder: 21:00, no meals validated today
    if (hour >= 21 && hour < 22 && todayFeedbacks.length === 0) {
      scheduleReminder(
        '🔥 Ton streak est en danger !',
        'Valide au moins un repas aujourd\'hui pour garder ta série.',
        'streak-reminder-' + today
      );
    }
  }, [feedbacks, todayLunch, todayDinner]);
}
