# assemblEAT v2 Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surgically cut dead features, migrate auth to Clerk, rewrite onboarding to 4 steps, and build a contextual dashboard with 3 sections.

**Architecture:** Next.js 16 App Router with Clerk for auth (replacing Supabase Auth), Supabase for data only, Zustand stores with pluggable persistence (localStorage ↔ Supabase). Dashboard adapts to time of day, day of week, season, and user objective progress.

**Tech Stack:** Next.js 16.1.6, React 19, @clerk/nextjs, @supabase/supabase-js, Zustand, Tailwind CSS, shadcn UI, next-intl, Vitest

**Spec:** `docs/superpowers/specs/2026-03-16-assembleat-v2-redesign.md`

---

## Chunk 1: Phase 1 — Cut Dead Features

### Task 1: Git tag + remove Streak

**Files:**
- Modify: `lib/store/useMealStore.ts` (remove streak state + `checkAndUpdateStreak`)
- Modify: `lib/store/persistence.ts` (remove `getStreak`/`updateStreak` from interface + both implementations)
- Delete: `components/streak/StreakBadge.tsx`
- Modify: `app/app/page.tsx` (remove streak imports, local states, logic)

- [ ] **Step 1: Create restore point**

```bash
git tag pre-v2-redesign
```

- [ ] **Step 2: Remove streak state from store**

In `lib/store/useMealStore.ts`:
- Remove `streakCount: number` and `streakLastDate: string | null` from state interface
- Remove `checkAndUpdateStreak: () => void` from actions interface
- Remove the `checkAndUpdateStreak` implementation (lines ~193-213)
- Remove streak-related reads in `syncFromPersistence()` (lines reading `streak-count`, `streak-last-date`)
- Remove streak initializers from create() (`streakCount: 0, streakLastDate: null`)

- [ ] **Step 2b: Remove streak from PersistenceLayer**

In `lib/store/persistence.ts`:
- Remove `getStreak()` and `updateStreak()` from the `PersistenceLayer` interface (lines 31-33)
- Remove `getStreak` and `updateStreak` implementations from `createLocalPersistence()` (lines 82-91)
- Remove `getStreak` and `updateStreak` implementations from `createSupabasePersistence()` (lines 214-243)

- [ ] **Step 3: Delete StreakBadge component**

```bash
rm components/streak/StreakBadge.tsx
rmdir components/streak 2>/dev/null
```

- [ ] **Step 4: Clean streak from dashboard**

In `app/app/page.tsx`:
- Remove `import { StreakBadge } from '@/components/streak/StreakBadge'` (line 7)
- Remove local states: `streakBroken`, `previousStreak`, `showStreakBroken` (lines ~36-40)
- Remove `useEffect` that calls `checkAndUpdateStreak()` and detects broken streak (lines ~46-59)
- Remove `streakCount` from `useMealStore` destructuring (line ~70)
- Remove `<StreakBadge>` JSX and streak broken banner JSX
- Keep all other dashboard functionality intact

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: No TypeScript errors related to streak

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(v2): remove streak/gamification feature"
```

---

### Task 2: Remove Multi-profiles

**Files:**
- Delete: `lib/store/useProfileStore.ts`
- Modify: `app/app/settings/page.tsx` (remove profile store import + multi-profile UI)
- Modify: `types/index.ts` (keep types, they may be used elsewhere)

- [ ] **Step 1: Delete profile store**

```bash
rm lib/store/useProfileStore.ts
```

- [ ] **Step 2: Clean settings page**

In `app/app/settings/page.tsx`:
- Remove `import { useProfileStore } from '@/lib/store/useProfileStore'` (line ~22)
- Remove `useProfileStore` destructuring and all multi-profile UI section (the "Multi-profils" Pro section with profile list, add, switch, delete — lines ~315-400)
- Keep all other settings sections intact

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(v2): remove multi-profiles feature"
```

---

### Task 3: Remove Fridge Mode

**Files:**
- Delete: `lib/engine/fridgeEngine.ts`
- Delete: `app/app/fridge/page.tsx`
- Modify: `app/app/page.tsx` (remove Fridge CTA)

- [ ] **Step 1: Delete fridge files**

```bash
rm lib/engine/fridgeEngine.ts
rm app/app/fridge/page.tsx
rmdir app/app/fridge 2>/dev/null
```

- [ ] **Step 2: Remove Fridge CTA from dashboard**

In `app/app/page.tsx`:
- Remove `Refrigerator` from lucide-react import (line ~17)
- Remove the CTA card linking to `/app/fridge` (lines ~406-409)

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat(v2): remove fridge mode feature"
```

---

### Task 4: Update feature flags

**Files:**
- Modify: `lib/config/features.ts`
- Modify: `types/index.ts` (remove flags from FeatureFlag union type)

- [ ] **Step 1: Update feature matrix**

In `lib/config/features.ts`:
- Remove entries: `MULTI_PROFILE`, `FRIDGE_MODE`, `FRIEND_COMPARE`
- Change `WEEKLY_STATS` from `{ free: false, pro: true }` to `{ free: true, pro: true }`

- [ ] **Step 2: Update FeatureFlag type**

In `types/index.ts`:
- Remove `'MULTI_PROFILE'`, `'FRIDGE_MODE'`, `'FRIEND_COMPARE'` from the `FeatureFlag` union type

- [ ] **Step 3: Grep for remaining usages**

```bash
grep -r "MULTI_PROFILE\|FRIDGE_MODE\|FRIEND_COMPARE" --include="*.ts" --include="*.tsx" .
```
Expected: No results (or only in spec/plan docs)

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat(v2): clean feature flags, make WEEKLY_STATS free"
```

---

### Task 5: Update Bottom Nav (5→4 items)

**Files:**
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Update nav items**

In `components/BottomNav.tsx`, replace the `navItems` array (lines ~9-15) with:

```typescript
const navItems = [
  { href: '/app', icon: Home, label: 'Accueil' },
  { href: '/app/semainier', icon: Calendar, label: 'Semainier' },
  { href: '/app/batch-cook', icon: ChefHat, label: 'Préparer' },
  { href: '/app/settings', icon: Settings, label: 'Réglages' },
];
```

Remove the Export item (`Download` icon, `/app/export`). Remove unused `Download` import from lucide-react.

- [ ] **Step 2: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat(v2): bottom nav 5→4 items, french labels, export moved to settings"
```

---

### Task 6: Phase 1 verification

- [ ] **Step 1: Full build + test**

```bash
npm run build && npm run test:run
```

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev
```
Manually verify:
- Dashboard loads without streak badge, fridge CTA, or errors
- Settings page loads without multi-profile section
- Bottom nav shows 4 items: Accueil, Semainier, Préparer, Réglages
- `/app/fridge` returns 404

- [ ] **Step 3: Tag completion**

```bash
git tag v2-phase1-complete
```

---

## Chunk 2: Phase 2 — Auth Migration (Clerk)

### Task 7: Install Clerk + env setup

**Files:**
- Modify: `package.json` (new dependency)
- Modify: `.env.local` (add Clerk vars)
- Modify: `.env.local.example` (add Clerk var templates)

- [ ] **Step 1: Install Clerk**

```bash
npm install @clerk/nextjs
```

- [ ] **Step 2: Add env vars to `.env.local.example`**

Add to `.env.local.example`:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

- [ ] **Step 3: Add real keys to `.env.local`**

User must create a Clerk project at https://dashboard.clerk.com and paste keys into `.env.local`.

- [ ] **Step 4: Git tag + commit**

```bash
git tag pre-clerk-migration
git add package.json package-lock.json .env.local.example && git commit -m "feat(v2): install @clerk/nextjs"
```

---

### Task 8: Clerk webhook endpoint

**Files:**
- Create: `app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Install svix for webhook verification**

```bash
npm install svix
```

- [ ] **Step 2: Create webhook route**

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: 'assembleat' } }
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, first_name, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? null;

    await supabase.from('profiles').upsert(
      {
        clerk_user_id: id,
        first_name: first_name ?? '',
        email,
        plan: 'free',
      },
      { onConflict: 'clerk_user_id' }
    );
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data;
    await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('clerk_user_id', id);
  }

  return new Response('OK', { status: 200 });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/clerk/ package.json package-lock.json && git commit -m "feat(v2): add Clerk webhook endpoint with idempotent upsert"
```

---

### Task 9: ClerkProvider + middleware

**Files:**
- Modify: `app/layout.tsx` (wrap with ClerkProvider)
- Modify: `middleware.ts` (replace with clerkMiddleware)

- [ ] **Step 1: Update root layout**

In `app/layout.tsx`:
- Add `import { ClerkProvider } from '@clerk/nextjs'`
- Wrap the `<body>` content with `<ClerkProvider>`:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { MatomoTracker } from '@/components/MatomoTracker';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <ClerkProvider>
      <html lang="fr" className={inter.variable}>
        <body>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
          <MatomoTracker />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Replace middleware**

Replace entire `middleware.ts` with:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.png$).*)',
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx middleware.ts && git commit -m "feat(v2): add ClerkProvider and clerkMiddleware"
```

---

### Task 10: Sign-in/Sign-up routes

**Files:**
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Create sign-in page**

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 2: Create sign-up page**

```typescript
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
mkdir -p "app/sign-in/[[...sign-in]]" "app/sign-up/[[...sign-up]]"
git add app/sign-in/ app/sign-up/ && git commit -m "feat(v2): add Clerk sign-in/sign-up routes"
```

---

### Task 11: Update persistence layer (MUST come before ClerkSyncProvider)

**Files:**
- Modify: `lib/store/persistence.ts` (accept userId param, remove auth dependency)

- [ ] **Step 1: Change `createSupabasePersistence` signature**

In `lib/store/persistence.ts`:

1. Change the type alias (line 97):
```typescript
// OLD: type SupabaseClient = ReturnType<typeof import('@/lib/supabase/client').createAssembleatClient>;
// NEW:
import type { SupabaseClient } from '@supabase/supabase-js';
```

2. Change function signature (line 99):
```typescript
// OLD: export function createSupabasePersistence(supabase: SupabaseClient): PersistenceLayer {
// NEW:
export function createSupabasePersistence(supabase: SupabaseClient, userId: string): PersistenceLayer {
```

3. Remove the `getUserId()` helper function (lines 100-103) entirely.

4. Replace every `const userId = await getUserId(); if (!userId) return ...;` with just using the `userId` parameter directly. There are 7 occurrences across `getWeekPlan`, `saveWeekPlan`, `saveFeedback`, `getFeedbacks`, `getSettings`, `saveSettings`.

5. In `getSettings` (line 185): change `.eq('id', userId)` to `.eq('clerk_user_id', userId)` since we now use Clerk user IDs.

6. In `saveSettings` (line 204): change `const patch: Record<string, unknown> = { id: userId }` to `{ clerk_user_id: userId }` and update the onConflict to `'clerk_user_id'`.

- [ ] **Step 2: Verify build + commit**

```bash
npm run build && git add lib/store/persistence.ts && git commit -m "feat(v2): persistence layer accepts userId param, no auth dependency"
```

---

### Task 12: Adapt useMigration to Clerk

**Files:**
- Modify: `lib/hooks/useMigration.ts`

- [ ] **Step 1: Replace Supabase auth with Clerk userId param**

In `lib/hooks/useMigration.ts`:
- Remove any import of `useAuth` from `@/lib/hooks/useAuth`
- Change the hook to accept a `userId: string | null` parameter instead of reading from Supabase auth
- Replace internal references to `user.id` with the `userId` parameter
- Ensure the migration is still idempotent (check flag before running)

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useMigration.ts && git commit -m "feat(v2): adapt useMigration to accept Clerk userId"
```

---

### Task 13: ClerkSyncProvider

**Files:**
- Create: `components/ClerkSyncProvider.tsx`
- Modify: `app/app/layout.tsx` (replace AuthSyncProvider)

- [ ] **Step 1: Create ClerkSyncProvider**

```typescript
// components/ClerkSyncProvider.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { createSupabasePersistence } from '@/lib/store/persistence';
import { useMigration } from '@/lib/hooks/useMigration';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: 'assembleat' } }
);

export function ClerkSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const supabaseLayerActiveRef = useRef(false);
  const { setPersistence, syncFromPersistence } = useMealStore();
  const setPlan = useSubscriptionStore((s) => s.setPlan);
  const { migrate, migrated } = useMigration(isSignedIn ? user?.id ?? null : null);

  useEffect(() => {
    if (!isSignedIn || !user?.id || supabaseLayerActiveRef.current) return;

    const sync = async () => {
      // Step 1: Migrate localStorage → Supabase (idempotent, one-shot)
      if (!migrated) await migrate();

      // Step 2: Switch persistence to Supabase
      setPersistence(createSupabasePersistence(supabase, user.id));
      await syncFromPersistence();
      supabaseLayerActiveRef.current = true;

      // Step 3: Fetch subscription plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('clerk_user_id', user.id)
        .single();

      if (profile?.plan) {
        setPlan(profile.plan as 'free' | 'pro');
      }
    };

    sync();
  }, [isSignedIn, user?.id, setPersistence, syncFromPersistence, setPlan, migrate, migrated]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Update app layout**

In `app/app/layout.tsx`, replace:
- `import { AuthSyncProvider } from '@/components/AuthSyncProvider'` → `import { ClerkSyncProvider } from '@/components/ClerkSyncProvider'`
- `<AuthSyncProvider>` → `<ClerkSyncProvider>`

The new layout should be:
```tsx
import { HydrationProvider } from '@/components/HydrationProvider';
import { ClerkSyncProvider } from '@/components/ClerkSyncProvider';
import { OnboardingGate } from '@/components/OnboardingGate';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrationProvider>
      <ClerkSyncProvider>
        <OnboardingGate>
          <main className="pb-20 min-h-screen mx-auto max-w-lg">
            {children}
          </main>
          <BottomNav />
        </OnboardingGate>
        <Toaster />
      </ClerkSyncProvider>
    </HydrationProvider>
  );
}
```

Note: `NotificationPrompt`, `NotificationReminderProvider`, `InstallBanner` can be re-added later in Phase 5 if needed.

- [ ] **Step 3: Commit**

```bash
git add components/ClerkSyncProvider.tsx app/app/layout.tsx && git commit -m "feat(v2): add ClerkSyncProvider, replace AuthSyncProvider in layout"
```

---

### Task 14: Validate + cleanup old auth

- [ ] **Step 1: Verify full flow**

```bash
npm run dev
```
Test manually:
- Visit `/sign-in` → Clerk sign-in UI appears
- Sign in with Google or email → redirected to `/app`
- Dashboard loads with data
- Sign out → redirected to landing

- [ ] **Step 2: Delete old auth files**

```bash
rm components/AuthSyncProvider.tsx
rm lib/hooks/useAuth.ts
rm lib/supabase/middleware.ts
rm -rf app/auth/callback
rm -rf app/app/login
```

- [ ] **Step 3: Remove old Supabase auth imports if any remain**

```bash
grep -r "useAuth\|AuthSyncProvider\|updateSession" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".git"
```
Fix any remaining imports.

- [ ] **Step 4: Final build + commit**

```bash
npm run build && git add -A && git commit -m "feat(v2): delete old Supabase Auth files, Clerk migration complete"
git tag v2-phase2-complete
```

---

## Chunk 3: Phase 3 — Onboarding Rewrite

### Task 15: Avatar component

**Files:**
- Create: `components/onboarding/AvatarGenerator.tsx`

- [ ] **Step 1: Create AvatarGenerator**

```typescript
// components/onboarding/AvatarGenerator.tsx
'use client';

import { useState } from 'react';

const COLORS = [
  'bg-gradient-to-br from-green-500 to-green-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-orange-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-pink-600',
  'bg-gradient-to-br from-teal-500 to-teal-600',
];

const FOOD_EMOJIS = ['🍎', '🥑', '🥕', '🍳', '🧑‍🍳', '🍋'];

interface AvatarGeneratorProps {
  firstName: string;
  selectedColor: number;
  selectedEmoji: number;
  onColorChange: (index: number) => void;
  onEmojiChange: (index: number) => void;
}

export function AvatarGenerator({
  firstName,
  selectedColor,
  selectedEmoji,
  onColorChange,
  onEmojiChange,
}: AvatarGeneratorProps) {
  const initial = firstName.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <div className="relative w-20 h-20">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-white ${COLORS[selectedColor]}`}
        >
          {initial}
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg shadow-md">
          {FOOD_EMOJIS[selectedEmoji]}
        </div>
      </div>

      {/* Color palette */}
      <div className="flex gap-2">
        {COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => onColorChange(i)}
            className={`w-8 h-8 rounded-full ${color} ${
              selectedColor === i ? 'ring-2 ring-offset-2 ring-green-500 scale-110' : ''
            } transition-all`}
          />
        ))}
      </div>

      {/* Emoji selection */}
      <div className="text-xs text-muted-foreground">Choisis ton compagnon food</div>
      <div className="flex gap-2">
        {FOOD_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onEmojiChange(i)}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${
              selectedEmoji === i
                ? 'bg-green-50 ring-2 ring-green-500 scale-110'
                : 'bg-muted'
            } transition-all`}
            aria-label={`Compagnon : ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export { COLORS, FOOD_EMOJIS };
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/AvatarGenerator.tsx && git commit -m "feat(v2): add AvatarGenerator component"
```

---

### Task 16: Rewrite OnboardingFlow (4 steps)

**Files:**
- Rewrite: `components/onboarding/OnboardingFlow.tsx`
- Delete: `components/onboarding/OnboardingStepFoodPrefs.tsx`
- Delete: `components/onboarding/OnboardingStep5.tsx`

- [ ] **Step 1: Delete old step components**

```bash
rm -f components/onboarding/OnboardingStepFoodPrefs.tsx
rm -f components/onboarding/OnboardingStep5.tsx
```

- [ ] **Step 2: Rewrite OnboardingFlow**

Replace `components/onboarding/OnboardingFlow.tsx` entirely with a 4-step flow:
- Step 1: firstName input + AvatarGenerator (color + emoji)
- Step 2: Objective selection (pill buttons)
- Step 3: Diets (multi-select) + Allergies (multi-select, mandatory)
- Step 4: Moment Aha — generate first meal with `assemblyEngine`, display with NutriScore badge

Each step saves to localStorage immediately via `useMealStore.updateSettings()`.

Step 4 calls `generateAssembly('lunch', settings)` from `lib/engine/assemblyEngine.ts` and renders the result card with NutriScore badge. Primary CTA: "Voir ma semaine complète" → calls `completeOnboarding()` and navigates to `/app`. Secondary: link to `/sign-up`.

Progress bar at bottom: `{step}/4` with animated width.

The component should accept `onComplete: (profile: UserProfile) => void` as prop.

- [ ] **Step 3: Update OnboardingGate**

In `components/OnboardingGate.tsx`:
- Remove the check for `/app/login` path (no longer needed)
- Keep the `!onboardingCompleted && !settings.firstName` gate logic
- Ensure it calls `completeOnboarding()` from `useMealStore` on flow completion

- [ ] **Step 4: Verify build + test**

```bash
npm run build && npm run dev
```
Test: visit `/app` without onboarding completed → see 4-step flow

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(v2): rewrite onboarding to 4 steps with avatar generator and moment aha"
git tag v2-phase3-complete
```

---

## Chunk 4: Phase 4 — Contextual Dashboard

### Task 17: Time-based meal focus helper

**Files:**
- Create: `lib/hooks/useTimeContext.ts`

- [ ] **Step 1: Create time context hook**

```typescript
// lib/hooks/useTimeContext.ts
'use client';

import { useState, useEffect } from 'react';
import type { MealType } from '@/types';

interface TimeContext {
  focusMeal: MealType;
  currentHour: number;
  isWeekend: boolean;
  isMondayMorning: boolean;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonLabel: string;
  seasonVegetables: string[];
}

const SEASON_DATA: Record<string, { label: string; vegetables: string[] }> = {
  winter: { label: '❄️ Hiver', vegetables: ['Poireaux', 'Choux', 'Carottes', 'Navets', 'Courges', 'Endives'] },
  spring: { label: '🌸 Printemps', vegetables: ['Asperges', 'Petits pois', 'Radis', 'Épinards', 'Artichauts'] },
  summer: { label: '☀️ Été', vegetables: ['Tomates', 'Courgettes', 'Aubergines', 'Poivrons', 'Haricots verts'] },
  autumn: { label: '🍂 Automne', vegetables: ['Potiron', 'Champignons', 'Brocolis', 'Betteraves', 'Céleri'] },
};

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getFocusMeal(hour: number): MealType {
  if (hour >= 6 && hour <= 10) return 'breakfast';
  if (hour >= 11 && hour <= 14) return 'lunch';
  return 'dinner';
}

export function useTimeContext(): TimeContext {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hour = now.getHours();
  const day = now.getDay();
  const month = now.getMonth();
  const season = getSeason(month);
  const seasonInfo = SEASON_DATA[season];

  return {
    focusMeal: getFocusMeal(hour),
    currentHour: hour,
    isWeekend: day === 0 || day === 6,
    isMondayMorning: day === 1 && hour < 12,
    season,
    seasonLabel: seasonInfo.label,
    seasonVegetables: seasonInfo.vegetables,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useTimeContext.ts && git commit -m "feat(v2): add useTimeContext hook (time/day/season awareness)"
```

---

### Task 18: Progressive guide hook

**Files:**
- Create: `lib/hooks/useProgressiveGuide.ts`

- [ ] **Step 1: Create guide hook**

```typescript
// lib/hooks/useProgressiveGuide.ts
'use client';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

interface GuideState {
  currentStep: number; // 0 = not started, 1-7 = active, 8 = completed
  dismissed: boolean;
}

const GUIDE_STEPS = [
  { id: 1, content: 'Bienvenue ! Voici tes repas du jour. Découvre ton Nutri-Score sur chaque carte.' },
  { id: 2, content: 'Clique sur 🔄 pour régénérer un repas qui ne te plaît pas.' },
  { id: 3, content: 'Valide tes repas avec ✅ pour alimenter ton bilan hebdomadaire.' },
  { id: 4, content: 'Découvre ton Roast dans la section Bilan 🔥' },
  { id: 5, content: 'Ton premier score hebdo est prêt !' },
  { id: 6, content: 'Planifie ta semaine dans le Semainier 📅' },
  { id: 7, content: 'Tu maîtrises ! Le guide se retire. Bon appétit 🎉' },
];

export function useProgressiveGuide() {
  const [state, setState] = useLocalStorage<GuideState>('assembleat-guide', {
    currentStep: 0,
    dismissed: false,
  });

  const advance = (toStep: number) => {
    if (toStep > state.currentStep && !state.dismissed) {
      setState({ ...state, currentStep: toStep });
    }
  };

  const dismiss = () => setState({ ...state, dismissed: true });

  const currentGuide = !state.dismissed && state.currentStep >= 1 && state.currentStep <= 7
    ? GUIDE_STEPS[state.currentStep - 1]
    : null;

  return {
    currentGuide,
    step: state.currentStep,
    totalSteps: 7,
    advance,
    dismiss,
    isComplete: state.currentStep >= 8 || state.dismissed,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useProgressiveGuide.ts && git commit -m "feat(v2): add progressive guide hook (7-step discovery)"
```

---

### Task 19: Objective coaching hook

**Files:**
- Create: `lib/hooks/useObjectiveCoaching.ts`

- [ ] **Step 1: Create coaching hook**

```typescript
// lib/hooks/useObjectiveCoaching.ts
'use client';

import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

interface Objective {
  label: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
}

export function useObjectiveCoaching() {
  const [objective, setObjective] = useLocalStorage<Objective | null>(
    'assembleat-objective',
    null
  );

  if (!objective) {
    return {
      hasObjective: false as const,
      setObjective: (obj: Objective) => setObjective(obj),
    };
  }

  const start = new Date(objective.startDate);
  const today = new Date();
  const daysPassed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  const progress = Math.min(Math.max(daysPassed / objective.durationDays, 0), 1);
  const percentage = Math.round(progress * 100);

  let message: string;
  if (percentage >= 100) message = 'Objectif atteint ! Fixe un nouveau défi ?';
  else if (percentage >= 80) message = 'Dernière ligne droite !';
  else if (percentage >= 50) message = 'Plus de la moitié ! Continue';
  else if (percentage >= 20) message = 'Tu prends le rythme';
  else message = 'Tu démarres bien !';

  return {
    hasObjective: true as const,
    objective,
    daysPassed,
    daysTotal: objective.durationDays,
    progress,
    percentage,
    message,
    setObjective: (obj: Objective) => setObjective(obj),
    clearObjective: () => setObjective(null),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useObjectiveCoaching.ts && git commit -m "feat(v2): add objective coaching hook (progress + motivational messages)"
```

---

### Task 20: Rewrite dashboard page

**Files:**
- Rewrite: `app/app/page.tsx`

- [ ] **Step 1: Rewrite dashboard with 3 sections**

Rewrite `app/app/page.tsx` with this structure:
1. **Header**: Avatar (from store: initial + color + emoji) + "Salut {firstName}" + date + Clerk `<UserButton />` or sign-in link
2. **Progressive guide banner** (if active): dismissible, shows current guide step
3. **Objective coaching bar** (if objective set): progress bar + J{x}/{total} + message
4. **Section 1 "Repas du jour"**: 3 meal cards. Use `useTimeContext()` to determine `focusMeal`. Active card gets `ring-2 ring-green-500`, others get `scale-95 opacity-90` (not opacity below 0.5). Validated meals show green badge. Weekly score mini-card below.
5. **Section 2 "Mon bilan"**: Roast link, Tier List link, Historique link (Pro → blurred preview)
6. **Section 3 "Mes outils"**: Liste de courses, Répertoire, Partage diét., Smart suggestions — all Pro with blurred previews
7. **Day-based banners**: Weekend = bilan hebdo + "Prépare ta semaine". Monday = "Nouvelle semaine" banner
8. **Seasonal banner**: below Section 1, shows season vegetables

Use `useTimeContext()`, `useProgressiveGuide()`, `useObjectiveCoaching()` hooks.

Key imports to add:
```typescript
import { useTimeContext } from '@/lib/hooks/useTimeContext';
import { useProgressiveGuide } from '@/lib/hooks/useProgressiveGuide';
import { useObjectiveCoaching } from '@/lib/hooks/useObjectiveCoaching';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
```

- [ ] **Step 2: Verify build + smoke test**

```bash
npm run build && npm run dev
```
Check: dashboard shows 3 sections, meal focus changes with time, guide banner visible

- [ ] **Step 3: Commit**

```bash
git add app/app/page.tsx && git commit -m "feat(v2): rewrite dashboard with 3 contextual sections"
git tag v2-phase4-complete
```

---

## Chunk 5: Phase 5 — Polish

### Task 21: Restructure Settings

**Files:**
- Modify: `app/app/settings/page.tsx`

- [ ] **Step 1: Add Export section and Clerk UserProfile**

In `app/app/settings/page.tsx`:
- Add `import { UserProfile } from '@clerk/nextjs'` at top
- Add "Compte" section with `<UserProfile />` component
- Move export functionality (copy to clipboard, PDF, share link) into a new "Export" section
- Add "Objectifs" section for setting temporal objectives (calls `useObjectiveCoaching().setObjective`)
- Ensure 9 sections as specified: Compte, Profil nutritionnel, Préférences, Règles, Export, Notifications, Objectifs, Langue, Données

- [ ] **Step 2: Commit**

```bash
git add app/app/settings/page.tsx && git commit -m "feat(v2): restructure settings with 9 sections + Clerk UserProfile"
```

---

### Task 22: Update i18n messages

**Files:**
- Modify: `messages/fr.json`

- [ ] **Step 1: Add new translation keys**

Add keys for:
- `nav.home`: "Accueil"
- `nav.prepare`: "Préparer"
- `nav.settings`: "Réglages"
- `dashboard.section.meals`: "Repas du jour"
- `dashboard.section.review`: "Mon bilan"
- `dashboard.section.tools`: "Mes outils"
- `onboarding.step1.title`: "Comment tu t'appelles ?"
- `onboarding.step2.title`: "Ton objectif"
- `onboarding.step3.title`: "Régime et allergies"
- `onboarding.step4.title`: "Voici ton premier repas"
- Seasonal banner messages
- Objective coaching messages
- Guide step messages

Remove deprecated keys related to streak, fridge, multi-profiles.

- [ ] **Step 2: Commit**

```bash
git add messages/fr.json && git commit -m "feat(v2): update i18n messages for new UI"
```

---

### Task 23: Accessibility pass

- [ ] **Step 1: aria-labels on emoji avatars**

In `AvatarGenerator.tsx`: already has `aria-label` on emoji buttons ✅

- [ ] **Step 2: Contrast check on meal cards**

Verify: active card text is readable (not opacity < 0.5). Inactive cards use `scale-95` + `opacity-90` (contrast safe).

- [ ] **Step 3: Tap targets on bottom nav**

With 4 items on 375px screen: ~93px per item > 44px WCAG minimum ✅

- [ ] **Step 4: Commit if any fixes**

```bash
git add -A && git commit -m "fix(v2): accessibility improvements (aria-labels, contrast, tap targets)"
```

---

### Task 24: End-to-end verification

- [ ] **Step 1: Full build + test suite**

```bash
npm run build && npm run test:run
```

- [ ] **Step 2: Manual flow test (guest)**

1. Visit `/` → landing page loads
2. Click "Commencer" → `/app` → onboarding starts (4 steps)
3. Complete onboarding → dashboard loads with today's meals
4. Verify: meal focus matches current time
5. Verify: guide banner shows step 1
6. Verify: bottom nav has 4 items
7. Verify: no streak, fridge, or multi-profile UI

- [ ] **Step 3: Manual flow test (auth)**

1. Click "Se connecter" → `/sign-in` → Clerk UI
2. Sign in → redirected to `/app`
3. Dashboard shows user data from Supabase
4. Settings → Clerk UserProfile component visible
5. Sign out → back to landing

- [ ] **Step 4: Final commit + tag**

```bash
git add -A && git commit -m "feat(v2): assemblEAT v2 redesign complete"
git tag v2-complete
```

---

## File Map Summary

### Files to CREATE
| File | Purpose |
|------|---------|
| `app/api/webhooks/clerk/route.ts` | Clerk webhook (user sync) |
| `app/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in |
| `app/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up |
| `components/ClerkSyncProvider.tsx` | Lightweight auth sync |
| `components/onboarding/AvatarGenerator.tsx` | Initial + color + emoji avatar |
| `lib/hooks/useTimeContext.ts` | Time/day/season awareness |
| `lib/hooks/useProgressiveGuide.ts` | 7-step discovery guide |
| `lib/hooks/useObjectiveCoaching.ts` | Objective progress + messages |

### Files to DELETE
| File | Reason |
|------|--------|
| `components/AuthSyncProvider.tsx` | Replaced by ClerkSyncProvider |
| `components/streak/StreakBadge.tsx` | Feature removed |
| `lib/hooks/useAuth.ts` | Replaced by Clerk |
| `lib/supabase/middleware.ts` | Replaced by clerkMiddleware |
| `lib/store/useProfileStore.ts` | Feature removed |
| `lib/engine/fridgeEngine.ts` | Feature removed |
| `app/auth/callback/route.ts` | Replaced by Clerk |
| `app/app/login/page.tsx` | Replaced by Clerk |
| `app/app/fridge/page.tsx` | Feature removed |
| `components/onboarding/OnboardingStepFoodPrefs.tsx` | Removed from flow |
| `components/onboarding/OnboardingStep5.tsx` | Deferred to Settings |

### Files to MODIFY
| File | Change |
|------|--------|
| `middleware.ts` | → clerkMiddleware() |
| `app/layout.tsx` | + ClerkProvider wrapper |
| `app/app/layout.tsx` | AuthSyncProvider → ClerkSyncProvider |
| `app/app/page.tsx` | Full rewrite: 3 sections + contextual |
| `app/app/settings/page.tsx` | 9 sections + UserProfile + remove multi-profiles |
| `components/BottomNav.tsx` | 5→4 items, French labels |
| `components/OnboardingGate.tsx` | Remove /app/login check |
| `components/onboarding/OnboardingFlow.tsx` | 6→4 steps rewrite |
| `lib/config/features.ts` | Remove 3 flags, WEEKLY_STATS → free |
| `lib/store/useMealStore.ts` | Remove streak state |
| `lib/store/persistence.ts` | Accept userId param |
| `types/index.ts` | Remove 3 FeatureFlag values |
| `messages/fr.json` | New keys, remove deprecated |
