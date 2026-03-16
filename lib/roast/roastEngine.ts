import type { AssemblyRow, MealFeedback } from '@/types';
import { roastTemplates, type RoastTemplate } from '@/components/roast/roastTemplates';

export interface RoastAnalysis {
  punchlines: string[];
  stats: {
    totalMeals: number;
    avgScore: string;
    topProtein: string;
    repetitionCount: number;
    lightDinners: number;
    uniqueIngredients: number;
  };
}

interface WeekDay {
  breakfast: AssemblyRow | null;
  lunch: AssemblyRow | null;
  dinner: AssemblyRow | null;
}

function getNutriGradeValue(grade: string | undefined): number {
  const map: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
  return map[grade ?? ''] ?? 0;
}

function isLightDinner(dinner: AssemblyRow | null): boolean {
  if (!dinner) return false;
  const hasNoSauce = !dinner.sauce;
  const hasNoCereal = !dinner.cereal;
  return hasNoSauce || hasNoCereal;
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

function pickTemplates(
  candidates: RoastTemplate[],
  count: number,
  exclude: Set<string>
): RoastTemplate[] {
  const available = candidates.filter((t) => !exclude.has(t.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateRoast(
  weekPlan: WeekDay[],
  feedbacks: MealFeedback[],
  objective: string,
  mode: 'roast' | 'kind'
): RoastAnalysis {
  // ─── Collect all meals ─────────────────────────────
  const allMeals: AssemblyRow[] = [];
  for (const day of weekPlan) {
    if (day.breakfast) allMeals.push(day.breakfast);
    if (day.lunch) allMeals.push(day.lunch);
    if (day.dinner) allMeals.push(day.dinner);
  }

  const totalMeals = allMeals.length;

  // ─── Count proteins ────────────────────────────────
  const proteinCounts: Record<string, number> = {};
  for (const meal of allMeals) {
    if (meal.protein) {
      proteinCounts[meal.protein.name] = (proteinCounts[meal.protein.name] ?? 0) + 1;
    }
  }

  const sortedProteins = Object.entries(proteinCounts).sort((a, b) => b[1] - a[1]);
  const topProtein = sortedProteins[0]?.[0] ?? 'ta protéine habituelle';
  const topProteinCount = sortedProteins[0]?.[1] ?? 0;
  const repetitionCount = topProteinCount;

  // ─── Unique ingredients ────────────────────────────
  const ingredientSet = new Set<string>();
  for (const meal of allMeals) {
    if (meal.protein) ingredientSet.add(meal.protein.id);
    if (meal.vegetable) ingredientSet.add(meal.vegetable.id);
    if (meal.cereal) ingredientSet.add(meal.cereal.id);
    if (meal.sauce) ingredientSet.add(meal.sauce.id);
    if (meal.extras) meal.extras.forEach((e) => ingredientSet.add(e.id));
  }
  const uniqueIngredients = ingredientSet.size;

  // ─── Vegetable coverage ───────────────────────────
  const mealsWithVeggies = allMeals.filter((m) => m.vegetable).length;
  const noVeggiesMeals = totalMeals - mealsWithVeggies;

  // ─── Sauce usage ──────────────────────────────────
  const mealsWithSauce = allMeals.filter((m) => m.sauce).length;

  // ─── Light dinners ────────────────────────────────
  const lightDinners = weekPlan.filter((d) => isLightDinner(d.dinner)).length;

  // ─── Avg score from feedbacks ─────────────────────
  const validatedIds = allMeals.filter((m) => m.validated).map((m) => m.id);
  const relevantFeedbacks = feedbacks.filter((f) => validatedIds.includes(f.assemblyId));
  const avgPleasure =
    relevantFeedbacks.length > 0
      ? relevantFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) / relevantFeedbacks.length
      : 0;

  const avgScoreLabel =
    avgPleasure >= 4.5
      ? 'A'
      : avgPleasure >= 3.5
      ? 'B'
      : avgPleasure >= 2.5
      ? 'C'
      : avgPleasure >= 1.5
      ? 'D'
      : avgPleasure > 0
      ? 'E'
      : '-';

  const stats = {
    totalMeals,
    avgScore: avgScoreLabel,
    topProtein,
    repetitionCount,
    lightDinners,
    uniqueIngredients,
  };

  // ─── Template variable map ────────────────────────
  const vars: Record<string, string | number> = {
    protein: topProtein,
    count: topProteinCount,
    avgScore: avgScoreLabel,
    totalMeals,
    uniqueIngredients,
    possible: 21,
  };

  // ─── Filter templates by tone and TCA safety ─────
  const safeTemplates = roastTemplates.filter((t) => {
    if (t.tone !== mode) return false;
    if (t.excludeObjectives?.includes(objective)) return false;
    return true;
  });

  // ─── Build category pools based on analysis ───────
  const selectedTemplates: RoastTemplate[] = [];
  const usedIds = new Set<string>();

  function addFromCategory(category: RoastTemplate['category'], count: number) {
    const pool = safeTemplates.filter((t) => t.category === category);
    const picked = pickTemplates(pool, count, usedIds);
    picked.forEach((t) => usedIds.add(t.id));
    selectedTemplates.push(...picked);
  }

  // Priority logic based on analysis
  const priorities: Array<{ category: RoastTemplate['category']; condition: boolean }> = [
    { category: 'repetition', condition: topProteinCount >= 3 },
    { category: 'protein_addict', condition: topProteinCount >= 4 },
    { category: 'no_veggies', condition: noVeggiesMeals >= 3 },
    { category: 'score_low', condition: avgScoreLabel === 'D' || avgScoreLabel === 'E' },
    { category: 'score_high', condition: avgScoreLabel === 'A' || avgScoreLabel === 'B' },
    { category: 'sauce_lover', condition: mealsWithSauce >= 5 },
    { category: 'light_dinner', condition: lightDinners >= 3 },
    { category: 'variety', condition: uniqueIngredients >= 10 },
  ];

  for (const { category, condition } of priorities) {
    if (condition && selectedTemplates.length < 3) {
      addFromCategory(category, 1);
    }
  }

  // Fill remaining slots with general templates
  if (selectedTemplates.length < 3) {
    addFromCategory('general', 3 - selectedTemplates.length);
  }

  // Final fallback: take any safe templates
  if (selectedTemplates.length < 3) {
    const fallback = pickTemplates(safeTemplates, 3 - selectedTemplates.length, usedIds);
    selectedTemplates.push(...fallback);
  }

  const punchlines = selectedTemplates
    .slice(0, 3)
    .map((t) => fillTemplate(t.template, vars));

  return { punchlines, stats };
}
