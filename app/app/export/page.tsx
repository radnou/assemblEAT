'use client';

import { useState, useCallback } from 'react';
import { FileDown, Copy, Check, WifiOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeekNavigation } from '@/lib/hooks/useWeekNavigation';
import { useMealStore } from '@/lib/store/useMealStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { WeekExportPreview } from '@/components/WeekExportPreview';
import { ProBadge, ProUpsellDialog } from '@/components/ProUpsellDialog';
import { generateTextSummary } from '@/lib/utils/pdfExport';
import { useTranslations } from 'next-intl';

export default function ExportPage() {
  const t = useTranslations('export');
  const { weekKey } = useWeekNavigation();
  const { getWeekPlan, settings } = useMealStore();
  const { plan } = useSubscriptionStore();
  const [copied, setCopied] = useState(false);
  const [isOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [proOpen, setProOpen] = useState(false);

  const weekPlan = getWeekPlan(weekKey);

  const handleCopy = useCallback(async () => {
    const text = generateTextSummary(weekPlan, settings.firstName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [weekPlan, settings.firstName]);

  const handleGeneratePdf = useCallback(async () => {
    // Lazy-load @react-pdf/renderer pour réduire le bundle initial
    const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

    const styles = StyleSheet.create({
      page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10 },
      header: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
      subheader: { fontSize: 8, color: '#666', marginBottom: 20 },
      dayTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 4, color: '#2E4057' },
      meal: { marginLeft: 10, marginBottom: 2 },
      mealLabel: { fontWeight: 'bold' },
    });

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const assemblyText = (a: typeof weekPlan.days[0]['breakfast']) => {
      if (!a) return '—';
      return [a.protein, a.vegetable, a.cereal, a.sauce].filter(Boolean).map((c) => c!.name).join(' + ');
    };

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Semainier AssemblEat — {settings.firstName || 'Utilisateur'}</Text>
          <Text style={styles.subheader}>Semaine {weekKey}</Text>
          {weekPlan.days.map((day, i) => (
            <View key={i}>
              <Text style={styles.dayTitle}>{dayNames[i]}</Text>
              <Text style={styles.meal}><Text style={styles.mealLabel}>Petit-déj: </Text>{assemblyText(day.breakfast)}</Text>
              <Text style={styles.meal}><Text style={styles.mealLabel}>Déjeuner: </Text>{assemblyText(day.lunch)}</Text>
              <Text style={styles.meal}><Text style={styles.mealLabel}>Dîner: </Text>{assemblyText(day.dinner)}</Text>
              {day.physicalActivity && <Text style={styles.meal}>Activité: {day.physicalActivity}</Text>}
              {day.notes && <Text style={styles.meal}>Notes: {day.notes}</Text>}
            </View>
          ))}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assembleat-${weekKey}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [weekPlan, weekKey, settings.firstName]);

  if (isOffline) {
    return (
      <div className="py-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <WifiOff size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500">{t('offlineMessage')}</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <ProBadge feature="SHARE_WITH_DIETITIAN" onClick={() => setProOpen(true)} />
        </div>
      </div>

      <Badge variant="outline" className="text-sm">{weekKey}</Badge>

      {/* Preview */}
      <WeekExportPreview weekPlan={weekPlan} />

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={plan === 'free' ? () => setProOpen(true) : handleGeneratePdf}
          className="flex-1 bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta)]/90"
        >
          {plan === 'free' ? (
            <>
              <Lock size={16} className="mr-2" />
              {t('generatePdf')}
              <Badge className="ml-2 bg-white/20 text-white border-0 text-[10px] font-semibold">Pro</Badge>
            </>
          ) : (
            <>
              <FileDown size={16} className="mr-2" />
              {t('generatePdf')}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleCopy} className="flex-1">
          {copied ? <Check size={16} className="mr-2 text-green-600" /> : <Copy size={16} className="mr-2" />}
          {copied ? t('copied') : t('copyText')}
        </Button>
      </div>

      <ProUpsellDialog open={proOpen} onOpenChange={setProOpen} feature="SHARE_WITH_DIETITIAN" />
    </div>
  );
}
