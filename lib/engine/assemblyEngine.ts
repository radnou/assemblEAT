import type { AssemblyRow, MealType, SimplicityScore } from '@/types';
import { getAssembliesByMealType } from '@/lib/data/repertoire';
import { getCustomAssemblies } from '@/lib/engine/customRepertoire';

// ─── Diet / Allergy / Objective Filtering ───────────────

const DIET_EXCLUDED_TAGS: Record<string, string[]> = {
  vegetarien: ['viande', 'volaille', 'poisson'],
  vegetalien: ['viande', 'volaille', 'poisson', 'laitage', 'oeufs'],
  pescetarien: ['viande', 'volaille'],
  sans_gluten: ['gluten'],
  sans_lactose: ['laitage'],
  halal: ['porc'],
  casher: ['porc', 'fruits_de_mer'],
};

/**
 * Filtre les assemblages selon les régimes alimentaires.
 */
export function filterByDiets(assemblies: AssemblyRow[], diets: string[]): AssemblyRow[] {
  if (diets.length === 0) return assemblies;
  const excludedTags = new Set(diets.flatMap((d) => DIET_EXCLUDED_TAGS[d] ?? []));
  return assemblies.filter((a) => {
    const allTags = [
      ...(a.protein?.tags ?? []),
      ...(a.vegetable?.tags ?? []),
      ...(a.cereal?.tags ?? []),
      ...(a.sauce?.tags ?? []),
      ...(a.extras?.flatMap((e) => e.tags) ?? []),
    ];
    return !allTags.some((tag) => excludedTags.has(tag));
  });
}

/**
 * Filtre les assemblages selon les allergies (les noms d'allergènes mappent directement aux tags).
 */
export function filterByAllergies(assemblies: AssemblyRow[], allergies: string[]): AssemblyRow[] {
  if (allergies.length === 0) return assemblies;
  const allergenSet = new Set(allergies);
  return assemblies.filter((a) => {
    const allTags = [
      ...(a.protein?.tags ?? []),
      ...(a.vegetable?.tags ?? []),
      ...(a.cereal?.tags ?? []),
      ...(a.sauce?.tags ?? []),
      ...(a.extras?.flatMap((e) => e.tags) ?? []),
    ];
    return !allTags.some((tag) => allergenSet.has(tag));
  });
}

/**
 * Règle 1 — Anti-redondance protéique
 *
 * Si le petit-déjeuner contient des œufs, exclure les assemblages déjeuner/dîner
 * ayant un conflit déclaré avec cette protéine de petit-déjeuner.
 */
export function applyAntiRedundancy(
  assemblies: AssemblyRow[],
  breakfastAssembly: AssemblyRow | null
): AssemblyRow[] {
  if (!breakfastAssembly) return assemblies;

  const breakfastHasEggs = breakfastAssembly.protein?.tags.includes('oeufs') ?? false;
  if (!breakfastHasEggs) return assemblies;

  const breakfastProteinId = breakfastAssembly.protein?.id;
  if (!breakfastProteinId) return assemblies;

  return assemblies.filter((assembly) => {
    if (!assembly.protein?.conflictsWith) return true;
    return !assembly.protein.conflictsWith.includes(breakfastProteinId);
  });
}

/**
 * Règle 2 — Plafond féculent
 *
 * Déjeuner ≤ 150g, dîner ≤ 100g.
 * Retourne un message d'avertissement si dépassé, null sinon.
 */
export function checkStarchLimit(
  mealType: MealType,
  starchWeightG: number
): string | null {
  const limits: Record<MealType, number> = {
    breakfast: Infinity,
    lunch: 150,
    dinner: 100,
  };

  const limit = limits[mealType];
  if (starchWeightG > limit) {
    return 'Féculent légèrement au-dessus du repère — c\'est OK occasionnellement';
  }
  return null;
}

/**
 * Règle 3 — Variété sur 5 jours
 *
 * Exclut la protéine la plus récente de la génération aléatoire.
 */
export function applyVarietyFilter(
  assemblies: AssemblyRow[],
  recentProteins: string[]
): AssemblyRow[] {
  if (recentProteins.length === 0) return assemblies;

  const lastProtein = recentProteins[recentProteins.length - 1];
  return assemblies.filter(
    (assembly) => assembly.protein?.id !== lastProtein
  );
}

/**
 * Règle 4 — Badge dîner léger
 *
 * Retourne true si le dîner n'a pas de féculent.
 */
export function isLightDinner(assembly: AssemblyRow): boolean {
  return assembly.mealType === 'dinner' && assembly.cereal === null;
}

/**
 * Règle 5 — Score de simplicité
 *
 * Calcul basé sur la somme des prepTime de tous les composants.
 */
export function calculateSimplicity(assembly: AssemblyRow): SimplicityScore {
  const components = [
    assembly.protein,
    assembly.vegetable,
    assembly.cereal,
    assembly.sauce,
    ...(assembly.extras ?? []),
  ];

  const totalPrepTime = components.reduce(
    (sum, comp) => sum + (comp?.prepTime ?? 0),
    0
  );

  if (totalPrepTime <= 5) return '⭐ Express';
  if (totalPrepTime <= 10) return '⭐⭐ Rapide';
  return '⭐⭐⭐ Batch';
}

/**
 * Génère un assemblage aléatoire pour un type de repas donné,
 * en appliquant toutes les règles métier.
 * Retourne null si aucun candidat n'est disponible après filtrage.
 */
export function generateRandomAssembly(
  mealType: MealType,
  options: {
    breakfastAssembly?: AssemblyRow | null;
    recentProteins?: string[];
    enableAntiRedundancy?: boolean;
    diets?: string[];
    allergies?: string[];
    objective?: string;
    isPro?: boolean;
  } = {}
): AssemblyRow | null {
  let candidates = getAssembliesByMealType(mealType);

  // Include custom assemblies for Pro users
  if (options.isPro) {
    const custom = getCustomAssemblies().filter((a) => a.mealType === mealType);
    if (custom.length > 0) {
      candidates = [...candidates, ...custom];
    }
  }

  // Appliquer filtres régimes alimentaires
  if (options.diets && options.diets.length > 0) {
    candidates = filterByDiets(candidates, options.diets);
  }

  // Appliquer filtres allergies
  if (options.allergies && options.allergies.length > 0) {
    candidates = filterByAllergies(candidates, options.allergies);
  }

  // Appliquer filtres objectif
  if (options.objective) {
    let objectiveFiltered = candidates;

    if (options.objective === 'weight_loss' && mealType === 'dinner') {
      // Pas de féculent au dîner pour perte de poids
      objectiveFiltered = candidates.filter((a) => a.cereal === null);
    } else if (options.objective === 'less_meat') {
      // Préférer les protéines sans viande ni volaille
      const meatlessCandidates = candidates.filter((a) => {
        const proteinTags = a.protein?.tags ?? [];
        return !proteinTags.some((t) => ['viande', 'volaille'].includes(t));
      });
      objectiveFiltered = meatlessCandidates;
    }

    // Utiliser le résultat filtré seulement s'il reste des candidats (sinon fallback)
    if (objectiveFiltered.length > 0) {
      candidates = objectiveFiltered;
    }
  }

  // Appliquer règle 1 (anti-redondance)
  if (options.enableAntiRedundancy !== false && options.breakfastAssembly) {
    candidates = applyAntiRedundancy(candidates, options.breakfastAssembly);
  }

  // Appliquer règle 3 (variété)
  if (options.recentProteins && options.recentProteins.length > 0) {
    const filtered = applyVarietyFilter(candidates, options.recentProteins);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  // Zéro candidat — retourner null plutôt que crasher
  if (candidates.length === 0) {
    return null;
  }

  // Sélection aléatoire
  const index = Math.floor(Math.random() * candidates.length);
  return { ...candidates[index], validated: false };
}

/**
 * Détecte les conflits dans un plan journalier.
 * Retourne un tableau de messages d'alerte.
 */
export function detectDayConflicts(
  breakfast: AssemblyRow | null,
  lunch: AssemblyRow | null,
  dinner: AssemblyRow | null
): string[] {
  const warnings: string[] = [];

  // Vérifier redondance protéique petit-déj → déjeuner
  if (breakfast?.protein?.tags.includes('oeufs') && lunch?.protein?.tags.includes('oeufs')) {
    warnings.push('Œufs au petit-déjeuner et au déjeuner — pensez à varier les protéines');
  }

  // Vérifier redondance protéique déjeuner → dîner
  if (lunch?.protein?.id === dinner?.protein?.id && lunch?.protein) {
    warnings.push(`Même protéine (${lunch.protein.name}) midi et soir — pensez à varier`);
  }

  return warnings;
}
