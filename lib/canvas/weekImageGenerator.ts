/**
 * weekImageGenerator.ts
 * Generates a 1080 × 1920 PNG "What I Eat In A Week" Stories image.
 * Uses the Canvas 2D API — no WebGL, works in mobile Chrome and Safari.
 */

import type { WeekPlan, AssemblyRow } from '@/types';
import { loadFont, drawRoundedRect, drawPill } from './canvasUtils';

// ─── Design tokens ────────────────────────────────────────────────────────────

const W = 1080;
const H = 1920;

const COLORS = {
  bgFrom: '#FFF5E6',
  bgTo: '#F8F9FA',
  headerFrom: '#FF7A2F',
  headerTo: '#FFBA75',
  dayLabel: '#1A1A2E',
  dayLabelToday: '#FF7A2F',
  divider: '#E8E0D8',
  footerText: '#9CA3AF',
  breakfast: '#048A81', // teal
  lunch: '#E07A5F',     // terracotta
  dinner: '#3D405B',    // indigo
  emptyPill: '#D1D5DB', // gray
  white: '#FFFFFF',
} as const;

const DAY_ABBR_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_COLORS = [COLORS.breakfast, COLORS.lunch, COLORS.dinner] as const;

// ─── Layout constants ─────────────────────────────────────────────────────────

const HEADER_H = 200;
const FOOTER_H = 220;
const CONTENT_H = H - HEADER_H - FOOTER_H; // 1500
const ROW_H = Math.floor(CONTENT_H / 7);   // ~214 per day
const PAD = 48; // horizontal padding

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the first meaningful word from an assembly component name. */
function componentLabel(assembly: AssemblyRow, mealIndex: number): string {
  const sources: (string | undefined)[] = [];
  if (mealIndex === 0) {
    // breakfast: protein or cereal or first component
    sources.push(assembly.protein?.name, assembly.cereal?.name, assembly.vegetable?.name);
  } else {
    sources.push(assembly.protein?.name, assembly.vegetable?.name, assembly.cereal?.name);
  }
  const raw = sources.find((s) => s && s.trim().length > 0) ?? '—';
  // Take first word, max 14 chars
  const word = raw.split(/[\s,]/)[0];
  return word.length > 14 ? word.slice(0, 13) + '…' : word;
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderBackground(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, COLORS.bgFrom);
  grad.addColorStop(1, COLORS.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function renderHeader(
  ctx: CanvasRenderingContext2D,
  weekKey: string,
  userName: string
): void {
  // Gradient pill header
  const grad = ctx.createLinearGradient(0, 0, W, HEADER_H);
  grad.addColorStop(0, COLORS.headerFrom);
  grad.addColorStop(1, COLORS.headerTo);
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, 0, 0, W, HEADER_H, 0);
  ctx.fill();

  // App name
  ctx.fillStyle = COLORS.white;
  ctx.font = `800 56px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('AssemblEat', W / 2, 28);

  // Subtitle line
  ctx.font = `400 32px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const subtitle = userName
    ? `Ce que mange ${userName} — ${weekKey}`
    : `Ce que je mange — ${weekKey}`;
  ctx.fillText(subtitle, W / 2, 100);

  // Decorative label
  ctx.font = `600 24px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('What I Eat In A Week', W / 2, 152);
}

function renderDayRow(
  ctx: CanvasRenderingContext2D,
  dayIndex: number,
  dayPlan: { breakfast: AssemblyRow | null; lunch: AssemblyRow | null; dinner: AssemblyRow | null },
  isLast: boolean
): void {
  const y = HEADER_H + dayIndex * ROW_H;
  const centerY = y + ROW_H / 2;

  // Alternate row tint for readability
  if (dayIndex % 2 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, y, W, ROW_H);
  }

  // Day label on the left
  ctx.fillStyle = COLORS.dayLabel;
  ctx.font = `700 36px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(DAY_ABBR_FR[dayIndex], PAD, centerY);

  // Meal pills — three per row
  const meals = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner];
  const PILL_GAP = 16;
  const DAY_LABEL_W = 100;
  let pillX = PAD + DAY_LABEL_W;

  meals.forEach((assembly, mealIndex) => {
    const text = assembly ? componentLabel(assembly, mealIndex) : '—';
    const color = assembly ? MEAL_COLORS[mealIndex] : COLORS.emptyPill;
    const pillW = drawPill(ctx, text, pillX, centerY, color);
    pillX += pillW + PILL_GAP;
  });

  // Divider (not after last row)
  if (!isLast) {
    ctx.strokeStyle = COLORS.divider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD, y + ROW_H);
    ctx.lineTo(W - PAD, y + ROW_H);
    ctx.stroke();
  }
}

function renderFooter(
  ctx: CanvasRenderingContext2D,
): void {
  const footerY = H - FOOTER_H;

  // Thin separator line
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY + 20);
  ctx.lineTo(W - PAD, footerY + 20);
  ctx.stroke();

  // Watermark
  ctx.fillStyle = COLORS.footerText;
  ctx.font = `400 28px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('assembleat.app', W / 2, footerY + 160);

  // Legend pills
  const legendItems = [
    { label: 'Petit-déj', color: COLORS.breakfast },
    { label: 'Déjeuner', color: COLORS.lunch },
    { label: 'Dîner', color: COLORS.dinner },
  ];
  const legendY = footerY + 115;
  let legendX = PAD;
  legendItems.forEach(({ label, color }) => {
    // small dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(legendX + 8, legendY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.footerText;
    ctx.font = `400 22px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, legendX + 22, legendY);
    legendX += ctx.measureText(label).width + 22 + 36;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateWeekImageOptions {
  userName?: string;
}

/**
 * Generates a 1080 × 1920 PNG blob representing the week meal plan.
 * Safe to call in client components only (requires `document`).
 */
export async function generateWeekImage(
  weekPlan: WeekPlan,
  options: GenerateWeekImageOptions = {}
): Promise<Blob> {
  const { userName = '' } = options;

  // Attempt to load Inter; Canvas falls back to system-ui silently
  await loadFont('Inter', 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2');

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Enable sub-pixel text (important for Safari)
  ctx.imageSmoothingEnabled = true;

  // ── Render sections ──────────────────────────────────────────────────────
  renderBackground(ctx);
  renderHeader(ctx, weekPlan.weekKey, userName);

  for (let i = 0; i < 7; i++) {
    const dayPlan = weekPlan.days[i] ?? {
      date: '',
      breakfast: null,
      lunch: null,
      dinner: null,
    };
    renderDayRow(ctx, i, dayPlan, i === 6);
  }

  renderFooter(ctx);

  // ── Export as PNG blob ───────────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/png'
    );
  });
}
