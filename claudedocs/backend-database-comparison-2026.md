# AssemblEat Backend/Database Options: Structured Comparison (March 2026)

## Executive Summary

For a micro-SaaS PWA on Vercel needing auth, shared links, realtime comments, and Stripe payments, **Supabase** emerges as the strongest overall choice, offering the best balance of integrated features, Vercel compatibility, free tier generosity, and migration simplicity. **Neon + Clerk** is the strongest "best-of-breed" alternative if you prefer composability over integration. Firebase remains viable but introduces architectural friction on Vercel. PlanetScale has pivoted away from the micro-SaaS sweet spot. Vercel Postgres (now Neon) is effectively the Neon option.

**Confidence Level**: High (0.85) -- based on current pricing pages, official documentation, and multiple corroborating 2026 comparison sources.

---

## Context: AssemblEat Requirements Mapped

| Requirement | Database Need | Auth Need | Realtime Need | Payments Need |
|---|---|---|---|---|
| User authentication | User table, sessions | OAuth + email/password | -- | -- |
| Shared links w/ password | Links table, hashed passwords | Link-level access control | -- | -- |
| Realtime comments | Comments table | User identity for comments | WebSocket subscriptions | -- |
| Stripe payments | Subscriptions table, webhook state | User-to-customer mapping | -- | Webhook handlers, checkout |
| Migration from localStorage | Schema design, data import | New auth layer | New subscription layer | New integration |

---

## Option 1: Supabase (Postgres + Auth + Realtime)

### What It Is
An open-source Firebase alternative built on vanilla Postgres. Bundles database, authentication, realtime subscriptions, file storage, edge functions, and row-level security into one platform.

### Vercel Integration Quality: EXCELLENT
- First-class Vercel Marketplace integration (install in one click)
- Environment variables auto-synced to Vercel projects
- Billing can be handled through Vercel (unified invoice)
- Official Vercel template: `Stripe & Supabase SaaS Starter Kit`
- Works seamlessly with Next.js App Router and Server Components

### Free Tier (Spark equivalent)
- 2 projects
- 500 MB database storage
- 2 GB egress/month
- 50,000 MAUs for auth
- 1 GB file storage
- 500K edge function invocations
- **Unlimited** API requests
- **Unlimited** realtime connections and messages

### Feature Coverage for AssemblEat

| Feature | Coverage | Notes |
|---|---|---|
| Auth | BUILT-IN | Email/password, OAuth (Google, GitHub, etc.), magic links, MFA. 50K MAUs free. |
| Shared links w/ password | STRONG | Row-Level Security (RLS) policies can enforce link-level access. Store hashed passwords in a links table. |
| Realtime comments | BUILT-IN | Supabase Realtime: subscribe to Postgres changes via WebSockets. No extra infra. |
| Stripe integration | STRONG | Official docs for webhook handling via Edge Functions. Multiple production starter kits exist. Supabase even has a Stripe Foreign Data Wrapper for querying Stripe data directly from Postgres. |
| Migration from localStorage | STRAIGHTFORWARD | Design Postgres schema, write a one-time client-side migration script that reads localStorage and inserts into Supabase tables via the JS client. |

### Pricing at Scale

| Scale | Estimated Monthly Cost | Breakdown |
|---|---|---|
| 1K users | $0 (Free tier) | Well within free limits |
| 10K users | ~$27-35 | Pro plan ($25 base) + minimal overage |
| 100K users | ~$200-630 | Pro plan + bandwidth ($0.09/GB) + auth MAUs ($0.00325/user beyond 100K) + compute. Bandwidth is the largest cost driver. |

### Strengths
- All-in-one: auth, realtime, storage, database, edge functions in one platform
- Postgres underneath (SQL, joins, migrations, mature ecosystem)
- Realtime is free and unlimited on all tiers
- Massive ecosystem of Next.js + Supabase + Stripe starter kits
- Open source -- can self-host if costs become prohibitive
- Row-Level Security is ideal for shared link access control

### Weaknesses
- Realtime is a middleware layer on top of Postgres (not native Postgres logical replication for all use cases)
- Compute scaling requires manual instance upgrades on Pro
- Vendor lock-in on Supabase-specific APIs (mitigated by open source)
- $25/month minimum for Pro (no pay-as-you-go between free and Pro)

---

## Option 2: Vercel Postgres + Auth.js (NextAuth v5)

### What It Is
Vercel Postgres was officially transitioned to Neon's native integration (Q4 2024 - Q1 2025). "Vercel Postgres" is now effectively Neon, billed through the Vercel Marketplace. Auth.js v5 (formerly NextAuth) provides self-hosted, open-source authentication.

### Vercel Integration Quality: NATIVE (it IS Vercel's database)
- Deepest possible Vercel integration (built into the platform)
- Unified billing through Vercel
- Database branching for preview deployments
- Drizzle Studio table editor built in
- Auto-provisioned environment variables

### Free Tier
- 100 compute-unit hours/month (doubled from 50 in late 2025)
- 0.5 GB storage per project
- Scale-to-zero (5-minute idle timeout)
- Unlimited branches
- Auth.js is free and open source (zero cost for auth regardless of scale)

### Feature Coverage for AssemblEat

| Feature | Coverage | Notes |
|---|---|---|
| Auth | SEPARATE (Auth.js) | Auth.js v5 supports 50+ OAuth providers, credentials, magic links. Free forever. Requires you to manage session storage and user tables yourself. |
| Shared links w/ password | MANUAL | No RLS equivalent -- implement access control in application code or use Neon's new Authorize feature. |
| Realtime comments | NOT BUILT-IN | Neon is a database, not a realtime platform. You need a separate solution: Ably, Pusher, Liveblocks, or polling. |
| Stripe integration | MANUAL | Standard Next.js API route webhooks. No starter kits specific to this stack. Works fine but requires more glue code. |
| Migration from localStorage | MODERATE | Design schema, use Drizzle ORM or Prisma, write migration script. More setup than Supabase client. |

### Pricing at Scale

| Scale | Estimated Monthly Cost | Breakdown |
|---|---|---|
| 1K users | $0 (Free) | Neon free tier + Auth.js free |
| 10K users | ~$19-50 | Neon Launch ($19) + Auth.js free + realtime service ($0-30) |
| 100K users | ~$70-200 | Neon Scale ($69) + Auth.js free + realtime service ($50-100). Auth.js being free is a major cost advantage at scale. |

### Strengths
- Deepest Vercel integration possible
- Auth.js is completely free at any scale (major cost advantage)
- Neon's scale-to-zero saves money during low-traffic periods
- Database branching for preview deployments is excellent for DX
- No vendor lock-in on auth (Auth.js is open source, standard Postgres)
- Neon compute is ~50% cheaper than provisioned alternatives

### Weaknesses
- No built-in realtime (must add a separate service and pay for it)
- No built-in file storage
- Auth.js v5 has a steeper learning curve than managed auth services
- More assembly required -- you are composing 2-3 services instead of 1
- Auth.js session/user management requires more boilerplate than Supabase Auth or Clerk

---

## Option 3: Firebase / Firestore

### What It Is
Google's Backend-as-a-Service platform. NoSQL document database (Firestore), authentication, cloud functions, file storage, and realtime listeners. The original "app backend in a box."

### Vercel Integration Quality: ADEQUATE but NOT NATIVE
- No Vercel Marketplace integration
- Requires manual environment variable configuration
- Firebase Admin SDK works in Next.js API routes / Server Actions
- Cloud Functions run on Google Cloud, not Vercel's edge -- latency mismatch
- Two billing relationships to manage (Vercel + Google Cloud)
- Firebase client SDK adds significant bundle size

### Free Tier (Spark Plan)
- 1 GB Firestore storage
- 50K reads / 20K writes / 20K deletes per day
- 10 GB bandwidth/month
- 50K auth MAUs (phone auth: 10K/month for free)
- 5 GB Cloud Storage
- 2M Cloud Function invocations/month

### Feature Coverage for AssemblEat

| Feature | Coverage | Notes |
|---|---|---|
| Auth | BUILT-IN | Firebase Auth: email/password, OAuth, phone, anonymous. Mature and battle-tested. |
| Shared links w/ password | MODERATE | Firestore Security Rules can enforce access. Document-level security. Less expressive than Postgres RLS. |
| Realtime comments | BUILT-IN (EXCELLENT) | Firestore's onSnapshot() is best-in-class realtime. This is Firebase's core strength. |
| Stripe integration | MODERATE | Works via Cloud Functions or Next.js API routes. Fewer dedicated starter kits than Supabase. The "Run Payments with Stripe" Firebase Extension simplifies setup. |
| Migration from localStorage | EASY (data) / HARD (mental model) | JSON from localStorage maps naturally to Firestore documents. But switching from relational thinking to NoSQL document modeling is a significant architectural shift. |

### Pricing at Scale

| Scale | Estimated Monthly Cost | Breakdown |
|---|---|---|
| 1K users | $0 (Spark) | Within daily free quotas |
| 10K users | ~$25-80 | Blaze plan. Costs depend heavily on read/write patterns. $0.18/100K reads. |
| 100K users | ~$150-500+ | Highly variable. Read-heavy apps (realtime comments) can spike costs unpredictably. $0.18/100K reads adds up fast with active realtime listeners. |

### Strengths
- Best-in-class realtime (Firestore onSnapshot is unmatched for simplicity)
- Mature auth system with phone auth, anonymous auth
- Firebase Extensions marketplace (Stripe, Algolia, etc.)
- Google Cloud ecosystem for scaling
- Generous daily free quotas

### Weaknesses
- NoSQL (Firestore) is a poor fit for relational data like user-subscription-payment relationships
- No native Vercel integration -- architectural friction
- Operation-based pricing is unpredictable (a bug can cause massive bills)
- Vendor lock-in to Google Cloud (no self-hosting, proprietary query language)
- Cloud Functions cold starts add latency vs Vercel serverless functions
- Bundle size: Firebase client SDK is heavy (~150KB+ gzipped for auth + firestore)
- Two separate billing systems to manage
- No SQL -- cannot use Prisma, Drizzle, or standard ORM tooling

---

## Option 4: Neon Postgres + Clerk

### What It Is
A "best-of-breed" composed stack: Neon provides serverless Postgres (the same engine behind Vercel Postgres), and Clerk provides managed authentication with pre-built UI components. Official integration guides and starter templates exist for this combination.

### Vercel Integration Quality: VERY GOOD
- Neon: First-class Vercel Marketplace integration (same as Option 2)
- Clerk: Official Vercel integration, env var syncing
- Both billed through Vercel Marketplace
- Official Next.js + Neon + Clerk + Drizzle starter on GitHub

### Free Tier
- Neon: 100 CU-hours/month, 0.5 GB storage
- Clerk: 50,000 monthly retained users free (expanded from 10K in 2026)
- Combined: generous for a micro-SaaS launch

### Feature Coverage for AssemblEat

| Feature | Coverage | Notes |
|---|---|---|
| Auth | EXCELLENT (Clerk) | Pre-built sign-in/sign-up components, OAuth, MFA, organization management. Best DX of any auth option. Clerk's `<SignIn />` component works out of the box. |
| Shared links w/ password | GOOD | Neon Authorize for database-level auth. Clerk JWTs can be passed to Neon for RLS-like enforcement. |
| Realtime comments | NOT BUILT-IN | Same limitation as Option 2. Need Ably, Pusher, Liveblocks, or polling. |
| Stripe integration | GOOD | Clerk provides user metadata storage for Stripe customer IDs. Standard webhook pattern in Next.js API routes. |
| Migration from localStorage | MODERATE | Same as Option 2 for database. Clerk handles user creation/migration with bulk import APIs. |

### Pricing at Scale

| Scale | Estimated Monthly Cost | Breakdown |
|---|---|---|
| 1K users | $0 | Both free tiers cover this |
| 10K users | ~$19-50 | Neon Launch ($19) + Clerk free (under 50K) + realtime service |
| 100K users | ~$170-370 | Neon Scale ($69) + Clerk ($0.02/user for 50K-100K = ~$1,000) + realtime. **Clerk becomes the dominant cost at scale.** |

### Strengths
- Best authentication DX (pre-built UI, minimal code)
- Neon's Vercel integration is best-in-class
- Composable -- swap any component independently
- Clerk handles complex auth scenarios (organizations, roles, MFA) with zero effort
- Neon database branching for preview deployments
- Both services available in Vercel Marketplace

### Weaknesses
- **Clerk is expensive at scale**: $1,000+/month at 100K users vs $0 for Auth.js or ~$325 for Supabase
- No built-in realtime (same gap as Option 2)
- Two services to manage + a realtime service = three vendors
- Clerk is proprietary -- harder to migrate away from than Auth.js or Supabase Auth
- No built-in file storage

---

## Option 5: PlanetScale

### What It Is
Originally a MySQL-only serverless database built on Vitess (the system that scaled YouTube). In 2025, PlanetScale added PostgreSQL support ("PlanetScale Postgres Metal"). Positioned for high-scale, enterprise workloads.

### Vercel Integration Quality: ADEQUATE
- Vercel integration exists but is not in the Vercel Marketplace
- Manual environment variable setup required
- No unified billing through Vercel
- No database branching tied to Vercel preview deployments

### Free Tier
- **No free tier.** Removed in April 2024.
- Cheapest option: $5/month single-node database (limited)
- Scaler Pro: $39/month minimum

### Feature Coverage for AssemblEat

| Feature | Coverage | Notes |
|---|---|---|
| Auth | NONE | Database only. Need Auth.js, Clerk, or another auth provider. |
| Shared links w/ password | MANUAL | Application-level implementation only. |
| Realtime comments | NONE | No realtime features. Need a separate service. |
| Stripe integration | MANUAL | Standard webhook pattern. No specific integrations. |
| Migration from localStorage | MODERATE | Schema design + ORM. PlanetScale Postgres is standard Postgres. |

### Pricing at Scale

| Scale | Estimated Monthly Cost | Breakdown |
|---|---|---|
| 1K users | ~$5-39 | Single node ($5) or Scaler Pro ($39) + auth service + realtime service |
| 10K users | ~$60-120 | Scaler Pro ($39) + Clerk or Auth.js + realtime service |
| 100K users | ~$150-500+ | Depends on cluster configuration. Enterprise-grade pricing. |

### Strengths
- Vitess-powered horizontal scaling (proven at YouTube scale)
- Non-blocking schema changes (unique differentiator)
- Strong compliance: SOC 1/2, HIPAA, PCI DSS 4.0
- PlanetScale Postgres Metal offers dedicated hardware

### Weaknesses
- **No free tier** -- non-starter for a micro-SaaS MVP
- No auth, no realtime, no storage -- database only
- Vercel integration is not native
- Overkill for a micro-SaaS (designed for enterprise scale)
- Postgres support is new (2025) -- less mature than Neon or Supabase
- Most expensive starting point of all options
- Community and ecosystem for Next.js/Vercel is smaller

---

## Head-to-Head Comparison Matrix

| Criterion | Supabase | Vercel/Neon + Auth.js | Firebase | Neon + Clerk | PlanetScale |
|---|---|---|---|---|---|
| **Vercel Integration** | Excellent | Native | Adequate | Very Good | Adequate |
| **Free Tier** | Very Generous | Good | Generous | Good | None |
| **Built-in Auth** | Yes (50K MAUs free) | Auth.js (free, OSS) | Yes (mature) | Clerk (50K free) | No |
| **Built-in Realtime** | Yes (unlimited free) | No | Yes (best-in-class) | No | No |
| **Stripe Ecosystem** | Excellent (starter kits) | Manual | Moderate (extensions) | Good | Manual |
| **Data Model** | Relational (Postgres) | Relational (Postgres) | NoSQL (Firestore) | Relational (Postgres) | Relational (Postgres) |
| **Migration from localStorage** | Straightforward | Moderate | Easy data / Hard model | Moderate | Moderate |
| **Cost at 1K users** | $0 | $0 | $0 | $0 | $5-39 |
| **Cost at 10K users** | ~$30 | ~$19-50 | ~$25-80 | ~$19-50 | ~$60-120 |
| **Cost at 100K users** | ~$200-630 | ~$70-200 | ~$150-500+ | ~$170-370 | ~$150-500+ |
| **Auth cost at 100K** | ~$325 (included) | $0 (Auth.js) | ~$125 (included) | ~$1,000 (Clerk) | External |
| **Realtime cost** | $0 (included) | $30-100 (external) | Included (read costs) | $30-100 (external) | External |
| **Self-host escape hatch** | Yes (open source) | Yes (Postgres + Auth.js) | No | Partial (Postgres yes, Clerk no) | No |
| **DX / Speed to ship** | Fast | Moderate | Fast (NoSQL) | Fast (Clerk UI) | Slow |
| **Bundle size impact** | Light (supabase-js ~12KB) | Minimal | Heavy (~150KB+) | Light-Moderate | Minimal |

---

## Recommendation for AssemblEat

### Primary Recommendation: Supabase

**Why**: Supabase covers all four of AssemblEat's requirements (auth, shared links, realtime comments, Stripe) in a single platform with the least integration complexity. The free tier is generous enough to launch and validate. The Vercel integration is first-class. The ecosystem of Next.js + Supabase + Stripe starter kits means you can reference production-quality patterns rather than inventing your own.

**Migration path from localStorage**:
1. Design Postgres schema (users, meals, shared_links, comments, subscriptions)
2. Install `@supabase/supabase-js` and configure Vercel integration
3. Set up Supabase Auth (replaces any existing auth)
4. Write a client-side migration script: read localStorage, insert into Supabase
5. Add RLS policies for shared link password protection
6. Subscribe to Realtime for comments
7. Wire up Stripe webhooks via Supabase Edge Functions or Next.js API routes

**Cost trajectory**:
- Launch/validation: $0/month
- Growth (10K users): ~$30/month
- Scale (100K users): ~$200-630/month (self-host option available if costs become prohibitive)

### Runner-Up: Neon + Auth.js (if you want maximum cost efficiency at scale)

**Why**: Auth.js is free forever, and Neon is the cheapest serverless Postgres. At 100K users, this stack could be $70-200/month vs Supabase's $200-630. The trade-off is no built-in realtime (add Ably or Liveblocks at ~$30-100/month) and more assembly required.

**Best for**: Teams comfortable building their own auth flows and integrating separate realtime services.

### Avoid for This Use Case

- **Firebase**: NoSQL is a poor fit for relational SaaS data (user-subscription-payment-comment relationships). The Vercel integration friction and unpredictable operation-based pricing add unnecessary risk.
- **PlanetScale**: No free tier, no built-in features, enterprise pricing -- overkill for a micro-SaaS.
- **Neon + Clerk**: Clerk's $1,000+/month at 100K users makes it the most expensive auth option. Only choose this if Clerk's pre-built UI components save enough development time to justify the cost.

---

## Risk Factors and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Supabase pricing increases | Medium | Medium | Open-source self-host escape hatch |
| Realtime at high scale (Supabase) | Low | Medium | Supabase Realtime scales with paid plan; can add dedicated realtime service if needed |
| Supabase downtime | Low | High | Multi-region available on Team/Enterprise plans |
| Stripe webhook reliability | Low | High | Idempotent webhook handlers, Stripe retry logic, dead-letter monitoring |
| localStorage migration data loss | Medium | Low | Run migration with confirmation UI, keep localStorage as fallback for 30 days |

---

## Sources

- [Supabase for Vercel Marketplace](https://vercel.com/marketplace/supabase)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Pricing Real Costs at 10K-100K Users](https://designrevision.com/blog/supabase-pricing)
- [Supabase Pricing 2026 Complete Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [Neon for Vercel Marketplace](https://vercel.com/marketplace/neon)
- [Vercel Postgres Transition to Neon](https://neon.com/docs/guides/vercel-postgres-transition-guide)
- [Neon Pricing](https://neon.com/pricing)
- [Neon Serverless Postgres Pricing 2026](https://vela.simplyblock.io/articles/neon-serverless-postgres-pricing-2026/)
- [Neon + Clerk Integration Guide](https://neon.com/blog/nextjs-authentication-using-clerk-drizzle-orm-and-neon)
- [Clerk Pricing](https://clerk.com/pricing)
- [Clerk vs Supabase Auth Budget Comparison](https://www.getmonetizely.com/articles/clerk-vs-supabase-auth-how-to-choose-the-right-authentication-service-for-your-budget-199ca)
- [Firebase Pricing Plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Firestore Pricing](https://cloud.google.com/firestore/pricing)
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [PlanetScale Pricing](https://planetscale.com/pricing)
- [PlanetScale Postgres](https://planetscale.com/postgres)
- [Stripe & Supabase SaaS Starter Kit on Vercel](https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit)
- [Supabase Stripe Webhook Docs](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Neon vs Supabase Benchmarks and Pricing](https://designrevision.com/blog/supabase-vs-neon)
- [Best Database Software for Startups 2026](https://makerkit.dev/blog/tutorials/best-database-software-startups)
- [Firebase vs Supabase 2026 Deep Dive](https://www.tekingame.ir/en/blog/firebase-vs-supabase-2026-comparison-nextjs-architecture-pricing-vector-db-ar)
- [SaaS Stripe Integration 2026](https://designrevision.com/blog/saas-stripe-integration)
