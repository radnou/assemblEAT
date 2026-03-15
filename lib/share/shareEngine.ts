import type { WeekPlan, MealFeedback } from '@/types';

export interface SharePayload {
  weekPlan: WeekPlan;
  feedbacks: MealFeedback[];
  userName: string;
  weekKey: string;
}

export interface DecodedShareData {
  weekKey: string;
  userName: string;
  days: { b: string[] | null; l: string[] | null; d: string[] | null }[];
  feedbacks: { p: number; d: string }[];
}

/**
 * Encodes week plan data to a compact base64 URL-safe string.
 * We keep the payload minimal to stay well under URL length limits (~2000 chars).
 */
export function encodeShareData(data: SharePayload): string {
  const payload = {
    w: data.weekKey,
    n: data.userName || 'Utilisateur',
    d: data.weekPlan.days.map(day => ({
      b: day.breakfast
        ? [day.breakfast.protein?.name, day.breakfast.vegetable?.name, day.breakfast.cereal?.name].filter(Boolean) as string[]
        : null,
      l: day.lunch
        ? [day.lunch.protein?.name, day.lunch.vegetable?.name, day.lunch.cereal?.name].filter(Boolean) as string[]
        : null,
      d: day.dinner
        ? [day.dinner.protein?.name, day.dinner.vegetable?.name, day.dinner.cereal?.name].filter(Boolean) as string[]
        : null,
    })),
    // Limit feedbacks to avoid URL bloat
    f: data.feedbacks.slice(0, 14).map(f => ({ p: f.pleasure, d: f.date.slice(5) })), // MM-DD only
  };

  const json = JSON.stringify(payload);
  // btoa needs latin1 — use encodeURIComponent to handle unicode then base64
  return btoa(encodeURIComponent(json))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a share token back to structured data. Returns null on any error.
 */
export function decodeShareData(encoded: string): DecodedShareData | null {
  try {
    // Restore standard base64 from URL-safe variant
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64));
    const data = JSON.parse(json);

    if (!data.w || !data.n || !Array.isArray(data.d)) return null;

    return {
      weekKey: data.w,
      userName: data.n,
      days: data.d,
      feedbacks: Array.isArray(data.f) ? data.f : [],
    };
  } catch {
    return null;
  }
}

/**
 * Builds the full shareable URL for a given encoded payload.
 */
export function buildShareUrl(encoded: string): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://assembleat.app';
  return `${base}/share/${encoded}`;
}
