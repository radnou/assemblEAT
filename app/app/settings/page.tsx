'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, LogIn, LogOut, Plus, X, Copy, Check, FileDown, Lock, Link as LinkIcon, BarChart3 } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications/notificationManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMealStore } from '@/lib/store/useMealStore';
import { ProBadge, ProUpsellDialog } from '@/components/ProUpsellDialog';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { UserProfile, useUser, useClerk } from '@clerk/nextjs';
import { useGoalsStore } from '@/lib/store/useGoalsStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { useObjectiveCoaching } from '@/lib/hooks/useObjectiveCoaching';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full
  }
}

// ─── Objectives list ──────────────────────────────────────────────────────────

const OBJECTIVE_OPTIONS = [
  { value: 'balanced', label: 'Manger plus équilibré' },
  { value: 'time_saving', label: 'Gagner du temps' },
  { value: 'weight_loss', label: 'Perdre du poids' },
  { value: 'more_protein', label: 'Plus de protéines' },
  { value: 'less_meat', label: 'Réduire la viande' },
] as const;

const DIET_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Végétalien' },
  { value: 'pescatarian', label: 'Pescetarien' },
  { value: 'glutenFree', label: 'Sans gluten' },
  { value: 'lactoseFree', label: 'Sans lactose' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Casher' },
] as const;

const COOKING_TIME_OPTIONS = [
  { value: 'express', label: 'Express — moins de 5 min' },
  { value: 'moderate', label: 'Rapide — 10-15 min' },
  { value: 'batch', label: 'Batch cook — je prépare à l\'avance' },
] as const;

const MEAL_OPTIONS: { value: 'breakfast' | 'lunch' | 'dinner'; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</h2>
      <Card className="p-4 space-y-3">{children}</Card>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const tGoals = useTranslations('goals');
  const { settings, updateSettings, resetAll } = useMealStore();
  const { plan } = useSubscriptionStore();
  const { goals, addGoal, removeGoal } = useGoalsStore();
  const coaching = useObjectiveCoaching();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('unsupported');
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [goalText, setGoalText] = useState('');
  const [goalTarget, setGoalTarget] = useState(3);

  // ─── Profile data from localStorage (set during onboarding) ───────────────
  const [profileObjective, setProfileObjective] = useState<string>('balanced');
  const [profileDiets, setProfileDiets] = useState<string[]>([]);
  const [profileAllergies, setProfileAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);
  const [cookingTime, setCookingTime] = useState<string>('express');
  const [mealsToTrack, setMealsToTrack] = useState<string[]>(['breakfast', 'lunch', 'dinner']);

  // ─── Temporal objective ───────────────────────────────────────────────────
  const [objLabel, setObjLabel] = useState('');
  const [objDuration, setObjDuration] = useState(14);

  // ─── Load profile from localStorage ───────────────────────────────────────
  useEffect(() => {
    const profile = getLocalStorage<Record<string, unknown>>('userProfile', {});
    if (profile.objective) setProfileObjective(profile.objective as string);
    if (Array.isArray(profile.diets)) setProfileDiets(profile.diets as string[]);
    if (Array.isArray(profile.allergies)) setProfileAllergies(profile.allergies as string[]);
    if (profile.householdSize) setHouseholdSize(profile.householdSize as number);
    if (profile.cookingTime) setCookingTime(profile.cookingTime as string);
    if (Array.isArray(profile.mealsToTrack)) setMealsToTrack(profile.mealsToTrack as string[]);
  }, []);

  const saveProfile = useCallback((patch: Record<string, unknown>) => {
    const profile = getLocalStorage<Record<string, unknown>>('userProfile', {});
    const updated = { ...profile, ...patch };
    setLocalStorage('userProfile', updated);
  }, []);

  // ─── Notifications ────────────────────────────────────────────────────────
  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);
  const notifEnabled = notifPermission === 'granted';
  const handleNotificationToggle = useCallback(async () => {
    if (!isNotificationSupported()) return;
    if (notifPermission === 'denied') return;
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  }, [notifPermission]);

  // ─── Weekly goals ─────────────────────────────────────────────────────────
  const currentWeekKey = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }, []);
  const weekGoals = goals.filter((g) => g.weekKey === currentWeekKey);
  const presets = [tGoals('presets.legumes'), tGoals('presets.greens'), tGoals('presets.reduceSauce')];
  const handleAddGoal = () => {
    const text = goalText.trim();
    if (!text) return;
    addGoal(text, goalTarget, currentWeekKey);
    setGoalText('');
    setGoalTarget(3);
  };

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const handleSignOut = async () => { await signOut(); };

  // ─── Allergy management ───────────────────────────────────────────────────
  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed || profileAllergies.includes(trimmed)) return;
    const updated = [...profileAllergies, trimmed];
    setProfileAllergies(updated);
    saveProfile({ allergies: updated });
    setAllergyInput('');
  };
  const removeAllergy = (a: string) => {
    const updated = profileAllergies.filter((x) => x !== a);
    setProfileAllergies(updated);
    saveProfile({ allergies: updated });
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="py-6 space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* ─── 1. COMPTE ──────────────────────────────────────────────────── */}
      <SettingsSection title="Compte">
        {isSignedIn ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="ml-2 flex items-center gap-1">
                <LogOut size={14} />
                <span className="text-xs">Déconnexion</span>
              </Button>
            </div>
            <UserProfile />
          </div>
        ) : (
          <Link href="/sign-in">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <LogIn size={16} />
              {tAuth('login')}
            </Button>
          </Link>
        )}
      </SettingsSection>

      {/* ─── 2. PROFIL NUTRITIONNEL ─────────────────────────────────────── */}
      <SettingsSection title="Profil nutritionnel">
        {/* Prénom */}
        <div className="space-y-1">
          <label htmlFor="firstName" className="text-sm font-medium">{t('firstName')}</label>
          <input
            id="firstName"
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={settings.firstName}
            onChange={(e) => updateSettings({ firstName: e.target.value })}
            placeholder="Votre prénom"
          />
        </div>

        {/* Objectif */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Objectif principal</p>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setProfileObjective(opt.value); saveProfile({ objective: opt.value }); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  profileObjective === opt.value
                    ? 'bg-green-100 border-green-500 text-green-800 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Régimes */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Régimes</p>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => {
                  const updated = profileDiets.includes(d.value)
                    ? profileDiets.filter((x) => x !== d.value)
                    : [...profileDiets, d.value];
                  setProfileDiets(updated);
                  saveProfile({ diets: updated });
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  profileDiets.includes(d.value)
                    ? 'bg-green-100 border-green-500 text-green-800 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Allergies / intolérances</p>
          {profileAllergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {profileAllergies.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1">
                  {a}
                  <button onClick={() => removeAllergy(a)} className="hover:text-red-900" aria-label={`Supprimer ${a}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Tapez et appuyez sur Entrée…"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
          />
        </div>
      </SettingsSection>

      {/* ─── 3. PRÉFÉRENCES ─────────────────────────────────────────────── */}
      <SettingsSection title="Préférences">
        {/* Household size */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Nombre de personnes</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              className="w-20 border rounded-lg px-3 py-2 text-sm"
              value={householdSize}
              onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); setHouseholdSize(v); saveProfile({ householdSize: v }); }}
            />
            <span className="text-xs text-gray-500">personne{householdSize > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Cooking time */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Temps de cuisine</p>
          <div className="flex flex-wrap gap-2">
            {COOKING_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setCookingTime(opt.value); saveProfile({ cookingTime: opt.value }); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  cookingTime === opt.value
                    ? 'bg-green-100 border-green-500 text-green-800 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meals to track */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Repas à planifier</p>
          <div className="flex flex-wrap gap-2">
            {MEAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const updated = mealsToTrack.includes(opt.value)
                    ? mealsToTrack.filter((x) => x !== opt.value)
                    : [...mealsToTrack, opt.value];
                  setMealsToTrack(updated);
                  saveProfile({ mealsToTrack: updated });
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  mealsToTrack.includes(opt.value)
                    ? 'bg-green-100 border-green-500 text-green-800 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ─── 4. RÈGLES ──────────────────────────────────────────────────── */}
      <SettingsSection title="Règles">
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
      </SettingsSection>

      {/* ─── 5. EXPORT ──────────────────────────────────────────────────── */}
      <SettingsSection title="Export">
        <p className="text-sm text-gray-600">
          Exportez votre semainier pour le partager ou le sauvegarder.
        </p>
        <Link href="/app/export">
          <Button variant="outline" className="w-full flex items-center gap-2">
            <FileDown size={16} />
            Accéder à l&apos;export
            {plan === 'free' && (
              <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                PDF = Pro
              </span>
            )}
          </Button>
        </Link>
        <Link href="/app/wrapped">
          <Button variant="outline" className="w-full flex items-center gap-2 mt-2">
            <BarChart3 size={16} />
            Voir mon bilan du mois
          </Button>
        </Link>
      </SettingsSection>

      {/* ─── 6. NOTIFICATIONS ───────────────────────────────────────────── */}
      {isNotificationSupported() && (
        <SettingsSection title="Notifications">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Rappels de repas</p>
              <p className="text-xs text-gray-500">Rappels midi et soir</p>
            </div>
            <Button
              variant={notifEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={handleNotificationToggle}
              disabled={notifPermission === 'denied'}
            >
              {notifEnabled ? 'Activé ✓' : 'Activer'}
            </Button>
          </div>
          {notifPermission === 'denied' && (
            <p className="text-xs text-red-500">
              Notifications bloquées. Activez-les dans les paramètres de votre navigateur.
            </p>
          )}
        </SettingsSection>
      )}

      {/* ─── 7. OBJECTIFS ───────────────────────────────────────────────── */}
      <SettingsSection title="Objectifs">
        {/* Temporal objective coaching */}
        {coaching.hasObjective ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-blue-900">
                🎯 {coaching.objective.label} · J{coaching.daysPassed}/{coaching.daysTotal}
              </span>
              <button
                onClick={coaching.clearObjective}
                className="text-xs text-gray-400 hover:text-red-500 underline"
                aria-label="Supprimer l'objectif"
              >
                Supprimer
              </button>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${coaching.percentage}%` }}
              />
            </div>
            <p className="text-xs text-blue-600">{coaching.message}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Fixe-toi un objectif temporel pour rester motivé.</p>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: Manger 5 fruits et légumes par jour"
              value={objLabel}
              onChange={(e) => setObjLabel(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Durée :</label>
              <input
                type="number"
                min={1}
                max={90}
                className="w-20 border rounded-lg px-2 py-1.5 text-sm"
                value={objDuration}
                onChange={(e) => setObjDuration(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="text-xs text-gray-500">jours</span>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (!objLabel.trim()) return;
                  coaching.setObjective({
                    label: objLabel.trim(),
                    startDate: new Date().toISOString().split('T')[0],
                    durationDays: objDuration,
                  });
                  setObjLabel('');
                  setObjDuration(14);
                }}
                disabled={!objLabel.trim()}
              >
                <Plus size={14} className="mr-1" />
                Créer
              </Button>
            </div>
          </div>
        )}

        {/* Weekly nutritional goals (Pro) */}
        {plan === 'pro' && (
          <div className="border-t pt-3 space-y-3">
            <p className="text-sm font-medium">{tGoals('title')}</p>

            {weekGoals.length > 0 && (
              <ul className="space-y-2">
                {weekGoals.map((goal) => (
                  <li key={goal.id} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-base">🎯</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{goal.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 flex-1 bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(goal.achievedCount / goal.targetCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-blue-600 font-medium shrink-0">
                          {goal.achievedCount}/{goal.targetCount}
                        </span>
                      </div>
                      {goal.achievedCount >= goal.targetCount && (
                        <p className="text-[10px] text-green-600 font-semibold mt-0.5">{tGoals('completed')}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-gray-300 hover:text-red-400 shrink-0"
                      aria-label="Supprimer l'objectif"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Suggestions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoalText(preset)}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={tGoals('goalPlaceholder')}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 shrink-0">{tGoals('target')} :</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="w-16 border rounded-lg px-2 py-1.5 text-sm"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <Button size="sm" className="flex-1 flex items-center gap-1" onClick={handleAddGoal} disabled={!goalText.trim()}>
                  <Plus size={14} />
                  {tGoals('addGoal')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* ─── 8. LANGUE ──────────────────────────────────────────────────── */}
      <SettingsSection title={t('language')}>
        <div className="flex gap-2">
          <Button
            variant={settings.language === 'fr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              updateSettings({ language: 'fr' });
              document.cookie = 'NEXT_LOCALE=fr;path=/;max-age=31536000';
              window.location.reload();
            }}
          >
            Français
          </Button>
          <Button
            variant={settings.language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              updateSettings({ language: 'en' });
              document.cookie = 'NEXT_LOCALE=en;path=/;max-age=31536000';
              window.location.reload();
            }}
          >
            English
          </Button>
          <Button
            variant={settings.language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              updateSettings({ language: 'de' });
              document.cookie = 'NEXT_LOCALE=de;path=/;max-age=31536000';
              window.location.reload();
            }}
          >
            Deutsch
          </Button>
        </div>
      </SettingsSection>

      {/* ─── 9. DONNÉES ─────────────────────────────────────────────────── */}
      <SettingsSection title="Données">
        <p className="text-xs text-gray-500">
          Cette action est irréversible : toutes vos données seront supprimées.
        </p>
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setShowResetDialog(true)}
        >
          <Trash2 size={16} className="mr-2" />
          {t('resetAll')}
        </Button>
      </SettingsSection>

      {/* ─── Dialogs ────────────────────────────────────────────────────── */}
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
        AssemblEat v2.0 — Données stockées localement sur votre appareil
      </p>
    </div>
  );
}
