# Journal First Pivot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform assemblEAT from a meal planner into a meal journal that also suggests — adding "Mangé / Autre chose / Sauté" actions, prévu vs réel comparison, and enriched sharing.

**Architecture:** Add `ActualMeal` data layer alongside existing `AssemblyRow`. Each meal card gets 3 journal actions. A new `MealLogger` Drawer handles "Autre chose" input. Day and week comparison components show prévu vs réel. Share payload enriched with actual data.

**Tech Stack:** Next.js 16, React 19, Zustand, shadcn UI (Drawer, Input, Badge, Button), sonner (toast), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-26-journal-first-pivot.md`

---

## Task 1: Add ActualMeal type

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add ActualMeal interface**

In `types/index.ts`, add after the `MealFeedback` interface:

```typescript
export interface ActualMeal {
  date: string;          // YYYY-MM-DD
  mealType: MealType;    // breakfast | lunch | dinner
  status: 'confirmed' | 'different' | 'skipped';
  description?: string;  // free text if "autre chose"
  pills?: string[];      // selected pills if "autre chose"
  photoUrl?: string;     // local URL if photo added (v2)
  loggedAt: string;      // ISO timestamp
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: passes (type added but not yet used)

- [ ] **Step 3: Commit**

```bash
git add types/index.ts && git commit -m "feat(journal): add ActualMeal type"
```

---

## Task 2: Add persistence layer methods

**Files:**
- Modify: `lib/store/persistence.ts`

- [ ] **Step 1: Extend PersistenceLayer interface**

In `lib/store/persistence.ts`, add to the `PersistenceLayer` interface (after the Settings methods):

```typescript
  // Actual meals (journal)
  saveActualMeal(meal: ActualMeal): Promise<void>;
  getActualMeals(dateFrom: string, dateTo: string): Promise<ActualMeal[]>;
```

Add the import at the top of the file:
```typescript
import type { WeekPlan, MealFeedback, UserSettings, ActualMeal } from '@/types';
```

- [ ] **Step 2: Implement in createLocalPersistence**

Add to the return object of `createLocalPersistence()`:

```typescript
    async saveActualMeal(meal: ActualMeal) {
      const existing = localGet<ActualMeal[]>('actual-meals', []);
      const filtered = existing.filter(
        (m) => !(m.date === meal.date && m.mealType === meal.mealType)
      );
      localSet('actual-meals', [...filtered, meal]);
    },
    async getActualMeals(dateFrom: string, dateTo: string) {
      const all = localGet<ActualMeal[]>('actual-meals', []);
      return all.filter((m) => m.date >= dateFrom && m.date <= dateTo);
    },
```

- [ ] **Step 3: Implement in createSupabasePersistence**

Add to the return object of `createSupabasePersistence()`:

```typescript
    async saveActualMeal(meal: ActualMeal) {
      try {
        await supabase.from('actual_meals').upsert(
          {
            user_id: userId,
            date: meal.date,
            meal_type: meal.mealType,
            status: meal.status,
            description: meal.description ?? null,
            pills: meal.pills ?? null,
            logged_at: meal.loggedAt,
          },
          { onConflict: 'user_id,date,meal_type' }
        );
      } catch {
        // silently ignore
      }
    },
    async getActualMeals(dateFrom: string, dateTo: string) {
      try {
        const { data, error } = await supabase
          .from('actual_meals')
          .select('*')
          .eq('user_id', userId)
          .gte('date', dateFrom)
          .lte('date', dateTo);
        if (error || !data) return [];
        return data.map((row: Record<string, unknown>) => ({
          date: row.date as string,
          mealType: row.meal_type as ActualMeal['mealType'],
          status: row.status as ActualMeal['status'],
          description: (row.description as string) ?? undefined,
          pills: (row.pills as string[]) ?? undefined,
          loggedAt: row.logged_at as string,
        }));
      } catch {
        return [];
      }
    },
```

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add lib/store/persistence.ts && git commit -m "feat(journal): add actual meal persistence (local + supabase)"
```

---

## Task 3: Add journal state and actions to store

**Files:**
- Modify: `lib/store/useMealStore.ts`

- [ ] **Step 1: Add imports and state**

Add to imports at top:
```typescript
import type { ActualMeal } from '@/types';
```

Add to the store state interface (alongside existing state fields):
```typescript
  actualMeals: ActualMeal[];
```

Add to the store actions interface:
```typescript
  logMeal: (meal: ActualMeal) => void;
  getActualMeal: (date: string, mealType: MealType) => ActualMeal | null;
  getDayComparison: (date: string) => Array<{
    mealType: MealType;
    planned: AssemblyRow | null;
    actual: ActualMeal | null;
  }>;
  getWeekConformity: (weekKey: string) => { rate: number; logged: number; skipped: number };
```

- [ ] **Step 2: Implement initial state**

In the `create()` call, add initial state:
```typescript
  actualMeals: [],
```

- [ ] **Step 3: Implement logMeal action**

```typescript
  logMeal: (meal) => {
    const { actualMeals, persistence } = get();
    const filtered = actualMeals.filter(
      (m) => !(m.date === meal.date && m.mealType === meal.mealType)
    );
    set({ actualMeals: [...filtered, meal] });
    persistence.saveActualMeal(meal);
  },
```

- [ ] **Step 4: Implement getActualMeal**

```typescript
  getActualMeal: (date, mealType) => {
    return get().actualMeals.find(
      (m) => m.date === date && m.mealType === mealType
    ) ?? null;
  },
```

- [ ] **Step 5: Implement getDayComparison**

```typescript
  getDayComparison: (date) => {
    const { todayBreakfast, todayLunch, todayDinner, actualMeals } = get();
    const today = new Date().toISOString().split('T')[0];
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
    const planned = date === today
      ? [todayBreakfast, todayLunch, todayDinner]
      : [null, null, null]; // for other days, would need weekPlans lookup

    return mealTypes.map((mt, i) => ({
      mealType: mt,
      planned: planned[i],
      actual: actualMeals.find((m) => m.date === date && m.mealType === mt) ?? null,
    }));
  },
```

- [ ] **Step 6: Implement getWeekConformity**

```typescript
  getWeekConformity: (weekKey) => {
    const { actualMeals } = get();
    // Parse weekKey (YYYY-WW) to get date range
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // Get Monday of the week
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const monday = new Date(jan1);
    monday.setDate(jan1.getDate() + days - ((jan1.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fromDate = monday.toISOString().split('T')[0];
    const toDate = sunday.toISOString().split('T')[0];

    const weekMeals = actualMeals.filter((m) => m.date >= fromDate && m.date <= toDate);
    const logged = weekMeals.length;
    const skipped = weekMeals.filter((m) => m.status === 'skipped').length;
    const confirmed = weekMeals.filter((m) => m.status === 'confirmed').length;
    const total = logged || 1;
    const rate = Math.round((confirmed / total) * 100);

    return { rate, logged, skipped };
  },
```

- [ ] **Step 7: Load actual meals in syncFromPersistence**

In the existing `syncFromPersistence` method, add loading of actual meals:

```typescript
  // Load actual meals for current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const actualMeals = await persistence.getActualMeals(monthStart, monthEnd);
  set({ actualMeals });
```

- [ ] **Step 8: Load actual meals in hydrate**

In the `hydrate` method, load from localStorage:

```typescript
  // In hydrate(), add:
  const storedActualMeals = localGet<ActualMeal[]>('actual-meals', []);
  set({ actualMeals: storedActualMeals });
```

Add `localGet` import if not already available (check the file — it may use a different pattern).

- [ ] **Step 9: Verify build + commit**

```bash
npm run build && git add lib/store/useMealStore.ts && git commit -m "feat(journal): add logMeal, getActualMeal, comparison actions to store"
```

---

## Task 4: Create MealLogger Drawer component

**Files:**
- Create: `components/MealLogger.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/MealLogger.tsx
'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MealType, ActualMeal } from '@/types';

const QUICK_PILLS = [
  { label: 'Poulet', emoji: '🍗' },
  { label: 'Pâtes', emoji: '🍝' },
  { label: 'Riz', emoji: '🍚' },
  { label: 'Salade', emoji: '🥗' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Sandwich', emoji: '🥪' },
  { label: 'Sushi', emoji: '🍣' },
  { label: 'Œufs', emoji: '🥚' },
];

interface MealLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  onLog: (meal: ActualMeal) => void;
}

export function MealLogger({ open, onOpenChange, mealType, date, onLog }: MealLoggerProps) {
  const [text, setText] = useState('');
  const [selectedPills, setSelectedPills] = useState<string[]>([]);

  const togglePill = (label: string) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    const description = text.trim() || selectedPills.join(', ') || 'Repas noté';

    onLog({
      date,
      mealType,
      status: 'different',
      description,
      pills: selectedPills.length > 0 ? selectedPills : undefined,
      loggedAt: new Date().toISOString(),
    });

    toast.success('C\'est noté !');
    setText('');
    setSelectedPills([]);
    onOpenChange(false);
  };

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="text-center">
          <DrawerTitle>Qu&apos;as-tu mangé ?</DrawerTitle>
          <p className="text-sm text-muted-foreground">{mealLabels[mealType]}</p>
        </DrawerHeader>

        <div className="space-y-4">
          {/* Text input */}
          <div className="relative">
            <Input
              placeholder="Tape ici... (ex: pizza)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg opacity-50 hover:opacity-100"
              aria-label="Ajouter une photo"
            >
              📸
            </button>
          </div>

          {/* Quick pills */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Ou tap rapide :</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PILLS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => togglePill(label)}
                  className={`px-3 h-9 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                    selectedPills.includes(label)
                      ? 'bg-green-100 ring-2 ring-green-500 font-medium'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  const custom = prompt('Autre aliment ?');
                  if (custom) togglePill(custom);
                }}
                className="px-3 h-9 rounded-full text-sm bg-muted hover:bg-muted/80 flex items-center gap-1"
              >
                <span>+</span> Autre
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold"
            disabled={!text.trim() && selectedPills.length === 0}
          >
            C&apos;est noté
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Check if shadcn Drawer exists**

```bash
ls components/ui/drawer.tsx 2>/dev/null || echo "MISSING"
```

If missing, install it:
```bash
npx shadcn@latest add drawer
```

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add components/MealLogger.tsx components/ui/ && git commit -m "feat(journal): create MealLogger drawer component"
```

---

## Task 5: Update meal cards with journal actions

**Files:**
- Modify: `components/AssemblyCard.tsx`
- Modify: `app/app/page.tsx`

- [ ] **Step 1: Add journal props to AssemblyCard**

In `components/AssemblyCard.tsx`, add to `AssemblyCardProps`:

```typescript
  actualMeal?: ActualMeal | null;
  onLogConfirmed?: () => void;
  onLogDifferent?: () => void;
  onLogSkipped?: () => void;
```

Add import:
```typescript
import type { ActualMeal } from '@/types';
```

- [ ] **Step 2: Replace validate button with journal actions**

In the card's action buttons section, replace the existing validate/regenerate buttons with:

```tsx
{actualMeal ? (
  // Logged state
  <div className="text-center text-sm">
    {actualMeal.status === 'confirmed' && (
      <p className="text-green-600 font-medium">
        Mangé {new Date(actualMeal.loggedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    )}
    {actualMeal.status === 'different' && (
      <div>
        <p className="text-amber-600 font-medium">
          Mangé : {actualMeal.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(actualMeal.loggedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    )}
    {actualMeal.status === 'skipped' && (
      <p className="text-gray-400">Sauté</p>
    )}
  </div>
) : (
  // Journal actions
  <div className="flex flex-col items-center gap-2">
    <div className="flex gap-2 w-full">
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={onLogConfirmed}
      >
        Mangé
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onLogDifferent}
      >
        Autre chose
      </Button>
    </div>
    <button
      onClick={onLogSkipped}
      className="text-xs text-muted-foreground hover:text-foreground transition"
    >
      Sauté
    </button>
  </div>
)}
```

Keep the regenerate button above the journal actions (users can still regenerate suggestions).

- [ ] **Step 3: Wire up in dashboard**

In `app/app/page.tsx`:

Add imports:
```typescript
import { MealLogger } from '@/components/MealLogger';
import type { ActualMeal } from '@/types';
```

Add state:
```typescript
const [loggerOpen, setLoggerOpen] = useState(false);
const [loggerMealType, setLoggerMealType] = useState<MealType>('lunch');
const logMeal = useMealStore((s) => s.logMeal);
const getActualMeal = useMealStore((s) => s.getActualMeal);
```

Get today's date:
```typescript
const todayDate = new Date().toISOString().split('T')[0];
```

Create handlers:
```typescript
const handleLogConfirmed = (mealType: MealType) => {
  logMeal({
    date: todayDate,
    mealType,
    status: 'confirmed',
    loggedAt: new Date().toISOString(),
  });
  toast.success("C'est noté !");
};

const handleLogDifferent = (mealType: MealType) => {
  setLoggerMealType(mealType);
  setLoggerOpen(true);
};

const handleLogSkipped = (mealType: MealType) => {
  logMeal({
    date: todayDate,
    mealType,
    status: 'skipped',
    loggedAt: new Date().toISOString(),
  });
  toast("Repas sauté");
};

const handleLogFromDrawer = (meal: ActualMeal) => {
  logMeal(meal);
};
```

Pass props to each AssemblyCard:
```typescript
<AssemblyCard
  // ...existing props
  actualMeal={getActualMeal(todayDate, mealType)}
  onLogConfirmed={() => handleLogConfirmed(mealType)}
  onLogDifferent={() => handleLogDifferent(mealType)}
  onLogSkipped={() => handleLogSkipped(mealType)}
/>
```

Add the MealLogger Drawer at the bottom of the component:
```typescript
<MealLogger
  open={loggerOpen}
  onOpenChange={setLoggerOpen}
  mealType={loggerMealType}
  date={todayDate}
  onLog={handleLogFromDrawer}
/>
```

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add components/AssemblyCard.tsx app/app/page.tsx && git commit -m "feat(journal): replace validate with mangé/autre/sauté actions"
```

---

## Task 6: Create DayComparison component

**Files:**
- Create: `components/DayComparison.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/DayComparison.tsx
'use client';

import type { MealType, AssemblyRow, ActualMeal } from '@/types';

interface DayComparisonProps {
  date: string;
  comparison: Array<{
    mealType: MealType;
    planned: AssemblyRow | null;
    actual: ActualMeal | null;
  }>;
}

const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: 'Petit-déj', emoji: '☀️' },
  lunch: { label: 'Déjeuner', emoji: '🍽️' },
  dinner: { label: 'Dîner', emoji: '🌙' },
};

function getPlannedSummary(planned: AssemblyRow | null): string {
  if (!planned) return '—';
  const parts = [planned.protein?.label, planned.vegetable?.label, planned.cereal?.label]
    .filter(Boolean);
  return parts.join(' + ') || '—';
}

function getActualSummary(actual: ActualMeal | null): string {
  if (!actual) return 'Non noté';
  if (actual.status === 'skipped') return 'Sauté';
  if (actual.status === 'confirmed') return 'Identique';
  return actual.description ?? actual.pills?.join(', ') ?? 'Autre';
}

function getStatusIcon(actual: ActualMeal | null): string {
  if (!actual) return '⏳';
  if (actual.status === 'confirmed') return '✅';
  if (actual.status === 'skipped') return '⏭️';
  return '⚠️';
}

export function DayComparison({ date, comparison }: DayComparisonProps) {
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' });
  const logged = comparison.filter((c) => c.actual !== null).length;

  if (logged === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm capitalize">
          Prévu vs Réel — {dayName}
        </h3>
        <span className="text-xs text-muted-foreground">{logged}/3 notés</span>
      </div>

      {comparison.map(({ mealType, planned, actual }) => {
        const { label, emoji } = MEAL_LABELS[mealType];
        return (
          <div key={mealType} className="text-sm space-y-0.5">
            <div className="font-medium text-xs text-muted-foreground">
              {emoji} {label}
            </div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-muted-foreground text-xs">Prévu: </span>
                <span className="text-xs">{getPlannedSummary(planned)}</span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-muted-foreground text-xs">Réel: </span>
                <span className="text-xs">{getActualSummary(actual)} {getStatusIcon(actual)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + commit**

```bash
npm run build && git add components/DayComparison.tsx && git commit -m "feat(journal): create DayComparison component"
```

---

## Task 7: Create WeekComparison component

**Files:**
- Create: `components/WeekComparison.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/WeekComparison.tsx
'use client';

interface WeekComparisonProps {
  conformity: {
    rate: number;
    logged: number;
    skipped: number;
  };
  weekLabel: string; // e.g., "Semaine 12"
}

export function WeekComparison({ conformity, weekLabel }: WeekComparisonProps) {
  const { rate, logged, skipped } = conformity;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-3">
      <h3 className="font-semibold text-sm text-blue-900">
        Bilan — {weekLabel}
      </h3>

      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">{rate}%</div>
          <div className="text-xs text-muted-foreground">Conformité</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{logged}</div>
          <div className="text-xs text-muted-foreground">Repas notés</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{skipped}</div>
          <div className="text-xs text-muted-foreground">Sauts</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Suggestions suivies</span>
          <span>{rate}%</span>
        </div>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {skipped > 3 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
          Tu as sauté {skipped} repas cette semaine. Essaie de noter plus régulièrement.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + commit**

```bash
npm run build && git add components/WeekComparison.tsx && git commit -m "feat(journal): create WeekComparison component"
```

---

## Task 8: Integrate comparisons in dashboard

**Files:**
- Modify: `app/app/page.tsx`

- [ ] **Step 1: Add comparison components to dashboard**

Add imports:
```typescript
import { DayComparison } from '@/components/DayComparison';
import { WeekComparison } from '@/components/WeekComparison';
```

Add store selectors:
```typescript
const getDayComparison = useMealStore((s) => s.getDayComparison);
const getWeekConformity = useMealStore((s) => s.getWeekConformity);
```

Compute comparison data:
```typescript
const dayComparison = getDayComparison(todayDate);
const hasLoggedToday = dayComparison.some((c) => c.actual !== null);
```

Add DayComparison card in Section 1 (after the meal cards, before weekly score):
```tsx
{hasLoggedToday && (
  <div className="mx-4 mt-3">
    <DayComparison date={todayDate} comparison={dayComparison} />
  </div>
)}
```

Add WeekComparison in the weekend bilan section (where `isWeekend` is true), using:
```tsx
{isWeekend && (
  <div className="mx-4 mb-3">
    <WeekComparison
      conformity={getWeekConformity(currentWeekKey)}
      weekLabel={`Semaine ${currentWeekKey.split('-W')[1]}`}
    />
  </div>
)}
```

`currentWeekKey` should be computed from the current date using the same format as the rest of the app (check how `weekKey` is computed in `useMealStore`).

- [ ] **Step 2: Verify build + commit**

```bash
npm run build && git add app/app/page.tsx && git commit -m "feat(journal): integrate day and week comparisons in dashboard"
```

---

## Task 9: Enrich share payload with actual meals

**Files:**
- Modify: `lib/share/shareEngine.ts`
- Modify: `app/share/[data]/page.tsx`
- Modify: `components/share/ShareLinkButton.tsx` (if this is where sharing is triggered)

- [ ] **Step 1: Update SharePayload type**

In `lib/share/shareEngine.ts`, add to `SharePayload`:
```typescript
  actuals?: ActualMeal[];
```

Add import:
```typescript
import type { ActualMeal } from '@/types';
```

Add to `DecodedShareData`:
```typescript
  a?: Array<{ d: string; t: string; s: string; desc?: string }>; // actual meals compact
```

- [ ] **Step 2: Update encode function**

In `encodeShareData()`, add encoding of actuals:
```typescript
  if (payload.actuals && payload.actuals.length > 0) {
    compact.a = payload.actuals.map((m) => ({
      d: m.date,
      t: m.mealType,
      s: m.status,
      ...(m.description ? { desc: m.description } : {}),
    }));
  }
```

- [ ] **Step 3: Update decode function**

In `decodeShareData()`, add decoding of actuals:
```typescript
  const actuals: ActualMeal[] = (parsed.a ?? []).map((m: Record<string, string>) => ({
    date: m.d,
    mealType: m.t as MealType,
    status: m.s as ActualMeal['status'],
    description: m.desc,
    loggedAt: '',
  }));
```

Return it alongside existing decoded data.

- [ ] **Step 4: Update share page to show prévu vs réel**

In `app/share/[data]/page.tsx`, after decoding the data:

If actuals exist, show a comparison table instead of (or alongside) the current plan-only view. For each day/meal, show:
- Prévu column (existing)
- Réel column (from actuals)
- Status icon (✅ confirmed, ⚠️ different, ⏭️ skipped)

Add conformity stats at bottom:
```tsx
{actuals.length > 0 && (
  <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center text-sm">
    <span className="font-medium">Conformité : </span>
    <span>{Math.round((actuals.filter(a => a.status === 'confirmed').length / actuals.length) * 100)}%</span>
    <span className="text-muted-foreground"> · {actuals.length} repas notés</span>
  </div>
)}
```

- [ ] **Step 5: Update ShareLinkButton to include actuals**

In `components/share/ShareLinkButton.tsx` (or wherever the share is triggered), pass the `actualMeals` from the store into the payload:

```typescript
const actualMeals = useMealStore((s) => s.actualMeals);
// When encoding:
const encoded = encodeShareData({
  ...existingPayload,
  actuals: actualMeals.filter((m) => /* filter for current week */),
});
```

- [ ] **Step 6: Verify build + commit**

```bash
npm run build && git add lib/share/shareEngine.ts app/share/ components/share/ && git commit -m "feat(journal): enrich share with prévu vs réel comparison"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: passes

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev
```

Test flow:
1. Dashboard loads → meal cards show "Mangé / Autre chose / Sauté" buttons
2. Click "Mangé" → toast "C'est noté !" → card shows "Mangé à HH:MM"
3. Click "Autre chose" → Drawer opens → type "pizza" → submit → toast → card shows "Mangé : pizza"
4. Click "Sauté" → card shows "Sauté"
5. After logging all 3 meals → DayComparison card appears
6. On weekend → WeekComparison shows conformity

- [ ] **Step 3: Commit + tag**

```bash
git add -A && git commit -m "feat(journal): journal first pivot complete"
git tag journal-first-v1
```

---

## File Map Summary

### Files to CREATE
| File | Purpose |
|------|---------|
| `components/MealLogger.tsx` | Drawer bottom sheet for "Autre chose" input |
| `components/DayComparison.tsx` | Prévu vs réel comparison card (daily) |
| `components/WeekComparison.tsx` | Weekly conformity stats card |

### Files to MODIFY
| File | Change |
|------|--------|
| `types/index.ts` | Add `ActualMeal` interface |
| `lib/store/persistence.ts` | Add `saveActualMeal`, `getActualMeals` to both implementations |
| `lib/store/useMealStore.ts` | Add `actualMeals` state, `logMeal`, `getActualMeal`, `getDayComparison`, `getWeekConformity` |
| `components/AssemblyCard.tsx` | Replace validate with journal actions, show logged state |
| `app/app/page.tsx` | Wire journal actions, add MealLogger, add DayComparison/WeekComparison |
| `lib/share/shareEngine.ts` | Add `actuals` to payload, update encode/decode |
| `app/share/[data]/page.tsx` | Show prévu vs réel columns |
| `components/share/ShareLinkButton.tsx` | Include actual meals in share payload |
