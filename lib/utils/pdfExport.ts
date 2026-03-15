import type { WeekPlan, AssemblyRow, MealType, MealFeedback } from '@/types';

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

const pleasureEmoji: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😍',
};

const quantityLabel: Record<string, string> = {
  not_enough: 'Pas assez',
  just_right: 'Pile bien',
  too_much: 'Trop',
};

/**
 * Version Pro du résumé texte — inclut les feedbacks emoji stockés localement.
 */
export function generateProTextSummary(weekPlan: WeekPlan, firstName: string): string {
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  let text = `Semainier AssemblEat Pro — ${firstName || 'Utilisateur'}\n`;
  text += `Semaine ${weekPlan.weekKey}\n`;
  text += '═'.repeat(40) + '\n\n';

  weekPlan.days.forEach((day, i) => {
    text += `${dayNames[i]} (${day.date || '—'})\n`;

    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
    mealTypes.forEach((mealType) => {
      const assembly = day[mealType];
      const assemblyText = assembly
        ? [assembly.protein, assembly.vegetable, assembly.cereal, assembly.sauce]
            .filter(Boolean)
            .map((c) => c!.name)
            .join(' + ')
        : '—';

      text += `  ${mealLabels[mealType]}: ${assemblyText}\n`;

      // Look up feedback from localStorage
      if (typeof window !== 'undefined' && assembly?.id) {
        const feedbackRaw = localStorage.getItem(`feedback-${assembly.id}-${day.date}`);
        if (feedbackRaw) {
          try {
            const fb: MealFeedback = JSON.parse(feedbackRaw);
            const emoji = pleasureEmoji[fb.pleasure] ?? '';
            const qty = fb.quantity ? ` · ${quantityLabel[fb.quantity] ?? fb.quantity}` : '';
            const note = fb.note ? ` · "${fb.note}"` : '';
            text += `    ${emoji}${qty}${note}\n`;
          } catch {
            // malformed feedback — skip
          }
        }
      }
    });

    if (day.physicalActivity) text += `  Activité: ${day.physicalActivity}\n`;
    if (day.notes) text += `  Notes: ${day.notes}\n`;
    text += '\n';
  });

  return text;
}
