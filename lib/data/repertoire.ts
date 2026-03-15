import type { AssemblyRow, MealComponent, BatchItem, FlavorProfile } from '@/types';

// ─── Composants petit-déjeuner ──────────────────────

const breakfastComponents: Record<string, MealComponent> = {
  flocons: { id: 'flocons', name: "Flocons d'avoine", category: 'cereal', prepTime: 3, tags: ['cereales', 'chaud', 'gluten'], ciqualRefId: 'flocons-avoine' },
  painComplet: { id: 'painComplet', name: 'Pain complet', category: 'cereal', prepTime: 1, tags: ['cereales', 'tartine', 'gluten'], ciqualRefId: 'pain-complet' },
  yaourt: { id: 'yaourt', name: 'Yaourt nature', category: 'dairy', prepTime: 0, tags: ['laitage'], ciqualRefId: 'yaourt-nature' },
  fromBlanc: { id: 'fromBlanc', name: 'Fromage blanc', category: 'dairy', prepTime: 0, tags: ['laitage'], ciqualRefId: 'fromage-blanc' },
  oeufsBreak: { id: 'oeufsBreak', name: 'Œufs brouillés', category: 'protein', prepTime: 5, tags: ['oeufs', 'chaud'], ciqualRefId: 'oeufs-durs', conflictsWith: ['oeufs-plat', 'oeufs-dur-dej'] },
  banane: { id: 'banane', name: 'Banane', category: 'fruit', prepTime: 0, tags: ['fruit', 'sucre-naturel'], ciqualRefId: 'banane' },
  miel: { id: 'miel', name: 'Miel', category: 'sauce', prepTime: 0, tags: ['sucrant'], ciqualRefId: 'miel' },
};

// ─── Composants déjeuner ────────────────────────────

const lunchProteins: MealComponent[] = [
  { id: 'poulet-dej', name: 'Poulet grillé', category: 'protein', prepTime: 2, tags: ['viande', 'volaille'], ciqualRefId: 'poulet-grille', weightG: 150 },
  { id: 'thon-dej', name: 'Thon en boîte', category: 'protein', prepTime: 1, tags: ['poisson', 'conserve'], ciqualRefId: 'thon-conserve', openFoodFactsBarcode: '3165440100186', weightG: 130 },
  { id: 'oeufs-dur-dej', name: 'Œufs durs', category: 'protein', prepTime: 1, tags: ['oeufs'], ciqualRefId: 'oeufs-durs', conflictsWith: ['oeufsBreak'], weightG: 120 },
  { id: 'lentilles-dej', name: 'Lentilles', category: 'protein', prepTime: 2, tags: ['legumineuse', 'vegetal'], ciqualRefId: 'lentilles-cuites', weightG: 150 },
  { id: 'saumon-dej', name: 'Saumon vapeur', category: 'protein', prepTime: 2, tags: ['poisson'], ciqualRefId: 'saumon-vapeur', weightG: 130 },
  { id: 'tofu-dej', name: 'Tofu sauté', category: 'protein', prepTime: 3, tags: ['vegetal', 'soja'], ciqualRefId: 'tofu-nature', weightG: 150 },
];

const lunchVegetables: MealComponent[] = [
  { id: 'brocolis-dej', name: 'Brocolis vapeur', category: 'vegetable', prepTime: 1, tags: ['vert', 'vapeur'], ciqualRefId: 'brocolis-vapeur', weightG: 200 },
  { id: 'courgettes-dej', name: 'Courgettes grillées', category: 'vegetable', prepTime: 1, tags: ['grille', 'ete'], ciqualRefId: 'courgettes-grillees', weightG: 200 },
  { id: 'carottes-dej', name: 'Carottes vapeur', category: 'vegetable', prepTime: 1, tags: ['racine', 'vapeur'], ciqualRefId: 'carottes-vapeur', weightG: 200 },
  { id: 'haricots-dej', name: 'Haricots verts', category: 'vegetable', prepTime: 1, tags: ['vert'], ciqualRefId: 'haricots-verts', weightG: 200 },
  { id: 'epinards-dej', name: 'Épinards', category: 'vegetable', prepTime: 1, tags: ['feuille', 'vert'], ciqualRefId: 'epinards-cuits', weightG: 200 },
  { id: 'tomates-dej', name: 'Tomates', category: 'vegetable', prepTime: 0, tags: ['cru', 'ete'], ciqualRefId: 'tomates', weightG: 150 },
];

const lunchCereals: MealComponent[] = [
  { id: 'riz-dej', name: 'Riz complet', category: 'cereal', prepTime: 2, tags: ['feculent'], ciqualRefId: 'riz-complet', weightG: 150 },
  { id: 'quinoa-dej', name: 'Quinoa', category: 'cereal', prepTime: 2, tags: ['feculent', 'complet'], ciqualRefId: 'quinoa-cuit', weightG: 150 },
  { id: 'patate-dej', name: 'Patate douce', category: 'cereal', prepTime: 2, tags: ['feculent', 'tubercule'], ciqualRefId: 'patate-douce', weightG: 150 },
  { id: 'semoule-dej', name: 'Semoule complète', category: 'cereal', prepTime: 2, tags: ['feculent', 'gluten'], ciqualRefId: 'semoule-complete', weightG: 150 },
  { id: 'pates-dej', name: 'Pâtes complètes', category: 'cereal', prepTime: 2, tags: ['feculent', 'gluten'], ciqualRefId: 'pates-completes', weightG: 150 },
];

const sauces: MealComponent[] = [
  { id: 'vinaigrette', name: 'Vinaigrette maison', category: 'sauce', prepTime: 1, tags: ['classique'], ciqualRefId: 'vinaigrette-maison', weightG: 20 },
  { id: 'sauce-soja-s', name: 'Sauce soja', category: 'sauce', prepTime: 0, tags: ['asiatique'], ciqualRefId: 'sauce-soja', weightG: 15 },
  { id: 'houmous-s', name: 'Houmous', category: 'sauce', prepTime: 0, tags: ['oriental'], ciqualRefId: 'houmous', weightG: 40 },
];

// ─── Assemblages pré-définis ────────────────────────

export const breakfastAssemblies: AssemblyRow[] = [
  {
    id: 'pdj-1', mealType: 'breakfast',
    protein: null, cereal: breakfastComponents.flocons,
    vegetable: null, sauce: breakfastComponents.miel,
    extras: [breakfastComponents.yaourt, breakfastComponents.banane],
    flavorProfile: 'classique',
  },
  {
    id: 'pdj-2', mealType: 'breakfast',
    protein: breakfastComponents.oeufsBreak, cereal: breakfastComponents.painComplet,
    vegetable: null, sauce: null,
    flavorProfile: 'classique',
  },
  {
    id: 'pdj-3', mealType: 'breakfast',
    protein: null, cereal: breakfastComponents.painComplet,
    vegetable: null, sauce: breakfastComponents.miel,
    extras: [breakfastComponents.fromBlanc],
    flavorProfile: 'classique',
  },
  {
    id: 'pdj-4', mealType: 'breakfast',
    protein: null, cereal: breakfastComponents.flocons,
    vegetable: null, sauce: null,
    extras: [breakfastComponents.fromBlanc, breakfastComponents.banane],
    flavorProfile: 'nordique',
  },
];

export const lunchAssemblies: AssemblyRow[] = [
  {
    id: 'dej-1', mealType: 'lunch',
    protein: lunchProteins[0], vegetable: lunchVegetables[0],
    cereal: lunchCereals[0], sauce: sauces[0],
    flavorProfile: 'classique',
  },
  {
    id: 'dej-2', mealType: 'lunch',
    protein: lunchProteins[1], vegetable: lunchVegetables[5],
    cereal: lunchCereals[1], sauce: sauces[0],
    flavorProfile: 'méditerranéen',
  },
  {
    id: 'dej-3', mealType: 'lunch',
    protein: lunchProteins[3], vegetable: lunchVegetables[1],
    cereal: lunchCereals[3], sauce: sauces[2],
    flavorProfile: 'méditerranéen',
  },
  {
    id: 'dej-4', mealType: 'lunch',
    protein: lunchProteins[5], vegetable: lunchVegetables[0],
    cereal: lunchCereals[0], sauce: sauces[1],
    flavorProfile: 'asiatique',
  },
  {
    id: 'dej-5', mealType: 'lunch',
    protein: lunchProteins[4], vegetable: lunchVegetables[3],
    cereal: lunchCereals[2], sauce: sauces[0],
    flavorProfile: 'nordique',
  },
  {
    id: 'dej-6', mealType: 'lunch',
    protein: lunchProteins[2], vegetable: lunchVegetables[4],
    cereal: lunchCereals[4], sauce: sauces[0],
    flavorProfile: 'classique',
  },
];

export const dinnerAssemblies: AssemblyRow[] = [
  {
    id: 'din-1', mealType: 'dinner',
    protein: lunchProteins[0], vegetable: lunchVegetables[1],
    cereal: null, sauce: sauces[0],
    flavorProfile: 'classique',
  },
  {
    id: 'din-2', mealType: 'dinner',
    protein: lunchProteins[4], vegetable: lunchVegetables[0],
    cereal: { ...lunchCereals[0], weightG: 100 }, sauce: sauces[1],
    flavorProfile: 'asiatique',
  },
  {
    id: 'din-3', mealType: 'dinner',
    protein: lunchProteins[3], vegetable: lunchVegetables[4],
    cereal: null, sauce: sauces[0],
    flavorProfile: 'végétarien',
  },
  {
    id: 'din-4', mealType: 'dinner',
    protein: lunchProteins[1], vegetable: lunchVegetables[5],
    cereal: null, sauce: sauces[0],
    flavorProfile: 'méditerranéen',
  },
  {
    id: 'din-5', mealType: 'dinner',
    protein: lunchProteins[5], vegetable: lunchVegetables[2],
    cereal: { ...lunchCereals[2], weightG: 100 }, sauce: sauces[1],
    flavorProfile: 'asiatique',
  },
  {
    id: 'din-6', mealType: 'dinner',
    protein: lunchProteins[2], vegetable: lunchVegetables[3],
    cereal: null, sauce: sauces[2],
    flavorProfile: 'classique',
  },
];

// ─── Profils saveurs ────────────────────────────────

export const flavorProfiles: Record<FlavorProfile, { name: string; description: string; emoji: string }> = {
  'méditerranéen': { name: 'Méditerranéen', description: 'Huile d\'olive, tomates, herbes', emoji: '🫒' },
  'asiatique': { name: 'Asiatique', description: 'Sauce soja, gingembre, sésame', emoji: '🥢' },
  'nordique': { name: 'Nordique', description: 'Saumon, avoine, baies', emoji: '🐟' },
  'mexicain': { name: 'Mexicain', description: 'Épices, haricots, maïs', emoji: '🌮' },
  'classique': { name: 'Classique', description: 'Vinaigrette, herbes, beurre', emoji: '🍽️' },
  'végétarien': { name: 'Végétarien', description: 'Légumineuses, tofu, graines', emoji: '🥬' },
};

// ─── Batch Cook Dimanche ────────────────────────────

export const batchCookItems: BatchItem[] = [
  // Protéines
  { id: 'bc-poulet', name: 'Poulet (4 portions)', category: 'protein', checked: false, estimatedMinutes: 25, cookingMethod: 'four' },
  { id: 'bc-oeufs', name: 'Œufs durs (8)', category: 'protein', checked: false, estimatedMinutes: 12, cookingMethod: 'poêle' },
  { id: 'bc-lentilles', name: 'Lentilles (2 portions)', category: 'protein', checked: false, estimatedMinutes: 20, cookingMethod: 'poêle' },
  // Féculents
  { id: 'bc-riz', name: 'Riz complet (4 portions)', category: 'cereal', checked: false, estimatedMinutes: 15, cookingMethod: 'poêle' },
  { id: 'bc-quinoa', name: 'Quinoa (2 portions)', category: 'cereal', checked: false, estimatedMinutes: 12, cookingMethod: 'poêle' },
  { id: 'bc-patate', name: 'Patates douces (3 portions)', category: 'cereal', checked: false, estimatedMinutes: 30, cookingMethod: 'four' },
  // Légumes
  { id: 'bc-brocolis', name: 'Brocolis vapeur (3 portions)', category: 'vegetable', checked: false, estimatedMinutes: 8, cookingMethod: 'vapeur' },
  { id: 'bc-courgettes', name: 'Courgettes grillées (2 portions)', category: 'vegetable', checked: false, estimatedMinutes: 10, cookingMethod: 'poêle' },
  { id: 'bc-carottes', name: 'Carottes vapeur (2 portions)', category: 'vegetable', checked: false, estimatedMinutes: 10, cookingMethod: 'vapeur' },
  { id: 'bc-haricots', name: 'Haricots verts (2 portions)', category: 'vegetable', checked: false, estimatedMinutes: 8, cookingMethod: 'vapeur' },
  // Sauces
  { id: 'bc-vinaigrette', name: 'Vinaigrette maison', category: 'sauce', checked: false, estimatedMinutes: 3, cookingMethod: 'cru' },
  { id: 'bc-houmous', name: 'Houmous maison', category: 'sauce', checked: false, estimatedMinutes: 5, cookingMethod: 'mixeur' },
];

export function getAllAssemblies(): AssemblyRow[] {
  return [...breakfastAssemblies, ...lunchAssemblies, ...dinnerAssemblies];
}

export function getAssembliesByMealType(mealType: AssemblyRow['mealType']): AssemblyRow[] {
  switch (mealType) {
    case 'breakfast': return breakfastAssemblies;
    case 'lunch': return lunchAssemblies;
    case 'dinner': return dinnerAssemblies;
  }
}
