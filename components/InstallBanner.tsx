'use client';

import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { useTranslations } from 'next-intl';

export function InstallBanner() {
  const t = useTranslations('install');
  const { showInstallBanner, showIOSTooltip, promptInstall, dismissBanner } = useInstallPrompt();

  if (!showInstallBanner && !showIOSTooltip) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-xl shadow-lg border p-4 flex items-center gap-3 max-w-md mx-auto">
      {showInstallBanner && (
        <>
          <Download size={24} className="text-[var(--color-cta)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t('android')}</p>
          </div>
          <Button size="sm" onClick={promptInstall} className="bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta)]/90">
            Installer
          </Button>
        </>
      )}
      {showIOSTooltip && (
        <>
          <Share size={24} className="text-[var(--color-cta)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">{t('ios')}</p>
          </div>
        </>
      )}
      <button
        onClick={dismissBanner}
        className="shrink-0 text-gray-400 hover:text-gray-600"
        aria-label={t('dismiss')}
      >
        <X size={18} />
      </button>
    </div>
  );
}
