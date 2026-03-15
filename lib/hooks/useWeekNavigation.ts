'use client';

import { useState, useMemo, useCallback } from 'react';

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekKey(date: Date): string {
  const week = getISOWeekNumber(date);
  const year = date.getFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(monday: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function useWeekNavigation() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const monday = useMemo(() => getMondayOfWeek(currentDate), [currentDate]);
  const weekKey = useMemo(() => getWeekKey(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDates(monday), [monday]);

  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return {
    weekKey,
    weekDates,
    monday,
    dayNames,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    isCurrentWeek: getWeekKey(new Date()) === weekKey,
  };
}
