'use client';

import { useMemo } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  month: string;                  // "Mars 2026"
  monthKey: string;               // "2026-03"
  totalMeals: number;             // meals validated this month
  avgScore: string;               // average Indice d'equilibre (A-E)
  topProtein: string;             // most used protein
  topVegetable: string;           // most used vegetable
  varietyCount: number;           // unique ingredients used
  bestDay: string;                // day with highest score
  challengesCompleted: number;    // weekly challenges completed
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getGradeValue(componentCount: number): number {
  if (componentCount >= 3) return 2; // B
  if (componentCount >= 2) return 3; // C
  return 4; // D
}

function valueToGrade(avg: number): string {
  if (avg <= 1.5) return 'A';
  if (avg <= 2.5) return 'B';
  if (avg <= 3.5) return 'C';
  if (avg <= 4.5) return 'D';
  return 'E';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMonthlyStats(): { stats: MonthlyStats | null; isAvailable: boolean } {
  const feedbacks = useMealStore((s) => s.feedbacks);
  const weekPlans = useMealStore((s) => s.weekPlans);

  const result = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthLabel = `${MONTH_NAMES_FR[currentMonth]} ${currentYear}`;

    // Filter feedbacks for the current month
    const monthFeedbacks = feedbacks.filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMeals = monthFeedbacks.length;

    if (totalMeals < 10) {
      return { stats: null, isAvailable: false };
    }

    // Collect all assemblies from week plans that fall in this month
    const proteinCounts: Record<string, number> = {};
    const vegetableCounts: Record<string, number> = {};
    const uniqueIngredients = new Set<string>();
    const dayScores: Record<string, { total: number; count: number }> = {};

    // Track validated assembly IDs from feedbacks
    const validatedAssemblyIds = new Set(monthFeedbacks.map((f) => f.assemblyId));

    // Scan all week plans for assemblies
    for (const weekPlan of Object.values(weekPlans)) {
      for (const day of weekPlan.days) {
        for (const meal of [day.breakfast, day.lunch, day.dinner]) {
          if (!meal || !meal.id) continue;
          if (!validatedAssemblyIds.has(meal.id)) continue;

          // Count components
          let componentCount = 0;
          if (meal.protein) {
            proteinCounts[meal.protein.name] = (proteinCounts[meal.protein.name] || 0) + 1;
            uniqueIngredients.add(meal.protein.name);
            componentCount++;
          }
          if (meal.vegetable) {
            vegetableCounts[meal.vegetable.name] = (vegetableCounts[meal.vegetable.name] || 0) + 1;
            uniqueIngredients.add(meal.vegetable.name);
            componentCount++;
          }
          if (meal.cereal) {
            uniqueIngredients.add(meal.cereal.name);
            componentCount++;
          }
          if (meal.sauce) {
            uniqueIngredients.add(meal.sauce.name);
          }

          // Score per day
          const dateKey = day.date || '';
          if (dateKey) {
            if (!dayScores[dateKey]) dayScores[dateKey] = { total: 0, count: 0 };
            dayScores[dateKey].total += getGradeValue(componentCount);
            dayScores[dateKey].count++;
          }
        }
      }
    }

    // Also scan today's meals (not yet in weekPlans)
    const todayMeals = useMealStore.getState();
    for (const meal of [todayMeals.todayBreakfast, todayMeals.todayLunch, todayMeals.todayDinner]) {
      if (!meal || !meal.id || !validatedAssemblyIds.has(meal.id)) continue;
      if (meal.protein) {
        proteinCounts[meal.protein.name] = (proteinCounts[meal.protein.name] || 0) + 1;
        uniqueIngredients.add(meal.protein.name);
      }
      if (meal.vegetable) {
        vegetableCounts[meal.vegetable.name] = (vegetableCounts[meal.vegetable.name] || 0) + 1;
        uniqueIngredients.add(meal.vegetable.name);
      }
      if (meal.cereal) uniqueIngredients.add(meal.cereal.name);
      if (meal.sauce) uniqueIngredients.add(meal.sauce.name);
    }

    // Average pleasure as a proxy for score
    const avgPleasure = monthFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) / totalMeals;
    // Map pleasure (1-5) to grade: 5->A, 4->B, 3->C, 2->D, 1->E
    const avgScore = valueToGrade(6 - avgPleasure);

    // Top protein and vegetable
    const topProtein = Object.entries(proteinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const topVegetable = Object.entries(vegetableCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Best day (lowest avg grade value = best)
    let bestDay = '—';
    let bestDayScore = Infinity;
    for (const [date, scores] of Object.entries(dayScores)) {
      const avg = scores.total / scores.count;
      if (avg < bestDayScore) {
        bestDayScore = avg;
        bestDay = date;
      }
    }

    // Format best day
    if (bestDay !== '—') {
      try {
        const d = new Date(bestDay);
        bestDay = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      } catch {
        // keep raw date
      }
    }

    // Challenges completed (from localStorage)
    let challengesCompleted = 0;
    if (typeof window !== 'undefined') {
      try {
        const challenges = localStorage.getItem('weekly-challenges');
        if (challenges) {
          const parsed = JSON.parse(challenges) as { completed?: boolean; weekKey?: string }[];
          if (Array.isArray(parsed)) {
            challengesCompleted = parsed.filter((c) => c.completed).length;
          }
        }
      } catch {
        // ignore
      }
    }

    const stats: MonthlyStats = {
      month: monthLabel,
      monthKey,
      totalMeals,
      avgScore,
      topProtein,
      topVegetable,
      varietyCount: uniqueIngredients.size,
      bestDay,
      challengesCompleted,
    };

    return { stats, isAvailable: true };
  }, [feedbacks, weekPlans]);

  return result;
}
