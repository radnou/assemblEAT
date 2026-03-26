# assemblEAT — Pivot "Journal First"

## Raison d'être

> Un journal alimentaire beau et rapide, qui me suggère des repas équilibrés et me montre l'écart entre ce que je prévois et ce que je mange vraiment. Partageable avec ma diététicienne en un lien.

**Origine** : prescription diététicienne → besoin de journaliser → MyFitnessPal trop lourd → assemblEAT
**Modèle** : B2C pur, 3.99€/mois Pro, le patient paie pour lui-même
**Stack** : Next.js 16, React 19, Clerk, Supabase, Zustand, Tailwind/shadcn

---

## 1. Le shift fondamental

| | Avant (Planificateur First) | Après (Journal First) |
|---|---|---|
| Acte principal | L'app génère un repas | L'utilisateur note ce qu'il a mangé |
| Carte repas | "Voici ce que tu devrais manger" | "Suggestion + qu'as-tu mangé ?" |
| Bouton principal | "✅ Valider" (confirmer le plan) | "✅ Mangé" (noter dans le journal) |
| Données | Prévu uniquement | Prévu + Réel + Écart |
| Valeur pour la diét | Voir le plan | Voir prévu vs réel |

**Ce qui ne change pas** : l'app continue de SUGGÉRER des repas (assemblages Nutri-Score). Mais la suggestion passe de "directive" à "support". Le journal est le coeur.

---

## 2. Flow quotidien — Les 3 actions

Chaque carte repas du dashboard affiche la suggestion ET propose 3 actions après le repas :

### Action 1 : "✅ Mangé" (1 tap)
- Confirme la suggestion comme repas réel
- Optionnel : note de plaisir (1-5) inline après confirmation
- Le repas est marqué comme "réel = prévu"

### Action 2 : "✏️ Autre chose" (3-10 secondes)
- Ouvre un `Drawer` (bottom sheet shadcn) avec :

```
┌──────────────────────────────────┐
│        Qu'as-tu mangé ?          │
│ ┌──────────────────────────┐ 📸  │
│ │ Tape ici... (ex: pizza)  │     │
│ └──────────────────────────┘     │
│ Ou tap rapide :                  │
│ [🍗Poulet] [🍝Pâtes] [🍚Riz]    │
│ [🥗Salade] [🍕Pizza] [🥪Sandwich]│
│ [🍣Sushi]  [🥚Œufs] [+ Autre]   │
│       ┌──────────────────┐       │
│       │   ✅ C'est noté   │       │
│       └──────────────────┘       │
└──────────────────────────────────┘
```

**Principes du formulaire :**
- Texte libre = héros (en haut, focus auto)
- Grille plate de 8 pills hardcodées (pas de catégories protéine/légume/féculent)
- Photo = icône inline à droite du champ texte (pas un bloc dédié)
- Pas de quantités obligatoires
- Pas de Nutri-Score obligatoire sur le "autre chose" (bonus silencieux si composants reconnus)
- Tout visible sans scroll sur 375px (~300px de hauteur)
- Micro-victoire après validation : toast sonner "✅ C'est noté !" + compteur repas semaine

**Pills MVP (8 hardcodées)** : Poulet, Pâtes, Riz, Salade, Pizza, Sandwich, Sushi, Œufs

**Évolutions futures (pas dans ce spec)** :
- Autocomplétion basée sur historique
- Pills personnalisées (top 8 de l'utilisateur)
- Pré-remplissage intelligent ("Sandwich comme d'habitude ?")
- Reconnaissance photo IA

### Action 3 : "⏭️ Sauté"
- Note que le repas a été sauté
- 1 tap, pas de formulaire

---

## 3. Carte repas — Nouvelle structure

```
┌─────────────────────────────────┐
│ 🍽️ Déjeuner suggéré        B   │
│ 🥩 Poulet · 🥦 Brocoli · 🌾 Riz│
│ 🫒 Huile d'olive · 🥩 32g prot.│
│                                 │
│ [✅ Mangé] [✏️ Autre chose]     │
│         ⏭️ Sauté                │
└─────────────────────────────────┘
```

**Après journalisation (si réel ≠ prévu) :**

```
┌─────────────────────────────────┐
│ 🍽️ Déjeuner                    │
│ Suggéré : Poulet+Brocoli+Riz B │
│ Mangé : Pizza               D  │ ⚠️
│                                 │
│ ✅ Noté à 13h15                 │
└─────────────────────────────────┘
```

**Après journalisation (si réel = prévu) :**

```
┌─────────────────────────────────┐
│ 🍽️ Déjeuner               ✅ B │
│ 🥩 Poulet · 🥦 Brocoli · 🌾 Riz│
│                                 │
│ ✅ Noté à 13h15                 │
└─────────────────────────────────┘
```

---

## 4. Bilan prévu vs réel

### Bilan du jour (visible en fin de journée)

```
📊 Prévu vs Réel — Mercredi

☀️ Petit-déj
  Prévu: Œufs + Pain complet  A
  Réel:  Céréales + Lait      C   ⚠️ -2

🍽️ Déjeuner
  Prévu: Poulet + Brocoli     A
  Réel:  ✅ Identique          A

🌙 Dîner
  Prévu: Saumon + Salade      B
  Réel:  Pizza                 D   ⚠️ -2

Score jour: Prévu B+ → Réel C
```

### Bilan hebdomadaire

- Taux de conformité : "Tu as suivi tes suggestions X% du temps"
- Score moyen prévu vs score moyen réel
- Repas les plus souvent modifiés
- Pattern insight : "Tu dévies surtout le soir" (si les dîners réels sont systématiquement < prévu)

Le bilan hebdo apparaît le weekend (samedi/dimanche matin), comme actuellement.

---

## 5. Lien de partage enrichi

Le lien `/share/[data]` affiche maintenant prévu ET réel :

```
Plan de Radnouane — Semaine 12
Indice d'équilibre : Prévu B+ → Réel C

│ Jour/Repas  │ Prévu              │ Réel               │
│─────────────│────────────────────│────────────────────│
│ Lun déj     │ Poulet+Brocoli  A │ Poulet+Brocoli  A │ ✅
│ Lun dîn     │ Saumon+Salade   B │ Pizza            D │ ⚠️
│ Mar déj     │ Bœuf+Haricots   B │ ⏭️ Sauté          │
│ ...         │                    │                    │

Conformité : 60% · 12 repas notés · 3 sauts

[🚀 Essayer assemblEAT gratuitement]
```

**Encodage** : le payload base64 du share ajoute un champ `actual` (array de repas réels) au `SharePayload` existant.

---

## 6. Modèle de données — Ajouts

### Nouveau type : `ActualMeal`

```typescript
interface ActualMeal {
  date: string;          // YYYY-MM-DD
  mealType: MealType;    // breakfast | lunch | dinner
  status: 'confirmed' | 'different' | 'skipped';
  description?: string;  // texte libre si "autre chose"
  pills?: string[];      // pills sélectionnées si "autre chose"
  photoUrl?: string;     // URL locale si photo ajoutée (v2)
  loggedAt: string;      // ISO timestamp
}
```

### Store : `useMealStore` — Ajouts

```typescript
// Nouveau state
actualMeals: ActualMeal[];

// Nouvelles actions
logMeal: (meal: ActualMeal) => void;
getActualMeal: (date: string, mealType: MealType) => ActualMeal | null;
getDayComparison: (date: string) => { planned: AssemblyRow | null, actual: ActualMeal | null }[];
getWeekConformity: (weekKey: string) => { rate: number, logged: number, skipped: number };
```

### Persistence layer — Ajouts

```typescript
interface PersistenceLayer {
  // existant...

  // NOUVEAU
  saveActualMeal(meal: ActualMeal): Promise<void>;
  getActualMeals(dateFrom: string, dateTo: string): Promise<ActualMeal[]>;
}
```

- localStorage : clé `actual-meals` (array JSON)
- Supabase : table `assembleat.actual_meals` (user_id, date, meal_type, status, description, pills, logged_at)

---

## 7. Hiérarchie des features

```
COEUR (acte quotidien)
├── 📝 Journal (mangé / autre chose / sauté)         ← NOUVEAU
├── 💡 Suggestions (assemblages Nutri-Score)           ← existant, support
└── 📊 Comparaison prévu vs réel                      ← NOUVEAU

ENGAGEMENT (raisons de revenir)
├── 🔥 Roast hebdomadaire (opt-in)
├── 🎯 Défi hebdomadaire
├── 📈 Indice d'équilibre hebdo (free)
├── 🥬 Compteur fruits/légumes
└── 🏆 Tier list

PARTAGE (boucle virale)
├── 🔗 Lien diét (prévu vs réel)
├── 📤 Roast public partageable
├── 📊 Wrapped mensuel
└── 🔍 50 pages SEO Nutri-Score

OUTILS (Pro 3.99€/mois)
├── 🛒 Liste de courses
├── 📚 Répertoire avancé
├── 📈 Historique 12 semaines
└── 🤖 Smart suggestions
```

---

## 8. Ce qui ne change PAS

- Bottom nav (4 items : Accueil, Semainier, Préparer, Réglages)
- Onboarding 4 étapes + avatar combiné
- Auth Clerk (Google, email)
- Disclaimer médical
- Interface contextuelle (heure, saison, guide progressif, coaching objectif)
- Barèmes Nutri-Score (général, boissons, graisses)
- Bon gras, compteur fruits/légumes
- i18n FR/EN/DE
- Sprint Growth (roast public, SEO, défis, wrapped)
- Settings 9 sections

---

## 9. Composants à créer/modifier

### Nouveaux fichiers

| Fichier | Rôle |
|---------|------|
| `components/MealLogger.tsx` | Drawer bottom sheet "Qu'as-tu mangé ?" (input texte + 8 pills + photo icon + validation) |
| `components/DayComparison.tsx` | Carte bilan prévu vs réel du jour |
| `components/WeekComparison.tsx` | Bilan hebdo avec taux de conformité et patterns |

### Fichiers à modifier

| Fichier | Changement |
|---------|------------|
| `app/app/page.tsx` | Carte repas : remplacer "Valider" par "Mangé / Autre / Sauté". Ajouter bilan jour. |
| `lib/store/useMealStore.ts` | Ajouter `actualMeals`, `logMeal()`, `getActualMeal()`, `getDayComparison()`, `getWeekConformity()` |
| `lib/store/persistence.ts` | Ajouter `saveActualMeal()`, `getActualMeals()` aux deux implémentations |
| `types/index.ts` | Ajouter `ActualMeal` type |
| `app/share/[data]/page.tsx` | Afficher colonne prévu + réel |
| `lib/share/shareEngine.ts` | Ajouter `actual` au payload |
| `components/AssemblyCard.tsx` | Afficher état journalisé (réel vs prévu) après notation |

---

## 10. Plan d'exécution

### Phase 1 : Types + Store (faible risque)
1. Ajouter `ActualMeal` type
2. Ajouter state et actions au store
3. Ajouter méthodes à la persistence layer (localStorage)

### Phase 2 : MealLogger component (moyen risque)
1. Créer le Drawer avec input texte + 8 pills
2. Intégrer dans les cartes repas du dashboard
3. Remplacer "Valider" par "Mangé / Autre / Sauté"
4. Toast "C'est noté !" + compteur repas

### Phase 3 : Comparaison prévu vs réel (moyen risque)
1. Créer DayComparison component
2. Créer WeekComparison component
3. Intégrer dans le dashboard (bilan jour en fin de journée, bilan hebdo le weekend)

### Phase 4 : Partage enrichi (faible risque)
1. Mettre à jour SharePayload avec données réelles
2. Mettre à jour la page /share avec vue prévu vs réel

---

## 11. Critères de succès

- [ ] L'utilisateur peut noter un repas en moins de 5 secondes (1 tap "Mangé" ou 3 taps "Autre chose")
- [ ] Le Drawer "Qu'as-tu mangé ?" affiche tout sans scroll sur 375px
- [ ] La carte repas montre prévu vs réel après journalisation
- [ ] Le bilan du jour compare les 3 repas (prévu vs réel avec écart)
- [ ] Le bilan hebdo affiche le taux de conformité
- [ ] Le lien de partage montre les colonnes prévu et réel
- [ ] Les repas "autre chose" en texte libre sont enregistrés sans Nutri-Score (c'est OK)
- [ ] Les repas "sauté" sont comptabilisés dans le bilan
- [ ] Toute l'infrastructure existante continue de fonctionner (suggestions, roast, défis, etc.)
