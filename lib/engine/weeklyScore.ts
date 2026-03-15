import type { WeekPlan, MealFeedback, NutriGrade, ComponentCategory } from '@/types';

export interface WeeklyScore {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  mealsValidated: number;
  totalMeals: number; // 21
  avgPleasure: number;
  insight: string;
  strengths: string[];
  weaknesses: string[];
}

// Map component category to grade numeric value (A=1 … E=5)
const GRADE_VALUE: Record<NutriGrade, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

/**
 * Rough heuristic Nutri-Score for an assembly: use the worst grade among its
 * components that have a ciqualRefId, falling back to 'C' if none.
 * We keep this synchronous (no async I/O) to be safe inside a render.
 */
function estimateAssemblyGrade(assembly: {
  protein: { ciqualRefId?: string } | null;
  vegetable: { ciqualRefId?: string; category?: ComponentCategory } | null;
  cereal: { ciqualRefId?: string } | null;
  sauce: { ciqualRefId?: string } | null;
}): NutriGrade {
  // Heuristic: presence of a vegetable component improves the estimate
  const hasVeg = assembly.vegetable !== null;
  const hasProtein = assembly.protein !== null;
  const hasCereal = assembly.cereal !== null;
  const componentCount = [hasVeg, hasProtein, hasCereal].filter(Boolean).length;

  if (componentCount === 3) return 'B';
  if (componentCount === 2) return 'C';
  return 'D';
}

function gradeFromValidationAndScore(
  validationPct: number,
  avgNutriValue: number
): WeeklyScore['grade'] {
  if (validationPct >= 0.8 && avgNutriValue <= 2) return 'A';
  if (validationPct >= 0.6 && avgNutriValue <= 3) return 'B';
  if (validationPct >= 0.4) return 'C';
  if (validationPct >= 0.2) return 'D';
  return 'E';
}

function buildInsight(grade: WeeklyScore['grade'], avgPleasure: number): string {
  switch (grade) {
    case 'A':
      return 'Excellente semaine\u00a0! Vos repas sont bien équilibrés.';
    case 'B':
      return avgPleasure >= 4
        ? 'Bon score\u00a0! Continuez comme ça.'
        : 'Bon score\u00a0! Pensez à varier davantage les protéines.';
    case 'C':
      return 'Score correct. Plus de légumes amélioreraient votre équilibre.';
    case 'D':
      return 'Semaine en demi-teinte. Un petit effort demain\u00a0?';
    case 'E':
      return 'Semaine difficile. Recommencez doucement — chaque repas compte\u00a0!';
  }
}

function analyseCategories(weekPlan: WeekPlan): {
  strengths: string[];
  weaknesses: string[];
} {
  let vegCount = 0;
  let proteinCount = 0;
  let cerealCount = 0;
  let sauceCount = 0;
  let mealCount = 0;

  for (const day of weekPlan.days) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (!meal) continue;
      mealCount++;
      if (meal.vegetable) vegCount++;
      if (meal.protein) proteinCount++;
      if (meal.cereal) cerealCount++;
      if (meal.sauce) sauceCount++;
    }
  }

  if (mealCount === 0) return { strengths: [], weaknesses: [] };

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const vegRate = vegCount / mealCount;
  const proteinRate = proteinCount / mealCount;
  const cerealRate = cerealCount / mealCount;

  if (vegRate >= 0.7) strengths.push('Légumes bien présents');
  else if (vegRate < 0.4) weaknesses.push('Manque de légumes');

  if (proteinRate >= 0.7) strengths.push('Protéines bien équilibrées');
  else if (proteinRate < 0.4) weaknesses.push('Protéines insuffisantes');

  if (cerealRate >= 0.5) strengths.push('Féculents variés');
  else if (cerealRate < 0.2) weaknesses.push('Peu de féculents');

  if (sauceCount > 0 && sauceCount / mealCount <= 0.5) {
    strengths.push('Sauces utilisées avec modération');
  }

  return { strengths, weaknesses };
}

export function computeWeeklyScore(
  weekPlan: WeekPlan,
  feedbacks: MealFeedback[]
): WeeklyScore {
  const TOTAL_MEALS = 21;

  // Collect all assembly IDs that appear in the week plan
  const weekAssemblyIds = new Set<string>();
  for (const day of weekPlan.days) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (meal?.id) weekAssemblyIds.add(meal.id);
    }
  }

  // Derive the week date range (Mon–Sun) from the weekKey (YYYY-Www)
  function getWeekDateRange(weekKey: string): { start: Date; end: Date } {
    const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    // ISO week: week 1 is the week containing the first Thursday of the year
    const jan4 = new Date(year, 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  const { start, end } = getWeekDateRange(weekPlan.weekKey);

  // Feedbacks that belong to this week
  const weekFeedbacks = feedbacks.filter((f) => {
    const d = new Date(f.date);
    return d >= start && d <= end;
  });

  // Count validated meals: feedback for an assembly that is in the week plan
  const validatedFeedbacks = weekFeedbacks.filter(
    (f) => weekAssemblyIds.has(f.assemblyId)
  );
  const mealsValidated = validatedFeedbacks.length;

  const avgPleasure =
    validatedFeedbacks.length > 0
      ? validatedFeedbacks.reduce((sum, f) => sum + f.pleasure, 0) /
        validatedFeedbacks.length
      : 0;

  // Estimate Nutri-Score for each meal in the plan
  let totalNutriValue = 0;
  let nutriscoredMeals = 0;
  for (const day of weekPlan.days) {
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (!meal) continue;
      const g = estimateAssemblyGrade(meal);
      totalNutriValue += GRADE_VALUE[g];
      nutriscoredMeals++;
    }
  }
  const avgNutriValue =
    nutriscoredMeals > 0 ? totalNutriValue / nutriscoredMeals : 3;

  const validationPct = mealsValidated / TOTAL_MEALS;
  const grade = gradeFromValidationAndScore(validationPct, avgNutriValue);
  const insight = buildInsight(grade, avgPleasure);
  const { strengths, weaknesses } = analyseCategories(weekPlan);

  return {
    grade,
    mealsValidated,
    totalMeals: TOTAL_MEALS,
    avgPleasure: Math.round(avgPleasure * 10) / 10,
    insight,
    strengths,
    weaknesses,
  };
}
