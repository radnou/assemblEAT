# AssemblEat

## Commands

```bash
npm run dev          # Dev server (Next.js 16)
npm run build        # Production build
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run lint         # ESLint
```

## Architecture

- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn UI
- **State**: Zustand stores (`lib/store/`) with pluggable persistence (localStorage ↔ Supabase)
- **Auth**: Supabase OAuth + Magic Link (no email/password)
- **DB**: Supabase (custom schema `assembleat`, NOT `public`)
- **Payments**: Lemon Squeezy
- **i18n**: next-intl — French only (hardcoded in `i18n/request.ts`)
- **PWA**: Serwist service worker (`app/sw.ts`)
- **Analytics**: Matomo (self-hosted)

## Key Directories

- `app/` — Next.js routes. `/` = landing, `/app/*` = protected app
- `components/` — React components + `ui/` (shadcn)
- `lib/store/` — Zustand stores (`useMealStore`, `useSubscriptionStore`, `useProfileStore`, `useGoalsStore`)
- `lib/engine/` — Business logic (assembly generation, weekly score, smart suggestions)
- `lib/nutriscore/` — Nutri-Score v2 algorithm + OpenFoodFacts API
- `lib/hooks/` — Custom hooks (auth, feature flags, migration, etc.)
- `lib/config/features.ts` — Feature flag matrix (free vs pro)
- `lib/supabase/` — Supabase clients (browser + server)
- `types/index.ts` — All TypeScript types
- `infra/` — Self-hosted Supabase, nginx, deploy scripts
- `__tests__/` — Vitest tests (components, integration, lib)

## Code Style

- Imports: absolute with `@/` prefix (e.g., `import { cn } from '@/lib/utils'`)
- Type imports: `import type { X } from '...'`
- Components: PascalCase files, `'use client'` directive for client components
- Stores: `useXStore` naming pattern
- Hooks: `useX` naming pattern
- localStorage keys: kebab-case (`week-YYYY-WW`, `meal-feedbacks`)

## Gotchas

- **Hydration**: `HydrationProvider` must wrap store-dependent components — Zustand hydrates async
- **Supabase schema**: Uses custom `assembleat` schema, requires `PGRST_DB_SCHEMAS=public,assembleat` in env
- **Persistence switch**: `AuthSyncProvider` switches from localStorage to Supabase persistence after auth+migration
- **Feature flags are static**: Hardcoded in `lib/config/features.ts`, require rebuild to change
- **Nutri-Score**: Only general food category implemented (cheese exception exists, beverages/fats not yet)
- **Provider chain order**: `HydrationProvider → AuthSyncProvider → OnboardingGate` — order matters
- **OFF API cached**: OpenFoodFacts responses cached 1h via service worker

## Environment

See `.env.local.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`, `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL`, `LEMONSQUEEZY_API_KEY`
- `NEXT_PUBLIC_MATOMO_URL`, `NEXT_PUBLIC_MATOMO_SITE_ID`
- `ADMIN_SECRET_KEY` (protects `/admin?key=xxx`)
