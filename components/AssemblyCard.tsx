'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dice5, Check, MessageSquarePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NutriGradeBadge } from '@/components/NutriGradeBadge';
import { FlavorBadge } from '@/components/FlavorBadge';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';
import type { AssemblyRow, MealType, NutriGrade, MealFeedback } from '@/types';
import { calculateSimplicity, isLightDinner } from '@/lib/engine/assemblyEngine';
import { computeAssemblyScore, getProteinGrams } from '@/lib/nutriscore/assemblyScore';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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

const PLEASURE_EMOJIS: Record<number, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '🤩',
};

interface AssemblyCardProps {
  assembly: AssemblyRow | null;
  mealType: MealType;
  onRegenerate?: () => void;
  onValidate?: () => void;
  warnings?: string[];
  existingFeedback?: MealFeedback | null;
  onFeedbackSubmit?: (feedback: MealFeedback) => void;
  today?: string;
}

export function AssemblyCard({
  assembly,
  mealType,
  onRegenerate,
  onValidate,
  warnings,
  existingFeedback,
  onFeedbackSubmit,
  today = new Date().toISOString().split('T')[0],
}: AssemblyCardProps) {
  const t = useTranslations('dashboard');
  const [nutriGrade, setNutriGrade] = useState<NutriGrade | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const mealLabels: Record<MealType, string> = {
    breakfast: t('breakfast'),
    lunch: t('lunch'),
    dinner: t('dinner'),
  };

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

  const handleValidate = useCallback(() => {
    onValidate?.();
    setFeedbackOpen(true);
  }, [onValidate]);

  const handleFeedbackSubmit = useCallback((feedback: MealFeedback) => {
    onFeedbackSubmit?.(feedback);
    setFeedbackOpen(false);
  }, [onFeedbackSubmit]);

  if (!assembly) {
    return (
      <Card className="border-l-4 border-l-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">{mealLabels[mealType]}</span>
          <Button variant="ghost" size="icon" onClick={handleRegenerate} aria-label={t('regenerate')} title={t('regenerate')}>
            <Dice5 size={22} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">{t('noMeal')}</p>
      </Card>
    );
  }

  const simplicity = calculateSimplicity(assembly);
  const lightDinner = isLightDinner(assembly);
  const proteinGrams = getProteinGrams(assembly);
  const components = [assembly.protein, assembly.vegetable, assembly.cereal, assembly.sauce, ...(assembly.extras ?? [])].filter(Boolean);

  return (
    <>
      <Card className={cn('border-l-4 p-4 relative', mealColors[mealType])}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {nutriGrade && <NutriGradeBadge grade={nutriGrade} size="sm" showLabel={false} />}
            {proteinGrams !== null && (
              <span className="text-xs text-muted-foreground" title="Protéines estimées">
                🥩 {proteinGrams}g prot.
              </span>
            )}
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
              className={cn('text-xs text-white', mealBgColors[mealType])}
            >
              {comp!.name}
            </Badge>
          ))}
        </div>

        {/* Bon gras */}
        {assembly.bonGras && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600">
            <span>{assembly.bonGras.emoji}</span>
            <span>{assembly.bonGras.label}</span>
            {assembly.bonGras.weightG && (
              <span className="text-gray-400">({assembly.bonGras.weightG}g)</span>
            )}
          </div>
        )}

        {/* Flavor profile */}
        {assembly.flavorProfile && (
          <div className="mb-3">
            <FlavorBadge profile={assembly.flavorProfile} />
          </div>
        )}

        {/* Light dinner badge */}
        {lightDinner && (
          <Badge className="bg-green-100 text-green-700 text-xs mb-2">
            {t('lightDinner')}
          </Badge>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mb-2 space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <motion.div animate={isSpinning ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 0.5 }}>
            <Button variant="ghost" size="icon" onClick={handleRegenerate} aria-label={t('regenerate')} title={t('regenerate')}>
              <Dice5 size={22} />
            </Button>
          </motion.div>
          {!assembly.validated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleValidate}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              aria-label={t('validate')}
              title={t('validate')}
            >
              <Check size={22} />
            </Button>
          )}
          {assembly.validated && (
            <div className="flex items-center gap-1.5">
              {existingFeedback && (
                <span className="text-lg" title={`Plaisir: ${existingFeedback.pleasure}/5`}>
                  {PLEASURE_EMOJIS[existingFeedback.pleasure]}
                </span>
              )}
              <Badge className="bg-green-100 text-green-700 text-xs">Validé</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFeedbackOpen(true)}
                className="text-gray-500 hover:text-gray-700 h-7 w-7"
                aria-label="Donner un avis"
              >
                <MessageSquarePlus size={15} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <FeedbackSheet
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        assemblyId={assembly.id}
        date={today}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
}
