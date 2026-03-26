// ─── Color & Contrast Utilities ─────────────────────────────────────────────
// WCAG 2.1 relative luminance and contrast ratio calculation.
// These are the same formulas axe/Lighthouse use — but we apply them
// with additional design-judgment context automated tools miss.

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return null;

  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  const num = parseInt(expanded, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG minimum thresholds
export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3.0;   // large = 18pt+ or 14pt+ bold
export const WCAG_AAA_NORMAL = 7.0;
export const WCAG_AAA_LARGE = 4.5;

export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  const ptSize = fontSizePx * 0.75;
  return ptSize >= 18 || (ptSize >= 14 && fontWeight >= 700);
}
