'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Refrigerator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import {
  getAllIngredients,
  findMatchingAssemblies,
  findPartialMatches,
} from '@/lib/engine/fridgeEngine';
import type { AssemblyRow, ComponentCategory, MealComponent } from '@/types';
import { useTranslations } from 'next-intl';

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORY_ORDER: ComponentCategory[] = ['protein', 'vegetable', 'cereal', 'sauce'];

const CATEGORY_LABELS: Partial<Record<ComponentCategory, string>> = {
  protein: 'fridge.proteins',
  vegetable: 'fridge.vegetables',
  cereal: 'fridge.cereals',
  sauce: 'fridge.sauces',
};

const CATEGORY_EMOJIS: Partial<Record<ComponentCategory, string>> = {
  protein: '🥩',
  vegetable: '🥦',
  cereal: '🌾',
  sauce: '🫙',
};

// ─── Meal-type labels ────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

// ─── Small fridge assembly card ──────────────────────────────────────────────

function FridgeAssemblyCard({
  assembly,
  missingNames,
}: {
  assembly: AssemblyRow;
  missingNames?: string[];
}) {
  const components: { label: string; comp: MealComponent | null | undefined }[] = [
    { label: 'P', comp: assembly.protein },
    { label: 'L', comp: assembly.vegetable },
    { label: 'F', comp: assembly.cereal },
    { label: 'S', comp: assembly.sauce },
  ];

  const hasMissing = missingNames && missingNames.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl border px-4 py-3 space-y-2 ${
        hasMissing ? 'border-amber-200' : 'border-green-200'
      }`}
    >
      {/* Meal type pill + flavor */}
      <div className="flex items-center gap-2">
        <span className="text-base">{MEAL_TYPE_LABELS[assembly.mealType] ?? '🍽️'}</span>
        {assembly.flavorProfile && (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {assembly.flavorProfile}
          </Badge>
        )}
        {hasMissing && (
          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0 ml-auto">
            Il manque 1
          </Badge>
        )}
      </div>

      {/* Component chips */}
      <div className="flex flex-wrap gap-1.5">
        {components.map(({ comp }) => {
          if (!comp) return null;
          const isMissing = missingNames?.includes(comp.name);
          return (
            <span
              key={comp.id}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMissing
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isMissing && '⚠️ '}
              {comp.name}
            </span>
          );
        })}
        {(assembly.extras ?? []).map((extra) => {
          const isMissing = missingNames?.includes(extra.name);
          return (
            <span
              key={extra.id}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMissing
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              {isMissing && '⚠️ '}
              {extra.name}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Ingredient chip ─────────────────────────────────────────────────────────

function IngredientChip({
  ingredient,
  selected,
  onToggle,
}: {
  ingredient: MealComponent;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(ingredient.id)}
      className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all select-none ${
        selected
          ? 'bg-[var(--color-cta)] border-[var(--color-cta)] text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
      }`}
    >
      {ingredient.name}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FridgePage() {
  const t = useTranslations();
  const { plan } = useSubscriptionStore();
  const [proDialogOpen, setProDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group all ingredients by category (only the 4 main ones)
  const groupedIngredients = useMemo(() => {
    const all = getAllIngredients();
    const groups: Partial<Record<ComponentCategory, MealComponent[]>> = {};
    for (const cat of CATEGORY_ORDER) {
      const items = all.filter((c) => c.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, []);

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearAll = () => setSelectedIds(new Set());

  const selectedArray = Array.from(selectedIds);
  const exactMatches = useMemo(
    () => findMatchingAssemblies(selectedArray),
    [selectedArray],
  );
  const partialMatches = useMemo(
    () => findPartialMatches(selectedArray, 1),
    [selectedArray],
  );

  // ── Pro upsell gate ─────────────────────────────────────────────────────────
  if (plan === 'free') {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Refrigerator size={24} className="text-cyan-500" />
          <div>
            <h1 className="text-xl font-semibold">{t('fridge.title')}</h1>
            <p className="text-sm text-gray-500">{t('fridge.subtitle')}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 p-6 text-center space-y-4">
          <div className="text-4xl">🧊</div>
          <div>
            <p className="font-semibold text-gray-800">{t('fridge.upsellTitle')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('fridge.upsellDescription')}</p>
          </div>
          <Button
            onClick={() => setProDialogOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white border-0 font-semibold"
          >
            🔒 {t('fridge.unlock')}
          </Button>
        </div>

        <ProUpsellDialog
          open={proDialogOpen}
          onOpenChange={setProDialogOpen}
          feature="FRIDGE_MODE"
        />
      </div>
    );
  }

  // ── Pro view ─────────────────────────────────────────────────────────────────
  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Refrigerator size={24} className="text-cyan-500" />
          <div>
            <h1 className="text-xl font-semibold">{t('fridge.title')}</h1>
            <p className="text-sm text-gray-500">{t('fridge.subtitle')}</p>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {t('fridge.clearAll')}
          </button>
        )}
      </div>

      {/* Selection counter */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            key="counter"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Badge className="bg-[var(--color-cta)] text-white border-0">
              {selectedIds.size} {t('fridge.selectedCount')}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingredient grid by category */}
      <div className="space-y-5">
        {CATEGORY_ORDER.map((cat) => {
          const items = groupedIngredients[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <span>{CATEGORY_EMOJIS[cat]}</span>
                <span>{t(CATEGORY_LABELS[cat]!)}</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {items.map((ingredient) => (
                  <IngredientChip
                    key={ingredient.id}
                    ingredient={ingredient}
                    selected={selectedIds.has(ingredient.id)}
                    onToggle={toggleIngredient}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty selection state */}
      {selectedIds.size === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🧊</div>
          <p className="text-sm">{t('fridge.emptySelection')}</p>
        </div>
      )}

      {/* Results — exact matches */}
      {selectedIds.size > 0 && (
        <div className="space-y-4">
          {/* Exact matches */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              ✅ {t('fridge.exactMatches')}
              {exactMatches.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {exactMatches.length}
                </Badge>
              )}
            </h2>
            {exactMatches.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{t('fridge.noExactMatch')}</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {exactMatches.map((assembly) => (
                    <FridgeAssemblyCard key={assembly.id} assembly={assembly} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Partial matches — missing 1 ingredient */}
          {partialMatches.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                ⚠️ {t('fridge.almostMatches')}
                <Badge variant="secondary" className="text-xs">
                  {partialMatches.length}
                </Badge>
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {partialMatches.map(({ assembly, missing }) => (
                    <FridgeAssemblyCard
                      key={assembly.id}
                      assembly={assembly}
                      missingNames={missing}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
