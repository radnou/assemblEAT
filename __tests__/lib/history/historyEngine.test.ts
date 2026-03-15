import { describe, it, expect } from 'vitest';
import { computeWeeklyHistory } from '@/lib/history/historyEngine';
import type { MealFeedback } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFeedback(
  assemblyId: string,
  date: string,
  pleasure: MealFeedback['pleasure'] = 4
): MealFeedback {
  return { assemblyId, date, pleasure, quantity: 'just_right', note: null };
}

/**
 * Returns an ISO week key "YYYY-WW" for a date string "YYYY-MM-DD".
 * Mirrors the internal logic of historyEngine so we can build test data
 * that is guaranteed to land in specific weeks.
 */
function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns a date string (YYYY-MM-DD) that falls within the current ISO week
 * offset by `weeksAgo` weeks.
 */
function dateNWeeksAgo(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString().split('T')[0];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeWeeklyHistory', () => {
  it('returns exactly 12 WeekSummary entries when called with default weeks param', () => {
    const result = computeWeeklyHistory([]);
    expect(result).toHaveLength(12);
  });

  it('returns exactly N WeekSummary entries when weeks param is specified', () => {
    expect(computeWeeklyHistory([], 4)).toHaveLength(4);
    expect(computeWeeklyHistory([], 1)).toHaveLength(1);
    expect(computeWeeklyHistory([], 20)).toHaveLength(20);
  });

  it('returns all-empty summaries when no feedbacks are provided', () => {
    const result = computeWeeklyHistory([]);
    for (const summary of result) {
      expect(summary.totalMeals).toBe(0);
      expect(summary.avgPleasure).toBe(0);
      expect(summary.feedbackCount).toBe(0);
      expect(summary.topProtein).toBeNull();
    }
  });

  it('result is sorted chronologically (oldest first)', () => {
    const result = computeWeeklyHistory([]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].weekKey <= result[i].weekKey).toBe(true);
    }
  });

  it('each summary contains a valid startDate string', () => {
    const result = computeWeeklyHistory([]);
    for (const summary of result) {
      expect(summary.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('correctly populates summary for a week with one feedback', () => {
    const date = dateNWeeksAgo(1);
    const weekKey = getISOWeekKey(date);
    const feedback = makeFeedback('assembly-abc', date, 4);

    const result = computeWeeklyHistory([feedback]);
    const week = result.find((s) => s.weekKey === weekKey);

    expect(week).toBeDefined();
    expect(week!.totalMeals).toBe(1);
    expect(week!.feedbackCount).toBe(1);
    expect(week!.avgPleasure).toBe(4);
    expect(week!.topProtein).toBe('assembly-abc');
  });

  it('computes avgPleasure as the mean of all feedbacks in the week', () => {
    const date = dateNWeeksAgo(0); // current week
    const weekKey = getISOWeekKey(date);
    const feedbacks: MealFeedback[] = [
      makeFeedback('a1', date, 2),
      makeFeedback('a2', date, 4),
      makeFeedback('a3', date, 3),
    ];

    const result = computeWeeklyHistory(feedbacks);
    const week = result.find((s) => s.weekKey === weekKey);

    expect(week).toBeDefined();
    // Mean of 2,4,3 = 3.0
    expect(week!.avgPleasure).toBe(3);
  });

  it('rounds avgPleasure to one decimal place', () => {
    const date = dateNWeeksAgo(0);
    const weekKey = getISOWeekKey(date);
    const feedbacks: MealFeedback[] = [
      makeFeedback('a1', date, 1),
      makeFeedback('a2', date, 2),
      makeFeedback('a3', date, 2),
    ];
    // Mean = 5/3 ≈ 1.666... → rounded to 1.7
    const result = computeWeeklyHistory(feedbacks);
    const week = result.find((s) => s.weekKey === weekKey);
    expect(week!.avgPleasure).toBe(1.7);
  });

  it('identifies the most frequent assemblyId as topProtein', () => {
    const date = dateNWeeksAgo(0);
    const weekKey = getISOWeekKey(date);
    const feedbacks: MealFeedback[] = [
      makeFeedback('assembly-X', date, 3),
      makeFeedback('assembly-X', date, 4),
      makeFeedback('assembly-Y', date, 5),
    ];

    const result = computeWeeklyHistory(feedbacks);
    const week = result.find((s) => s.weekKey === weekKey);
    expect(week!.topProtein).toBe('assembly-X');
  });

  it('returns topProtein of the single assembly when there is only one', () => {
    const date = dateNWeeksAgo(0);
    const weekKey = getISOWeekKey(date);
    const feedbacks = [makeFeedback('only-one', date, 3)];

    const result = computeWeeklyHistory(feedbacks);
    const week = result.find((s) => s.weekKey === weekKey);
    expect(week!.topProtein).toBe('only-one');
  });

  it('feedbacks outside the requested window do not appear in any summary', () => {
    // Place a feedback 100 weeks in the past — well outside the 12-week window
    const oldDate = dateNWeeksAgo(100);
    const feedback = makeFeedback('old-assembly', oldDate, 5);

    const result = computeWeeklyHistory([feedback], 12);
    for (const summary of result) {
      expect(summary.totalMeals).toBe(0);
    }
  });

  it('handles feedbacks spread across multiple weeks correctly', () => {
    const dateWeek0 = dateNWeeksAgo(0);
    const dateWeek2 = dateNWeeksAgo(2);

    const feedbacks: MealFeedback[] = [
      makeFeedback('a1', dateWeek0, 5),
      makeFeedback('a2', dateWeek2, 1),
    ];

    const result = computeWeeklyHistory(feedbacks, 12);

    const week0Key = getISOWeekKey(dateWeek0);
    const week2Key = getISOWeekKey(dateWeek2);

    const week0 = result.find((s) => s.weekKey === week0Key);
    const week2 = result.find((s) => s.weekKey === week2Key);

    expect(week0?.totalMeals).toBe(1);
    expect(week0?.avgPleasure).toBe(5);
    expect(week2?.totalMeals).toBe(1);
    expect(week2?.avgPleasure).toBe(1);
  });

  it('weeks with no feedbacks have totalMeals=0 and topProtein=null', () => {
    // Put feedbacks only in current week; all other weeks should be empty
    const date = dateNWeeksAgo(0);
    const feedback = makeFeedback('a1', date, 4);
    const result = computeWeeklyHistory([feedback], 12);

    const emptyWeeks = result.filter((s) => s.totalMeals === 0);
    expect(emptyWeeks.length).toBeGreaterThanOrEqual(10);
    for (const week of emptyWeeks) {
      expect(week.topProtein).toBeNull();
      expect(week.avgPleasure).toBe(0);
    }
  });
});
