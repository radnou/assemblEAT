'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMealStore } from '@/lib/store/useMealStore';
import { ProBadge, ProUpsellDialog } from '@/components/ProUpsellDialog';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { settings, updateSettings, resetAll } = useMealStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  return (
    <div className="py-6 space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* Prénom */}
      <Card className="p-4 space-y-2">
        <label htmlFor="firstName" className="text-sm font-medium">{t('firstName')}</label>
        <input
          id="firstName"
          type="text"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={settings.firstName}
          onChange={(e) => updateSettings({ firstName: e.target.value })}
          placeholder="Votre prénom"
        />
      </Card>

      {/* Langue */}
      <Card className="p-4 space-y-2">
        <p className="text-sm font-medium">{t('language')}</p>
        <div className="flex gap-2">
          <Button
            variant={settings.language === 'fr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateSettings({ language: 'fr' })}
          >
            Français
          </Button>
          <Button
            variant={settings.language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateSettings({ language: 'en' })}
          >
            English
          </Button>
        </div>
      </Card>

      {/* Règles métier */}
      <Card className="p-4 space-y-3">
        <p className="text-sm font-medium">{t('rules')}</p>
        <div className="flex items-center gap-3">
          <Checkbox
            id="antiRedundancy"
            checked={settings.rules.antiRedundancy}
            onCheckedChange={(checked) =>
              updateSettings({ rules: { ...settings.rules, antiRedundancy: checked === true } })
            }
          />
          <label htmlFor="antiRedundancy" className="text-sm cursor-pointer">
            {t('antiRedundancy')}
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="starchWarning"
            checked={settings.rules.starchWarning}
            onCheckedChange={(checked) =>
              updateSettings({ rules: { ...settings.rules, starchWarning: checked === true } })
            }
          />
          <label htmlFor="starchWarning" className="text-sm cursor-pointer">
            {t('starchWarning')}
          </label>
        </div>
      </Card>

      {/* Mode Pro */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('modePro')}</p>
          <ProBadge feature="SHARE_WITH_DIETITIAN" onClick={() => setProOpen(true)} />
        </div>
        <p className="text-xs text-gray-500">{t('modeProSoon')}</p>
      </Card>

      {/* Reset */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setShowResetDialog(true)}
      >
        <Trash2 size={16} className="mr-2" />
        {t('resetAll')}
      </Button>

      {/* Dialogs */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('resetAll')}</DialogTitle>
            <DialogDescription>{t('resetConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => { resetAll(); setShowResetDialog(false); }}>
              Réinitialiser
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProUpsellDialog open={proOpen} onOpenChange={setProOpen} feature="SHARE_WITH_DIETITIAN" />

      <p className="text-center text-[10px] text-gray-400 pt-4">
        AssemblEat v1.0 — Données stockées localement sur votre appareil
      </p>
    </div>
  );
}
