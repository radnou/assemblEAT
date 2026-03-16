'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Share2,
  MessageSquare,
  BarChart3,
  Cloud,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { FeatureFlag } from '@/types';
import { useLemonSqueezy, openCheckout } from '@/components/LemonSqueezyCheckout';
import { useUser } from '@clerk/nextjs';

type LucideIcon = typeof Share2;

interface HeroContent {
  gradient: string;
  icon: LucideIcon;
  headline: string;
  description: string;
  preview: string;
}

const heroContent: Partial<Record<FeatureFlag, HeroContent>> = {
  SHARE_WITH_DIETITIAN: {
    gradient: 'from-teal-500 to-emerald-600',
    icon: Share2,
    headline: 'Partagez avec votre diététicien',
    description:
      'Votre praticien voit vos repas, commente en temps réel, et vous guide chaque semaine.',
    preview: '📋 Semainier → 🔗 Lien sécurisé → 👩‍⚕️ Commentaires en direct',
  },
  PRACTITIONER_THREAD: {
    gradient: 'from-violet-500 to-purple-600',
    icon: MessageSquare,
    headline: 'Conseils personnalisés',
    description:
      'Votre praticien réagit à chaque repas avec 👍 ⚠️ 💡 et des commentaires ciblés.',
    preview: '🥗 Déjeuner → 👍 "Parfait !" → 💡 "Ajoutez des graines"',
  },
  WEEKLY_STATS: {
    gradient: 'from-blue-500 to-indigo-600',
    icon: BarChart3,
    headline: 'Suivez votre progression',
    description: 'Évolution de votre indice d\'équilibre sur 12 semaines. Voyez vos progrès concrets.',
    preview: '📊 Semaine 1: C → Semaine 4: B → Semaine 8: A',
  },
  CLOUD_SYNC: {
    gradient: 'from-sky-500 to-blue-600',
    icon: Cloud,
    headline: 'Vos données partout',
    description: 'Synchronisez entre votre téléphone, tablette et ordinateur.',
    preview: '📱 ↔️ 💻 ↔️ 📲 Toujours à jour',
  },
  SMART_SUGGESTIONS: {
    gradient: 'from-orange-500 to-amber-600',
    icon: Sparkles,
    headline: 'Suggestions intelligentes',
    description: "L'app apprend vos goûts et propose des assemblages adaptés à votre profil.",
    preview: '🍽️ Vos préférences → ✨ Suggestions → 🎯 Assemblages parfaits',
  },
  GROCERY_LIST: {
    gradient: 'from-green-500 to-teal-600',
    icon: Utensils,
    headline: 'Liste de courses automatique',
    description: 'Liste de courses générée automatiquement depuis votre semainier.',
    preview: '📅 Semainier → 🛒 Liste auto → ✅ Courses simplifiées',
  },
};

const DEFAULT_HERO: HeroContent = {
  gradient: 'from-orange-500 to-rose-500',
  icon: Lock,
  headline: 'Passez à AssemblEat Pro',
  description: 'Débloquez toutes les fonctionnalités pour mieux manger, sans effort.',
  preview: '🥗 Partage · 📊 Stats · ☁️ Sync · 💡 Suggestions',
};

const ALSO_INCLUDED: Array<{ icon: LucideIcon; label: string; key: FeatureFlag }> = [
  { icon: MessageSquare, label: 'Thread praticien', key: 'PRACTITIONER_THREAD' },
  { icon: Cloud, label: 'Sync cloud', key: 'CLOUD_SYNC' },
  { icon: Sparkles, label: 'Suggestions IA', key: 'SMART_SUGGESTIONS' },
];

interface ProUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: FeatureFlag;
}

export function ProUpsellDialog({ open, onOpenChange, feature }: ProUpsellDialogProps) {
  const t = useTranslations('pro');
  const { user } = useUser();
  useLemonSqueezy();

  const hero = (feature && heroContent[feature]) ?? DEFAULT_HERO;
  const HeroIcon = hero.icon;

  const alsoIncluded = ALSO_INCLUDED.filter((item) => item.key !== feature);

  function handleCtaClick() {
    openCheckout({
      userId: user?.id,
      email: user?.primaryEmailAddress?.emailAddress,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`bg-gradient-to-br ${hero.gradient} p-6 text-white`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HeroIcon size={24} className="text-white" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-[10px] font-semibold backdrop-blur-sm">
              {t('trialBadge')}
            </Badge>
          </div>

          <h2 className="text-lg font-bold leading-tight mb-1">{hero.headline}</h2>
          <p className="text-sm text-white/85 leading-snug mb-4">{hero.description}</p>

          {/* Text-based preview */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
            <p className="text-xs text-white/90 font-mono leading-relaxed">{hero.preview}</p>
          </div>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
          className="p-5 space-y-4"
        >
          {/* Also included */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('alsoIncluded')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {alsoIncluded.map(({ icon: Icon, label, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5 text-xs text-gray-600 font-medium"
                >
                  <Icon size={12} className="text-gray-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-gray-900">{t('price')}</p>
            <p className="text-xs text-gray-500">{t('priceContext')}</p>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Button
              className={`w-full bg-gradient-to-r ${hero.gradient} text-white border-0 font-semibold shadow-sm hover:opacity-90 transition-opacity`}
              onClick={handleCtaClick}
            >
              {t('cta')}
            </Button>
            <p className="text-center text-[10px] text-gray-400">{t('cancel')}</p>
          </div>
        </motion.div>
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
