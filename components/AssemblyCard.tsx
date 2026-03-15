'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dice5, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NutriGradeBadge } from '@/components/NutriGradeBadge';
import { FlavorBadge } from '@/components/FlavorBadge';
import type { AssemblyRow, MealType, NutriGrade } from '@/types';
import { calculateSimplicity, isLightDinner } from '@/lib/engine/assemblyEngine';
import { computeAssemblyScore } from '@/lib/nutriscore/assemblyScore';
import { cn } from '@/lib/utils';
import { fr } from '@/lib/i18n/fr';

const mealColors: Record<MealType, string> = {
  breakfast: 'border-l-[var(--color-meal-breakfast)]',
  lunch: 'border-l-[var(--color-meal-lunch)]',
  dinner: 'border-l-[var(--color-meal-dinner)]',
};

const mealBgColors: Record<MealType, string> = {
  breakfast: 'bg-[var(--color-meal-breakfast)]',
  lunch: 'bg-[var(--color-meal-lunch)]',
  dinner: 'bg-[var(--color-meal-dinner)]',
};

const mealLabels: Record<MealType, string> = {
  breakfast: fr.dashboard.breakfast,
  lunch: fr.dashboard.lunch,
  dinner: fr.dashboard.dinner,
};

interface AssemblyCardProps {
  assembly: AssemblyRow | null;
  mealType: MealType;
  onRegenerate?: () => void;
  onValidate?: () => void;
  warnings?: string[];
}

export function AssemblyCard({ assembly, mealType, onRegenerate, onValidate, warnings }: AssemblyCardProps) {
  const [nutriGrade, setNutriGrade] = useState<NutriGrade | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!assembly) {
      setNutriGrade(null);
      return;
    }
    let cancelled = false;
    computeAssemblyScore(assembly).then((result) => {
      if (!cancelled) setNutriGrade(result.grade);
    });
    return () => { cancelled = true; };
  }, [assembly]);

  const handleRegenerate = useCallback(() => {
    setIsSpinning(true);
    onRegenerate?.();
    setTimeout(() => setIsSpinning(false), 600);
  }, [onRegenerate]);

  if (!assembly) {
    return (
      <Card className="border-l-4 border-l-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-400">{mealLabels[mealType]}</span>
          <Button variant="ghost" size="icon" onClick={handleRegenerate} aria-label={fr.dashboard.regenerate}>
            <Dice5 size={18} />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{fr.dashboard.noMeal}</p>
      </Card>
    );
  }

  const simplicity = calculateSimplicity(assembly);
  const lightDinner = isLightDinner(assembly);
  const components = [assembly.protein, assembly.vegetable, assembly.cereal, assembly.sauce, ...(assembly.extras ?? [])].filter(Boolean);

  return (
    <Card className={cn('border-l-4 p-4 relative', mealColors[mealType])}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {nutriGrade && <NutriGradeBadge grade={nutriGrade} size="sm" showLabel={false} />}
          <span className="text-sm font-semibold">{mealLabels[mealType]}</span>
        </div>
        <span className="text-xs text-gray-500">{simplicity}</span>
      </div>

      {/* Components as pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {components.map((comp) => (
          <Badge
            key={comp!.id}
            variant="secondary"
            className={cn('text-[11px] text-white', mealBgColors[mealType])}
          >
            {comp!.name}
          </Badge>
        ))}
      </div>

      {/* Flavor profile */}
      {assembly.flavorProfile && (
        <div className="mb-3">
          <FlavorBadge profile={assembly.flavorProfile} />
        </div>
      )}

      {/* Light dinner badge */}
      {lightDinner && (
        <Badge className="bg-green-100 text-green-700 text-[10px] mb-2">
          {fr.dashboard.lightDinner}
        </Badge>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-2 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-orange-600 bg-orange-50 rounded px-2 py-1">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <motion.div animate={isSpinning ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 0.5 }}>
          <Button variant="ghost" size="icon" onClick={handleRegenerate} aria-label={fr.dashboard.regenerate}>
            <Dice5 size={18} />
          </Button>
        </motion.div>
        {!assembly.validated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onValidate}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            aria-label={fr.dashboard.validate}
          >
            <Check size={18} />
          </Button>
        )}
        {assembly.validated && (
          <Badge className="bg-green-100 text-green-700 text-[10px]">Validé</Badge>
        )}
      </div>
    </Card>
  );
}
