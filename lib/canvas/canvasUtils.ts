/**
 * canvasUtils.ts
 * Low-level Canvas 2D helpers used by the week image generator.
 * Works in both mobile Chrome and Safari (no WebGL, no experimental APIs).
 */

/**
 * Attempts to load a web font so it is available to Canvas.
 * Falls back silently after 2 seconds — the caller should use system-ui as backup.
 */
export async function loadFont(family: string, url?: string): Promise<boolean> {
  try {
    const src = url ? `url(${url})` : 'local(Inter)';
    const font = new FontFace(family, src);
    const loaded = await Promise.race<FontFace>([
      font.load(),
      new Promise<FontFace>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      ),
    ]);
    document.fonts.add(loaded);
    return true;
  } catch {
    return false; // caller uses system-ui fallback
  }
}

/**
 * Draws a filled rounded rectangle path (does NOT stroke/fill — caller decides).
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws a filled pill (rounded rectangle) with centered text.
 * Returns the total width actually used so callers can chain pills.
 */
export function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bgColor: string,
  textColor = '#ffffff'
): number {
  const fontSize = 22;
  ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;

  const padding = { h: 24, v: 10 };
  const measured = ctx.measureText(text);
  const pillW = measured.width + padding.h * 2;
  const pillH = fontSize + padding.v * 2;
  const radius = pillH / 2;

  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, x, y - pillH / 2, pillW, pillH, radius);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padding.h, y);

  return pillW;
}
