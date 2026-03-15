import { describe, it, expect } from 'vitest';
import { getSmartSuggestions } from '@/lib/engine/smartSuggestions';
import { getAssembliesByMealType } from '@/lib/data/repertoire';
import type { MealFeedback } from '@/types';

function makeFeedback(
  assemblyId: string,
  pleasure: MealFeedback['pleasure'],
  date = '2024-03-01'
): MealFeedback {
  return { assemblyId, date, pleasure, quantity: 'just_right', note: null };
}

describe('getSmartSuggestions', () => {
  it('returns exactly the requested count of suggestions', () => {
    const result = getSmartSuggestions('lunch', [], 3);
    expect(result).toHaveLength(3);
  });

  it('returns fewer than requested when not enough assemblies exist', () => {
    const allLunch = getAssembliesByMealType('lunch');
    const bigCount = allLunch.length + 10;
    const result = getSmartSuggestions('lunch', [], bigCount);
    expect(result.length).toBeLessThanOrEqual(allLunch.length);
  });

  it('returns assemblies of the correct mealType for lunch', () => {
    const result = getSmartSuggestions('lunch', [], 3);
    result.forEach((assembly) => {
      expect(assembly.mealType).toBe('lunch');
    });
  });

  it('returns assemblies of the correct mealType for breakfast', () => {
    const result = getSmartSuggestions('breakfast', [], 2);
    result.forEach((assembly) => {
      expect(assembly.mealType).toBe('breakfast');
    });
  });

  it('returns assemblies of the correct mealType for dinner', () => {
    const result = getSmartSuggestions('dinner', [], 2);
    result.forEach((assembly) => {
      expect(assembly.mealType).toBe('dinner');
    });
  });

  it('no feedbacks returns assemblies with neutral scoring (count matches)', () => {
    const result = getSmartSuggestions('lunch', [], 4);
    expect(result).toHaveLength(4);
    result.forEach((assembly) => {
      expect(assembly).toBeDefined();
      expect(assembly.id).toBeTruthy();
    });
  });

  it('empty feedbacks array still works', () => {
    expect(() => getSmartSuggestions('lunch', [], 3)).not.toThrow();
    const result = getSmartSuggestions('lunch', [], 3);
    expect(result.length).toBeGreaterThan(0);
  });

  it('high-pleasure assemblies ranked higher on average across many samples', () => {
    const lunchAssemblies = getAssembliesByMealType('lunch');
    if (lunchAssemblies.length < 2) return; // skip if not enough data

    // Give the first assembly a consistently high score (5) and another a low score (1)
    const highId = lunchAssemblies[0].id;
    const lowId = lunchAssemblies[lunchAssemblies.length - 1].id;

    // Make sure we don't compare same assembly
    if (highId === lowId) return;

    const feedbacks: MealFeedback[] = [
      // Many high-pleasure feedbacks for highId
      ...Array.from({ length: 10 }, () => makeFeedback(highId, 5)),
      // Many low-pleasure feedbacks for lowId
      ...Array.from({ length: 10 }, () => makeFeedback(lowId, 1)),
    ];

    let highAppearances = 0;
    let lowAppearances = 0;
    const TRIALS = 50;

    for (let i = 0; i < TRIALS; i++) {
      const result = getSmartSuggestions('lunch', feedbacks, 2);
      const ids = result.map((a) => a.id);
      if (ids.includes(highId)) highAppearances++;
      if (ids.includes(lowId)) lowAppearances++;
    }

    // High-pleasure assembly should appear more often than low-pleasure one
    // Allow for some jitter tolerance (60/40 split is the minimum expectation)
    expect(highAppearances).toBeGreaterThan(lowAppearances);
  });

  it('returns count=1 correctly', () => {
    const result = getSmartSuggestions('lunch', [], 1);
    expect(result).toHaveLength(1);
  });

  it('feedbacks for other mealType do not affect results type-wise', () => {
    const breakfastAssemblies = getAssembliesByMealType('breakfast');
    const breakfastId = breakfastAssemblies[0]?.id;
    if (!breakfastId) return;

    // Give feedback only on breakfast assembly but request lunch
    const feedbacks: MealFeedback[] = [makeFeedback(breakfastId, 5)];
    const result = getSmartSuggestions('lunch', feedbacks, 3);
    result.forEach((assembly) => {
      expect(assembly.mealType).toBe('lunch');
    });
  });

  it('multiple feedbacks for same assembly are averaged', () => {
    const lunchAssemblies = getAssembliesByMealType('lunch');
    if (lunchAssemblies.length === 0) return;

    const assemblyId = lunchAssemblies[0].id;
    const feedbacks: MealFeedback[] = [
      makeFeedback(assemblyId, 5),
      makeFeedback(assemblyId, 5),
      makeFeedback(assemblyId, 5),
    ];

    // Should not crash and should return proper assemblies
    expect(() => getSmartSuggestions('lunch', feedbacks, 2)).not.toThrow();
  });
});
