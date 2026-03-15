'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, LogIn, LogOut, Plus, X, Users, Check } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useGoalsStore } from '@/lib/store/useGoalsStore';
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore';
import { useProfileStore } from '@/lib/store/useProfileStore';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const tGoals = useTranslations('goals');
  const { settings, updateSettings, resetAll } = useMealStore();
  const { plan } = useSubscriptionStore();
  const { goals, addGoal, removeGoal } = useGoalsStore();
  const { profiles, activeProfileId, addProfile, switchProfile, deleteProfile } = useProfileStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [profilesProOpen, setProfilesProOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>('unsupported');
  const [goalText, setGoalText] = useState('');
  const [goalTarget, setGoalTarget] = useState(3);
  const [newProfileName, setNewProfileName] = useState('');
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Current ISO week key (YYYY-Www)
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

  const presets = [
    tGoals('presets.legumes'),
    tGoals('presets.greens'),
    tGoals('presets.reduceSauce'),
  ];

  const handleAddGoal = () => {
    const text = goalText.trim();
    if (!text) return;
    addGoal(text, goalTarget, currentWeekKey);
    setGoalText('');
    setGoalTarget(3);
  };

  const handleAddProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    addProfile(name);
    setNewProfileName('');
    setShowAddProfile(false);
  };

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const notifEnabled = notifPermission === 'granted';

  const handleNotificationToggle = useCallback(async () => {
    if (!isNotificationSupported()) return;
    if (notifPermission === 'denied') return; // can't re-request once denied
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  }, [notifPermission]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="py-6 space-y-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* Auth */}
      <Card className="p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 truncate">{user.email}</p>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="ml-2 flex items-center gap-1">
              <LogOut size={14} />
              <span className="text-xs">Déconnexion</span>
            </Button>
          </div>
        ) : (
          <Link href="/app/login">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <LogIn size={16} />
              {tAuth('login')}
            </Button>
          </Link>
        )}
      </Card>

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

      {/* Notifications */}
      {isNotificationSupported() && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium">{t('notifications')}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Rappels de repas</p>
              <p className="text-xs text-gray-500">Midi, soir, et streak en danger</p>
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
        </Card>
      )}

      {/* Objectifs nutritionnels (Pro only) */}
      {plan === 'pro' && (
        <Card className="p-4 space-y-4">
          <p className="text-sm font-medium">{tGoals('title')}</p>

          {/* Active goals list */}
          {weekGoals.length > 0 && (
            <ul className="space-y-2">
              {weekGoals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100"
                >
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
                      <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                        {tGoals('completed')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-gray-300 hover:text-red-400 shrink-0"
                    aria-label="Supprimer"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Preset suggestions */}
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

          {/* Add goal form */}
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
              <Button
                size="sm"
                className="flex-1 flex items-center gap-1"
                onClick={handleAddGoal}
                disabled={!goalText.trim()}
              >
                <Plus size={14} />
                {tGoals('addGoal')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Profils (Pro only) */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <p className="text-sm font-medium">{t('profiles')}</p>
          </div>
          {plan !== 'pro' && (
            <ProBadge feature="MULTI_PROFILE" onClick={() => setProfilesProOpen(true)} />
          )}
        </div>

        {plan === 'pro' ? (
          <div className="space-y-3">
            {/* Profile list */}
            <ul className="space-y-2">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <li
                    key={profile.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-orange-50 border-[var(--color-cta)]'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <button
                      className="flex-1 flex items-center gap-2 text-left"
                      onClick={() => switchProfile(profile.id)}
                    >
                      <span className="text-base">👤</span>
                      <span className={`text-sm font-medium ${isActive ? 'text-[var(--color-cta)]' : 'text-gray-700'}`}>
                        {profile.name}
                      </span>
                      {isActive && <Check size={14} className="text-[var(--color-cta)]" />}
                    </button>
                    {profiles.length > 1 && !isActive && (
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Supprimer ce profil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Add profile */}
            {showAddProfile ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder={t('profileNamePlaceholder')}
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddProfile} disabled={!newProfileName.trim()}>
                  <Check size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAddProfile(false); setNewProfileName(''); }}>
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-1.5"
                onClick={() => setShowAddProfile(true)}
              >
                <Plus size={14} />
                {t('addProfile')}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">{t('profilesProHint')}</p>
        )}
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
      <ProUpsellDialog open={profilesProOpen} onOpenChange={setProfilesProOpen} feature="MULTI_PROFILE" />

      <p className="text-center text-[10px] text-gray-400 pt-4">
        AssemblEat v1.0 — Données stockées localement sur votre appareil
      </p>
    </div>
  );
}
