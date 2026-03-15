'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PleasureSelector } from '@/components/feedback/PleasureSelector';
import type { MealFeedback } from '@/types';
import { cn } from '@/lib/utils';

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assemblyId: string;
  date: string;
  onSubmit: (feedback: MealFeedback) => void;
}

type Quantity = 'not_enough' | 'just_right' | 'too_much';

export function FeedbackSheet({ open, onOpenChange, assemblyId, date, onSubmit }: FeedbackSheetProps) {
  const t = useTranslations('feedback');

  const [pleasure, setPleasure] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [quantity, setQuantity] = useState<Quantity | null>(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!pleasure) return;
    const feedback: MealFeedback = {
      id: `${assemblyId}-${date}`,
      assemblyId,
      date,
      pleasure,
      quantity,
      note: note.trim() || null,
    };
    onSubmit(feedback);
    resetAndClose();
  };

  const resetAndClose = () => {
    setPleasure(null);
    setQuantity(null);
    setNote('');
    onOpenChange(false);
  };

  const quantityOptions: { value: Quantity; label: string }[] = [
    { value: 'not_enough', label: t('notEnough') },
    { value: 'just_right', label: t('justRight') },
    { value: 'too_much', label: t('tooMuch') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4 max-w-lg mx-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg font-bold text-center">{t('title')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Pleasure selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('pleasureLabel')}</p>
            <PleasureSelector value={pleasure} onChange={setPleasure} />
          </div>

          {/* Quantity selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('quantityLabel')}</p>
            <div className="flex gap-2">
              {quantityOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuantity(quantity === value ? null : value)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-sm border transition-all duration-150',
                    quantity === value
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Note textarea */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('noteLabel')}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              placeholder={t('notePlaceholder')}
              rows={2}
              className="w-full resize-none text-sm rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{note.length}/140</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={!pleasure}
              className="flex-1"
            >
              {t('submit')}
            </Button>
            <button
              type="button"
              onClick={resetAndClose}
              className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              {t('skip')}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
