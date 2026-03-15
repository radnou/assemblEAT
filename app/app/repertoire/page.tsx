'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import {
  getCustomAssemblies,
  saveCustomAssembly,
  deleteCustomAssembly,
} from '@/lib/engine/customRepertoire';
import {
  breakfastAssemblies,
  lunchAssemblies,
  dinnerAssemblies,
} from '@/lib/data/repertoire';
import type { AssemblyRow, MealType, MealComponent } from '@/types';
import { useTranslations } from 'next-intl';

// ─── Component selectors ─────────────────────────────────────────────────────

// Collect all unique components from built-in assemblies for the form selectors
function collectComponents(
  assemblies: AssemblyRow[],
  field: 'protein' | 'vegetable' | 'cereal' | 'sauce'
): MealComponent[] {
  const seen = new Set<string>();
  const result: MealComponent[] = [];
  for (const a of assemblies) {
    const comp = a[field];
    if (comp && !seen.has(comp.id)) {
      seen.add(comp.id);
      result.push(comp);
    }
  }
  return result;
}

const allAssemblies = [...breakfastAssemblies, ...lunchAssemblies, ...dinnerAssemblies];
const allProteins = collectComponents(allAssemblies, 'protein');
const allVegetables = collectComponents(allAssemblies, 'vegetable');
const allCereals = collectComponents(allAssemblies, 'cereal');
const allSauces = collectComponents(allAssemblies, 'sauce');

// ─── Meal type label ──────────────────────────────────────────────────────────

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Petit-déjeuner',
  lunch: '☀️ Déjeuner',
  dinner: '🌙 Dîner',
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: 'border-l-[var(--color-meal-breakfast)]',
  lunch: 'border-l-[var(--color-meal-lunch)]',
  dinner: 'border-l-[var(--color-meal-dinner)]',
};

// ─── Mini assembly card ───────────────────────────────────────────────────────

function AssemblyMiniCard({
  assembly,
  onDelete,
  isCustom,
}: {
  assembly: AssemblyRow;
  onDelete?: (id: string) => void;
  isCustom?: boolean;
}) {
  const components = [
    assembly.protein?.name,
    assembly.vegetable?.name,
    assembly.cereal?.name,
    assembly.sauce?.name,
  ].filter(Boolean);

  return (
    <Card className={`p-3 border-l-4 ${MEAL_COLORS[assembly.mealType]} relative`}>
      {isCustom && (
        <Badge className="absolute top-2 right-2 text-[10px] bg-orange-100 text-orange-700 border-0">
          Custom
        </Badge>
      )}
      <p className="text-xs font-semibold text-gray-700 pr-12 truncate">
        {components[0] ?? '—'}{components[1] ? ` + ${components[1]}` : ''}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
        {components.slice(2).filter(Boolean).join(' · ')}
      </p>
      {isCustom && onDelete && (
        <button
          onClick={() => onDelete(assembly.id)}
          className="absolute bottom-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={13} />
        </button>
      )}
    </Card>
  );
}

// ─── New custom assembly form ─────────────────────────────────────────────────

interface FormState {
  mealType: MealType;
  proteinId: string;
  vegetableId: string;
  cerealId: string;
  sauceId: string;
}

const DEFAULT_FORM: FormState = {
  mealType: 'lunch',
  proteinId: '',
  vegetableId: '',
  cerealId: '',
  sauceId: '',
};

function CustomAssemblyForm({ onSave, onCancel }: { onSave: (a: AssemblyRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const findComponent = useCallback(
    (list: MealComponent[], id: string): MealComponent | null =>
      list.find((c) => c.id === id) ?? null,
    []
  );

  const handleSubmit = () => {
    const protein = findComponent(allProteins, form.proteinId);
    const vegetable = findComponent(allVegetables, form.vegetableId);
    const cereal = form.cerealId ? findComponent(allCereals, form.cerealId) : null;
    const sauce = form.sauceId ? findComponent(allSauces, form.sauceId) : null;

    if (!protein && !vegetable) return; // at least one component required

    const assembly: AssemblyRow = {
      id: `custom-${Date.now()}`,
      mealType: form.mealType,
      protein,
      vegetable,
      cereal,
      sauce,
    };
    onSave(assembly);
  };

  return (
    <div className="space-y-4">
      {/* Meal type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Type de repas</label>
        <div className="flex gap-2">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mt) => (
            <button
              key={mt}
              onClick={() => setForm((f) => ({ ...f, mealType: mt }))}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${
                form.mealType === mt
                  ? 'bg-[var(--color-cta)] text-white border-[var(--color-cta)]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {MEAL_LABELS[mt].split(' ')[0]} {mt === 'breakfast' ? 'Petit-déj' : mt === 'lunch' ? 'Déjeuner' : 'Dîner'}
            </button>
          ))}
        </div>
      </div>

      {/* Protein */}
      <SelectField
        label="Protéine"
        value={form.proteinId}
        onChange={(v) => setForm((f) => ({ ...f, proteinId: v }))}
        options={allProteins}
        placeholder="Choisir une protéine"
      />

      {/* Vegetable */}
      <SelectField
        label="Légume"
        value={form.vegetableId}
        onChange={(v) => setForm((f) => ({ ...f, vegetableId: v }))}
        options={allVegetables}
        placeholder="Choisir un légume"
      />

      {/* Cereal (optional) */}
      <SelectField
        label="Féculent (optionnel)"
        value={form.cerealId}
        onChange={(v) => setForm((f) => ({ ...f, cerealId: v }))}
        options={allCereals}
        placeholder="Aucun féculent"
        optional
      />

      {/* Sauce (optional) */}
      <SelectField
        label="Sauce (optionnel)"
        value={form.sauceId}
        onChange={(v) => setForm((f) => ({ ...f, sauceId: v }))}
        options={allSauces}
        placeholder="Aucune sauce"
        optional
      />

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          className="flex-1 bg-[var(--color-cta)] text-white hover:opacity-90"
          onClick={handleSubmit}
          disabled={!form.proteinId && !form.vegetableId}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: MealComponent[];
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RepertoirePage() {
  const t = useTranslations('repertoire');
  const { plan } = useSubscriptionStore();
  const isPro = plan === 'pro';

  const [customAssemblies, setCustomAssemblies] = useState<AssemblyRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  useEffect(() => {
    setCustomAssemblies(getCustomAssemblies());
  }, []);

  const handleSave = useCallback((assembly: AssemblyRow) => {
    saveCustomAssembly(assembly);
    setCustomAssemblies(getCustomAssemblies());
    setFormOpen(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteCustomAssembly(id);
    setCustomAssemblies(getCustomAssemblies());
  }, []);

  const builtInByType: Record<MealType, AssemblyRow[]> = {
    breakfast: breakfastAssemblies,
    lunch: lunchAssemblies,
    dinner: dinnerAssemblies,
  };

  const customByType: Record<MealType, AssemblyRow[]> = {
    breakfast: customAssemblies.filter((a) => a.mealType === 'breakfast'),
    lunch: customAssemblies.filter((a) => a.mealType === 'lunch'),
    dinner: customAssemblies.filter((a) => a.mealType === 'dinner'),
  };

  return (
    <div className="py-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[var(--color-cta)]" />
          <h1 className="text-xl font-semibold">{t('title')}</h1>
        </div>
        <Button
          size="sm"
          className="flex items-center gap-1.5 bg-[var(--color-cta)] text-white hover:opacity-90"
          onClick={() => {
            if (!isPro) {
              setProOpen(true);
            } else {
              setFormOpen(true);
            }
          }}
        >
          <Plus size={15} />
          {t('addCustom')}
          {!isPro && <span className="ml-1 text-[10px] opacity-80">Pro</span>}
        </Button>
      </div>

      {/* Sections by meal type */}
      {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
        const allForType = [
          ...builtInByType[mealType],
          ...customByType[mealType],
        ];
        return (
          <section key={mealType} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {MEAL_LABELS[mealType]}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allForType.map((assembly) => {
                const isCustom = assembly.id.startsWith('custom-');
                return (
                  <AssemblyMiniCard
                    key={assembly.id}
                    assembly={assembly}
                    isCustom={isCustom}
                    onDelete={isCustom ? handleDelete : undefined}
                  />
                );
              })}
              {isPro && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 py-6 text-gray-300 hover:border-[var(--color-cta)] hover:text-[var(--color-cta)] transition-colors"
                >
                  <Plus size={20} />
                  <span className="text-xs">Ajouter</span>
                </button>
              )}
            </div>
          </section>
        );
      })}

      {/* Custom assembly form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('newCustomAssembly')}</DialogTitle>
          </DialogHeader>
          <CustomAssemblyForm
            onSave={handleSave}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Pro upsell dialog */}
      <ProUpsellDialog
        open={proOpen}
        onOpenChange={setProOpen}
        feature="ADVANCED_REPERTOIRE"
      />
    </div>
  );
}
