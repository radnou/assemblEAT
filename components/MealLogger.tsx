'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MealType, ActualMeal } from '@/types';

const QUICK_PILLS = [
  { label: 'Poulet', emoji: '\u{1F357}' },
  { label: 'P\u00e2tes', emoji: '\u{1F35D}' },
  { label: 'Riz', emoji: '\u{1F35A}' },
  { label: 'Salade', emoji: '\u{1F957}' },
  { label: 'Pizza', emoji: '\u{1F355}' },
  { label: 'Sandwich', emoji: '\u{1F96A}' },
  { label: 'Sushi', emoji: '\u{1F363}' },
  { label: '\u0152ufs', emoji: '\u{1F95A}' },
];

interface MealLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  date: string;
  onLog: (meal: ActualMeal) => void;
}

export function MealLogger({ open, onOpenChange, mealType, date, onLog }: MealLoggerProps) {
  const [text, setText] = useState('');
  const [selectedPills, setSelectedPills] = useState<string[]>([]);

  const togglePill = (label: string) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    const description = text.trim() || selectedPills.join(', ') || 'Repas not\u00e9';
    onLog({
      date,
      mealType,
      status: 'different',
      description,
      pills: selectedPills.length > 0 ? selectedPills : undefined,
      loggedAt: new Date().toISOString(),
    });
    toast.success("C'est not\u00e9 !");
    setText('');
    setSelectedPills([]);
    onOpenChange(false);
  };

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Petit-d\u00e9jeuner',
    lunch: 'D\u00e9jeuner',
    dinner: 'D\u00eener',
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="text-center">
          <DrawerTitle>Qu&apos;as-tu mang\u00e9 ?</DrawerTitle>
          <p className="text-sm text-muted-foreground">{mealLabels[mealType]}</p>
        </DrawerHeader>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Tape ici... (ex: pizza)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg opacity-50 hover:opacity-100"
              aria-label="Ajouter une photo"
            >
              {'\u{1F4F8}'}
            </button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Ou tap rapide :</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PILLS.map(({ label, emoji }) => (
                <button
                  key={label}
                  onClick={() => togglePill(label)}
                  className={`px-3 h-9 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                    selectedPills.includes(label)
                      ? 'bg-green-100 ring-2 ring-green-500 font-medium'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-semibold"
            disabled={!text.trim() && selectedPills.length === 0}
          >
            C&apos;est not\u00e9
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
