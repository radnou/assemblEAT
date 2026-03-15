import { describe, it, expect } from 'vitest';
import { generateRoast } from '@/lib/roast/roastEngine';
import type { AssemblyRow, MealFeedback, MealComponent } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeComponent(id: string, name: string): MealComponent {
  return { id, name, category: 'protein', prepTime: 5, tags: [] };
}

function makeAssembly(id: string, overrides: Partial<AssemblyRow> = {}): AssemblyRow {
  return {
    id,
    mealType: 'lunch',
    protein: null,
    vegetable: null,
    cereal: null,
    sauce: null,
    validated: false,
    ...overrides,
  };
}

function makeWeekDay(
  breakfast: AssemblyRow | null = null,
  lunch: AssemblyRow | null = null,
  dinner: AssemblyRow | null = null
) {
  return { breakfast, lunch, dinner };
}

function emptyWeek(size = 7) {
  return Array.from({ length: size }, () => makeWeekDay());
}

function makeFeedback(
  assemblyId: string,
  pleasure: MealFeedback['pleasure'] = 4
): MealFeedback {
  return { assemblyId, date: '2024-03-01', pleasure, quantity: 'just_right', note: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateRoast – basic contract', () => {
  it('returns exactly 3 punchlines for a non-empty week', () => {
    const protein = makeComponent('p1', 'Chicken');
    const week = [makeWeekDay(null, makeAssembly('a1', { protein }))];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.punchlines).toHaveLength(3);
  });

  it('returns 3 punchlines even for a completely empty week', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'roast');
    expect(result.punchlines).toHaveLength(3);
  });

  it('every punchline is a non-empty string', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'kind');
    for (const p of result.punchlines) {
      expect(typeof p).toBe('string');
      expect(p.length).toBeGreaterThan(0);
    }
  });

  it('punchlines are not duplicated', () => {
    // Run multiple times to reduce flakiness due to randomness
    for (let i = 0; i < 5; i++) {
      const protein = makeComponent('p1', 'Tuna');
      const week = Array.from({ length: 5 }, () =>
        makeWeekDay(null, makeAssembly(`a${i}`, { protein }))
      );
      const result = generateRoast(week, [], 3, 'balanced', 'roast');
      const unique = new Set(result.punchlines);
      expect(unique.size).toBe(result.punchlines.length);
    }
  });
});

describe('generateRoast – mode (roast vs kind)', () => {
  it('roast mode and kind mode produce structurally valid results', () => {
    const week = emptyWeek();
    const roastResult = generateRoast(week, [], 0, 'balanced', 'roast');
    const kindResult = generateRoast(week, [], 0, 'balanced', 'kind');
    expect(roastResult.punchlines).toHaveLength(3);
    expect(kindResult.punchlines).toHaveLength(3);
  });

  it('both modes return a stats object with all required fields', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'roast');
    const { stats } = result;
    expect(stats).toHaveProperty('totalMeals');
    expect(stats).toHaveProperty('avgScore');
    expect(stats).toHaveProperty('topProtein');
    expect(stats).toHaveProperty('repetitionCount');
    expect(stats).toHaveProperty('lightDinners');
    expect(stats).toHaveProperty('uniqueIngredients');
  });
});

describe('generateRoast – TCA safety (weight_loss objective)', () => {
  it('does not crash with weight_loss objective', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'weight_loss', 'roast');
    expect(result.punchlines).toHaveLength(3);
  });

  it('does not crash with weight_loss objective in kind mode', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'weight_loss', 'kind');
    expect(result.punchlines).toHaveLength(3);
  });
});

describe('generateRoast – stats computation', () => {
  it('totalMeals counts all non-null meals across the week', () => {
    const protein = makeComponent('p1', 'Salmon');
    const week = [
      makeWeekDay(makeAssembly('b1'), makeAssembly('l1', { protein }), null),
      makeWeekDay(null, null, makeAssembly('d1')),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.totalMeals).toBe(3);
  });

  it('totalMeals is 0 for an empty week', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'kind');
    expect(result.stats.totalMeals).toBe(0);
  });

  it('topProtein is the most frequent protein name', () => {
    const chicken = makeComponent('p1', 'Chicken');
    const tuna = makeComponent('p2', 'Tuna');
    const week = [
      makeWeekDay(null, makeAssembly('a1', { protein: chicken }), null),
      makeWeekDay(null, makeAssembly('a2', { protein: chicken }), null),
      makeWeekDay(null, makeAssembly('a3', { protein: tuna }), null),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.topProtein).toBe('Chicken');
  });

  it('topProtein defaults to "ta protéine habituelle" when no meals have a protein', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'roast');
    expect(result.stats.topProtein).toBe('ta protéine habituelle');
  });

  it('repetitionCount equals the count of the top protein', () => {
    const chicken = makeComponent('p1', 'Chicken');
    const week = [
      makeWeekDay(null, makeAssembly('a1', { protein: chicken }), null),
      makeWeekDay(null, makeAssembly('a2', { protein: chicken }), null),
      makeWeekDay(null, makeAssembly('a3', { protein: chicken }), null),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.repetitionCount).toBe(3);
  });

  it('uniqueIngredients counts distinct ingredient IDs across all meals', () => {
    const protein = makeComponent('p1', 'Chicken');
    const vegetable = { ...makeComponent('v1', 'Broccoli'), category: 'vegetable' as const };
    const cereal = { ...makeComponent('c1', 'Quinoa'), category: 'cereal' as const };
    const week = [
      makeWeekDay(null, makeAssembly('a1', { protein, vegetable, cereal }), null),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.uniqueIngredients).toBe(3);
  });

  it('uniqueIngredients does not double-count the same ingredient used in multiple meals', () => {
    const protein = makeComponent('p1', 'Chicken'); // same id 'p1' in both meals
    const week = [
      makeWeekDay(null, makeAssembly('a1', { protein }), makeAssembly('a2', { protein })),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.uniqueIngredients).toBe(1);
  });

  it('avgScore is "-" when there are no validated feedbacks', () => {
    const result = generateRoast(emptyWeek(), [], 0, 'balanced', 'roast');
    expect(result.stats.avgScore).toBe('-');
  });

  it('avgScore is "A" when all validated feedback pleasure values are 5', () => {
    const assembly = makeAssembly('validated-1', { validated: true });
    const week = [makeWeekDay(null, assembly, null)];
    const feedbacks: MealFeedback[] = [makeFeedback('validated-1', 5)];
    const result = generateRoast(week, feedbacks, 0, 'balanced', 'roast');
    expect(result.stats.avgScore).toBe('A');
  });

  it('avgScore is "E" when all validated feedback pleasure values are 1', () => {
    const assembly = makeAssembly('low-rated', { validated: true });
    const week = [makeWeekDay(null, assembly, null)];
    const feedbacks: MealFeedback[] = [makeFeedback('low-rated', 1)];
    const result = generateRoast(week, feedbacks, 0, 'balanced', 'roast');
    expect(result.stats.avgScore).toBe('E');
  });

  it('lightDinners counts dinners that have no sauce or no cereal', () => {
    // Dinner with neither sauce nor cereal → light
    const lightDinner = makeAssembly('d1', { sauce: null, cereal: null });
    // Dinner with cereal but no sauce → still counts as light (hasNoSauce=true)
    const semiLightDinner = makeAssembly('d2', {
      sauce: null,
      cereal: makeComponent('c1', 'Rice'),
    });
    // Full dinner with sauce AND cereal → not light
    const fullDinner = makeAssembly('d3', {
      sauce: makeComponent('s1', 'Soy'),
      cereal: makeComponent('c1', 'Rice'),
    });
    const week = [
      makeWeekDay(null, null, lightDinner),
      makeWeekDay(null, null, semiLightDinner),
      makeWeekDay(null, null, fullDinner),
    ];
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    expect(result.stats.lightDinners).toBe(2);
  });
});

describe('generateRoast – template variable substitution', () => {
  it('substitutes {protein} placeholder in repetition templates', () => {
    // Force repetition category by using same protein >= 3 times
    const chicken = makeComponent('p1', 'Chicken');
    const week = Array.from({ length: 7 }, (_, i) =>
      makeWeekDay(null, makeAssembly(`a${i}`, { protein: chicken }), null)
    );
    const result = generateRoast(week, [], 0, 'balanced', 'roast');
    // At least one punchline should contain 'Chicken' because {protein} is substituted
    const hasProteinName = result.punchlines.some((p) => p.includes('Chicken'));
    expect(hasProteinName).toBe(true);
  });
});
