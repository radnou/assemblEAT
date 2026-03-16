// ─── Types AssemblEat ────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type ComponentCategory = 'cereal' | 'protein' | 'vegetable' | 'sauce' | 'dairy' | 'fruit' | 'beverage';

export type NutriGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type FoodCategory = 'general' | 'cheese' | 'beverage' | 'fat';

export type SimplicityScore = '⭐ Express' | '⭐⭐ Rapide' | '⭐⭐⭐ Batch';

export type FlavorProfile = 'méditerranéen' | 'asiatique' | 'nordique' | 'mexicain' | 'classique' | 'végétarien';

export type FeatureFlag =
  | 'SHARE_WITH_DIETITIAN'
  | 'ADVANCED_REPERTOIRE'
  | 'WEEKLY_STATS'
  | 'PRACTITIONER_THREAD'
  | 'PRACTITIONER_GOALS'
  | 'SMART_SUGGESTIONS'
  | 'PHOTO_JOURNAL'
  | 'GROCERY_LIST'
  | 'CLOUD_SYNC';

export type SubscriptionPlan = 'free' | 'pro';

// ─── Nutri-Score ────────────────────────────────────

export interface NutrientInput {
  /** kJ pour 100g */
  energy_kj: number;
  /** g pour 100g */
  sugars: number;
  /** g pour 100g */
  saturated_fat: number;
  /** g pour 100g (sodium × 2.5) */
  salt: number;
  /** g pour 100g */
  fiber: number;
  /** g pour 100g */
  protein: number;
}

export interface NutriScoreResult {
  grade: NutriGrade;
  score: number;
  nPoints: number;
  pPoints: number;
  details: {
    energy: number;
    sugars: number;
    saturatedFat: number;
    salt: number;
    fiber: number;
    protein: number;
    fruitVeg: number;
  };
}

export interface AssemblyNutriScore {
  grade: NutriGrade;
  score: number;
  componentScores: {
    id: string;
    name: string;
    grade: NutriGrade;
    score: number;
  }[];
}

// ─── Meal Components ────────────────────────────────────

export interface MealComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  prepTime: number;
  tags: string[];
  conflictsWith?: string[];
  openFoodFactsBarcode?: string;
  ciqualRefId?: string;
  /** Poids en grammes pour le calcul nutritionnel */
  weightG?: number;
}

export interface AssemblyRow {
  id: string;
  mealType: MealType;
  protein: MealComponent | null;
  vegetable: MealComponent | null;
  cereal: MealComponent | null;
  sauce: MealComponent | null;
  extras?: MealComponent[];
  flavorProfile?: FlavorProfile;
  validated?: boolean;
  note?: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  breakfast: AssemblyRow | null;
  lunch: AssemblyRow | null;
  dinner: AssemblyRow | null;
  physicalActivity?: string;
  notes?: string;
}

export interface WeekPlan {
  weekKey: string; // YYYY-WW
  days: DayPlan[];
}

// ─── Batch Cook ────────────────────────────────────

export interface BatchItem {
  id: string;
  name: string;
  category: 'protein' | 'cereal' | 'vegetable' | 'sauce';
  checked: boolean;
  estimatedMinutes: number;
  cookingMethod: 'four' | 'vapeur' | 'poêle' | 'cru' | 'mixeur';
}

// ─── CIQUAL Reference ────────────────────────────────────

export interface CiqualEntry {
  id: string;
  name: string;
  nutrients: NutrientInput;
  fruitVegPercent: number;
  category: FoodCategory;
}

// ─── Settings ────────────────────────────────────

export interface UserSettings {
  firstName: string;
  language: 'fr' | 'en';
  rules: {
    antiRedundancy: boolean;
    starchWarning: boolean;
  };
}

// ─── User Profile ────────────────────────────────────

export interface UserProfile extends UserSettings {
  avatarEmoji: string;
  objective: 'balanced' | 'time_saving' | 'weight_loss' | 'more_protein' | 'less_meat';
  diets: string[];
  allergies: string[];
  householdSize: number;
  cookingTime: 'express' | 'moderate' | 'batch';
  mealsToTrack: MealType[];
  onboardingCompleted: boolean;
  foodPreferences?: { id: string; rating: 'like' | 'neutral' | 'dislike' }[];
}

// ─── Meal Feedback ────────────────────────────────────

export interface MealFeedback {
  id?: string;
  assemblyId: string;
  date: string;
  pleasure: 1 | 2 | 3 | 4 | 5;
  quantity: 'not_enough' | 'just_right' | 'too_much' | null;
  note: string | null;
}

// ─── Monthly Summary ────────────────────────────────────

export interface MonthlySummary {
  month: string;
  avgNutriScore: number;
  totalMeals: number;
  topAssemblies: {
    id: string;
    name: string;
    count: number;
    avgPleasure: number;
  }[];
  dominantEmoji: string;
}

// ─── Shared Link ────────────────────────────────────

export interface SharedLink {
  id: string;
  token: string;
  hasPassword: boolean;
  createdAt: string;
  expiresAt: string | null;
}

// ─── Practitioner ────────────────────────────────────

export interface PractitionerComment {
  id: string;
  weekKey: string;
  assemblyId: string;
  reaction: 'approved' | 'warning' | 'suggestion';
  comment: string | null;
  authorName: string;
  createdAt: string;
}

export interface PractitionerGoal {
  id: string;
  weekKey: string;
  goalText: string;
  targetCount: number | null;
  achievedCount: number;
}
