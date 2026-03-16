import { calculateNutriScore } from '@/lib/nutriscore/algorithm';
import { getCiqualEntry } from '@/lib/nutriscore/ciqual-ref';
import type { NutriGrade, NutrientInput } from '@/types';

// ─── Types ──────────────────────────────────────────

export interface SeoCombination {
  protein: string;
  vegetable: string;
  cereal: string;
  slug: string;
  score: NutriGrade;
  /** Numeric Nutri-Score for sorting */
  numericScore: number;
  /** Component-level scores for breakdown */
  components: {
    protein: { name: string; ciqualId: string; grade: NutriGrade; score: number };
    vegetable: { name: string; ciqualId: string; grade: NutriGrade; score: number };
    cereal: { name: string; ciqualId: string; grade: NutriGrade; score: number };
  };
  /** Estimated total protein grams */
  proteinGrams: number | null;
}

// ─── Ingredient definitions ─────────────────────────

interface Ingredient {
  name: string;
  slug: string;
  ciqualId: string;
  weightG: number;
}

const proteins: Ingredient[] = [
  { name: 'Poulet grille', slug: 'poulet', ciqualId: 'poulet-grille', weightG: 150 },
  { name: 'Saumon vapeur', slug: 'saumon', ciqualId: 'saumon-vapeur', weightG: 130 },
  { name: 'Thon en boite', slug: 'thon', ciqualId: 'thon-conserve', weightG: 130 },
  { name: 'Tofu saute', slug: 'tofu', ciqualId: 'tofu-nature', weightG: 150 },
  { name: 'Lentilles', slug: 'lentilles', ciqualId: 'lentilles-cuites', weightG: 150 },
  { name: 'Oeufs durs', slug: 'oeufs', ciqualId: 'oeufs-durs', weightG: 120 },
];

const vegetables: Ingredient[] = [
  { name: 'Brocolis vapeur', slug: 'brocolis', ciqualId: 'brocolis-vapeur', weightG: 200 },
  { name: 'Haricots verts', slug: 'haricots-verts', ciqualId: 'haricots-verts', weightG: 200 },
  { name: 'Epinards', slug: 'epinards', ciqualId: 'epinards-cuits', weightG: 200 },
  { name: 'Courgettes grillees', slug: 'courgettes', ciqualId: 'courgettes-grillees', weightG: 200 },
  { name: 'Carottes vapeur', slug: 'carottes', ciqualId: 'carottes-vapeur', weightG: 200 },
  { name: 'Tomates', slug: 'tomates', ciqualId: 'tomates', weightG: 150 },
];

const cereals: Ingredient[] = [
  { name: 'Riz complet', slug: 'riz-complet', ciqualId: 'riz-complet', weightG: 150 },
  { name: 'Quinoa', slug: 'quinoa', ciqualId: 'quinoa-cuit', weightG: 150 },
  { name: 'Patate douce', slug: 'patate-douce', ciqualId: 'patate-douce', weightG: 150 },
  { name: 'Pates completes', slug: 'pates-completes', ciqualId: 'pates-completes', weightG: 150 },
  { name: 'Semoule complete', slug: 'semoule', ciqualId: 'semoule-complete', weightG: 150 },
];

// ─── Display names (with accents for rendering) ─────

const displayNames: Record<string, string> = {
  'poulet': 'Poulet grille',
  'saumon': 'Saumon vapeur',
  'thon': 'Thon en boite',
  'tofu': 'Tofu saute',
  'lentilles': 'Lentilles',
  'oeufs': 'Oeufs durs',
  'brocolis': 'Brocolis vapeur',
  'haricots-verts': 'Haricots verts',
  'epinards': 'Epinards',
  'courgettes': 'Courgettes grillees',
  'carottes': 'Carottes vapeur',
  'tomates': 'Tomates',
  'riz-complet': 'Riz complet',
  'quinoa': 'Quinoa',
  'patate-douce': 'Patate douce',
  'pates-completes': 'Pates completes',
  'semoule': 'Semoule complete',
};

/** Prettier display names with accents for UI */
const prettyNames: Record<string, string> = {
  'poulet': 'Poulet grille',
  'saumon': 'Saumon vapeur',
  'thon': 'Thon en boite',
  'tofu': 'Tofu saute',
  'lentilles': 'Lentilles',
  'oeufs': '\u0152ufs durs',
  'brocolis': 'Brocolis vapeur',
  'haricots-verts': 'Haricots verts',
  'epinards': '\u00C9pinards',
  'courgettes': 'Courgettes grillees',
  'carottes': 'Carottes vapeur',
  'tomates': 'Tomates',
  'riz-complet': 'Riz complet',
  'quinoa': 'Quinoa',
  'patate-douce': 'Patate douce',
  'pates-completes': 'P\u00E2tes compl\u00E8tes',
  'semoule': 'Semoule compl\u00E8te',
};

export function getPrettyName(slug: string): string {
  return prettyNames[slug] ?? displayNames[slug] ?? slug;
}

// ─── Prioritized combinations (most searched) ───────

const priorityCombos: [string, string, string][] = [
  // Poulet combos (most searched protein in France)
  ['poulet', 'brocolis', 'riz-complet'],
  ['poulet', 'haricots-verts', 'riz-complet'],
  ['poulet', 'courgettes', 'quinoa'],
  ['poulet', 'epinards', 'patate-douce'],
  ['poulet', 'carottes', 'semoule'],
  ['poulet', 'tomates', 'pates-completes'],
  ['poulet', 'brocolis', 'quinoa'],
  ['poulet', 'haricots-verts', 'patate-douce'],
  ['poulet', 'courgettes', 'riz-complet'],
  ['poulet', 'epinards', 'pates-completes'],
  // Saumon combos
  ['saumon', 'brocolis', 'riz-complet'],
  ['saumon', 'epinards', 'quinoa'],
  ['saumon', 'haricots-verts', 'patate-douce'],
  ['saumon', 'courgettes', 'riz-complet'],
  ['saumon', 'carottes', 'quinoa'],
  ['saumon', 'brocolis', 'pates-completes'],
  ['saumon', 'tomates', 'riz-complet'],
  // Thon combos
  ['thon', 'tomates', 'riz-complet'],
  ['thon', 'haricots-verts', 'quinoa'],
  ['thon', 'courgettes', 'pates-completes'],
  ['thon', 'brocolis', 'riz-complet'],
  ['thon', 'carottes', 'patate-douce'],
  // Tofu combos
  ['tofu', 'brocolis', 'riz-complet'],
  ['tofu', 'courgettes', 'quinoa'],
  ['tofu', 'epinards', 'riz-complet'],
  ['tofu', 'haricots-verts', 'patate-douce'],
  ['tofu', 'carottes', 'semoule'],
  ['tofu', 'brocolis', 'pates-completes'],
  // Lentilles combos
  ['lentilles', 'carottes', 'riz-complet'],
  ['lentilles', 'epinards', 'quinoa'],
  ['lentilles', 'courgettes', 'semoule'],
  ['lentilles', 'tomates', 'riz-complet'],
  ['lentilles', 'brocolis', 'patate-douce'],
  ['lentilles', 'haricots-verts', 'pates-completes'],
  // Oeufs combos
  ['oeufs', 'epinards', 'riz-complet'],
  ['oeufs', 'tomates', 'quinoa'],
  ['oeufs', 'haricots-verts', 'patate-douce'],
  ['oeufs', 'brocolis', 'pates-completes'],
  ['oeufs', 'courgettes', 'semoule'],
  ['oeufs', 'carottes', 'riz-complet'],
  // Extra popular combos to reach 50
  ['poulet', 'brocolis', 'patate-douce'],
  ['poulet', 'haricots-verts', 'quinoa'],
  ['poulet', 'carottes', 'riz-complet'],
  ['saumon', 'epinards', 'patate-douce'],
  ['saumon', 'haricots-verts', 'riz-complet'],
  ['tofu', 'epinards', 'quinoa'],
  ['lentilles', 'carottes', 'semoule'],
  ['thon', 'epinards', 'quinoa'],
  ['oeufs', 'brocolis', 'riz-complet'],
  ['poulet', 'epinards', 'quinoa'],
];

// ─── Score computation ──────────────────────────────

function computeComponentScore(ciqualId: string): { grade: NutriGrade; score: number } {
  const entry = getCiqualEntry(ciqualId);
  if (!entry) return { grade: 'C', score: 5 };
  const result = calculateNutriScore(entry.nutrients, entry.fruitVegPercent, entry.category);
  return { grade: result.grade, score: result.score };
}

function computeAssemblyGrade(
  proteinIng: Ingredient,
  vegIng: Ingredient,
  cerealIng: Ingredient,
): { grade: NutriGrade; numericScore: number } {
  const pEntry = getCiqualEntry(proteinIng.ciqualId);
  const vEntry = getCiqualEntry(vegIng.ciqualId);
  const cEntry = getCiqualEntry(cerealIng.ciqualId);

  if (!pEntry || !vEntry || !cEntry) return { grade: 'C', numericScore: 5 };

  const totalWeight = proteinIng.weightG + vegIng.weightG + cerealIng.weightG;

  const aggregate: NutrientInput = {
    energy_kj: 0,
    sugars: 0,
    saturated_fat: 0,
    salt: 0,
    fiber: 0,
    protein: 0,
  };

  const entries = [
    { entry: pEntry, weight: proteinIng.weightG },
    { entry: vEntry, weight: vegIng.weightG },
    { entry: cEntry, weight: cerealIng.weightG },
  ];

  let weightedFruitVeg = 0;

  for (const { entry, weight } of entries) {
    const ratio = weight / 100;
    aggregate.energy_kj += entry.nutrients.energy_kj * ratio;
    aggregate.sugars += entry.nutrients.sugars * ratio;
    aggregate.saturated_fat += entry.nutrients.saturated_fat * ratio;
    aggregate.salt += entry.nutrients.salt * ratio;
    aggregate.fiber += entry.nutrients.fiber * ratio;
    aggregate.protein += entry.nutrients.protein * ratio;
    weightedFruitVeg += entry.fruitVegPercent * weight;
  }

  // Normalize to 100g
  const normFactor = 100 / totalWeight;
  aggregate.energy_kj *= normFactor;
  aggregate.sugars *= normFactor;
  aggregate.saturated_fat *= normFactor;
  aggregate.salt *= normFactor;
  aggregate.fiber *= normFactor;
  aggregate.protein *= normFactor;
  weightedFruitVeg = weightedFruitVeg / totalWeight;

  const result = calculateNutriScore(aggregate, weightedFruitVeg);
  return { grade: result.grade, numericScore: result.score };
}

function computeProteinGrams(
  proteinIng: Ingredient,
  vegIng: Ingredient,
  cerealIng: Ingredient,
): number | null {
  let total = 0;
  let hasData = false;

  for (const ing of [proteinIng, vegIng, cerealIng]) {
    const entry = getCiqualEntry(ing.ciqualId);
    if (entry) {
      total += (entry.nutrients.protein * ing.weightG) / 100;
      hasData = true;
    }
  }

  return hasData ? Math.round(total) : null;
}

// ─── Public API ─────────────────────────────────────

let cachedCombinations: SeoCombination[] | null = null;

export function getTopCombinations(): SeoCombination[] {
  if (cachedCombinations) return cachedCombinations;

  const ingredientMap = {
    proteins: Object.fromEntries(proteins.map((p) => [p.slug, p])),
    vegetables: Object.fromEntries(vegetables.map((v) => [v.slug, v])),
    cereals: Object.fromEntries(cereals.map((c) => [c.slug, c])),
  };

  const combinations: SeoCombination[] = [];

  for (const [pSlug, vSlug, cSlug] of priorityCombos) {
    const p = ingredientMap.proteins[pSlug];
    const v = ingredientMap.vegetables[vSlug];
    const c = ingredientMap.cereals[cSlug];

    if (!p || !v || !c) continue;

    const { grade, numericScore } = computeAssemblyGrade(p, v, c);
    const pScore = computeComponentScore(p.ciqualId);
    const vScore = computeComponentScore(v.ciqualId);
    const cScore = computeComponentScore(c.ciqualId);
    const proteinGrams = computeProteinGrams(p, v, c);

    combinations.push({
      protein: p.slug,
      vegetable: v.slug,
      cereal: c.slug,
      slug: `${pSlug}-${vSlug}-${cSlug}`,
      score: grade,
      numericScore,
      components: {
        protein: { name: p.name, ciqualId: p.ciqualId, grade: pScore.grade, score: pScore.score },
        vegetable: { name: v.name, ciqualId: v.ciqualId, grade: vScore.grade, score: vScore.score },
        cereal: { name: c.name, ciqualId: c.ciqualId, grade: cScore.grade, score: cScore.score },
      },
      proteinGrams,
    });
  }

  cachedCombinations = combinations;
  return combinations;
}

export function getCombinationBySlug(slug: string): SeoCombination | undefined {
  return getTopCombinations().find((c) => c.slug === slug);
}

/**
 * Returns related combinations (same protein or same vegetable, different combo)
 */
export function getRelatedCombinations(slug: string, limit = 4): SeoCombination[] {
  const current = getCombinationBySlug(slug);
  if (!current) return [];

  const all = getTopCombinations();
  return all
    .filter(
      (c) =>
        c.slug !== slug &&
        (c.protein === current.protein || c.vegetable === current.vegetable),
    )
    .slice(0, limit);
}
