import type { MealFeedback } from '@/types';

export interface WeekSummary {
  weekKey: string;
  startDate: string;
  totalMeals: number;
  avgPleasure: number;
  feedbackCount: number;
  topProtein: string | null;
}

/**
 * Returns the ISO week key "YYYY-WW" for a given date string "YYYY-MM-DD".
 */
function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  // Copy date to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO week: Thursday in current week decides the year
  const dayOfWeek = d.getUTCDay() || 7; // make Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns the Monday date for a given ISO week key "YYYY-WW".
 */
function getWeekStartDate(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // Jan 4 is always in week 1 (ISO 8601)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  return monday.toISOString().split('T')[0];
}

/**
 * Returns the last `weeks` ISO week keys ending with the current week,
 * sorted chronologically.
 */
function getLastNWeekKeys(weeks: number): string[] {
  const today = new Date();
  const result: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const dateStr = d.toISOString().split('T')[0];
    const key = getISOWeekKey(dateStr);
    if (!result.includes(key)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Computes a weekly history summary from feedbacks.
 * Returns the last `weeks` weeks sorted chronologically,
 * filling missing weeks with empty data.
 */
export function computeWeeklyHistory(
  feedbacks: MealFeedback[],
  weeks: number = 12
): WeekSummary[] {
  // Group feedbacks by week key
  const byWeek = new Map<string, MealFeedback[]>();
  for (const feedback of feedbacks) {
    const key = getISOWeekKey(feedback.date);
    if (!byWeek.has(key)) {
      byWeek.set(key, []);
    }
    byWeek.get(key)!.push(feedback);
  }

  const weekKeys = getLastNWeekKeys(weeks);

  return weekKeys.map((weekKey) => {
    const weekFeedbacks = byWeek.get(weekKey) ?? [];
    const startDate = getWeekStartDate(weekKey);

    if (weekFeedbacks.length === 0) {
      return {
        weekKey,
        startDate,
        totalMeals: 0,
        avgPleasure: 0,
        feedbackCount: 0,
        topProtein: null,
      };
    }

    const avgPleasure =
      weekFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) / weekFeedbacks.length;

    // Determine top protein from assemblyId (use the most frequent prefix or id)
    // assemblyId format may not contain protein info directly,
    // so we track most common assemblyId as a proxy
    const idCounts = new Map<string, number>();
    for (const f of weekFeedbacks) {
      idCounts.set(f.assemblyId, (idCounts.get(f.assemblyId) ?? 0) + 1);
    }
    let topProtein: string | null = null;
    let maxCount = 0;
    for (const [id, count] of idCounts) {
      if (count > maxCount) {
        maxCount = count;
        topProtein = id;
      }
    }

    return {
      weekKey,
      startDate,
      totalMeals: weekFeedbacks.length,
      avgPleasure: Math.round(avgPleasure * 10) / 10,
      feedbackCount: weekFeedbacks.length,
      topProtein,
    };
  });
}
