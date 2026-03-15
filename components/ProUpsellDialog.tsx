'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Share2, BarChart3, Users, Utensils } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { featureDescriptions } from '@/lib/config/features';
import type { FeatureFlag } from '@/types';

const featureIcons: Record<FeatureFlag, typeof Share2> = {
  SHARE_WITH_DIETITIAN: Share2,
  ADVANCED_REPERTOIRE: Utensils,
  WEEKLY_STATS: BarChart3,
  MULTI_PROFILE: Users,
  PRACTITIONER_THREAD: Users,
  PRACTITIONER_GOALS: BarChart3,
  SMART_SUGGESTIONS: Utensils,
  PHOTO_JOURNAL: Share2,
  GROCERY_LIST: Utensils,
  CLOUD_SYNC: Share2,
  FRIDGE_MODE: Utensils,
  FRIEND_COMPARE: Users,
};

interface ProUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: FeatureFlag;
}

export function ProUpsellDialog({ open, onOpenChange, feature }: ProUpsellDialogProps) {
  const t = useTranslations('pro');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-[var(--color-cta)]" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('mainBenefit')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {(Object.keys(featureDescriptions) as FeatureFlag[]).map((key) => {
            const Icon = featureIcons[key];
            const isHighlighted = key === feature;
            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-2 rounded-lg ${isHighlighted ? 'bg-orange-50 ring-1 ring-[var(--color-cta)]' : ''}`}
              >
                <Icon size={18} className="text-[var(--color-cta)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{featureDescriptions[key].title}</p>
                  <p className="text-xs text-gray-500">{featureDescriptions[key].description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <Button className="w-full bg-[var(--color-cta)] hover:bg-[var(--color-cta)]/90 text-white">
            {t('unlock')}
          </Button>
          <p className="text-center text-[10px] text-gray-400">
            Paiement sécurisé par Stripe — annulation à tout moment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProBadge({ feature, onClick }: { feature: FeatureFlag; onClick?: () => void }) {
  const t = useTranslations('pro');

  return (
    <Badge
      variant="outline"
      className="cursor-pointer text-[var(--color-cta)] border-[var(--color-cta)] hover:bg-orange-50 text-[10px]"
      onClick={onClick}
    >
      {t('badge')}
    </Badge>
  );
}
