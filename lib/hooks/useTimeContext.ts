'use client';

import { useState, useEffect } from 'react';
import type { MealType } from '@/types';

interface TimeContext {
  focusMeal: MealType;
  currentHour: number;
  isWeekend: boolean;
  isMondayMorning: boolean;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonLabel: string;
  seasonVegetables: string[];
}

const SEASON_DATA: Record<string, { label: string; vegetables: string[] }> = {
  winter: { label: '❄️ Hiver', vegetables: ['Poireaux', 'Choux', 'Carottes', 'Navets', 'Courges', 'Endives'] },
  spring: { label: '🌸 Printemps', vegetables: ['Asperges', 'Petits pois', 'Radis', 'Épinards', 'Artichauts'] },
  summer: { label: '☀️ Été', vegetables: ['Tomates', 'Courgettes', 'Aubergines', 'Poivrons', 'Haricots verts'] },
  autumn: { label: '🍂 Automne', vegetables: ['Potiron', 'Champignons', 'Brocolis', 'Betteraves', 'Céleri'] },
};

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getFocusMeal(hour: number): MealType {
  if (hour >= 6 && hour <= 10) return 'breakfast';
  if (hour >= 11 && hour <= 14) return 'lunch';
  return 'dinner';
}

export function useTimeContext(): TimeContext {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hour = now.getHours();
  const day = now.getDay();
  const month = now.getMonth();
  const season = getSeason(month);
  const seasonInfo = SEASON_DATA[season];

  return {
    focusMeal: getFocusMeal(hour),
    currentHour: hour,
    isWeekend: day === 0 || day === 6,
    isMondayMorning: day === 1 && hour < 12,
    season,
    seasonLabel: seasonInfo.label,
    seasonVegetables: seasonInfo.vegetables,
  };
}
