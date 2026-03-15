# AssemblEat v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform AssemblEat from a localStorage-only PWA into a full-stack micro-SaaS with Supabase backend, Stripe payments, viral GenZ features, and practitioner sharing.

**Architecture:** Next.js 16 frontend on Vercel connects to Supabase self-hosted (Docker) on OVH VPS via API routes. Zustand store abstracts persistence (localStorage ↔ Supabase) through a `PersistenceLayer`. Stripe Checkout handles payments. Canvas API generates shareable images client-side.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Supabase (Docker), Stripe, @serwist/next, next-intl, vitest, Framer Motion, Canvas API

**Spec:** `docs/superpowers/specs/2026-03-15-assembleat-v2-features-design.md`

---

## File Structure

### New files to create

```
# Infrastructure
app/sw.ts                                    — Serwist service worker
vitest.config.ts                             — Test configuration
messages/fr.json                             — i18n French translations
messages/en.json                             — i18n English translations
i18n/request.ts                              — next-intl server config
lib/supabase/client.ts                       — Supabase browser client
lib/supabase/server.ts                       — Supabase server client
lib/store/persistence.ts                     — PersistenceLayer abstraction
lib/stripe/client.ts                         — Stripe server client
lib/hooks/useMigration.ts                    — localStorage → Supabase migration

# Components
components/onboarding/OnboardingFlow.tsx     — 5-screen onboarding wizard
components/onboarding/OnboardingStep1.tsx    — Name + avatar
components/onboarding/OnboardingStep2.tsx    — Objective
components/onboarding/OnboardingStep3.tsx    — Diets + allergies
components/onboarding/OnboardingStep4.tsx    — Habits
components/onboarding/OnboardingStep5.tsx    — Recap + first assembly
components/onboarding/OnboardingProgress.tsx — Progress bar
components/feedback/FeedbackSheet.tsx         — Post-meal feedback bottom sheet
components/feedback/PleasureSelector.tsx      — 5-emoji selector with aria-labels
components/streak/StreakBadge.tsx             — Streak counter + badges
components/share/ShareWeekImage.tsx           — Canvas API image generator
components/wrapped/WrappedCarousel.tsx        — Monthly wrapped 5 slides
components/tierlist/TierListGrid.tsx          — Tier list S/A/B/C/D grid
components/roast/RoastCard.tsx               — Roast punchlines card
components/roast/roastTemplates.ts           — 100+ punchline templates
components/ProfileNudgeBanner.tsx            — Nudge for incomplete profiles
lib/canvas/imageGenerator.ts                 — Canvas rendering functions
lib/canvas/canvasUtils.ts                    — Drawing utilities
lib/canvas/canvasWorker.ts                   — OffscreenCanvas Web Worker

# Pages
app/onboarding/page.tsx                      — Onboarding page
app/tierlist/page.tsx                        — Tier list page
app/wrapped/page.tsx                         — Monthly wrapped page
app/roast/page.tsx                           — Roast my diet page
app/share/[token]/page.tsx                   — Practitioner shared view
app/login/page.tsx                           — Login/signup page

# API Routes
app/api/auth/callback/route.ts               — OAuth callback
app/api/profile/route.ts                     — GET/PATCH profile
app/api/week-plans/[weekKey]/route.ts        — GET/PUT week plans
app/api/feedbacks/route.ts                   — POST/GET feedbacks
app/api/streaks/route.ts                     — GET streak
app/api/streaks/validate/route.ts            — POST validate day
app/api/share/links/route.ts                 — POST/DELETE shared links
app/api/share/verify/route.ts                — POST verify password
app/api/share/[token]/route.ts               — GET shared data
app/api/practitioner/comments/route.ts       — GET/POST comments
app/api/practitioner/goals/route.ts          — GET/POST/PATCH goals
app/api/stripe/create-checkout/route.ts      — POST create checkout
app/api/stripe/create-portal/route.ts        — POST create portal
app/api/webhooks/stripe/route.ts             — POST webhook handler
app/api/summaries/[month]/route.ts           — GET/generate wrapped
app/api/gdpr/export/route.ts                 — GET export data
app/api/gdpr/delete/route.ts                 — DELETE account
app/api/sync/batch/route.ts                  — POST offline queue flush

# VPS
infra/docker-compose.traefik.yml             — Traefik reverse proxy
infra/docker-compose.supabase.yml            — Supabase platform instance
infra/supabase/.env.example                  — Environment variables template
infra/supabase/init/01-schema.sql            — Schema + tables
infra/supabase/init/02-rls.sql               — Row Level Security policies
infra/supabase/kong.yml                      — Kong API gateway config
infra/scripts/setup-firewall.sh              — ufw setup script
infra/scripts/deploy-supabase.sh             — Deployment script

# Tests
__tests__/lib/engine/assemblyEngine.test.ts  — Engine with diet/allergy filters
__tests__/lib/nutriscore/algorithm.test.ts   — Nutri-Score v2 algorithm
__tests__/lib/store/persistence.test.ts      — Persistence layer
__tests__/components/FeedbackSheet.test.tsx   — Feedback component
__tests__/components/OnboardingFlow.test.tsx  — Onboarding flow
```

### Existing files to modify

```
types/index.ts                               — Add UserProfile, MealFeedback, extended FeatureFlag
lib/config/features.ts                       — Add 7 new feature flags
lib/data/repertoire.ts                       — Add missing tags (gluten, porc)
lib/engine/assemblyEngine.ts                 — Add diet/allergy/objective filtering
lib/store/useMealStore.ts                    — Refactor with PersistenceLayer
lib/i18n/fr.ts                               — DELETE after migration to next-intl
next.config.ts                               — Replace next-pwa with @serwist/next
app/layout.tsx                               — Add NextIntlClientProvider, onboarding gate
app/page.tsx                                 — Add StreakBadge, ProfileNudge, FeedbackSheet
app/globals.css                              — No changes needed
components/AssemblyCard.tsx                   — i18n, WCAG fixes, feedback button
components/BottomNav.tsx                      — i18n, WCAG fixes, tierlist nav item
components/ProUpsellDialog.tsx                — Contextual upsell messages, new flags
package.json                                 — Dependencies changes
```

---

## Chunk 1: Phase 0 — Setup + Fixes (Sprint 1, days 1-2)

### Task 1: Replace next-pwa with @serwist/next

**Files:**
- Create: `app/sw.ts`
- Modify: `next.config.ts`
- Modify: `package.json`
- Delete: `next-pwa.d.ts`

- [ ] **Step 1: Uninstall next-pwa, install @serwist/next**

```bash
npm uninstall next-pwa && npm install @serwist/next @serwist/sw
```

- [ ] **Step 2: Create service worker source**

Create `app/sw.ts`:

```typescript
import { defaultCache } from '@serwist/next/worker';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: string[] };

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'off-api-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
      },
    },
  ],
});
```

- [ ] **Step 3: Update next.config.ts**

Replace entire content of `next.config.ts`:

```typescript
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

- [ ] **Step 4: Delete old type declaration**

```bash
rm next-pwa.d.ts
```

- [ ] **Step 5: Build to verify**

```bash
npm run build
```

Expected: Build succeeds with no errors about next-pwa.

- [ ] **Step 6: Commit**

```bash
git add app/sw.ts next.config.ts package.json package-lock.json
git rm next-pwa.d.ts
git commit -m "chore: replace next-pwa with @serwist/next for Next.js 16 compatibility"
```

---

### Task 2: Add vitest + testing-library

**Files:**
- Create: `vitest.config.ts`
- Create: `__tests__/lib/nutriscore/algorithm.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Write first test — Nutri-Score algorithm**

Create `__tests__/lib/nutriscore/algorithm.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateNutriScore } from '@/lib/nutriscore/algorithm';

describe('calculateNutriScore', () => {
  it('returns grade A for broccoli (low energy, high fiber, 100% veg)', () => {
    const result = calculateNutriScore(
      { energy_kj: 146, sugars: 1.7, saturated_fat: 0.04, salt: 0.04, fiber: 3.3, protein: 2.8 },
      100
    );
    expect(result.grade).toBe('A');
    expect(result.score).toBeLessThanOrEqual(0);
  });

  it('returns grade A for chicken breast (high protein, low sugar)', () => {
    const result = calculateNutriScore(
      { energy_kj: 695, sugars: 0, saturated_fat: 1.3, salt: 0.3, fiber: 0, protein: 26 },
      0
    );
    expect(result.grade).toBe('A');
  });

  it('applies protein cap when N >= 7 and category is not cheese', () => {
    const result = calculateNutriScore(
      { energy_kj: 2500, sugars: 30, saturated_fat: 8, salt: 2, fiber: 1, protein: 15 },
      0,
      'general'
    );
    // N >= 7, protein should NOT be counted
    expect(result.pPoints).toBeLessThan(result.details.fiber + result.details.protein + result.details.fruitVeg);
  });

  it('does NOT apply protein cap for cheese', () => {
    const result = calculateNutriScore(
      { energy_kj: 2500, sugars: 30, saturated_fat: 8, salt: 2, fiber: 1, protein: 15 },
      0,
      'cheese'
    );
    expect(result.pPoints).toBe(result.details.fiber + result.details.protein + result.details.fruitVeg);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts __tests__/ package.json package-lock.json
git commit -m "chore: add vitest + testing-library with Nutri-Score algorithm tests"
```

---

### Task 3: Fix existing bugs + WCAG

**Files:**
- Modify: `lib/data/repertoire.ts` — fix dinner starch weightG 150→100
- Modify: `components/AssemblyCard.tsx` — gray-400→gray-500, text-[10px]→text-xs
- Modify: `components/BottomNav.tsx` — gray-400→gray-500, text-[10px]→text-xs

- [ ] **Step 1: Fix dinner starch weights in repertoire.ts**

In `lib/data/repertoire.ts`, for all dinner assemblies that reference lunch cereals, the `weightG` of cereals used at dinner must be 100g not 150g. The fix is in the dinner assemblies themselves — override the cereal weightG:

Find `dinnerAssemblies` and for each entry with a cereal (din-2, din-5), change the cereal reference to use `weightG: 100`:

```typescript
// In dinnerAssemblies, for entries with cereal:
// din-2: cereal: { ...lunchCereals[0], weightG: 100 }
// din-5: cereal: { ...lunchCereals[2], weightG: 100 }
```

- [ ] **Step 2: Fix WCAG contrast in AssemblyCard.tsx**

In `components/AssemblyCard.tsx`:
- Replace all `text-gray-400` with `text-gray-500`
- Replace all `text-[10px]` with `text-xs`
- Replace all `text-[11px]` with `text-xs`

- [ ] **Step 3: Fix WCAG contrast in BottomNav.tsx**

In `components/BottomNav.tsx`:
- Replace `text-gray-400` with `text-gray-500`
- Replace `text-[10px]` with `text-xs`

- [ ] **Step 4: Build to verify**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/data/repertoire.ts components/AssemblyCard.tsx components/BottomNav.tsx
git commit -m "fix: dinner starch weightG 150→100 and WCAG contrast improvements"
```

---

### Task 4: Extend types for v2

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add new types to types/index.ts**

Append to `types/index.ts`:

```typescript
// ─── User Profile (extends UserSettings) ────────────────

export interface UserProfile extends UserSettings {
  avatarEmoji: string;
  objective: 'balanced' | 'time_saving' | 'weight_loss' | 'more_protein' | 'less_meat';
  diets: string[];
  allergies: string[];
  householdSize: number;
  cookingTime: 'express' | 'moderate' | 'batch';
  mealsToTrack: MealType[];
  onboardingCompleted: boolean;
}

// ─── Meal Feedback ──────────────────────────────────

export interface MealFeedback {
  id?: string;
  assemblyId: string;
  date: string;
  pleasure: 1 | 2 | 3 | 4 | 5;
  quantity: 'not_enough' | 'just_right' | 'too_much' | null;
  note: string | null;
}

// ─── Monthly Summary ────────────────────────────────

export interface MonthlySummary {
  month: string; // YYYY-MM
  avgNutriScore: number;
  totalMeals: number;
  topAssemblies: { id: string; name: string; count: number; avgPleasure: number }[];
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

// ─── Practitioner Comment ───────────────────────────

export interface PractitionerComment {
  id: string;
  weekKey: string;
  assemblyId: string;
  reaction: 'approved' | 'warning' | 'suggestion';
  comment: string | null;
  authorName: string;
  createdAt: string;
}

// ─── Practitioner Goal ──────────────────────────────

export interface PractitionerGoal {
  id: string;
  weekKey: string;
  goalText: string;
  targetCount: number | null;
  achievedCount: number;
}
```

- [ ] **Step 2: Extend FeatureFlag type**

In `types/index.ts`, replace the existing `FeatureFlag` type:

```typescript
export type FeatureFlag =
  | 'SHARE_WITH_DIETITIAN'
  | 'ADVANCED_REPERTOIRE'
  | 'WEEKLY_STATS'
  | 'MULTI_PROFILE'
  | 'PRACTITIONER_THREAD'
  | 'PRACTITIONER_GOALS'
  | 'SMART_SUGGESTIONS'
  | 'PHOTO_JOURNAL'
  | 'GROCERY_LIST'
  | 'CLOUD_SYNC'
  | 'FRIDGE_MODE'
  | 'FRIEND_COMPARE';
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
```

Expected: Build succeeds (new types are additive, no breakage).

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "feat: extend types with UserProfile, MealFeedback, SharedLink, PractitionerComment"
```

---

### Task 5: Extend feature flags config

**Files:**
- Modify: `lib/config/features.ts`

- [ ] **Step 1: Add new flags to feature matrix**

In `lib/config/features.ts`, extend `featureMatrix` and `featureDescriptions`:

```typescript
const featureMatrix: Record<FeatureFlag, Record<SubscriptionPlan, boolean>> = {
  SHARE_WITH_DIETITIAN: { free: false, pro: true },
  ADVANCED_REPERTOIRE: { free: false, pro: true },
  WEEKLY_STATS: { free: false, pro: true },
  MULTI_PROFILE: { free: false, pro: true },
  PRACTITIONER_THREAD: { free: false, pro: true },
  PRACTITIONER_GOALS: { free: false, pro: true },
  SMART_SUGGESTIONS: { free: false, pro: true },
  PHOTO_JOURNAL: { free: false, pro: true },
  GROCERY_LIST: { free: false, pro: true },
  CLOUD_SYNC: { free: false, pro: true },
  FRIDGE_MODE: { free: false, pro: true },
  FRIEND_COMPARE: { free: false, pro: true },
};

export const featureDescriptions: Record<FeatureFlag, { title: string; description: string }> = {
  SHARE_WITH_DIETITIAN: {
    title: 'Partage diététicien',
    description: 'Partagez votre semainier avec votre diététicien(ne) via un lien sécurisé.',
  },
  ADVANCED_REPERTOIRE: {
    title: 'Répertoire avancé',
    description: 'Plus de 16 assemblages personnalisables.',
  },
  WEEKLY_STATS: {
    title: 'Statistiques hebdo',
    description: 'Évolution du Nutri-Score moyen sur 12 semaines.',
  },
  MULTI_PROFILE: {
    title: 'Multi-profils',
    description: 'Gérez plusieurs profils famille dans le même compte.',
  },
  PRACTITIONER_THREAD: {
    title: 'Thread praticien',
    description: 'Recevez les commentaires et réactions de votre praticien sur chaque repas.',
  },
  PRACTITIONER_GOALS: {
    title: 'Objectifs co-construits',
    description: 'Votre praticien définit des objectifs nutritionnels personnalisés.',
  },
  SMART_SUGGESTIONS: {
    title: 'Suggestions intelligentes',
    description: "L'app apprend vos goûts et propose des assemblages de plus en plus adaptés.",
  },
  PHOTO_JOURNAL: {
    title: 'Journal photo',
    description: 'Photographiez vos plats — votre praticien voit les vraies portions.',
  },
  GROCERY_LIST: {
    title: 'Liste de courses',
    description: 'Liste de courses auto-générée depuis votre semainier.',
  },
  CLOUD_SYNC: {
    title: 'Sync cloud',
    description: 'Synchronisez vos données entre tous vos appareils.',
  },
  FRIDGE_MODE: {
    title: 'Mode frigo',
    description: "Sélectionnez vos ingrédients dispo — l'app propose des assemblages.",
  },
  FRIEND_COMPARE: {
    title: 'Comparaison amis',
    description: 'Comparez votre Nutri-Score avec vos amis.',
  },
};
```

- [ ] **Step 2: Build to verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/config/features.ts
git commit -m "feat: add 8 new Pro feature flags with descriptions"
```

---

### Task 6: Add missing tags to repertoire + diet/allergy filtering

**Files:**
- Modify: `lib/data/repertoire.ts`
- Modify: `lib/engine/assemblyEngine.ts`
- Create: `__tests__/lib/engine/assemblyEngine.test.ts`

- [ ] **Step 1: Write failing tests for diet filtering**

Create `__tests__/lib/engine/assemblyEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateRandomAssembly, filterByDiets, filterByAllergies } from '@/lib/engine/assemblyEngine';
import { lunchAssemblies } from '@/lib/data/repertoire';

describe('filterByDiets', () => {
  it('vegetarien excludes viande, volaille, poisson', () => {
    const filtered = filterByDiets(lunchAssemblies, ['vegetarien']);
    filtered.forEach((a) => {
      const tags = a.protein?.tags ?? [];
      expect(tags).not.toContain('viande');
      expect(tags).not.toContain('volaille');
      expect(tags).not.toContain('poisson');
    });
  });

  it('returns all assemblies when diets is empty', () => {
    const filtered = filterByDiets(lunchAssemblies, []);
    expect(filtered.length).toBe(lunchAssemblies.length);
  });
});

describe('filterByAllergies', () => {
  it('oeufs allergy excludes assemblies with oeufs tag', () => {
    const filtered = filterByAllergies(lunchAssemblies, ['oeufs']);
    filtered.forEach((a) => {
      const tags = a.protein?.tags ?? [];
      expect(tags).not.toContain('oeufs');
    });
  });
});

describe('generateRandomAssembly with filters', () => {
  it('does not crash when all candidates are filtered out', () => {
    const result = generateRandomAssembly('lunch', {
      diets: ['vegetalien'],
      allergies: ['soja'],
    });
    // Should return null or a fallback, never crash
    // The function may return an assembly if it relaxes filters
    expect(result).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/lib/engine/assemblyEngine.test.ts
```

Expected: FAIL — `filterByDiets` and `filterByAllergies` don't exist yet.

- [ ] **Step 3: Add missing tags to repertoire.ts**

In `lib/data/repertoire.ts`, update the following components' `tags` arrays:

```typescript
// breakfastComponents
painComplet: { ..., tags: ['cereales', 'tartine', 'gluten'] }
flocons: { ..., tags: ['cereales', 'chaud', 'gluten'] }

// lunchCereals
'semoule-dej': { ..., tags: ['feculent', 'gluten'] }
'pates-dej': { ..., tags: ['feculent', 'gluten'] }
```

- [ ] **Step 4: Implement diet/allergy filtering in assemblyEngine.ts**

Add these exported functions to `lib/engine/assemblyEngine.ts`:

```typescript
const DIET_EXCLUDED_TAGS: Record<string, string[]> = {
  vegetarien: ['viande', 'volaille', 'poisson'],
  vegetalien: ['viande', 'volaille', 'poisson', 'laitage', 'oeufs'],
  pescetarien: ['viande', 'volaille'],
  sans_gluten: ['gluten'],
  sans_lactose: ['laitage'],
  halal: ['porc'],
  casher: ['porc', 'fruits_de_mer'],
};

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

export function filterByAllergies(assemblies: AssemblyRow[], allergies: string[]): AssemblyRow[] {
  if (allergies.length === 0) return assemblies;
  const allergenTags = new Set(allergies);
  return assemblies.filter((a) => {
    const allTags = [
      ...(a.protein?.tags ?? []),
      ...(a.vegetable?.tags ?? []),
      ...(a.cereal?.tags ?? []),
      ...(a.sauce?.tags ?? []),
      ...(a.extras?.flatMap((e) => e.tags) ?? []),
    ];
    return !allTags.some((tag) => allergenTags.has(tag));
  });
}
```

- [ ] **Step 5: Update generateRandomAssembly to use filters**

Modify `generateRandomAssembly` signature and body:

```typescript
export function generateRandomAssembly(
  mealType: MealType,
  options: {
    breakfastAssembly?: AssemblyRow | null;
    recentProteins?: string[];
    enableAntiRedundancy?: boolean;
    diets?: string[];
    allergies?: string[];
    objective?: string;
  } = {}
): AssemblyRow | null {
  let candidates = getAssembliesByMealType(mealType);

  // 1. Filter by diets
  if (options.diets && options.diets.length > 0) {
    candidates = filterByDiets(candidates, options.diets);
  }

  // 2. Filter by allergies
  if (options.allergies && options.allergies.length > 0) {
    candidates = filterByAllergies(candidates, options.allergies);
  }

  // 3. Apply objective
  if (options.objective === 'weight_loss' && mealType === 'dinner') {
    candidates = candidates.filter((a) => a.cereal === null);
  } else if (options.objective === 'less_meat') {
    const meatless = candidates.filter((a) =>
      !a.protein?.tags.some((t) => ['viande', 'volaille'].includes(t))
    );
    if (meatless.length > 0) candidates = meatless;
  }

  // 4. Anti-redundancy
  if (options.enableAntiRedundancy !== false && options.breakfastAssembly) {
    candidates = applyAntiRedundancy(candidates, options.breakfastAssembly);
  }

  // 5. Variety
  if (options.recentProteins && options.recentProteins.length > 0) {
    const filtered = applyVarietyFilter(candidates, options.recentProteins);
    if (filtered.length > 0) candidates = filtered;
  }

  // 6. Zero candidates fallback
  if (candidates.length === 0) {
    // Relax: try without variety
    candidates = getAssembliesByMealType(mealType);
    if (options.diets) candidates = filterByDiets(candidates, options.diets);
    if (options.allergies) candidates = filterByAllergies(candidates, options.allergies);
  }
  if (candidates.length === 0) {
    // Relax: try without objective
    candidates = getAssembliesByMealType(mealType);
    if (options.diets) candidates = filterByDiets(candidates, options.diets);
    if (options.allergies) candidates = filterByAllergies(candidates, options.allergies);
  }
  if (candidates.length === 0) {
    return null; // Caller displays "no matching assemblies" message
  }

  const index = Math.floor(Math.random() * candidates.length);
  return { ...candidates[index], validated: false };
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test:run
```

Expected: All tests PASS.

- [ ] **Step 7: Build to verify**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add lib/data/repertoire.ts lib/engine/assemblyEngine.ts __tests__/lib/engine/
git commit -m "feat: add diet/allergy/objective filtering to assembly engine with zero-candidate fallback"
```

---

### Task 7: Migrate i18n to next-intl

**Files:**
- Create: `messages/fr.json`
- Create: `messages/en.json`
- Create: `i18n/request.ts`
- Modify: `next.config.ts`
- Modify: `app/layout.tsx`
- Modify: `components/AssemblyCard.tsx`
- Modify: `components/BottomNav.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Create messages/fr.json**

Convert `lib/i18n/fr.ts` object to JSON. Create `messages/fr.json` with the same structure but as pure JSON (no `as const`, no TypeScript).

- [ ] **Step 3: Create messages/en.json**

Same structure, English values.

- [ ] **Step 4: Create i18n/request.ts**

```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'fr';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Update next.config.ts**

Add `createNextIntlPlugin` import and wrap the config:

```typescript
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(withNextIntl(nextConfig));
```

- [ ] **Step 6: Update layout.tsx**

Add `NextIntlClientProvider` wrapper. Replace hardcoded `lang="fr"` with dynamic locale.

- [ ] **Step 7: Update components to use useTranslations**

In `AssemblyCard.tsx`: replace `fr.dashboard.*` imports with `const t = useTranslations('dashboard')`.
In `BottomNav.tsx`: replace hardcoded labels with `const t = useTranslations('nav')`.
In `app/page.tsx`: replace `'fr-FR'` locale with `useLocale()`.

- [ ] **Step 8: Delete old i18n file**

```bash
rm lib/i18n/fr.ts
```

- [ ] **Step 9: Build and test**

```bash
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add messages/ i18n/ next.config.ts app/layout.tsx components/AssemblyCard.tsx components/BottomNav.tsx app/page.tsx
git rm lib/i18n/fr.ts
git commit -m "feat: migrate i18n from static fr.ts to next-intl with FR/EN support"
```

---

## Chunk 2: Sprint 2 — Onboarding + Auth + Feedback (days 6-10)

### Task 8: Onboarding Flow UI (5 screens)

**Files:**
- Create: `components/onboarding/OnboardingFlow.tsx`
- Create: `components/onboarding/OnboardingStep1.tsx`
- Create: `components/onboarding/OnboardingStep2.tsx`
- Create: `components/onboarding/OnboardingStep3.tsx`
- Create: `components/onboarding/OnboardingStep4.tsx`
- Create: `components/onboarding/OnboardingStep5.tsx`
- Create: `components/onboarding/OnboardingProgress.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create OnboardingProgress component**

Simple progress bar: `currentStep / totalSteps` rendered as a Tailwind progress bar.

- [ ] **Step 2: Create each step component**

Each step is a self-contained form screen with `value` and `onChange` props. Use Framer Motion `AnimatePresence` for slide transitions between steps.

Step 1: firstName (input) + avatarEmoji (grid of 12 emojis, tap to select).
Step 2: objective (5 radio cards with emoji + label).
Step 3: diets (multi-select checkboxes) + allergies (tag input with suggestions) + "Pas de restriction" skip button.
Step 4: householdSize (slider 1-6) + cookingTime (3 cards) + mealsToTrack (3 checkboxes).
Step 5: recap badges + generated assembly via `generateRandomAssembly` with the profile's filters.

- [ ] **Step 3: Create OnboardingFlow container**

State machine: `step` (1-5), `profile` accumulator. "Skip" button top-right on every screen. On complete, calls `onComplete(profile)` which saves to store + sets `onboardingCompleted: true`.

- [ ] **Step 4: Gate onboarding in layout.tsx**

In `app/layout.tsx`, conditionally render `<OnboardingFlow>` instead of `{children}` when `!onboardingCompleted`.

- [ ] **Step 5: Build and manual test**

```bash
npm run dev
```

Open `localhost:3000` — should see onboarding flow on first visit.

- [ ] **Step 6: Commit**

```bash
git add components/onboarding/ app/layout.tsx
git commit -m "feat: add 5-screen onboarding flow with diet/allergy/objective selection"
```

---

### Task 9: Feedback post-repas

**Files:**
- Create: `components/feedback/FeedbackSheet.tsx`
- Create: `components/feedback/PleasureSelector.tsx`
- Modify: `components/AssemblyCard.tsx`
- Modify: `lib/store/useMealStore.ts`

- [ ] **Step 1: Create PleasureSelector**

5 emojis (😫😕😐😊🤩) as buttons. Each with `aria-label`: "Très mauvais", "Mauvais", "Neutre", "Bon", "Excellent". `whileTap={{ scale: 0.9 }}` on each. Selected emoji scales to 1.2.

- [ ] **Step 2: Create FeedbackSheet**

Uses shadcn `Sheet` (side="bottom"). Contains PleasureSelector (required), quantity selector (3 buttons, optional), note textarea (140 chars, optional). Submit button. Skip button.

- [ ] **Step 3: Add feedback state to store**

In `useMealStore.ts`, add:
```typescript
feedbacks: MealFeedback[];
pendingFeedbacks: MealFeedback[]; // offline queue
addFeedback: (feedback: MealFeedback) => void;
```

`addFeedback` stores locally and adds to `pendingFeedbacks` if offline.

- [ ] **Step 4: Integrate in AssemblyCard**

After validation (✓ tap), auto-open `FeedbackSheet`. Show feedback emoji on validated meals.

- [ ] **Step 5: Build and manual test**

- [ ] **Step 6: Commit**

```bash
git add components/feedback/ components/AssemblyCard.tsx lib/store/useMealStore.ts
git commit -m "feat: add post-meal feedback sheet with pleasure rating and offline queue"
```

---

### Task 10: Streaks + badges

**Files:**
- Create: `components/streak/StreakBadge.tsx`
- Modify: `lib/store/useMealStore.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add streak logic to store**

In `useMealStore.ts`, add `streakCount`, `streakLastDate`, `checkAndUpdateStreak()`. Logic: compare today's local date with `streakLastDate`. If consecutive → increment. If same day → no change. If gap → reset to 1.

- [ ] **Step 2: Create StreakBadge component**

Displays `🔥 {count}` + badge icon based on milestone (7🌱/30🌿/90🌳/365🏆). Framer Motion `scale` animation when a new milestone is reached.

- [ ] **Step 3: Add to dashboard**

In `app/page.tsx`, render `<StreakBadge>` next to the greeting header.

- [ ] **Step 4: Trigger streak on meal validation**

In the validate handler, call `checkAndUpdateStreak()` after saving.

- [ ] **Step 5: Build and test**

- [ ] **Step 6: Commit**

```bash
git add components/streak/ lib/store/useMealStore.ts app/page.tsx
git commit -m "feat: add streak counter with milestone badges and Framer Motion animation"
```

---

## Chunk 3: Sprint 2 continued — VPS Infrastructure (days 6-10, parallel)

### Task 11: Setup firewall on VPS

**Files:**
- Create: `infra/scripts/setup-firewall.sh`

- [ ] **Step 1: Create firewall script**

```bash
#!/bin/bash
# setup-firewall.sh — Run on VPS as root
set -euo pipefail

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Traefik'
sudo ufw allow 443/tcp comment 'HTTPS Traefik'
sudo ufw --force enable
sudo ufw status verbose
echo "Firewall configured. Only ports 22, 80, 443 open."
```

- [ ] **Step 2: Execute on VPS**

```bash
ssh ubuntu@54.38.109.182 'bash -s' < infra/scripts/setup-firewall.sh
```

**WARNING**: This will block current exposed Supabase ports (54321, 54322, 54323). Verify GérerSCI Nginx already binds to 80/443 internally before running, or adjust GérerSCI to work behind Traefik first.

- [ ] **Step 3: Verify GérerSCI still works**

```bash
curl -s -o /dev/null -w '%{http_code}' https://app.gerersci.fr
```

Expected: 200

- [ ] **Step 4: Commit**

```bash
git add infra/scripts/setup-firewall.sh
git commit -m "infra: add ufw firewall script — only ports 22/80/443 open"
```

---

### Task 12: Deploy Traefik on VPS

**Files:**
- Create: `infra/docker-compose.traefik.yml`

- [ ] **Step 1: Create Traefik compose file**

See backend panel output for full `docker-compose.traefik.yml` with Let's Encrypt, Docker provider, HTTP→HTTPS redirect.

- [ ] **Step 2: Create Docker proxy network**

```bash
ssh ubuntu@54.38.109.182 'docker network create proxy 2>/dev/null || true'
```

- [ ] **Step 3: Deploy Traefik**

```bash
scp infra/docker-compose.traefik.yml ubuntu@54.38.109.182:/opt/traefik/docker-compose.yml
ssh ubuntu@54.38.109.182 'cd /opt/traefik && docker compose up -d'
```

- [ ] **Step 4: Migrate GérerSCI Nginx behind Traefik**

Add Traefik labels to the existing GérerSCI nginx container. Stop its direct port 80/443 binding.

- [ ] **Step 5: Verify**

```bash
curl -s -o /dev/null -w '%{http_code}' https://app.gerersci.fr
```

- [ ] **Step 6: Commit**

```bash
git add infra/docker-compose.traefik.yml
git commit -m "infra: deploy Traefik reverse proxy with Let's Encrypt TLS"
```

---

### Task 13: Deploy Supabase Platform on VPS

**Files:**
- Create: `infra/docker-compose.supabase.yml`
- Create: `infra/supabase/.env.example`
- Create: `infra/supabase/init/01-schema.sql`
- Create: `infra/supabase/init/02-rls.sql`
- Create: `infra/supabase/kong.yml`

- [ ] **Step 1: Create compose file**

Based on backend panel output. All services on `supabase-internal` network (internal: true). Only Kong on `proxy` network with Traefik labels for `api.assembleat.app`.

- [ ] **Step 2: Create schema SQL**

Copy the full SQL from spec section 11 (all CREATE TABLE statements + GIN index).

- [ ] **Step 3: Create RLS policies**

Copy from backend panel output (02-rls.sql).

- [ ] **Step 4: Create .env with generated secrets**

- [ ] **Step 5: Deploy**

```bash
scp -r infra/supabase/ ubuntu@54.38.109.182:/opt/supabase-platform/
ssh ubuntu@54.38.109.182 'cd /opt/supabase-platform && docker compose up -d'
```

- [ ] **Step 6: Verify health**

```bash
curl -s https://api.assembleat.app/auth/v1/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 7: Check RAM**

```bash
ssh ubuntu@54.38.109.182 'free -h && docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | head -30'
```

Expected: Total used < 6.5 Go.

- [ ] **Step 8: Commit**

```bash
git add infra/
git commit -m "infra: deploy Supabase Platform (PostgreSQL 17 + GoTrue + Realtime + Kong) on VPS"
```

---

## Chunk 4: Sprint 3 — Persistence + Migration (days 11-15)

### Task 14: Create Supabase client libraries

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Install Supabase SDK**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create browser client**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create server client**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=https://api.assembleat.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/ .env.local.example
git commit -m "feat: add Supabase browser and server clients"
```

---

### Task 15: Create PersistenceLayer abstraction

**Files:**
- Create: `lib/store/persistence.ts`
- Create: `__tests__/lib/store/persistence.test.ts`

- [ ] **Step 1: Write tests for local persistence**

- [ ] **Step 2: Define PersistenceLayer interface**

```typescript
export interface PersistenceLayer {
  getWeekPlan(weekKey: string): Promise<WeekPlan | null>;
  saveWeekPlan(weekKey: string, plan: WeekPlan): Promise<void>;
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: Partial<UserProfile>): Promise<void>;
  saveFeedback(feedback: MealFeedback): Promise<void>;
  getFeedbacks(month?: string): Promise<MealFeedback[]>;
  getStreak(): Promise<{ count: number; lastDate: string | null }>;
  updateStreak(count: number, lastDate: string): Promise<void>;
}
```

- [ ] **Step 3: Implement createLocalPersistence()**

Wraps localStorage calls. Same logic as current `useMealStore` helpers.

- [ ] **Step 4: Implement createSupabasePersistence(client)**

Wraps Supabase queries against `assembleat.*` schema.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add lib/store/persistence.ts __tests__/lib/store/persistence.test.ts
git commit -m "feat: add PersistenceLayer abstraction (localStorage + Supabase)"
```

---

### Task 16: Refactor useMealStore with PersistenceLayer

**Files:**
- Modify: `lib/store/useMealStore.ts`

- [ ] **Step 1: Add persistence field to store**

- [ ] **Step 2: Replace direct localStorage calls with persistence methods**

- [ ] **Step 3: Add setPersistence() to swap at runtime**

- [ ] **Step 4: Add offline sync queue (pendingSync[])**

- [ ] **Step 5: Build and test**

- [ ] **Step 6: Commit**

```bash
git add lib/store/useMealStore.ts
git commit -m "refactor: useMealStore now uses PersistenceLayer abstraction"
```

---

### Task 17: Auth pages + migration hook

**Files:**
- Create: `app/login/page.tsx`
- Create: `lib/hooks/useMigration.ts`

- [ ] **Step 1: Create login page**

Simple page with email/password form + Google OAuth button. Uses `createClient()` from `lib/supabase/client.ts`.

- [ ] **Step 2: Create migration hook**

`useMigration`: on auth success, checks localStorage for existing data. If found, uploads to Supabase (upsert), then clears localStorage and swaps persistence layer.

- [ ] **Step 3: Integrate in layout**

After auth, trigger migration hook. If user is authenticated, use Supabase persistence. If not, use localStorage.

- [ ] **Step 4: Build and E2E test manually**

- [ ] **Step 5: Commit**

```bash
git add app/login/ lib/hooks/useMigration.ts app/layout.tsx
git commit -m "feat: add login page and localStorage→Supabase migration hook"
```

---

## Chunk 5: Phase 2 — Viral Features (days 16-25)

*(Tasks 18-23: Canvas image generation, Wrapped, Tier List, Roast, new pages. Each follows the same TDD pattern: write test → implement → verify → commit.)*

### Task 18: Canvas image generation library
### Task 19: ShareWeekImage component + /semainier integration
### Task 20: WrappedCarousel + /wrapped page
### Task 21: TierListGrid + /tierlist page
### Task 22: RoastCard + roastTemplates (100+) + /roast page
### Task 23: i18n English translations

---

## Chunk 6: Phase 3 — Pro + Stripe (days 26-40)

*(Tasks 24-32: Stripe integration, shared links with argon2id, practitioner thread with Realtime, objectives, 12-week history, RGPD export.)*

### Task 24: Stripe client + checkout/portal routes
### Task 25: Stripe webhook with signature verification
### Task 26: Shared links (create/verify with argon2id + rate limit)
### Task 27: Share page (/share/[token]) — server component
### Task 28: Practitioner comment thread with Supabase Realtime
### Task 29: Practitioner goals (co-constructed objectives)
### Task 30: 12-week nutritional history
### Task 31: Practitioner onboarding + referral banner
### Task 32: RGPD export + account deletion

---

## Chunk 7: Phase 4 — Polish (day 41+)

*(Tasks 33+: Smart suggestions, push notifications, grocery list, photo journal, fridge mode, multi-profiles, i18n ES/AR+RTL.)*

### Task 33-40: Defined per spec section 15, Phase 4.

---

## Execution Notes

- **Parallel axes**: Tasks 1-7 (frontend fixes) can run in parallel with Tasks 11-13 (VPS infra)
- **Critical path**: Tasks 11 → 12 → 13 → 14 → 15 → 16 → 17 (infra → Supabase → migration)
- **Each task produces a working commit** — no broken intermediate states
- **Phase 2+ tasks** (18-23) are sketched but will be fully detailed when Phase 1 is complete
- **Analytics** (PostHog): add during Phase 2 as a parallel task before launch
