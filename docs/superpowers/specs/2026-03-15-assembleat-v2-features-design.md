# AssemblEat v2 — Design Spec

**Date** : 2026-03-15
**Statut** : En cours de validation
**Objectif** : Traction utilisateur (A) > Monétisation (B) > Solidification technique (D)

---

## 1. Contexte & Analyse SWOT

### Forces
- Niche unique : assemblage CPB (Céréales-Protéines-Base légumes)
- Nutri-Score v2 intégré automatiquement (algo local + API OFF)
- PWA installable, offline-first, zéro coût serveur en v1
- UX simple, aucune expertise nutritionnelle requise
- Architecture freemium déjà en place dans le code

### Faiblesses
- Pas de backend / auth / sync — données volatiles (localStorage)
- Zéro rétention mesurable, pas de feedback loop
- Pas de contenu partageable / viral
- Pas de gamification

### Opportunités
- Partage praticien = killer feature (compliance médicale)
- Communauté batch cooking (TikTok/IG) très active
- Viralité GenZ via formats natifs (Wrapped, Tier List, Roast)
- Instance Supabase mutualisable entre micro-SaaS

### Menaces
- Concurrents massifs (Yazio, Jow, MyFitnessPal)
- ChatGPT peut générer des plans repas
- Fatigue des apps santé

### Positionnement
AssemblEat ne résout pas le job "tracker mes calories" (MyFitnessPal) ni "faire mes courses" (Jow). Il résout le job **"décider quoi manger cette semaine sans y réfléchir"** pour des non-experts qui veulent une qualité nutritionnelle sans effort cognitif.

---

## 2. Onboarding Flow

4 écrans au premier lancement. Pas de compte requis en v1 (localStorage), migration vers Supabase auth en Phase 1.

### Écran 1 : "C'est parti"
- Prénom (obligatoire)
- Emoji avatar (grille de 12 emojis food : 🥑🍳🥗🍜🥩🐟🧀🥕🍎🥜🌮🍕)
- Ton animé : "Bonjour ! On va simplifier tes repas."

### Écran 2 : "Ton profil alimentaire"
- **Objectif principal** (choix unique) :
  - 🎯 Manger plus équilibré
  - ⏱️ Gagner du temps en cuisine
  - 📉 Perdre du poids progressivement
  - 💪 Plus de protéines
  - 🌱 Réduire la viande
- **Régime** (multi-sélection) :
  - Aucun en particulier / Végétarien / Végétalien / Pescetarien / Sans gluten / Sans lactose / Halal / Casher
- **Allergies** (tags libres + suggestions : arachides, fruits de mer, œufs, soja)

### Écran 3 : "Tes habitudes"
- Nombre de personnes (1 à 6, slider)
- Temps dispo en cuisine (⭐ <5min / ⭐⭐ 5-15min / ⭐⭐⭐ Batch cook dimanche)
- Repas à planifier (checkboxes : petit-déj / déjeuner / dîner)

### Écran 4 : Récap + premier repas généré
- Résumé visuel du profil en badges
- Premier assemblage généré selon les préférences
- Bouton CTA "C'est parti !" avec animation confetti

### Données

Extension du type `UserSettings` existant (conserve `language` et `rules`) :

```typescript
interface UserProfile extends UserSettings {
  // UserSettings: firstName, language, rules (conservés)
  avatarEmoji: string;
  objective: 'balanced' | 'time_saving' | 'weight_loss' | 'more_protein' | 'less_meat';
  diets: string[];
  allergies: string[];
  householdSize: number;
  cookingTime: 'express' | 'moderate' | 'batch';
  mealsToTrack: ('breakfast' | 'lunch' | 'dinner')[];
  onboardingCompleted: boolean;
}
```

**Migration existants** : les utilisateurs v1 avec `UserSettings` en localStorage sont considérés `onboardingCompleted: true` (pas de re-onboarding). Leurs champs profile sont initialisés avec des valeurs par défaut (avatarEmoji='🥑', diets=[], etc.).

Le moteur d'assemblage utilise `diets` et `allergies` pour filtrer les composants proposés.

---

## 3. Feedback post-repas

Micro-formulaire en bottom sheet après validation d'un repas (bouton ✓). Aussi accessible via bouton 📝 sur les repas validés. Optionnel (skip possible).

### Champs

1. **Plaisir** — "T'as kiffé ?" (obligatoire)
   - 5 emojis : 😫 😕 😐 😊 🤩
   - Tap unique, sélection immédiate

2. **Quantité** — "C'était suffisant ?" (optionnel)
   - 3 choix : "Pas assez" / "Pile bien" / "Trop"

3. **Note libre** — "Un truc à dire ?" (optionnel)
   - Champ texte, max 140 caractères
   - Placeholder : "Ex: sauce trop salée, brocolis parfaits..."

### Données

```typescript
interface MealFeedback {
  assemblyId: string;
  date: string;
  pleasure: 1 | 2 | 3 | 4 | 5;
  quantity: 'not_enough' | 'just_right' | 'too_much' | null;
  note: string | null;
}
```

### Utilisation

| Couche | Usage |
|--------|-------|
| Dashboard | Emoji affiché sur les repas validés |
| Wrapped mensuel | "Ton repas préféré ce mois" |
| Roast my diet | Punchlines basées sur les patterns |
| Thread praticien (Pro) | Ressenti visible à côté du Nutri-Score |
| Smart suggestions (Pro) | Boost les 🤩, réduit les 😫 |

---

## 4. Features virales GenZ (gratuites)

### V1 — "What I Eat In A Week"
- Bouton sur la page semainier : "Partager ma semaine"
- Génère une image card via Canvas API (1080x1920, format stories)
- Contenu : 7 rangées (Lun→Dim) avec repas en pills, Nutri-Score moyen, streak
- Watermark discret : "assembleat.app"
- Téléchargement PNG + bouton "Copier le lien"
- 100% côté client, pas de backend
- **Fonts Canvas** : charger Inter via `FontFace` API avant le rendu Canvas. Fallback sur `system-ui, sans-serif` si le chargement échoue après 2s. Tester le rendu sur Chrome Android, Safari iOS, Chrome Desktop.

### V3 — Wrapped mensuel
- Accessible le 1er de chaque mois ou depuis /settings
- 5 slides en carrousel swipable (Framer Motion) :
  1. "Ce mois, tu as validé X repas" + emoji dominant
  2. "Ton Nutri-Score moyen : B (+1 vs mois dernier)"
  3. "Top 3 repas préférés" (basé sur feedback 🤩)
  4. "Tu as mis 😫 à 3 repas — on les remplace ?"
  5. "Partage ton Wrapped !" → export image story
- Export image unique par mois
- **Historique mensuel** : une table `assembleat.monthly_summaries` est peuplée par un calcul côté client en fin de mois (ou lazily au premier accès du Wrapped). Elle stocke : `user_id`, `month` (YYYY-MM), `avg_nutri_score`, `total_meals`, `top_assemblies` (JSONB), `dominant_emoji`. Le delta "vs mois dernier" est calculé par comparaison de deux lignes `monthly_summaries`.

### V4 — Tier List repas
- Page depuis le dashboard : "🏆 Ma Tier List"
- Grille auto S/A/B/C/D basée sur feedback plaisir × Nutri-Score
- 🤩 + Nutri-Score A = tier S, 😫 + Nutri-Score D = tier D
- Visuel meme tier list, exportable en image carré (1:1, Reddit)

### V5 — Streaks
- Compteur jours consécutifs avec ≥1 repas validé
- **Timezone** : le jour est déterminé par le fuseau local du navigateur (`Intl.DateTimeFormat().resolvedOptions().timeZone`). Le rollover se fait à minuit local. La date stockée en DB est la date locale de l'utilisateur (pas UTC).
- Badges à 7j 🌱, 30j 🌿, 90j 🌳, 365j 🏆
- Animation Framer Motion au déblocage
- Affiché dashboard haut droite
- Partageable en mini card

### V6 — "Roast my diet"
- Bouton dans /settings ou fin du Wrapped
- Analyse la semaine, génère 3 punchlines depuis une banque de ~40 templates :
  - Répétition : "Poulet-riz 4 fois ? T'es en prep concours ou en mode robot ?"
  - Scores bas : "3 repas D... ta diét va te ghoster"
  - Excellent : "Nutri-Score A 5 jours d'affilée — t'es devenu(e) nutritionniste ?"
- Templates pré-écrits avec variables, pas d'IA
- Exportable en image card fond sombre + typo bold

### V2 — "Rate My Plate" (reporté v2+)
- Nécessite couche communautaire + modération. Trop complexe pour le MVP.

---

## 5. Structure Free vs Pro

### Principe
Tout ce qui attire est gratuit. Tout ce qui retient professionnellement est payant. Le Pro vend de l'**accountability** (quelqu'un regarde et commente), pas du contenu statique.

### Grille

| FREE (traction) | PRO 3,99€/mois (relation) |
|---|---|
| Dashboard + assemblages illimités | Thread praticien temps réel |
| Semainier complet | Évaluations par repas (👍/⚠️/💡) |
| Batch Cook checklist | Objectifs co-construits praticien |
| Export PDF / copie texte | Historique nutritionnel 12 semaines |
| Partage social images (V1, V3, V4) | Smart suggestions (algo préférences) |
| Streaks + badges (V5) | Multi-profils famille |
| "Roast my diet" (V6) | Sync cloud multi-appareils |
| Partage lien read-only (3 jours sur 7) | Partage complet + commentaires |
| Feedback post-repas | Liste de courses auto-générée |
| | Meal Photo Journal |
| | Mode "Reste du frigo" |

### Protection du paywall
Le lien gratuit ne montre que **les 3 jours les plus récents** de la semaine (ex: si on est jeudi, il montre Mar/Mer/Jeu). Le praticien voit assez pour comprendre la valeur, pas assez pour remplacer le Pro. Les commentaires/évaluations sont la valeur Pro — impossible à imprimer puisque c'est une interaction vivante avec notifications.

### Extension du système de feature flags
Le `FeatureFlag` existant dans `/lib/config/features.ts` doit être étendu pour couvrir toutes les features Pro :

```typescript
type FeatureFlag =
  | 'SHARE_WITH_DIETITIAN'    // existant
  | 'ADVANCED_REPERTOIRE'     // existant
  | 'WEEKLY_STATS'            // existant
  | 'MULTI_PROFILE'           // existant
  | 'PRACTITIONER_THREAD'     // nouveau : commentaires + réactions
  | 'PRACTITIONER_GOALS'      // nouveau : objectifs co-construits
  | 'SMART_SUGGESTIONS'       // nouveau : algo préférences
  | 'PHOTO_JOURNAL'           // nouveau : photos de plats
  | 'GROCERY_LIST'            // nouveau : liste de courses
  | 'CLOUD_SYNC'              // nouveau : sync multi-appareils
  | 'FRIDGE_MODE'             // nouveau : reste du frigo
  | 'FRIEND_COMPARE';         // nouveau : comparaison amis (v2+, spec séparée)
```

Chaque composant Pro utilise `useFeatureFlag(flag)` pour contrôler l'affichage du badge 🔒 et le déclenchement du `ProUpsellDialog`.

---

## 6. Partage sécurisé & Thread praticien

### Modèle d'accès (v1)
Lien avec token + mot de passe optionnel. Le praticien n'a pas besoin de compte.

```
assembleat.app/share/[token]
```

| | FREE | PRO |
|---|---|---|
| Lien partageable | 3 jours visibles sur 7 | Semaine complète |
| Mot de passe | Oui | Oui |
| Feedbacks plaisir | Non | Oui (😫→🤩 + notes) |
| Commentaires praticien | Non | Thread par repas |
| Évaluations praticien | Non | 👍/⚠️/💡 par assemblage |
| Objectifs co-construits | Non | Oui |
| Durée du lien | 7 jours puis expire | Permanent tant que Pro actif |
| Downgrade Pro→Free | Lien existant passe à 3 jours visibles, expire après 7j | — |

### Thread praticien (Pro)
Structure par semaine, chaque repas commentable :
- Le praticien voit : assemblage + Nutri-Score + feedback plaisir + note
- 3 actions : 👍 (validé) / ⚠️ (attention) / 💡 (suggestion)
- Commentaire texte max 280 chars
- Le patient reçoit notification push (PWA)
- Historique complet consultable

### Objectifs co-construits (Pro)
- Le praticien définit des objectifs textuels ("3 repas légumineuses cette semaine")
- Affichés en bannière sur le dashboard patient
- Compteur automatique en fin de semaine
- Le praticien voit le résultat dans son thread

---

## 7. i18n

Structure existante dans `/lib/i18n/fr.ts`. Extension avec `next-intl`.

| Langue | Phase | Raison |
|--------|-------|--------|
| Français | v1 | Marché cible initial |
| Anglais | v1.1 | Marché global, TikTok anglophone |
| Espagnol | v2 | 3ème marché meal prep |
| Arabe | v2 | Pertinent vu régimes Halal |

Détection automatique du navigateur + choix manuel dans Settings.

---

## 8. BDD de recettes — Approche hybride

- Assemblages de base dans le répertoire local (existant)
- Chaque assemblage peut avoir un **lien recette** optionnel (URL TikTok, IG, blog)
- Feature Pro : **"Inspirations"** — feed curated de recettes tagguées par profil CPB
- Les utilisateurs peuvent soumettre leurs assemblages (nom + composants + lien recette) → modération → répertoire communautaire

---

## 9. Features Pro additionnelles

| Feature | Description | Phase |
|---------|-------------|-------|
| Meal Photo Journal | Photo du plat à chaque repas, visible dans thread praticien | Phase 3 |
| Comparaison entre amis | "Qui a le meilleur Nutri-Score cette semaine ?" — nécessite une spec séparée (couche sociale : friend requests, privacy) | Phase 4+ (spec séparée) |
| Import agenda | Sync Google Calendar, bloquer jours "resto" | Phase 4 |
| Mode "Reste du frigo" | Sélectionner ingrédients dispo → assemblages possibles | Phase 3 |
| Widget iOS/Android | Widget écran d'accueil avec repas du moment | Phase 4 |

---

## 10. Architecture technique

### Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router, Turbopack) sur Vercel |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| State | Zustand + migration progressive localStorage → Supabase |
| Backend | Supabase self-hosted (Docker) sur VPS OVH |
| Auth | Supabase GoTrue (email + Google) |
| DB | PostgreSQL 17 (schema `assembleat`) |
| Realtime | Supabase Realtime (WebSocket) — commentaires praticien |
| Paiement | Stripe Checkout (hosted) + webhooks |
| PWA | next-pwa + service worker |
| i18n | next-intl |

### Infrastructure VPS OVH

```
VPS OVH (54.38.109.182) — 4 CPU, 7.6 Go RAM, 72 Go disque
├── Traefik (reverse proxy, :80/:443, TLS auto Let's Encrypt)
│   ├── api.assembleat.app → Supabase Platform Kong
│   ├── app.gerersci.fr → GérerSCI Nginx
│   └── api.gerersci.fr → GérerSCI Supabase Kong
├── GérerSCI (instance existante, inchangée)
│   ├── App (frontend + backend + nginx)
│   └── Supabase GérerSCI (instance dédiée)
├── Supabase "Platform" (nouvelle instance partagée multi-SaaS)
│   ├── PostgreSQL 17
│   ├── Schema: assembleat (tables AssemblEat)
│   ├── Schema: [futur micro-SaaS]
│   ├── GoTrue (auth — un seul issuer, isolation par RLS sur user_id + schema)
│   ├── Realtime (filtrage par schema via RLS)
│   ├── Storage (buckets séparés : assembleat-photos/)
│   └── Kong (routage par headers/path)
└── Monitoring (Grafana, Loki, Uptime Kuma — existant)
```

DNS :
- `assembleat.app` → Vercel (CNAME)
- `api.assembleat.app` → VPS OVH (A record 54.38.109.182)

### Tables Supabase (schema `assembleat`)

```sql
-- Auth (géré par GoTrue)
-- users extended via profil

CREATE TABLE assembleat.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🥑',
  objective TEXT,
  diets TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  household_size INT DEFAULT 1,
  cooking_time TEXT DEFAULT 'moderate',
  meals_to_track TEXT[] DEFAULT '{breakfast,lunch,dinner}',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  streak_count INT DEFAULT 0,
  streak_last_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assembleat.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  current_period_end TIMESTAMPTZ
);

CREATE TABLE assembleat.week_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  week_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_key)
);

CREATE TABLE assembleat.meal_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  assembly_id TEXT NOT NULL,
  date DATE NOT NULL,
  pleasure INT CHECK (pleasure BETWEEN 1 AND 5),
  quantity TEXT CHECK (quantity IN ('not_enough', 'just_right', 'too_much')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assembleat.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  password_hash TEXT,
  -- plan is NOT stored here; derived from profiles.plan at query time
  -- to avoid desync on upgrade/downgrade
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ -- NULL = permanent (Pro), set = 7 days after creation (Free)
);

-- RLS: le praticien peut lire via token + mot de passe validé côté API
-- L'écriture de commentaires requiert :
--   1. Le link_id correspond à un lien valide (non expiré)
--   2. Le propriétaire du lien a plan='pro' (jointure sur profiles)
--   3. Le mot de passe a été vérifié dans la session (via cookie signé ou JWT éphémère)
-- Ces vérifications sont faites dans l'API Route Next.js (/api/share/[token]/comment)
-- avant l'insert, pas uniquement via RLS.

CREATE TABLE assembleat.practitioner_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES assembleat.shared_links(id),
  week_key TEXT NOT NULL,
  assembly_id TEXT NOT NULL,
  reaction TEXT CHECK (reaction IN ('approved', 'warning', 'suggestion')),
  comment TEXT,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assembleat.practitioner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES assembleat.shared_links(id),
  week_key TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  target_count INT,
  achieved_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Row Level Security : chaque utilisateur ne voit que ses données. Le praticien accède uniquement via le token du lien partagé.

```sql
CREATE TABLE assembleat.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  month TEXT NOT NULL, -- YYYY-MM
  avg_nutri_score FLOAT,
  total_meals INT,
  top_assemblies JSONB, -- [{id, name, count, avg_pleasure}]
  dominant_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
```

### Note multi-tenant GoTrue
Une seule instance GoTrue sert tous les micro-SaaS sur cette instance Supabase. L'isolation se fait via RLS sur les schemas Postgres, pas via des JWT distincts. Un utilisateur authentifié a un `user_id` dans `auth.users` ; ses accès aux tables `assembleat.*` ou `saas2.*` sont contrôlés par les policies RLS de chaque schema. Si un micro-SaaS nécessite une isolation auth complète (emails séparés, providers différents), il faudra une instance GoTrue dédiée.

### Note sur assembly_id
Les `assembly_id` dans `meal_feedbacks` et `practitioner_comments` référencent les IDs définis dans `lib/data/repertoire.ts` (données locales). Ces IDs sont stables et conventionnels (ex: `dej-1`, `poulet-dej`). Si le répertoire évolue, les anciens IDs restent valides dans l'historique — les feedbacks/commentaires affichent le nom stocké dans `week_plans.data` (JSONB) et non un lookup live sur le répertoire.

---

## 11. Roadmap par phases

### Phase 1 — MVP Viral (semaines 1-3)
| Feature | Type | Effort |
|---------|------|--------|
| Onboarding 4 écrans | FREE | S |
| Feedback post-repas (😫→🤩) | FREE | S |
| Streaks + badges | FREE | S |
| Auth Supabase (email/Google) | Infra | M |
| Migration localStorage → Supabase | Infra | M |
| Traefik + Supabase Docker sur VPS | Infra | M |

### Phase 2 — Viralité (semaines 3-5)
| Feature | Type | Effort |
|---------|------|--------|
| "What I Eat In A Week" image export | FREE | M |
| Wrapped mensuel (5 slides) | FREE | M |
| Tier List repas | FREE | S |
| "Roast my diet" (banque de punchlines) | FREE | S |
| i18n anglais | FREE | S |

### Phase 3 — Pro + Stripe (semaines 5-7)
| Feature | Type | Effort |
|---------|------|--------|
| Stripe Checkout + webhooks | PRO | M |
| Partage lien sécurisé (token + mdp) | PRO | M |
| Thread praticien (commentaires + réactions) | PRO | L |
| Évaluations par repas (👍/⚠️/💡) | PRO | M |
| Objectifs co-construits | PRO | M |
| Historique nutritionnel 12 semaines | PRO | M |
| Meal Photo Journal | PRO | M |
| Mode "Reste du frigo" | PRO | M |

### Phase 4 — Polish (semaine 8+)
| Feature | Type | Effort |
|---------|------|--------|
| Smart suggestions (algo préférences) | PRO | L |
| Notifications push PWA | PRO | M |
| Liste de courses auto-générée | PRO | M |
| Multi-profils famille | PRO | L |
| Comparaison entre amis | PRO | M |
| Import agenda Google Calendar | PRO | M |
| Widget iOS/Android | PRO | M |
| i18n espagnol, arabe | FREE | S |
| "Rate My Plate" communautaire | FREE | L |
