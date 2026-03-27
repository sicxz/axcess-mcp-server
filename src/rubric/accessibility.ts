// ─── Accessibility Check Functions ──────────────────────────────────────────
//
// Each function evaluates one criterion against a single AccessibilityElement.
// Returns a RubricIssue if the element fails, null if it passes.
//
// These checks extend the typography rubric to cover:
//   - Touch target sizing (WCAG 2.5.5 / 2.5.8)
//   - Color-only information conveyance (WCAG 1.4.1)
//   - Focus indicator presence and quality (WCAG 2.4.7 / 2.4.11)
//   - Minimum interactive element height for usability

import { AccessibilityElement, RubricIssue } from './types.js';
import { contrastRatio } from './color.js';

const INTERACTIVE_TYPES = new Set([
  'button', 'link', 'input', 'checkbox', 'radio', 'select', 'navigation',
]);

function isInteractive(el: AccessibilityElement): boolean {
  return el.is_interactive === true || INTERACTIVE_TYPES.has(el.element_type);
}

// ── ACC-TOUCH-CRITICAL ────────────────────────────────────────────────────────
// Interactive elements with width or height below 24px fail WCAG 2.5.8 (AA).
export function checkTouchTargetCritical(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  const w = el.width_px;
  const h = el.height_px;
  if (w === undefined && h === undefined) return null;

  const dimension = Math.min(w ?? Infinity, h ?? Infinity);
  if (dimension < 24) {
    return {
      criterion_id: 'ACC-TOUCH-CRITICAL',
      criterion: 'Touch target below minimum (WCAG 2.5.8)',
      severity: 'critical',
      wcag_reference: 'WCAG 2.5.8 (AA)',
      what_scanners_miss:
        'Scanners check that interactive elements exist but do not measure rendered pixel dimensions from design specs or Figma.',
      finding: `Target measures ${w ?? '?'}×${h ?? '?'}px. WCAG 2.5.8 requires a minimum of 24×24px for interactive elements.`,
      recommendation:
        'Increase the touch target to at least 24×24px. Prefer 44×44px for primary actions per WCAG 2.5.5 (AAA).',
      passes_wcag_minimum: false,
      passes_design_judgment: false,
      measured_value: `${w ?? '?'}×${h ?? '?'}px`,
    };
  }
  return null;
}

// ── ACC-TOUCH-MAJOR ───────────────────────────────────────────────────────────
// Interactive elements between 24–44px pass WCAG 2.5.8 (AA) but fall short
// of 2.5.5 (AAA). Flag as major because 44×44 is the practical usability target.
export function checkTouchTargetMajor(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  const w = el.width_px;
  const h = el.height_px;
  if (w === undefined && h === undefined) return null;

  const dimension = Math.min(w ?? Infinity, h ?? Infinity);
  if (dimension >= 24 && dimension < 44) {
    return {
      criterion_id: 'ACC-TOUCH-MAJOR',
      criterion: 'Touch target below recommended size (WCAG 2.5.5)',
      severity: 'major',
      wcag_reference: 'WCAG 2.5.5 (AAA)',
      what_scanners_miss:
        'Automated scanners do not evaluate touch target size against the recommended 44×44px threshold from design specs.',
      finding: `Target measures ${w ?? '?'}×${h ?? '?'}px. Passes the 24px minimum but falls short of the 44×44px recommended size (WCAG 2.5.5).`,
      recommendation:
        'Increase the touch target to 44×44px for comfortable use on touch devices, especially for primary actions.',
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `${w ?? '?'}×${h ?? '?'}px`,
    };
  }
  return null;
}

// ── ACC-COLOR-ONLY ────────────────────────────────────────────────────────────
// Information conveyed by color alone without a secondary indicator fails WCAG 1.4.1.
export function checkColorOnly(el: AccessibilityElement): RubricIssue | null {
  if (!el.uses_color_only) return null;

  const hasSecondary =
    el.has_text_label === true ||
    el.has_icon_label === true ||
    el.has_pattern_or_shape === true;

  if (!hasSecondary) {
    return {
      criterion_id: 'ACC-COLOR-ONLY',
      criterion: 'Information conveyed by color alone (WCAG 1.4.1)',
      severity: 'critical',
      wcag_reference: 'WCAG 1.4.1 (A)',
      what_scanners_miss:
        'Scanners cannot infer whether a design uses color as the sole differentiator — they have no access to semantic meaning from design specs.',
      finding:
        'Element uses color as the only indicator of state or meaning. Users who cannot distinguish color (8% of males have color vision deficiency) will miss this information.',
      recommendation:
        'Add a secondary indicator: a text label, icon, pattern, or shape that communicates the same information as the color change.',
      passes_wcag_minimum: false,
      passes_design_judgment: false,
    };
  }
  return null;
}

// ── ACC-FOCUS-MISSING ─────────────────────────────────────────────────────────
// Interactive elements with no visible focus indicator fail WCAG 2.4.7 (AA).
export function checkFocusMissing(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  if (el.focus_visible === undefined) return null; // not enough data, skip

  if (el.focus_visible === false) {
    return {
      criterion_id: 'ACC-FOCUS-MISSING',
      criterion: 'No visible focus indicator (WCAG 2.4.7)',
      severity: 'critical',
      wcag_reference: 'WCAG 2.4.7 (AA)',
      what_scanners_miss:
        'Scanners can only check focus indicators in live DOM during keyboard interaction — they cannot evaluate this from design specs.',
      finding:
        'Interactive element has no visible focus indicator. Keyboard-only users and switch access users cannot determine which element is focused.',
      recommendation:
        'Add a visible focus ring. The indicator must have a contrast ratio of at least 3:1 against adjacent colors and be at least 2px thick (WCAG 2.4.11).',
      passes_wcag_minimum: false,
      passes_design_judgment: false,
    };
  }
  return null;
}

// ── ACC-FOCUS-THIN ────────────────────────────────────────────────────────────
// A visible focus indicator with a stroke width below 2px fails WCAG 2.4.11 (AA).
export function checkFocusThin(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  if (el.focus_visible !== true) return null;
  if (el.focus_indicator_width_px === undefined) return null;

  if (el.focus_indicator_width_px < 2) {
    return {
      criterion_id: 'ACC-FOCUS-THIN',
      criterion: 'Focus indicator too thin (WCAG 2.4.11)',
      severity: 'major',
      wcag_reference: 'WCAG 2.4.11 (AA)',
      what_scanners_miss:
        'Automated scanners cannot measure focus ring pixel thickness from design files or CSS spec values without rendering in a browser.',
      finding: `Focus indicator is ${el.focus_indicator_width_px}px thick. WCAG 2.4.11 requires at least 2px.`,
      recommendation:
        'Increase the focus outline or border to at least 2px. A 3px outline with offset is a safe, clearly visible baseline.',
      passes_wcag_minimum: false,
      passes_design_judgment: false,
      measured_value: `${el.focus_indicator_width_px}px`,
    };
  }
  return null;
}

// ── ACC-FOCUS-CONTRAST ────────────────────────────────────────────────────────
// The focus ring must have at least 3:1 contrast against the background behind it.
export function checkFocusContrast(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  if (el.focus_visible !== true) return null;
  if (!el.focus_indicator_color_hex || !el.focus_indicator_background_color_hex) return null;

  const ratio = contrastRatio(
    el.focus_indicator_color_hex,
    el.focus_indicator_background_color_hex
  );
  if (ratio === null) return null;

  if (ratio < 3.0) {
    return {
      criterion_id: 'ACC-FOCUS-CONTRAST',
      criterion: 'Focus indicator insufficient contrast (WCAG 2.4.11)',
      severity: 'major',
      wcag_reference: 'WCAG 2.4.11 (AA)',
      what_scanners_miss:
        'Focus ring color contrast requires comparing the indicator color against the background — automated tools rarely measure this from design specs.',
      finding: `Focus indicator contrast is ${ratio.toFixed(2)}:1, below the 3:1 minimum required by WCAG 2.4.11.`,
      recommendation:
        `Increase focus ring contrast to at least 3:1. Try a darker ring color or lighter background. Current: ${el.focus_indicator_color_hex} on ${el.focus_indicator_background_color_hex}.`,
      passes_wcag_minimum: false,
      passes_design_judgment: false,
      measured_value: `${ratio.toFixed(2)}:1`,
    };
  }
  return null;
}

// ── ACC-INTERACTIVE-SIZE ──────────────────────────────────────────────────────
// Interactive elements shorter than 32px are below the practical usability floor.
// This is a design-judgment check — not a WCAG hard failure.
export function checkInteractiveSize(el: AccessibilityElement): RubricIssue | null {
  if (!isInteractive(el)) return null;
  const h = el.height_px;
  if (h === undefined) return null;

  // Only flag as minor if it's between 24–32px (the critical/major checks above cover <24)
  if (h >= 24 && h < 32) {
    return {
      criterion_id: 'ACC-INTERACTIVE-SIZE',
      criterion: 'Interactive element below comfortable minimum height',
      severity: 'minor',
      wcag_reference: 'WCAG 2.5.5 (AAA)',
      what_scanners_miss:
        'Scanners do not evaluate interactive element height against practical usability thresholds from design files.',
      finding: `Element height is ${h}px. Elements below 32px are difficult to activate reliably, especially on touch screens.`,
      recommendation:
        'Consider increasing height to at least 32px for better usability. 44px is ideal for touch-primary interfaces.',
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `${h}px`,
    };
  }
  return null;
}

// ── All element-level checks ──────────────────────────────────────────────────

export const ACCESSIBILITY_ELEMENT_CHECKS: Array<
  (el: AccessibilityElement) => RubricIssue | null
> = [
  checkTouchTargetCritical,
  checkTouchTargetMajor,
  checkColorOnly,
  checkFocusMissing,
  checkFocusThin,
  checkFocusContrast,
  checkInteractiveSize,
];
