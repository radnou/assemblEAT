import type { WeekPlan, AssemblyRow, MealType } from '@/types';

const mealLabels: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

function assemblyToText(assembly: AssemblyRow | null): string {
  if (!assembly) return '—';
  const parts = [assembly.protein, assembly.vegetable, assembly.cereal, assembly.sauce]
    .filter(Boolean)
    .map((c) => c!.name);
  return parts.join(' + ');
}

/**
 * Génère un résumé texte compact de la semaine pour le presse-papier.
 */
export function generateTextSummary(weekPlan: WeekPlan, firstName: string): string {
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  let text = `Semainier AssemblEat — ${firstName || 'Utilisateur'}\n`;
  text += `Semaine ${weekPlan.weekKey}\n`;
  text += '═'.repeat(40) + '\n\n';

  weekPlan.days.forEach((day, i) => {
    text += `${dayNames[i]} (${day.date || '—'})\n`;
    text += `  ${mealLabels.breakfast}: ${assemblyToText(day.breakfast)}\n`;
    text += `  ${mealLabels.lunch}: ${assemblyToText(day.lunch)}\n`;
    text += `  ${mealLabels.dinner}: ${assemblyToText(day.dinner)}\n`;
    if (day.physicalActivity) text += `  Activité: ${day.physicalActivity}\n`;
    if (day.notes) text += `  Notes: ${day.notes}\n`;
    text += '\n';
  });

  return text;
}
