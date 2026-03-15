'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { DayPlan, AssemblyRow, MealType } from '@/types';
import { NutriGradeBadge } from '@/components/NutriGradeBadge';
import { fr } from '@/lib/i18n/fr';

const mealColors: Record<MealType, string> = {
  breakfast: 'bg-[var(--color-meal-breakfast)]',
  lunch: 'bg-[var(--color-meal-lunch)]',
  dinner: 'bg-[var(--color-meal-dinner)]',
};

function MealCell({ assembly, mealType }: { assembly: AssemblyRow | null; mealType: MealType }) {
  if (!assembly) {
    return <div className="h-12 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs">—</div>;
  }

  const components = [assembly.protein, assembly.vegetable, assembly.cereal].filter(Boolean);

  return (
    <div className="rounded border border-gray-100 p-1.5 space-y-1">
      <div className="flex flex-wrap gap-0.5">
        {components.map((c) => (
          <span key={c!.id} className={`text-[9px] text-white px-1 py-0.5 rounded ${mealColors[mealType]}`}>
            {c!.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DayColumnProps {
  dayName: string;
  date: Date;
  dayPlan: DayPlan;
  onGenerate: () => void;
  onUpdatePlan: (plan: DayPlan) => void;
}

export function DayColumn({ dayName, date, dayPlan, onGenerate, onUpdatePlan }: DayColumnProps) {
  const [editOpen, setEditOpen] = useState(false);
  const isToday = new Date().toDateString() === date.toDateString();
  const hasMeals = dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner;

  return (
    <>
      <div
        className={`flex-1 min-w-[90px] rounded-lg border p-2 space-y-1.5 cursor-pointer transition-colors hover:bg-gray-50 ${isToday ? 'ring-2 ring-[var(--color-cta)] bg-orange-50/30' : ''}`}
        onClick={() => setEditOpen(true)}
      >
        <div className="text-center">
          <p className={`text-xs font-semibold ${isToday ? 'text-[var(--color-cta)]' : 'text-gray-600'}`}>{dayName}</p>
          <p className="text-[10px] text-gray-400">{date.getDate()}/{date.getMonth() + 1}</p>
        </div>

        {hasMeals ? (
          <div className="space-y-1">
            <MealCell assembly={dayPlan.breakfast} mealType="breakfast" />
            <MealCell assembly={dayPlan.lunch} mealType="lunch" />
            <MealCell assembly={dayPlan.dinner} mealType="dinner" />
            {dayPlan.physicalActivity && (
              <p className="text-[9px] text-gray-500 truncate">{dayPlan.physicalActivity}</p>
            )}
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full text-[10px] h-7" onClick={(e) => { e.stopPropagation(); onGenerate(); }}>
            <Plus size={12} className="mr-1" />
            Générer
          </Button>
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{dayName} {date.getDate()}/{date.getMonth() + 1}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
              const assembly = dayPlan[mealType];
              const label = mealType === 'breakfast' ? fr.dashboard.breakfast : mealType === 'lunch' ? fr.dashboard.lunch : fr.dashboard.dinner;
              return (
                <div key={mealType} className="space-y-1">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  {assembly ? (
                    <div className="flex flex-wrap gap-1">
                      {[assembly.protein, assembly.vegetable, assembly.cereal, assembly.sauce].filter(Boolean).map((c) => (
                        <Badge key={c!.id} variant="secondary" className="text-xs">{c!.name}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Non planifié</p>
                  )}
                </div>
              );
            })}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{fr.weekPlanner.physicalActivity}</h3>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={dayPlan.physicalActivity ?? ''}
                onChange={(e) => onUpdatePlan({ ...dayPlan, physicalActivity: e.target.value })}
                placeholder="Ex: marche 30 min"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{fr.weekPlanner.notes}</h3>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
                value={dayPlan.notes ?? ''}
                onChange={(e) => onUpdatePlan({ ...dayPlan, notes: e.target.value })}
                placeholder="Notes libres..."
              />
            </div>
            {!hasMeals && (
              <Button onClick={() => { onGenerate(); setEditOpen(false); }} className="w-full bg-[var(--color-cta)] text-white">
                {fr.weekPlanner.generate}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
