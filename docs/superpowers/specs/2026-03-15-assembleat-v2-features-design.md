# AssemblEat v2 — Design Spec

**Date** : 2026-03-15
**Statut** : Validé (4 panels Big4)
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
- ChatGPT peut générer des plans repas (mais pas le suivi/gamification)
- Fatigue des apps santé

### Positionnement
AssemblEat ne résout pas le job "tracker mes calories" (MyFitnessPal) ni "faire mes courses" (Jow). Il résout le job **"décider quoi manger cette semaine sans y réfléchir"** pour des non-experts qui veulent une qualité nutritionnelle sans effort cognitif.

---

## 2. Onboarding Flow

5 écrans au premier lancement (scindé suite à review panel Communication pour réduire la charge cognitive). Pas de compte requis en v1 (localStorage), migration vers Supabase auth en Phase 1. Bouton "Passer" discret en haut à droite sur chaque écran.

### Écran 1 : "C'est parti"
- Prénom (obligatoire)
- Emoji avatar (grille de 12 emojis food : 🥑🍳🥗🍜🥩🐟🧀🥕🍎🥜🌮🍕)
- Ton animé : "Bonjour ! On va simplifier tes repas."

### Écran 2 : "Ton objectif"
- **Objectif principal** (choix unique) :
  - 🎯 Manger plus équilibré
  - ⏱️ Gagner du temps en cuisine
  - 📉 Perdre du poids progressivement
  - 💪 Plus de protéines
  - 🌱 Réduire la viande

### Écran 3 : "Restrictions alimentaires"
- **Régime** (multi-sélection) :
  - Aucun en particulier / Végétarien / Végétalien / Pescetarien / Sans gluten / Sans lactose / Halal / Casher
- **Allergies** (tags libres + suggestions : arachides, fruits de mer, œufs, soja)
- Bouton explicite "Pas de restriction" pour skip rapide

### Écran 4 : "Tes habitudes"
- Nombre de personnes (1 à 6, slider)
- Temps dispo en cuisine (⭐ <5min / ⭐⭐ 5-15min / ⭐⭐⭐ Batch cook dimanche)
- Repas à planifier (checkboxes : petit-déj / déjeuner / dîner)

### Écran 5 : Récap + premier repas généré
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

**Migration existants** : les utilisateurs v1 avec `UserSettings` en localStorage sont considérés `onboardingCompleted: true` (pas de re-onboarding). Leurs champs profile sont initialisés avec des valeurs par défaut (avatarEmoji='🥑', diets=[], etc.). Un nudge discret "Complète ton profil pour des repas plus adaptés" apparaît sur le dashboard pour les profils incomplets.

### Impact de `objective` sur le moteur

L'objectif modifie le comportement du moteur d'assemblage :

| Objectif | Effet sur le moteur |
|----------|-------------------|
| `balanced` | Comportement par défaut, aucun filtre additionnel |
| `time_saving` | Priorise les assemblages avec `simplicityScore = '⭐ Express'` |
| `weight_loss` | Force `cereal: null` au dîner (dîner léger systématique) |
| `more_protein` | Priorise les assemblages avec protéine ayant `protein > 20g/100g` (via CIQUAL) |
| `less_meat` | Filtre les composants avec tags `viande` et `volaille`, priorise `vegetal` et `legumineuse` |

---

## 3. Filtrage diets/allergies — Mapping explicite

### Table de mapping diet → tags exclus

| Diet | Tags exclus des composants |
|------|--------------------------|
| `vegetarien` | `viande`, `volaille`, `poisson` |
| `vegetalien` | `viande`, `volaille`, `poisson`, `laitage`, `oeufs` |
| `pescetarien` | `viande`, `volaille` |
| `sans_gluten` | `gluten` (tag à ajouter aux composants concernés : pain, pâtes, semoule) |
| `sans_lactose` | `laitage` |
| `halal` | `porc` (tag à ajouter si composants concernés) |
| `casher` | `porc`, `fruits_de_mer` |

### Table de mapping allergie → tags exclus

| Allergie | Tags exclus |
|----------|------------|
| `arachides` | `arachides` |
| `fruits_de_mer` | `fruits_de_mer`, `crustaces` |
| `oeufs` | `oeufs` |
| `soja` | `soja` |
| `gluten` | `gluten` |
| `lait` | `laitage` |

### Ordre d'application des filtres dans `generateRandomAssembly`

```
1. Filtrer par diets (exclusion par tags)
2. Filtrer par allergies (exclusion par tags)
3. Appliquer l'objectif (priorisation/exclusion)
4. Appliquer anti-redondance protéique (règle 1)
5. Appliquer variété 5 jours (règle 3)
6. Sélection aléatoire parmi les candidats restants
```

### Cas "zéro candidats"

Si le filtrage retourne zéro assemblages :
1. Relâcher le filtre de variété (règle 3)
2. Si toujours zéro, relâcher le filtre objectif
3. Si toujours zéro, afficher un message : "Aucun assemblage ne correspond à tous tes critères. Essaie d'ajuster tes restrictions dans les Réglages."
4. Ne jamais crasher — toujours retourner un état vide gracieux

### Tags à ajouter aux composants existants

Les `MealComponent` dans `repertoire.ts` doivent être enrichis des tags manquants :
- `painComplet` : ajouter `gluten`
- `pates-dej`, `semoule-dej` : ajouter `gluten`
- `flocons` : ajouter `gluten`
- `yaourt`, `fromBlanc` : tag `laitage` déjà présent
- `oeufsBreak`, `oeufs-dur-dej` : tag `oeufs` déjà présent
- `tofu-dej` : tag `soja` déjà présent

---

## 4. Feedback post-repas

Micro-formulaire en bottom sheet après validation d'un repas (bouton ✓). Aussi accessible via bouton 📝 sur les repas validés. Optionnel (skip possible).

### Champs

1. **Plaisir** — "T'as kiffé ?" (obligatoire)
   - 5 emojis : 😫 😕 😐 😊 🤩
   - Chaque emoji a un `aria-label` explicite : "Très mauvais", "Mauvais", "Neutre", "Bon", "Excellent"
   - Tap unique, sélection immédiate

2. **Quantité** — "C'était suffisant ?" (optionnel)
   - 3 choix : "Pas assez" / "Pile bien" / "Trop"

3. **Note libre** — "Un truc à dire ?" (optionnel)
   - Champ texte, max 140 caractères
   - Placeholder : "Ex: sauce trop salée, brocolis parfaits..."

### Stratégie offline

Les feedbacks sont stockés dans une **queue locale** (Zustand persist) quand l'utilisateur est hors ligne. La sync vers Supabase se fait automatiquement au retour réseau via un `useEffect` qui vérifie `navigator.onLine` et flush la queue. Même principe pour les validations de repas et les mises à jour de streak.

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

## 5. Features virales GenZ (gratuites)

### V1 — "What I Eat In A Week"
- Bouton sur la page semainier : "Partager ma semaine"
- Génère une image card via Canvas API (1080x1920, format stories)
- Contenu : 7 rangées (Lun→Dim) avec repas en pills, Nutri-Score moyen, streak
- Watermark discret : "assembleat.app"
- Téléchargement PNG + bouton "Copier le lien"
- 100% côté client, pas de backend
- **Fonts Canvas** : charger Inter via `FontFace` API avant le rendu Canvas. Fallback sur `system-ui, sans-serif` si le chargement échoue après 2s. Utiliser `OffscreenCanvas` dans un Web Worker sur les appareils bas de gamme pour ne pas bloquer le thread principal.

### V2 — Wrapped mensuel
- Accessible le 1er de chaque mois ou depuis /settings
- Si aucun repas validé ce mois, afficher un message "Pas encore de Wrapped — valide tes repas pour débloquer ton récap !"
- 5 slides en carrousel swipable (Framer Motion) :
  1. "Ce mois, tu as validé X repas" + emoji dominant
  2. "Ton Nutri-Score moyen : B (+1 vs mois dernier)"
  3. "Top 3 repas préférés" (basé sur feedback 🤩)
  4. "Tu as mis 😫 à 3 repas — on les remplace ?"
  5. "Partage ton Wrapped !" → export image story
- Export image unique par mois
- **Historique mensuel** : une table `assembleat.monthly_summaries` est peuplée lazily au premier accès du Wrapped. Elle stocke : `user_id`, `month` (YYYY-MM), `avg_nutri_score`, `total_meals`, `top_assemblies` (JSONB), `dominant_emoji`. Le delta "vs mois dernier" est calculé par comparaison de deux lignes.

### V3 — Tier List repas
- Page depuis le dashboard : "🏆 Ma Tier List"
- Grille auto S/A/B/C/D basée sur feedback plaisir × Nutri-Score
- 🤩 + Nutri-Score A = tier S, 😫 + Nutri-Score D = tier D
- Visuel meme tier list, exportable en image carré (1:1, Reddit)

### V4 — Streaks
- Compteur jours consécutifs avec ≥1 repas validé
- **Timezone** : le jour est déterminé par le fuseau local du navigateur (`Intl.DateTimeFormat().resolvedOptions().timeZone`). Le rollover se fait à minuit local. La date stockée en DB est la date locale de l'utilisateur (pas UTC).
- **Validation rétroactive** : seule la date de validation compte, pas la date du plan. Si l'utilisateur valide lundi les repas de dimanche, le streak de dimanche ne compte pas — le streak est basé sur "le jour où tu as utilisé l'app".
- Badges à 7j 🌱, 30j 🌿, 90j 🌳, 365j 🏆
- Animation Framer Motion au déblocage
- Affiché dashboard haut droite
- Partageable en mini card
- **Recalcul** : le streak peut être recalculé depuis `meal_feedbacks` en cas de désynchronisation client/serveur.

### V5 — "Roast my diet"
- Bouton dans /settings ou fin du Wrapped
- Analyse la semaine, génère 3 punchlines depuis une banque de **100+ templates** (40 insuffisant pour éviter la répétition)
- **Garde-fous TCA** : les punchlines sont filtrées par profil. Les utilisateurs avec `objective: 'weight_loss'` ne reçoivent JAMAIS de punchlines sur le poids, les scores D/E, ou la quantité. Pas de body shaming implicite. Templates revus éditorialement.
- **Ton** : humour bienveillant, jamais méchant. Registre GenZ mais pas toxique.
- Templates pré-écrits avec variables, pas d'IA
- Exportable en image card fond sombre + typo bold

### Rate My Plate (reporté v2+)
- Nécessite couche communautaire + modération. Spec séparée.

---

## 6. Structure Free vs Pro

### Principe
Tout ce qui attire est gratuit. Tout ce qui retient professionnellement est payant. Le Pro vend de l'**accountability** (quelqu'un regarde et commente), pas du contenu statique.

### Grille

| FREE (traction) | PRO 3,99€/mois (relation) |
|---|---|
| Dashboard + assemblages illimités | Thread praticien temps réel |
| Semainier complet | Évaluations par repas (👍/⚠️/💡) |
| Batch Cook checklist | Objectifs co-construits praticien |
| Export PDF / copie texte | Historique nutritionnel 12 semaines |
| Partage social images (V1, V2, V3) | Smart suggestions (algo préférences) |
| Streaks + badges (V4) | Multi-profils famille |
| "Roast my diet" (V5) | Sync cloud multi-appareils |
| Partage lien read-only (3 jours sur 7) | Partage complet + commentaires |
| Feedback post-repas | Liste de courses auto-générée |
| | Meal Photo Journal |
| | Mode "Reste du frigo" |

### Protection du paywall
Le lien gratuit ne montre que **les 3 jours les plus récents** de la semaine (ex: si on est jeudi, il montre Mar/Mer/Jeu). Le praticien voit assez pour comprendre la valeur, pas assez pour remplacer le Pro. Les commentaires/évaluations sont la valeur Pro — impossible à imprimer puisque c'est une interaction vivante avec notifications.

### Extension du système de feature flags
Le `FeatureFlag` existant dans `/lib/config/features.ts` doit être étendu :

```typescript
type FeatureFlag =
  | 'SHARE_WITH_DIETITIAN'    // existant
  | 'ADVANCED_REPERTOIRE'     // existant
  | 'WEEKLY_STATS'            // existant
  | 'MULTI_PROFILE'           // existant
  | 'PRACTITIONER_THREAD'     // nouveau
  | 'PRACTITIONER_GOALS'      // nouveau
  | 'SMART_SUGGESTIONS'       // nouveau
  | 'PHOTO_JOURNAL'           // nouveau
  | 'GROCERY_LIST'            // nouveau
  | 'CLOUD_SYNC'              // nouveau
  | 'FRIDGE_MODE'             // nouveau
  | 'FRIEND_COMPARE';         // v2+, spec séparée
```

### Messaging upsell Pro — variantes contextuelles

Le `ProUpsellDialog` doit afficher un message adapté au contexte de déclenchement :

| Trigger | Message |
|---------|---------|
| Partage complet | "Partage ta semaine entière avec ton diététicien" |
| Historique | "Débloque l'historique nutritionnel complet" |
| Commentaires | "Reçois les conseils de ton praticien directement dans l'app" |
| Smart suggestions | "Active les suggestions intelligentes basées sur tes goûts" |
| Générique | "Moins cher qu'un café par semaine — et bien plus utile" |

**Trial** : 7 jours gratuits à l'activation du Pro (via Stripe trial period).

---

## 7. Partage sécurisé & Thread praticien

### Modèle d'accès (v1)
Lien avec token + mot de passe optionnel. Le praticien n'a pas besoin de compte.

```
assembleat.app/share/[token]
```

| | FREE | PRO |
|---|---|---|
| Lien partageable | 3 jours les plus récents | Semaine complète |
| Mot de passe | Oui | Oui |
| Feedbacks plaisir | Non | Oui (😫→🤩 + notes) |
| Commentaires praticien | Non | Thread par repas |
| Évaluations praticien | Non | 👍/⚠️/💡 par assemblage |
| Objectifs co-construits | Non | Oui |
| Durée du lien | 7 jours puis expire | Permanent tant que Pro actif |
| Downgrade Pro→Free | Lien passe à 3 jours visibles, expire après 7j | — |

### Sécurité des liens partagés

- **Mot de passe** : hashé avec **argon2id** (pas bcrypt, plus résistant au GPU cracking)
- **Session praticien** : JWT éphémère émis après vérification du mot de passe, **expire après 1h**, refresh à chaque action. Stocké dans un cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
- **Rate limiting** : max 5 tentatives de mot de passe par token par 15 minutes. Au-delà, blocage temporaire 30 min avec message explicite.
- **Expiration lien** : si le praticien consulte un lien Free qui expire pendant la consultation, afficher un message "Ce lien a expiré" (pas un 404).

### Stratégie praticien active

Le praticien n'est pas un lecteur passif mais un **prescripteur** du Pro :
- **Onboarding praticien** : quand un praticien accède au lien pour la première fois, une bannière l'invite à recommander le Pro à son patient ("Recommandez AssemblEat Pro à vos patients pour un suivi nutritionnel complet")
- **Programme referral** (Phase 3+) : un praticien qui génère 5+ patients Pro reçoit un accès dashboard praticien gratuit avec vue agrégée de tous ses patients
- **Voix praticien** : sur la page partagée, le ton est **professionnel et vouvoie** (distinct du tutoiement de l'app utilisateur)

### Thread praticien (Pro)
Structure par semaine, chaque repas commentable :
- Le praticien voit : assemblage + Nutri-Score + feedback plaisir + note
- 3 actions : 👍 (validé) / ⚠️ (attention) / 💡 (suggestion)
- Commentaire texte max 280 chars
- Le patient reçoit notification push (PWA)
- Historique complet consultable
- **Cascade** : si un lien est supprimé, les commentaires passent en `soft-delete` (flag `deleted_at`), pas de suppression physique. Le patient conserve son historique.

### Objectifs co-construits (Pro)
- Le praticien définit des objectifs textuels ("3 repas légumineuses cette semaine")
- Affichés en bannière sur le dashboard patient
- Compteur automatique en fin de semaine
- Le praticien voit le résultat dans son thread

---

## 8. i18n

Structure existante dans `/lib/i18n/fr.ts`. Extension avec `next-intl`.

| Langue | Phase | Raison |
|--------|-------|--------|
| Français | v1 | Marché cible initial |
| Anglais | v1.1 | Marché global, TikTok anglophone |
| Espagnol | v2 | 3ème marché meal prep |
| Arabe | v2 | Pertinent vu régimes Halal (+ support RTL) |

**Actions i18n Phase 1** :
- Harmoniser toutes les strings hardcodées dans les composants (`AssemblyCard.tsx` "Validé", `BottomNav.tsx` labels, `page.tsx` locale `fr-FR`) pour passer par le système i18n
- Les dates doivent utiliser le locale actif, pas `fr-FR` en dur
- Préparer les propriétés logiques Tailwind (`ms-*`/`me-*`, `border-s-*`) pour le futur support RTL
- Pluralisation via ICU MessageFormat (`next-intl` le supporte nativement)

---

## 9. BDD de recettes — Approche hybride

- Assemblages de base dans le répertoire local (existant)
- Chaque assemblage peut avoir un **lien recette** optionnel (URL TikTok, IG, blog)
- Feature Pro : **"Inspirations"** — feed curated de recettes tagguées par profil CPB
- Les utilisateurs peuvent soumettre leurs assemblages (nom + composants + lien recette) → modération → répertoire communautaire

---

## 10. Features Pro additionnelles

| Feature | Description | Phase |
|---------|-------------|-------|
| Meal Photo Journal | Photo du plat à chaque repas, visible dans thread praticien | Phase 4 |
| Comparaison entre amis | Nécessite spec séparée (couche sociale : friend requests, privacy) | Phase 4+ (spec séparée) |
| Import agenda | Sync Google Calendar, bloquer jours "resto" | Phase 4 |
| Mode "Reste du frigo" | Sélectionner ingrédients dispo → assemblages possibles | Phase 4 |
| Widget iOS/Android | Widget écran d'accueil avec repas du moment | Phase 4 |

---

## 11. Architecture technique

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
| Paiement | Stripe Checkout (hosted) + webhooks (avec vérification `stripe-signature`) |
| PWA | **`@serwist/next`** (remplacement de `next-pwa` abandonné, compatible Turbopack) |
| i18n | next-intl |
| Tests | **vitest + @testing-library/react** |

### Infrastructure VPS OVH

```
VPS OVH (54.38.109.182) — 4 CPU, 7.6 Go RAM, 72 Go disque
├── Traefik (reverse proxy, :80/:443 seuls ports exposés, TLS auto Let's Encrypt)
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
├── Monitoring (Grafana, Loki, Uptime Kuma — existant)
└── Firewall ufw : seuls ports 80/443 ouverts publiquement
```

**Sécurité infra** :
- `ufw` configuré pour bloquer tous les ports sauf 80, 443, et SSH (22)
- Tous les ports Docker internes (Postgres 5432, Kong 8000, Studio 3000) restent sur le réseau Docker interne uniquement
- Firewall vérifié avant chaque déploiement

**Validation RAM** : avant le déploiement de la 2ème instance Supabase, exécuter `docker stats` en charge simulée. Si le budget RAM dépasse 6.5 Go, prévoir un upgrade VPS ou migrer AssemblEat vers Supabase Cloud (tier gratuit). Budget estimé : GérerSCI Supabase (~2 Go) + AssemblEat Supabase (~1.5 Go) + Traefik + monitoring (~0.5 Go) + marge = ~4.5 Go. Faisable avec 7.6 Go.

DNS :
- `assembleat.app` → Vercel (CNAME)
- `api.assembleat.app` → VPS OVH (A record 54.38.109.182)

### Note multi-tenant GoTrue
Une seule instance GoTrue sert tous les micro-SaaS. L'isolation se fait via RLS sur les schemas Postgres. Défense en profondeur :
- Roles Postgres séparés par schema (`assembleat_app` avec `SET search_path = assembleat`)
- Audit RLS systématique + tests d'intrusion cross-schema avant chaque déploiement
- Si un micro-SaaS nécessite une isolation auth complète, instance GoTrue dédiée

### Migration localStorage → Supabase

**Flux de rattachement** :
1. L'utilisateur existant (données localStorage) ouvre l'app après la mise à jour
2. Un écran "Créer un compte pour sauvegarder tes données" apparaît (non bloquant, dismissable)
3. S'il crée un compte : les données localStorage sont uploadées vers Supabase (merge one-way : localStorage → serveur)
4. S'il refuse : l'app continue en mode localStorage (pas de dégradation)
5. En cas de conflit (données serveur + localStorage pour le même user) : les données les plus récentes gagnent (comparaison `updated_at`)
6. Après migration réussie, localStorage est vidé et Supabase devient la source de vérité

### Stratégie offline post-migration

Après migration vers Supabase, le mode offline fonctionne via :
- **Zustand persist** : le store Zustand continue de persister dans localStorage comme cache local
- **Queue de sync** : les writes offline (feedbacks, validations, modifications semainier) sont stockés dans une queue `pendingSync[]` en localStorage
- **Reconciliation** : au retour réseau, la queue est flushed vers Supabase. En cas de conflit, last-write-wins basé sur `updated_at`
- **Pages dégradées** : `/export` (PDF) et `/share` (liens) nécessitent le réseau. Message explicite si offline.

### Stripe webhooks

L'endpoint `/api/webhooks/stripe` :
1. Vérifie la signature via `stripe-signature` header + `STRIPE_WEBHOOK_SECRET` (non négociable)
2. Gère les événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Met à jour `profiles.plan` et `subscriptions.status` en DB
4. En cas de downgrade : met à jour les `shared_links` (expiration 7j, visibilité 3 jours)

### Tables Supabase (schema `assembleat`)

```sql
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
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_key)
);

-- GIN index pour les requêtes Smart Suggestions et historique
CREATE INDEX idx_week_plans_data ON assembleat.week_plans USING GIN (data);

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
  password_hash TEXT, -- argon2id
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ -- NULL = permanent (Pro), set = 7 days (Free)
);

CREATE TABLE assembleat.practitioner_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES assembleat.shared_links(id) ON DELETE SET NULL,
  week_key TEXT NOT NULL,
  assembly_id TEXT NOT NULL,
  reaction TEXT CHECK (reaction IN ('approved', 'warning', 'suggestion')),
  comment TEXT,
  author_name TEXT NOT NULL,
  deleted_at TIMESTAMPTZ, -- soft-delete
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assembleat.practitioner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES assembleat.shared_links(id) ON DELETE SET NULL,
  week_key TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  target_count INT,
  achieved_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assembleat.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES assembleat.profiles(id),
  month TEXT NOT NULL, -- YYYY-MM
  avg_nutri_score FLOAT,
  total_meals INT,
  top_assemblies JSONB,
  dominant_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
```

### Note sur assembly_id
Les `assembly_id` dans `meal_feedbacks` et `practitioner_comments` référencent les IDs définis dans `lib/data/repertoire.ts`. Ces IDs sont stables et conventionnels (ex: `dej-1`, `poulet-dej`). Les feedbacks/commentaires affichent le nom stocké dans `week_plans.data` (JSONB) et non un lookup live sur le répertoire, assurant la cohérence même si le répertoire évolue.

---

## 12. RGPD & Données de santé

### Classification des données
- Les feedbacks plaisir, Nutri-Scores, et assemblages sont des données de **bien-être**, pas des données de santé au sens du RGPD tant qu'elles ne sont pas croisées avec un diagnostic médical
- Le thread praticien pourrait requalifier les données en **données de santé** si le praticien est un professionnel de santé identifié. Évaluation juridique à conduire avant le lancement Pro.

### Mesures mises en place
- Consentement explicite (checkbox) lors de la création de compte : "J'accepte que mes données de repas soient stockées pour personnaliser mon expérience"
- Consentement séparé lors de la création d'un lien partagé : "J'autorise le partage de mes données de repas avec la personne qui recevra ce lien"
- Politique de rétention : les données sont conservées tant que le compte est actif. Suppression sous 30 jours après demande de suppression de compte.
- Export RGPD : bouton "Exporter mes données" dans Settings (JSON)
- Hébergement France (OVH Strasbourg) = données restent en UE

### Évaluation HDS
Si le thread praticien est utilisé dans un cadre de consultation diététique formelle, une évaluation HDS (Hébergement de Données de Santé) sera nécessaire. À documenter avant le lancement Phase 3.

---

## 13. Charte éditoriale

### Voix utilisateur (in-app)
- Tutoiement systématique
- Ton amical, encourageant, jamais culpabilisant
- Emojis autorisés avec parcimonie
- Humour léger dans Roast (jamais sur le poids ou l'apparence)

### Voix praticien (page partagée)
- Vouvoiement
- Ton professionnel, sobre
- Pas d'emojis dans les données cliniques
- Labels factuels ("Assemblage validé", "Score nutritionnel")

---

## 14. Accessibilité (WCAG AA)

- Contraste minimum : remplacer `text-gray-400` par `text-gray-500` sur tous les éléments informatifs (ratio ≥ 4.5:1)
- `aria-label` sur tous les emojis utilisés comme vecteurs d'information
- Focus management : focus automatique sur le premier élément interactif de chaque nouvel écran (onboarding, bottom sheets)
- Tailles de police : minimum 12px pour tout texte informatif (remplacer `text-[10px]` par `text-xs` minimum)
- Instructions PWA iOS adaptées pour VoiceOver

---

## 15. Roadmap par phases

### Phase 1 — MVP Viral (semaines 1-3)
| Feature | Type | Effort |
|---------|------|--------|
| Remplacer `next-pwa` par `@serwist/next` | Infra | S |
| Ajouter vitest + testing-library | Infra | S |
| Fix bug féculents dîner weightG 150→100 | Fix | S |
| Harmoniser strings hardcodées → i18n | Fix | S |
| Fix contraste WCAG (gray-400→gray-500) | Fix | S |
| Onboarding 5 écrans | FREE | M |
| Filtrage diets/allergies dans le moteur | FREE | M |
| Feedback post-repas (😫→🤩) | FREE | S |
| Streaks + badges | FREE | S |
| Traefik + Supabase Docker sur VPS + firewall | Infra | M |
| Auth Supabase (email/Google) + écrans login | Infra | M |
| Migration localStorage → Supabase | Infra | L |

### Phase 2 — Viralité (semaines 3-5)
| Feature | Type | Effort |
|---------|------|--------|
| "What I Eat In A Week" image export | FREE | M |
| Wrapped mensuel (5 slides) | FREE | M |
| Tier List repas | FREE | S |
| "Roast my diet" (100+ templates, garde-fous TCA) | FREE | M |
| i18n anglais | FREE | S |

### Phase 3 — Pro + Stripe (semaines 5-8)
| Feature | Type | Effort |
|---------|------|--------|
| Stripe Checkout + webhooks (signature vérifiée) | PRO | M |
| Partage lien sécurisé (token + argon2id + rate limit) | PRO | M |
| Thread praticien (commentaires + réactions + realtime) | PRO | L |
| Évaluations par repas (👍/⚠️/💡) | PRO | M |
| Objectifs co-construits | PRO | M |
| Historique nutritionnel 12 semaines | PRO | M |
| Onboarding praticien + referral | PRO | M |
| Évaluation RGPD/HDS | Legal | M |

### Phase 4 — Polish (semaine 9+)
| Feature | Type | Effort |
|---------|------|--------|
| Smart suggestions (algo préférences) | PRO | L |
| Notifications push PWA | PRO | M |
| Liste de courses auto-générée | PRO | M |
| Multi-profils famille | PRO | L |
| Meal Photo Journal | PRO | M |
| Mode "Reste du frigo" | PRO | M |
| Import agenda Google Calendar | PRO | M |
| Widget iOS/Android | PRO | M |
| i18n espagnol, arabe (+ RTL) | FREE | M |

---

## Annexe — Corrections issues panels Big4

| Panel | # issues bloquantes | Statut |
|-------|-------------------|--------|
| Technique (McKinsey Digital) | 5 | ✅ Tous corrigés |
| Business (BCG/Bain) | 3 | ✅ Tous corrigés |
| Communication (Accenture Interactive) | 5 | ✅ Tous corrigés |
| Fonctionnel (KPMG/PwC) | 5 | ✅ Tous corrigés |
