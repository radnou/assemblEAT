'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PleasureSelector } from '@/components/feedback/PleasureSelector';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { Camera } from 'lucide-react';
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
  const { plan } = useSubscriptionStore();

  const [pleasure, setPleasure] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [quantity, setQuantity] = useState<Quantity | null>(null);
  const [note, setNote] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!pleasure) return;

    // Store photo in localStorage if present (Pro only)
    if (plan === 'pro' && photoPreview) {
      try {
        localStorage.setItem(`meal-photos-${assemblyId}-${date}`, photoPreview);
      } catch {
        // localStorage may be full — silently ignore
      }
    }

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
    setPhotoPreview(null);
    setPhotoFile(null);
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

          {/* Photo capture — Pro only */}
          {plan === 'pro' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('photoLabel')}</label>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Photo du plat" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-300"
                >
                  <Camera size={24} className="mr-2" /> {t('addPhoto')}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          )}

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
