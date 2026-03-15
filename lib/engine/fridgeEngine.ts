import type { AssemblyRow, MealComponent } from '@/types';
import { getAllAssemblies } from '@/lib/data/repertoire';

/**
 * Extract all unique ingredients (MealComponent) from every assembly in the repertoire.
 * Deduplication is by component id.
 */
export function getAllIngredients(): MealComponent[] {
  const assemblies = getAllAssemblies();
  const seen = new Map<string, MealComponent>();

  for (const assembly of assemblies) {
    const components: (MealComponent | null | undefined)[] = [
      assembly.protein,
      assembly.vegetable,
      assembly.cereal,
      assembly.sauce,
      ...(assembly.extras ?? []),
    ];
    for (const comp of components) {
      if (comp && !seen.has(comp.id)) {
        seen.set(comp.id, comp);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Return the list of non-null component ids for an assembly.
 */
function getAssemblyComponentIds(assembly: AssemblyRow): string[] {
  const ids: string[] = [];
  if (assembly.protein) ids.push(assembly.protein.id);
  if (assembly.vegetable) ids.push(assembly.vegetable.id);
  if (assembly.cereal) ids.push(assembly.cereal.id);
  if (assembly.sauce) ids.push(assembly.sauce.id);
  for (const extra of assembly.extras ?? []) {
    ids.push(extra.id);
  }
  return ids;
}

/**
 * Return assemblies where ALL components are covered by selectedIngredientIds.
 * Sorted by total number of selected ingredients used (descending).
 */
export function findMatchingAssemblies(selectedIngredientIds: string[]): AssemblyRow[] {
  if (selectedIngredientIds.length === 0) return [];

  const selected = new Set(selectedIngredientIds);
  const assemblies = getAllAssemblies();

  const matches = assemblies.filter((assembly) => {
    const ids = getAssemblyComponentIds(assembly);
    if (ids.length === 0) return false;
    return ids.every((id) => selected.has(id));
  });

  // Sort by number of matched ingredients (assemblies that use more of what you have first)
  matches.sort((a, b) => {
    const aCount = getAssemblyComponentIds(a).filter((id) => selected.has(id)).length;
    const bCount = getAssemblyComponentIds(b).filter((id) => selected.has(id)).length;
    return bCount - aCount;
  });

  return matches;
}

export interface PartialMatch {
  assembly: AssemblyRow;
  matchPercent: number;
  missing: string[];
}

/**
 * Return assemblies missing at most `maxMissing` ingredients.
 * Excludes perfect matches (those are returned by findMatchingAssemblies).
 * Sorted by matchPercent descending.
 */
export function findPartialMatches(
  selectedIngredientIds: string[],
  maxMissing: number = 1,
): PartialMatch[] {
  if (selectedIngredientIds.length === 0) return [];

  const selected = new Set(selectedIngredientIds);
  const assemblies = getAllAssemblies();

  const results: PartialMatch[] = [];

  for (const assembly of assemblies) {
    const ids = getAssemblyComponentIds(assembly);
    if (ids.length === 0) continue;

    const missing = ids.filter((id) => !selected.has(id));

    // Exclude perfect matches and assemblies with too many missing ingredients
    if (missing.length === 0 || missing.length > maxMissing) continue;

    const matchPercent = Math.round(((ids.length - missing.length) / ids.length) * 100);

    // Collect missing ingredient names
    const missingNames = missing.map((id) => {
      const comp =
        assembly.protein?.id === id
          ? assembly.protein
          : assembly.vegetable?.id === id
            ? assembly.vegetable
            : assembly.cereal?.id === id
              ? assembly.cereal
              : assembly.sauce?.id === id
                ? assembly.sauce
                : (assembly.extras ?? []).find((e) => e.id === id);
      return comp?.name ?? id;
    });

    results.push({ assembly, matchPercent, missing: missingNames });
  }

  results.sort((a, b) => b.matchPercent - a.matchPercent);

  return results;
}
