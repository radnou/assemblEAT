'use client';

import type { WeekPlan, AssemblyRow } from '@/types';

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function cellText(assembly: AssemblyRow | null): string {
  if (!assembly) return '—';
  return [assembly.protein, assembly.vegetable, assembly.cereal]
    .filter(Boolean)
    .map((c) => c!.name.split(' ')[0])
    .join(', ');
}

interface WeekExportPreviewProps {
  weekPlan: WeekPlan;
}

export function WeekExportPreview({ weekPlan }: WeekExportPreviewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left font-medium text-gray-500 sticky left-0 bg-gray-50">Repas</th>
            {dayNames.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-gray-500">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
            const label = mealType === 'breakfast' ? 'Petit-déj' : mealType === 'lunch' ? 'Déjeuner' : 'Dîner';
            return (
              <tr key={mealType} className="border-t">
                <td className="p-2 font-medium text-gray-600 sticky left-0 bg-white">{label}</td>
                {weekPlan.days.map((day, i) => (
                  <td key={i} className="p-2 text-center text-gray-700 max-w-[80px] truncate">
                    {cellText(day[mealType])}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className="border-t">
            <td className="p-2 font-medium text-gray-600 sticky left-0 bg-white">Activité</td>
            {weekPlan.days.map((day, i) => (
              <td key={i} className="p-2 text-center text-gray-500 text-[10px]">
                {day.physicalActivity || '—'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
