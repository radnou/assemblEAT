import type { AssemblyRow, MealFeedback, MealType } from '@/types';
import { getAssembliesByMealType } from '@/lib/data/repertoire';

/**
 * Score assemblies based on user feedback history.
 * Assemblies with high pleasure scores get boosted.
 * Assemblies with low pleasure scores get penalized.
 * Assemblies never tried get a neutral score.
 */
export function getSmartSuggestions(
  mealType: MealType,
  feedbacks: MealFeedback[],
  count: number = 3
): AssemblyRow[] {
  const assemblies = getAssembliesByMealType(mealType);

  // Build a map of assemblyId -> list of pleasure scores
  const scoreMap = new Map<string, number[]>();
  for (const feedback of feedbacks) {
    const existing = scoreMap.get(feedback.assemblyId) ?? [];
    existing.push(feedback.pleasure);
    scoreMap.set(feedback.assemblyId, existing);
  }

  // Compute preference score for each assembly with slight randomization
  const scored = assemblies.map((assembly) => {
    const scores = scoreMap.get(assembly.id);
    const baseScore =
      scores && scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 3; // neutral for untried assemblies

    // Add slight randomization (0.8–1.2) to avoid always returning the same order
    const jitter = 0.8 + Math.random() * 0.4;
    const preferenceScore = baseScore * jitter;

    return { assembly, preferenceScore };
  });

  // Sort by preferenceScore descending and return top `count`
  scored.sort((a, b) => b.preferenceScore - a.preferenceScore);

  return scored.slice(0, count).map((s) => s.assembly);
}
