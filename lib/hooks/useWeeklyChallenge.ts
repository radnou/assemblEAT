'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Challenge {
  id: string;
  weekKey: string;
  title: string;
  description: string;
  emoji: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetCount: number;
}

interface StoredChallenge {
  id: string;
  weekKey: string;
  currentCount: number;
}

// ---------------------------------------------------------------------------
// Challenge pool
// ---------------------------------------------------------------------------

const CHALLENGE_POOL: ChallengeTemplate[] = [
  { id: 'variety_vegs', title: 'Variété légumes', description: 'Mange 5 légumes différents cette semaine', emoji: '🥦', targetCount: 5 },
  { id: 'all_a_b', title: 'Que du bon', description: 'Aucun repas en dessous de B cette semaine', emoji: '🏆', targetCount: 7 },
  { id: 'new_protein', title: 'Nouvelle protéine', description: 'Essaie une protéine que tu n\'as pas mangée la semaine dernière', emoji: '🥩', targetCount: 1 },
  { id: 'validate_all', title: 'Régulier', description: 'Valide au moins 2 repas par jour pendant 5 jours', emoji: '✅', targetCount: 10 },
  { id: 'no_redundancy', title: 'Zéro redondance', description: 'Pas de protéine en double dans la même journée', emoji: '🔄', targetCount: 7 },
  { id: 'green_week', title: 'Semaine verte', description: '3 repas végétariens cette semaine', emoji: '🌱', targetCount: 3 },
  { id: 'score_up', title: 'Progression', description: 'Améliore ton indice d\'équilibre par rapport à la semaine dernière', emoji: '📈', targetCount: 1 },
  { id: 'full_week', title: 'Semaine complète', description: 'Valide les 3 repas pendant 7 jours', emoji: '💪', targetCount: 21 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Current ISO week key (YYYY-WNN) — matches the format used in useMealStore. */
function getCurrentWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Deterministic selection based on week key so the same user gets the same
 * challenge for the entire week. Uses a simple hash of the week string.
 */
function selectChallengeForWeek(weekKey: string, lastChallengeId: string | null): ChallengeTemplate {
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) {
    hash = (hash << 5) - hash + weekKey.charCodeAt(i);
    hash |= 0; // Convert to 32-bit int
  }
  hash = Math.abs(hash);

  // Filter out last week's challenge to ensure variety
  const pool = lastChallengeId
    ? CHALLENGE_POOL.filter((c) => c.id !== lastChallengeId)
    : CHALLENGE_POOL;

  return pool[hash % pool.length];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWeeklyChallenge() {
  const weekKey = useMemo(() => getCurrentWeekKey(), []);

  const [stored, setStored] = useLocalStorage<StoredChallenge | null>(
    'weekly-challenge',
    null,
  );

  const [lastChallengeId] = useLocalStorage<string | null>(
    'weekly-challenge-last-id',
    null,
  );

  // Determine if this is a new week (challenge needs assignment)
  const isNew = !stored || stored.weekKey !== weekKey;

  const challenge: Challenge = useMemo(() => {
    if (!isNew && stored) {
      // Existing challenge for this week — restore from storage
      const template = CHALLENGE_POOL.find((c) => c.id === stored.id) ?? CHALLENGE_POOL[0];
      return {
        ...template,
        weekKey: stored.weekKey,
        currentCount: stored.currentCount,
        completed: stored.currentCount >= template.targetCount,
      };
    }

    // New week — select a fresh challenge
    const template = selectChallengeForWeek(weekKey, lastChallengeId);
    return {
      ...template,
      weekKey,
      currentCount: 0,
      completed: false,
    };
  }, [isNew, stored, weekKey, lastChallengeId]);

  // Persist new challenge on first render of the week
  useMemo(() => {
    if (isNew) {
      const newStored: StoredChallenge = {
        id: challenge.id,
        weekKey,
        currentCount: 0,
      };
      // We can't call setStored inside useMemo synchronously in a way React
      // likes, so we schedule it. The value will be correct on next render.
      queueMicrotask(() => {
        setStored(newStored);
        // Also persist "last id" so next week we pick a different one
        try {
          localStorage.setItem('weekly-challenge-last-id', JSON.stringify(challenge.id));
        } catch {
          // localStorage full
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, weekKey]);

  const markProgress = useCallback(() => {
    setStored((prev) => {
      if (!prev) return prev;
      const template = CHALLENGE_POOL.find((c) => c.id === prev.id);
      const target = template?.targetCount ?? Infinity;
      const next = Math.min(prev.currentCount + 1, target);
      return { ...prev, currentCount: next };
    });
  }, [setStored]);

  const shareChallenge = useCallback(async () => {
    const shareText = `J'ai réussi le défi '${challenge.title}' sur assemblEAT cette semaine ! ${challenge.emoji} Et toi ?`;
    const shareUrl = 'https://assembleat.app';

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Défi assemblEAT : ${challenge.title}`,
          text: shareText,
          url: shareUrl,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} → ${shareUrl}`);
        alert('Lien copié dans le presse-papiers !');
      }
    } catch {
      // User cancelled or share failed — ignore
    }
  }, [challenge.title, challenge.emoji]);

  return { challenge, isNew, markProgress, shareChallenge };
}
