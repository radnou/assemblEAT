import { describe, it, expect } from 'vitest';
import { generateGroceryList } from '@/lib/grocery/groceryEngine';
import type { WeekPlan, DayPlan, MealComponent, AssemblyRow } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeComponent(
  id: string,
  name: string,
  category: MealComponent['category']
): MealComponent {
  return { id, name, category, prepTime: 5, tags: [] };
}

function makeAssembly(
  id: string,
  overrides: Partial<AssemblyRow> = {}
): AssemblyRow {
  return {
    id,
    mealType: 'lunch',
    protein: null,
    vegetable: null,
    cereal: null,
    sauce: null,
    ...overrides,
  };
}

function makeEmptyDay(date: string): DayPlan {
  return { date, breakfast: null, lunch: null, dinner: null };
}

function makeWeekPlan(days: DayPlan[], weekKey = '2024-W01'): WeekPlan {
  return { weekKey, days };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateGroceryList', () => {
  it('returns empty list for a week plan with no meals', () => {
    const plan = makeWeekPlan([
      makeEmptyDay('2024-01-01'),
      makeEmptyDay('2024-01-02'),
    ]);
    const result = generateGroceryList(plan);
    expect(result.items).toHaveLength(0);
    expect(result.totalItems).toBe(0);
    expect(result.weekKey).toBe('2024-W01');
  });

  it('returns empty list for a week plan with zero days', () => {
    const plan = makeWeekPlan([]);
    const result = generateGroceryList(plan);
    expect(result.items).toHaveLength(0);
    expect(result.totalItems).toBe(0);
  });

  it('returns correct items for a single meal with one component', () => {
    const protein = makeComponent('chicken-id', 'Chicken', 'protein');
    const lunch = makeAssembly('a1', { protein });
    const plan = makeWeekPlan([{ date: '2024-01-01', breakfast: null, lunch, dinner: null }]);

    const result = generateGroceryList(plan);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Chicken');
    expect(result.items[0].category).toBe('protein');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].checked).toBe(false);
  });

  it('capitalises the first letter of each item name', () => {
    const vegetable = makeComponent('broc-id', 'broccoli', 'vegetable');
    const lunch = makeAssembly('a1', { vegetable });
    const plan = makeWeekPlan([{ date: '2024-01-01', breakfast: null, lunch, dinner: null }]);

    const result = generateGroceryList(plan);
    expect(result.items[0].name).toBe('Broccoli');
  });

  it('counts duplicate ingredients across different days correctly', () => {
    const protein = makeComponent('chicken-id', 'Chicken', 'protein');
    const day1: DayPlan = {
      date: '2024-01-01',
      breakfast: null,
      lunch: makeAssembly('a1', { protein }),
      dinner: null,
    };
    const day2: DayPlan = {
      date: '2024-01-02',
      breakfast: null,
      lunch: makeAssembly('a2', { protein }),
      dinner: null,
    };
    const plan = makeWeekPlan([day1, day2]);

    const result = generateGroceryList(plan);
    const chickenItem = result.items.find((i) => i.name === 'Chicken');
    expect(chickenItem).toBeDefined();
    expect(chickenItem!.quantity).toBe(2);
    expect(result.totalItems).toBe(1);
  });

  it('counts the same ingredient appearing in breakfast, lunch and dinner as 3', () => {
    const cereal = makeComponent('rice-id', 'Rice', 'cereal');
    const plan = makeWeekPlan([
      {
        date: '2024-01-01',
        breakfast: makeAssembly('b', { cereal }),
        lunch: makeAssembly('l', { cereal }),
        dinner: makeAssembly('d', { cereal }),
      },
    ]);

    const result = generateGroceryList(plan);
    const riceItem = result.items.find((i) => i.name === 'Rice');
    expect(riceItem!.quantity).toBe(3);
  });

  it('treats ingredient names case-insensitively (same key)', () => {
    const protein1 = makeComponent('c1', 'Chicken', 'protein');
    const protein2 = makeComponent('c2', 'chicken', 'protein'); // lowercase variant
    const plan = makeWeekPlan([
      {
        date: '2024-01-01',
        breakfast: null,
        lunch: makeAssembly('a1', { protein: protein1 }),
        dinner: makeAssembly('a2', { protein: protein2 }),
      },
    ]);

    const result = generateGroceryList(plan);
    const chickenItems = result.items.filter((i) => i.name.toLowerCase() === 'chicken');
    expect(chickenItems).toHaveLength(1);
    expect(chickenItems[0].quantity).toBe(2);
  });

  it('includes extras in the grocery list', () => {
    const extra = makeComponent('ext-id', 'Hummus', 'sauce');
    const lunch = makeAssembly('a1', { extras: [extra] });
    const plan = makeWeekPlan([{ date: '2024-01-01', breakfast: null, lunch, dinner: null }]);

    const result = generateGroceryList(plan);
    expect(result.items.find((i) => i.name === 'Hummus')).toBeDefined();
  });

  it('correctly maps all known categories', () => {
    const protein = makeComponent('p', 'Tuna', 'protein');
    const vegetable = makeComponent('v', 'Spinach', 'vegetable');
    const cereal = makeComponent('c', 'Quinoa', 'cereal');
    const sauce = makeComponent('s', 'Soy Sauce', 'sauce');
    const dairy = makeComponent('d', 'Yogurt', 'dairy');
    const fruit = makeComponent('f', 'Banana', 'fruit');

    const lunch = makeAssembly('a1', { protein, vegetable, cereal, sauce });
    const dinner = makeAssembly('a2', { extras: [dairy, fruit] });
    const plan = makeWeekPlan([
      { date: '2024-01-01', breakfast: null, lunch, dinner },
    ]);

    const result = generateGroceryList(plan);
    const categoriesPresent = result.items.map((i) => i.category);
    expect(categoriesPresent).toContain('protein');
    expect(categoriesPresent).toContain('vegetable');
    expect(categoriesPresent).toContain('cereal');
    expect(categoriesPresent).toContain('sauce');
    expect(categoriesPresent).toContain('dairy');
    expect(categoriesPresent).toContain('fruit');
  });

  it('maps unknown category to "other"', () => {
    // 'beverage' is a valid ComponentCategory but not in the grocery switch
    const beverage = makeComponent('bev', 'Coffee', 'beverage');
    const lunch = makeAssembly('a1', { extras: [beverage] });
    const plan = makeWeekPlan([{ date: '2024-01-01', breakfast: null, lunch, dinner: null }]);

    const result = generateGroceryList(plan);
    const coffeeItem = result.items.find((i) => i.name === 'Coffee');
    expect(coffeeItem!.category).toBe('other');
  });

  it('sorts items by category order (protein before vegetable before cereal)', () => {
    const protein = makeComponent('p', 'Tuna', 'protein');
    const vegetable = makeComponent('v', 'Spinach', 'vegetable');
    const cereal = makeComponent('c', 'Quinoa', 'cereal');
    // Use a single meal so insertion order is vegetable, protein, cereal
    const lunch = makeAssembly('a1', { vegetable, protein, cereal });
    const plan = makeWeekPlan([{ date: '2024-01-01', breakfast: null, lunch, dinner: null }]);

    const result = generateGroceryList(plan);
    const categoryOrder = result.items.map((i) => i.category);
    // protein must come before vegetable, vegetable before cereal
    expect(categoryOrder.indexOf('protein')).toBeLessThan(categoryOrder.indexOf('vegetable'));
    expect(categoryOrder.indexOf('vegetable')).toBeLessThan(categoryOrder.indexOf('cereal'));
  });

  it('sorts items by quantity descending within the same category', () => {
    const chicken = makeComponent('ch', 'Chicken', 'protein');
    const tuna = makeComponent('tu', 'Tuna', 'protein');

    // chicken appears in lunch AND dinner, tuna only in breakfast
    const plan = makeWeekPlan([
      {
        date: '2024-01-01',
        breakfast: makeAssembly('b', { protein: tuna }),
        lunch: makeAssembly('l', { protein: chicken }),
        dinner: makeAssembly('d', { protein: chicken }),
      },
    ]);

    const result = generateGroceryList(plan);
    const proteins = result.items.filter((i) => i.category === 'protein');
    // Chicken (qty=2) should come before Tuna (qty=1)
    expect(proteins[0].name).toBe('Chicken');
    expect(proteins[1].name).toBe('Tuna');
  });

  it('totalItems reflects the number of unique ingredients, not total appearances', () => {
    const protein = makeComponent('p', 'Chicken', 'protein');
    const plan = makeWeekPlan([
      { date: '2024-01-01', breakfast: null, lunch: makeAssembly('a1', { protein }), dinner: null },
      { date: '2024-01-02', breakfast: null, lunch: makeAssembly('a2', { protein }), dinner: null },
      { date: '2024-01-03', breakfast: null, lunch: makeAssembly('a3', { protein }), dinner: null },
    ]);

    const result = generateGroceryList(plan);
    expect(result.totalItems).toBe(1); // still one unique ingredient
    expect(result.items[0].quantity).toBe(3);
  });

  it('preserves the weekKey in the returned GroceryList', () => {
    const plan = makeWeekPlan([], '2025-W42');
    const result = generateGroceryList(plan);
    expect(result.weekKey).toBe('2025-W42');
  });
});
