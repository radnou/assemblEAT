# assemblEAT v2 — Redesign Spec

## Context

assemblEAT is a B2C micro-SaaS PWA for meal planning with Nutri-Score v2. The app has accumulated features without coherence, the auth/signup flow is broken and confusing, and navigation is overloaded. This spec defines a surgical cleanup: cut dead features, fix the flow, recentre the product.

**Stack**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn UI + Zustand + Supabase (DB only) + Clerk (auth)

---

## 1. Authentication — Migrate from Supabase Auth to Clerk

### What changes

| Current (Supabase Auth) | New (Clerk) |
|------------------------|-------------|
| Custom `AuthSyncProvider` component | Clerk `<ClerkProvider>` in root layout |
| Custom `useAuth()` hook | Clerk `useUser()` / `useAuth()` from `@clerk/nextjs` |
| Custom `lib/supabase/middleware.ts` session refresh | `clerkMiddleware()` — 3 lines |
| Custom login page (`/app/login`) | Clerk `<SignIn />` component |
| Manual Google OAuth + Magic Link setup | Clerk dashboard toggle (Google, Apple, GitHub, email) |
| `AuthSyncProvider` switches persistence layer | Webhook `user.created` → Supabase profile creation |

### Architecture

```
Clerk (auth layer)
  ├── <ClerkProvider> wraps root layout
  ├── <SignIn /> / <SignUp /> at /sign-in, /sign-up
  ├── <UserButton /> in header (replaces custom auth UI)
  ├── clerkMiddleware() in middleware.ts
  └── Webhook: user.created → POST /api/webhooks/clerk
        └── Creates row in assembleat.profiles table

Supabase (data layer only)
  ├── assembleat.profiles (linked by clerk_user_id)
  ├── assembleat.week_plans
  ├── assembleat.meal_feedbacks
  └── assembleat.shared_links
```

### Files to delete

- `components/AuthSyncProvider.tsx`
- `lib/hooks/useAuth.ts`
- `lib/supabase/middleware.ts`
- `app/auth/callback/route.ts`
- `app/app/login/page.tsx`

### Files to modify

- `middleware.ts` → replace with `clerkMiddleware()`
- `app/layout.tsx` → wrap with `<ClerkProvider>`
- `app/app/layout.tsx` → remove `AuthSyncProvider`, add Clerk user sync
- `lib/store/persistence.ts` → use Clerk `userId` instead of Supabase `user.id`
- `lib/hooks/useMigration.ts` → adapt to use Clerk user ID

### New files

- `app/api/webhooks/clerk/route.ts` — handle `user.created` (upsert profile), `user.updated` (sync changes), `user.deleted` (soft-delete profile). Must be idempotent (use `INSERT ... ON CONFLICT DO UPDATE` for retries by Svix).
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page

### Environment variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

---

## 2. Onboarding — Reduce to 4 sub-steps

### Current flow (6 steps)

1. Name + avatar emoji
2. Objective
3. Diets & allergies
4. Food preferences (rate foods) ← **REMOVE**
5. Household size + cooking time + meals to track ← **DEFER to Settings**
6. Summary + account creation ← **REPLACE with Moment Aha**

### New flow (4 sub-steps)

#### Step 1 — Identity (5 seconds)

- Input: first name (required)
- Avatar generation: initial letter in colored circle (palette of 6-8 colors, user picks) + food emoji companion (pick from 6 options)
- Avatar renders live as user types
- Progress bar: 1/4

#### Step 2 — Objective (5 seconds)

- Single choice: Équilibré / Perte de poids / Prise de muscle / Custom
- Pill-style buttons, one tap selection
- Progress bar: 2/4

#### Step 3 — Diet & Allergies (10 seconds)

- Section 1: Diet (multi-select pills): Végétarien, Végan, Sans gluten, Pescétarien, Aucun
- Section 2: Allergies (multi-select pills, marked as mandatory): Arachides, Lactose, Œufs, Crustacés, Aucune
- "Aucune" acts as toggle-off for the group
- Progress bar: 3/4

#### Step 4 — Moment Aha (instant gratification)

- Generate first personalized meal based on steps 2+3
- Display: meal card with protein + vegetable + cereal + sauce + Nutri-Score badge
- Primary CTA: "🚀 Voir ma semaine complète" → navigates to dashboard
- Secondary link: "Créer un compte pour sauvegarder" (non-blocking)
- Progress bar: 4/4 ✅

### Guest data persistence

All onboarding data (objective, diets, allergies, avatar) is saved to localStorage immediately after each step, before any account creation. This ensures:
- Guest users can use the full app without signing up
- When a guest later creates a Clerk account, `ClerkSyncProvider` triggers `useMigration` which uploads localStorage data to Supabase
- No data is lost between guest usage and account creation

### Deferred to Settings (collected later via contextual nudges)

- Household size
- Cooking time preference
- Meals to track (breakfast/lunch/dinner)
- Food preferences (fine-tuning)

### Nudge system

- After day 3: "Précise tes préférences pour des repas encore mieux adaptés" → links to Settings
- After day 7: "Indique ton temps de cuisine pour des recettes adaptées"
- Behavioral inference: systematically rejected meals inform preferences automatically

### Component changes

- `components/OnboardingGate.tsx` → rewrite with 4-step flow
- `components/onboarding/OnboardingFlow.tsx` → rewrite
- Delete `components/onboarding/OnboardingStepFoodPrefs.tsx` (food preferences)
- Delete `components/onboarding/OnboardingStep5.tsx` (household/cooking time)

---

## 3. Dashboard — 3 Contextual Sections

### Layout structure

```
Header
  ├── Avatar (initial + color + emoji)
  ├── "Salut {firstName}" + date
  └── <UserButton /> (Clerk) or "Se connecter" link

Section 1: 🎯 Repas du jour
  ├── Objective progress bar (J{current}/{total} + motivational message)
  ├── Active meal card (time-based focus, colored border)
  ├── Other meal cards (scale 0.95, neutral border — NOT opacity/grayed)
  ├── Validated meals show ✅ badge
  └── Weekly score mini-card (FREE — change `WEEKLY_STATS` flag to `{ free: true, pro: true }`)

Section 2: 📊 Mon bilan
  ├── Roast card (free)
  ├── Tier List card (free)
  └── Historique card (Pro — blurred preview + contextual upsell)

Section 3: 🛠️ Mes outils
  ├── Liste de courses (Pro — blurred preview)
  ├── Mon répertoire (Pro — blurred preview)
  ├── Partage diététicien (Pro — blurred preview)
  └── Smart suggestions (Pro — blurred preview)

Bottom Nav (4 items)
  ├── 🏠 Accueil
  ├── 📅 Semainier
  ├── 👨‍🍳 Préparer (was "Batch Cook")
  └── ⚙️ Réglages (includes Export)
```

### Time-based adaptation

| Time | Focus meal | Others | Special |
|------|-----------|--------|---------|
| 6:00-10:59 | ☀️ Petit-déjeuner | Scale 0.95, neutral border | — |
| 11:00-14:59 | 🍽️ Déjeuner | Breakfast: shows "✅ validé" if done | — |
| 15:00-23:59 | 🌙 Dîner | Breakfast+Lunch: shows "✅ validé" if done | — |

### Day-based adaptation

| Day | Dashboard variation |
|-----|-------------------|
| Saturday/Sunday morning | Bilan hebdo card (score, repas count, avg pleasure) + CTA "Prépare ta semaine prochaine" + CTA "Batch Cook pour demain" |
| Monday | "Nouvelle semaine, c'est parti 💪" banner |
| Other days | Standard layout |

### Season-based adaptation

- Seasonal banner: "❄️ Légumes de saison : poireaux, choux, carottes..."
- Badge "saison" on in-season ingredients in meal cards
- Season data: static mapping month → seasonal vegetables/fruits (French market)

### Dual coaching thread

#### Progressive guide (weeks 1-2, then disappears)

| Step | Trigger | Content |
|------|---------|---------|
| 1/7 | First visit | "Bienvenue ! Voici tes repas du jour" |
| 2/7 | Second visit | "Clique sur 🔄 pour régénérer un repas" |
| 3/7 | First regeneration | "Valide tes repas avec ✅ pour alimenter ton bilan" |
| 4/7 | 3 meals validated | "Découvre ton Roast dans la section Bilan 🔥" |
| 5/7 | First week complete | "Ton premier score hebdo est prêt !" |
| 6/7 | Day 7+ | "Planifie ta semaine dans le Semainier 📅" |
| 7/7 | Day 10+ | "Tu maîtrises ! Le guide se retire. Bon appétit 🎉" |

- Displayed as a dismissible banner between header and Section 1
- "Passer le guide" link always visible
- Guide state stored in localStorage

#### Objective coaching (persistent)

- Progress bar: J{current}/{total} with percentage
- Motivational messages adapt to phase:
  - 0-20%: "Tu démarres bien ! 🌱"
  - 20-50%: "Tu prends le rythme 💪"
  - 50-80%: "Plus de la moitié ! Continue 📈"
  - 80-99%: "Dernière ligne droite 🏁"
  - 100%: "Objectif atteint ! 🎉 Fixe un nouveau défi ?"
- If no objective set: prompt to set one in Settings

### Meal validation

- Explicit gesture: tap "✅ Valider" button on each meal card
- Validated state: green checkmark badge + card slightly dimmed with "validé" label
- Optional: quick feedback (pleasure rating 1-5) inline after validation
- Unvalidated past meals: show "⏭ Sauté" after time window passes

### Pro upsell strategy

- No static "PRO" badges scattered everywhere
- Instead: **blurred previews** in Section 3 showing actual generated content
  - Grocery list: show 3 items clearly, rest blurred + "Débloque la liste complète"
  - Historique: show 2 weeks, rest blurred + "12 semaines d'analytics avec Pro"
- **Contextual triggers** at engagement moments:
  - After 5th meal validated: "Ta liste de courses est prête — débloque avec Pro"
  - After viewing Roast: "Découvre ton évolution sur 12 semaines avec Pro"
  - After day 7: "Tu as 7 jours de données ! L'historique Pro t'attend"
- **Value accumulation counter**: "Tu as 12 repas personnalisés. Crée un compte pour les garder."

---

## 4. Bottom Navigation — 4 Items

### Current (5 items)

🏠 Dashboard | 📅 Semainier | 👨‍🍳 Batch Cook | 📥 Export | ⚙️ Settings

### New (4 items)

🏠 Accueil | 📅 Semainier | 👨‍🍳 Préparer | ⚙️ Réglages

### Changes

- "Batch Cook" renamed to "Préparer" (French, clearer)
- "Export" moved into "Réglages" as a sub-section
- Wider tap targets (~90px vs ~70px on 375px screens)
- All labels in French

### File changes

- `components/BottomNav.tsx` → update routes and labels
- `app/app/export/page.tsx` → move content to settings or keep route but remove from nav

---

## 5. Features to Remove

### Streak / Gamification

**Files to delete/modify:**
- `useMealStore.ts` → remove `streakCount`, `streakLastDate`, `checkAndUpdateStreak()`
- `components/streak/StreakBadge.tsx` → delete
- `app/app/page.tsx` → remove streak imports (`StreakBadge`), local states (`streakBroken`, `previousStreak`), and streak logic (lines using `checkAndUpdateStreak`)
- `app/app/page.tsx` → also remove Fridge Mode CTA (`Refrigerator` icon import + `/app/fridge` link)

**Rationale:** Gamification adds noise without supporting the core value prop (eat better with Nutri-Score). The objective coaching system replaces the engagement mechanism.

### Multi-profiles

**Files to delete/modify:**
- `lib/store/useProfileStore.ts` → delete
- `app/app/settings/page.tsx` → remove `useProfileStore` import and multi-profile UI section

**Rationale:** Adds complexity for a niche use case. Single user = single profile. Can be re-added later if validated by user research.

### Fridge Mode

**Files to delete:**
- `lib/engine/fridgeEngine.ts`
- `app/app/fridge/page.tsx`
- Fridge mode CTA on dashboard
- Related feature flag

**Rationale:** Cool concept but not core to meal planning. Adds cognitive load to an already feature-rich app.

### Feature flags to remove

Update `lib/config/features.ts`:
- Remove: `MULTI_PROFILE`, `FRIDGE_MODE`, `FRIEND_COMPARE`
- Keep: `SHARE_WITH_DIETITIAN`, `ADVANCED_REPERTOIRE`, `WEEKLY_STATS`, `PRACTITIONER_GOALS`, `SMART_SUGGESTIONS`, `GROCERY_LIST`, `CLOUD_SYNC`, `PHOTO_JOURNAL`, `PRACTITIONER_THREAD`

---

## 6. Provider Chain — Simplified

### Current chain

```
app/layout.tsx:
  NextIntlClientProvider
    └── children
    └── MatomoTracker (sibling, not wrapper)

app/app/layout.tsx:
  HydrationProvider
    └── AuthSyncProvider ← REMOVE
          └── OnboardingGate
                └── Children + BottomNav + Toaster
```

### New chain

```
app/layout.tsx:
  ClerkProvider
    └── NextIntlClientProvider
          └── children
          └── MatomoTracker (sibling, unchanged)

app/app/layout.tsx:
  HydrationProvider
    └── ClerkSyncProvider (new, lightweight)
          └── OnboardingGate (rewritten)
                └── Children + BottomNav + Toaster
```

### ClerkSyncProvider (new)

Lightweight replacement for AuthSyncProvider:
- Watches Clerk `useUser()` state
- On first authenticated visit: checks if Supabase profile exists
- If not: runs migration from localStorage → Supabase
- Switches persistence layer to Supabase
- Sets subscription plan from Supabase profile
- No session cookie management needed (Clerk handles it)

---

## 7. Settings — Restructured

### New Settings sections

1. **Compte** — Clerk `<UserProfile />` component (manages auth, email, connected accounts)
2. **Profil nutritionnel** — First name, objective, diets, allergies (same as onboarding data)
3. **Préférences** — Food preferences, household size, cooking time, meals to track (deferred from onboarding)
4. **Règles** — Anti-redundancy toggle, starch warnings
5. **Export** — Copy to clipboard, PDF export (Pro), share link
6. **Notifications** — Push notification preferences
7. **Objectifs** — Set/edit temporal objective (Pro: practitioner goals)
8. **Langue** — FR/EN toggle
9. **Données** — Reset profile (destructive)

---

## 8. Migration Plan

### Phase 1: Cut (low risk)

1. Git tag `pre-v2-redesign` as restore point
2. Delete Streak components and store state + clean usages in `app/app/page.tsx`
3. Delete Multi-profile store and UI + clean usages in `app/app/settings/page.tsx`
4. Delete Fridge Mode engine, page, and CTA in `app/app/page.tsx`
5. Update feature flags (`MULTI_PROFILE`, `FRIDGE_MODE`, `FRIEND_COMPARE` → remove)
6. Change `WEEKLY_STATS` to `{ free: true, pro: true }`
7. Update bottom nav (5→4 items, rename, move Export)
8. Verify: `npm run build` passes with no TypeScript errors

### Phase 2: Auth migration (high risk — do BEFORE onboarding rewrite)

**Rationale:** The new onboarding (Phase 3) has a CTA pointing to Clerk sign-up. Clerk must be in place first.

1. Git tag `pre-clerk-migration` as restore point
2. Set up Clerk project and configure providers (Google, Apple, email)
3. Install `@clerk/nextjs`, add env vars
4. Create Clerk webhook endpoint (`app/api/webhooks/clerk/route.ts`) — idempotent upsert
5. Add `<ClerkProvider>` to `app/layout.tsx` (coexists with old auth temporarily)
6. Create `ClerkSyncProvider` in `app/app/layout.tsx`
7. Replace `middleware.ts` with `clerkMiddleware()`
8. Create `/sign-in` and `/sign-up` routes
9. Migrate existing Supabase Auth users to Clerk (if any) via Clerk Backend API
10. Validate complete flow: sign-up → dashboard → sign-out → sign-in
11. Only after validation: delete old auth files (`AuthSyncProvider`, `useAuth`, `lib/supabase/middleware.ts`, `app/auth/callback/`, `app/app/login/`)

**Rollback strategy:** If Clerk migration fails, revert to `pre-clerk-migration` tag. During Phase 2, old auth files coexist until step 11 — rollback is safe until then.

### Phase 3: Rewrite onboarding (medium risk)

1. Rewrite `OnboardingGate` with 4-step flow
2. Implement avatar generator (initial + color palette + emoji)
3. Implement Moment Aha (generate first meal)
4. Ensure guest data persistence (localStorage before account)
5. Add nudge system for deferred data collection
6. Delete old onboarding components (`OnboardingStepFoodPrefs.tsx`, `OnboardingStep5.tsx`)

### Phase 4: Dashboard contextual (medium risk)

1. Restructure dashboard into 3 sections
2. Implement time-based meal focus (colored border + scale reduction)
3. Implement explicit meal validation (tap to confirm)
4. Implement day-based variations (weekend bilan, Monday banner)
5. Implement seasonal banner and ingredient badges
6. Implement progressive guide (7 steps, dismissible)
7. Implement objective coaching (progress bar + messages)
8. Implement Pro upsell strategy (blurred previews + contextual triggers)

### Phase 5: Polish

1. Restructure Settings page (9 sections)
2. Update i18n messages (fr.json)
3. Accessibility pass (WCAG AA contrast, aria-labels on emojis, tap targets)
4. Test complete flow end-to-end (guest + auth + onboarding + dashboard)
5. Update landing page to reflect new features/flow

---

## 9. Success Criteria

- [ ] New user can go from landing → sign-up → onboarding (4 steps) → see first meal in under 60 seconds
- [ ] Dashboard loads with time-appropriate meal in focus
- [ ] Bottom nav has exactly 4 items, all in French
- [ ] No Streak, Multi-profile, or Fridge Mode code remains
- [ ] Clerk auth works with Google + email (magic link minimum)
- [ ] Pro features show blurred previews, not locked badges
- [ ] Progressive guide shows for new users, disappears after step 7
- [ ] Objective progress bar visible when objective is set
- [ ] Seasonal banner displays correct season
- [ ] All existing free features (Roast, Tier List, Nutri-Score, Semainier, Batch Cook) still work
- [ ] WCAG AA contrast ratios met on all meal cards (active and inactive)
