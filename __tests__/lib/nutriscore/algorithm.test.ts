import { describe, it, expect } from 'vitest';
import { calculateNutriScore } from '@/lib/nutriscore/algorithm';

describe('calculateNutriScore', () => {
  it('returns Grade A for broccoli (high fiber, high fruit/veg, low negatives)', () => {
    const result = calculateNutriScore(
      {
        energy_kj: 146,
        sugars: 1.7,
        saturated_fat: 0.04,
        salt: 0.04,
        fiber: 3.3,
        protein: 2.8,
      },
      100, // fruitVegPercent
      'general'
    );

    expect(result.grade).toBe('A');
    expect(result.score).toBeLessThanOrEqual(0);
  });

  it('returns Grade A for chicken (high protein, low negatives)', () => {
    const result = calculateNutriScore(
      {
        energy_kj: 695,
        sugars: 0,
        saturated_fat: 1.3,
        salt: 0.3,
        fiber: 0,
        protein: 26,
      },
      0, // fruitVegPercent
      'general'
    );

    expect(result.grade).toBe('A');
    expect(result.score).toBeLessThanOrEqual(0);
  });

  it('applies protein cap when nPoints >= 7 and category is not cheese', () => {
    // Construct a food with nPoints >= 7 so the protein cap rule activates
    // energy_kj=2350 (>2345 threshold → 7pts), sugars=0, sat_fat=0, salt=0 → nPoints=7
    const withCap = calculateNutriScore(
      {
        energy_kj: 2350,
        sugars: 0,
        saturated_fat: 0,
        salt: 0,
        fiber: 0,
        protein: 26, // would be 7 pts if not capped
      },
      0,
      'general' // protein cap applies
    );

    const withoutCap = calculateNutriScore(
      {
        energy_kj: 2350,
        sugars: 0,
        saturated_fat: 0,
        salt: 0,
        fiber: 0,
        protein: 26,
      },
      0,
      'cheese' // protein cap does NOT apply for cheese
    );

    // With cap: protein excluded from pPoints → higher score
    expect(withCap.score).toBeGreaterThan(withoutCap.score);
    // Confirm protein cap is in effect: pPoints should equal 0 (no fiber, no fruitVeg)
    expect(withCap.pPoints).toBe(0);
  });

  it('does NOT apply protein cap for cheese even when nPoints >= 7', () => {
    const result = calculateNutriScore(
      {
        energy_kj: 2350,
        sugars: 0,
        saturated_fat: 0,
        salt: 0,
        fiber: 0,
        protein: 26, // 7 pts
      },
      0,
      'cheese'
    );

    // Cheese is exempt: protein (7 pts) counts even though nPoints=7
    // pPoints = fiber(0) + protein(7) + fruitVeg(0) = 7
    expect(result.pPoints).toBe(7);
    expect(result.details.protein).toBe(7);
  });

  it('returns Grade E for junk food (very high negatives)', () => {
    const result = calculateNutriScore(
      {
        energy_kj: 3500,
        sugars: 50,
        saturated_fat: 12,
        salt: 3,
        fiber: 0,
        protein: 2,
      },
      0,
      'general'
    );

    expect(result.grade).toBe('E');
    expect(result.score).toBeGreaterThan(18);
  });
});
