import type { WeekPlan, MealComponent } from '@/types';

export interface GroceryItem {
  name: string;
  category: 'protein' | 'vegetable' | 'cereal' | 'sauce' | 'dairy' | 'fruit' | 'other';
  quantity: number;
  checked: boolean;
}

export interface GroceryList {
  items: GroceryItem[];
  totalItems: number;
  weekKey: string;
}

const CATEGORY_ORDER: GroceryItem['category'][] = [
  'protein',
  'vegetable',
  'cereal',
  'sauce',
  'dairy',
  'fruit',
  'other',
];

function mapComponentCategory(category: string): GroceryItem['category'] {
  switch (category) {
    case 'protein':
      return 'protein';
    case 'vegetable':
      return 'vegetable';
    case 'cereal':
      return 'cereal';
    case 'sauce':
      return 'sauce';
    case 'dairy':
      return 'dairy';
    case 'fruit':
      return 'fruit';
    default:
      return 'other';
  }
}

export function generateGroceryList(weekPlan: WeekPlan): GroceryList {
  // Map: ingredient name → { category, quantity }
  const itemMap = new Map<string, { category: GroceryItem['category']; quantity: number }>();

  for (const day of weekPlan.days) {
    const meals = [day.breakfast, day.lunch, day.dinner];
    for (const meal of meals) {
      if (!meal) continue;

      const components: (MealComponent | null | undefined)[] = [
        meal.protein,
        meal.vegetable,
        meal.cereal,
        meal.sauce,
        ...(meal.extras ?? []),
      ];

      for (const component of components) {
        if (!component) continue;
        const key = component.name.toLowerCase().trim();
        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          itemMap.set(key, {
            category: mapComponentCategory(component.category),
            quantity: 1,
          });
        }
      }
    }
  }

  // Build and sort items
  const unsortedItems: GroceryItem[] = Array.from(itemMap.entries()).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category: data.category,
    quantity: data.quantity,
    checked: false,
  }));

  // Sort by category order, then by quantity descending within category
  const items = unsortedItems.sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return b.quantity - a.quantity;
  });

  return {
    items,
    totalItems: items.length,
    weekKey: weekPlan.weekKey,
  };
}
