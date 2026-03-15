'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { useWeekNavigation } from '@/lib/hooks/useWeekNavigation';
import { generateGroceryList, type GroceryItem } from '@/lib/grocery/groceryEngine';
import { ProUpsellDialog } from '@/components/ProUpsellDialog';
import { useTranslations } from 'next-intl';

const CATEGORY_LABELS: Record<GroceryItem['category'], string> = {
  protein: 'grocery.proteins',
  vegetable: 'grocery.vegetables',
  cereal: 'grocery.cereals',
  sauce: 'grocery.sauces',
  dairy: 'grocery.dairy',
  fruit: 'grocery.fruits',
  other: 'grocery.other',
};

const CATEGORY_EMOJIS: Record<GroceryItem['category'], string> = {
  protein: '🥩',
  vegetable: '🥦',
  cereal: '🌾',
  sauce: '🫙',
  dairy: '🥛',
  fruit: '🍎',
  other: '🧺',
};

export default function GroceryPage() {
  const t = useTranslations();
  const { plan } = useSubscriptionStore();
  const { weekKey } = useWeekNavigation();
  const { getWeekPlan } = useMealStore();

  const [proDialogOpen, setProDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  // Load checked state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`grocery-checked-${weekKey}`);
      if (stored) {
        setCheckedItems(new Set(JSON.parse(stored) as string[]));
      } else {
        setCheckedItems(new Set());
      }
    } catch {
      setCheckedItems(new Set());
    }
  }, [weekKey]);

  // Persist checked state to localStorage
  const saveChecked = useCallback((next: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`grocery-checked-${weekKey}`, JSON.stringify(Array.from(next)));
    } catch {
      // localStorage full
    }
  }, [weekKey]);

  const weekPlan = useMemo(() => getWeekPlan(weekKey), [getWeekPlan, weekKey]);
  const groceryList = useMemo(() => generateGroceryList(weekPlan), [weekPlan]);

  // Split items: unchecked first, then checked at bottom
  const { unchecked, checked } = useMemo(() => {
    const unchecked: GroceryItem[] = [];
    const checked: GroceryItem[] = [];
    for (const item of groceryList.items) {
      const key = item.name.toLowerCase();
      if (checkedItems.has(key)) {
        checked.push({ ...item, checked: true });
      } else {
        unchecked.push(item);
      }
    }
    return { unchecked, checked };
  }, [groceryList.items, checkedItems]);

  const toggleItem = useCallback((itemName: string) => {
    const key = itemName.toLowerCase();
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveChecked(next);
      return next;
    });
  }, [saveChecked]);

  // Group unchecked items by category
  const groupedUnchecked = useMemo(() => {
    const groups: Partial<Record<GroceryItem['category'], GroceryItem[]>> = {};
    for (const item of unchecked) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [unchecked]);

  const handleCopy = useCallback(async () => {
    const lines: string[] = [`🛒 Liste de courses — ${weekKey}`, ''];
    const categories = Object.keys(groupedUnchecked) as GroceryItem['category'][];
    for (const cat of categories) {
      const items = groupedUnchecked[cat] ?? [];
      if (items.length === 0) continue;
      lines.push(`${CATEGORY_EMOJIS[cat]} ${t(CATEGORY_LABELS[cat])}`);
      for (const item of items) {
        lines.push(`  □ ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`);
      }
      lines.push('');
    }
    if (checked.length > 0) {
      lines.push('✅ Déjà coché');
      for (const item of checked) {
        lines.push(`  ✓ ${item.name}`);
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [groupedUnchecked, checked, weekKey, t]);

  const handleShare = useCallback(async () => {
    const lines: string[] = [`🛒 Liste de courses AssemblEat — ${weekKey}`, ''];
    const categories = Object.keys(groupedUnchecked) as GroceryItem['category'][];
    for (const cat of categories) {
      const items = groupedUnchecked[cat] ?? [];
      if (items.length === 0) continue;
      lines.push(`${CATEGORY_EMOJIS[cat]} ${t(CATEGORY_LABELS[cat])}`);
      for (const item of items) {
        lines.push(`  □ ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`);
      }
      lines.push('');
    }
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Liste de courses AssemblEat', text });
      } catch {
        // user cancelled or share not supported
      }
    }
  }, [groupedUnchecked, weekKey, t]);

  // Show upsell if free plan
  if (plan === 'free') {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} className="text-green-500" />
          <div>
            <h1 className="text-xl font-semibold">{t('grocery.title')}</h1>
            <p className="text-sm text-gray-500">{t('grocery.subtitle')}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center space-y-4">
          <div className="text-4xl">🛒</div>
          <div>
            <p className="font-semibold text-gray-800">Liste de courses automatique</p>
            <p className="text-sm text-gray-500 mt-1">
              Générez votre liste de courses en un clic depuis votre semainier planifié.
            </p>
          </div>
          <Button
            onClick={() => setProDialogOpen(true)}
            className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-semibold"
          >
            🔒 Débloquer avec Pro
          </Button>
        </div>

        <ProUpsellDialog
          open={proDialogOpen}
          onOpenChange={setProDialogOpen}
          feature="GROCERY_LIST"
        />
      </div>
    );
  }

  // Empty state
  if (groceryList.totalItems === 0) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} className="text-green-500" />
          <div>
            <h1 className="text-xl font-semibold">{t('grocery.title')}</h1>
            <p className="text-sm text-gray-500">{weekKey}</p>
          </div>
        </div>
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-sm">{t('grocery.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} className="text-green-500" />
          <div>
            <h1 className="text-xl font-semibold">{t('grocery.title')}</h1>
            <p className="text-sm text-gray-500">{t('grocery.subtitle')}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm shrink-0">
          {checked.length}/{groceryList.totalItems}
        </Badge>
      </div>

      {/* Progress bar */}
      {groceryList.totalItems > 0 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(checked.length / groceryList.totalItems) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2 flex-1"
        >
          {copySuccess ? (
            <>
              <Check size={16} className="text-green-500" />
              {t('grocery.copied')}
            </>
          ) : (
            <>
              <Copy size={16} />
              {t('grocery.copy')}
            </>
          )}
        </Button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2 flex-1"
          >
            <Share2 size={16} />
            {t('grocery.share')}
          </Button>
        )}
      </div>

      {/* Unchecked items grouped by category */}
      <div className="space-y-5">
        {(Object.keys(groupedUnchecked) as GroceryItem['category'][]).map((cat) => {
          const items = groupedUnchecked[cat] ?? [];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <span>{CATEGORY_EMOJIS[cat]}</span>
                <span>{t(CATEGORY_LABELS[cat])}</span>
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <GroceryItemRow
                      key={item.name}
                      item={item}
                      onToggle={toggleItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checked items at bottom */}
      {checked.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-2">✅ Dans le panier</h2>
          <div className="space-y-2 opacity-60">
            <AnimatePresence>
              {checked.map((item) => (
                <GroceryItemRow
                  key={item.name}
                  item={item}
                  onToggle={toggleItem}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (name: string) => void;
}

function GroceryItemRow({ item, onToggle }: GroceryItemRowProps) {
  const t = useTranslations('grocery');
  const isChecked = item.checked;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 cursor-pointer select-none transition-colors hover:bg-gray-50 ${
        isChecked ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
      }`}
      onClick={() => onToggle(item.name)}
    >
      {/* Checkbox */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          isChecked
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300'
        }`}
      >
        {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
      </div>

      {/* Name */}
      <span
        className={`flex-1 text-sm font-medium transition-all ${
          isChecked ? 'line-through text-gray-400' : 'text-gray-800'
        }`}
      >
        {item.name}
      </span>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <Badge variant="secondary" className="text-[10px] px-2 shrink-0">
          ×{item.quantity} {t('times')}
        </Badge>
      )}
    </motion.div>
  );
}
