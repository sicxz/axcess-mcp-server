// ─── Typography Accessibility Rubric ────────────────────────────────────────
//
// These checks go beyond what axe, Lighthouse, and WAVE catch.
// Automated scanners evaluate technical compliance. This rubric
// evaluates design judgment: whether the type actually works for
// readers with disabilities, not just whether it clears a threshold.
//
// Each check outputs a RubricIssue only when a problem is found.
// Passing checks are collected separately as positive findings.

import {
  TypographyElement,
  ElementEvaluation,
  RubricIssue,
  Severity,
} from './types.js';
import {
  BRINGHURST_LUPTON_ELEMENT_CHECKS,
  brng_headingScale,
} from './bringhurst_lupton.js';
import {
  contrastRatio,
  isLargeText,
  WCAG_AA_NORMAL,
  WCAG_AA_LARGE,
  WCAG_AAA_NORMAL,
} from './color.js';

// ─── Score Deductions ───────────────────────────────────────────────────────
const DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  major: 15,
  minor: 5,
};

// ─── Individual Checks ──────────────────────────────────────────────────────

function checkContrastWithWeight(el: TypographyElement): RubricIssue | null {
  const ratio = contrastRatio(el.color_hex, el.background_color_hex);
  if (ratio === null) return null;

  const large = isLargeText(el.font_size, el.font_weight);
  const minimum = large ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  const passesWcag = ratio >= minimum;

  // Design judgment: passes WCAG but thin weight makes it harder to read
  // Font weights below 400 with contrast ratios below 7:1 are flagged even if compliant
  const thinWeightRisk =
    el.font_weight < 400 && ratio < WCAG_AAA_NORMAL && !large;

  if (!passesWcag) {
    return {
      criterion_id: 'TYP-CONTRAST-FAIL',
      criterion: 'Text contrast — fails WCAG minimum',
      severity: 'critical',
      wcag_reference: 'WCAG 1.4.3',
      what_scanners_miss: 'Scanners catch this. The issue here is that it fails.',
      finding: `Contrast ratio is ${ratio.toFixed(2)}:1. Required minimum is ${minimum}:1 for ${large ? 'large' : 'normal'} text.`,
      recommendation: `Increase contrast to at least ${minimum}:1. Consider a darker foreground or lighter background.`,
      passes_wcag_minimum: false,
      passes_design_judgment: false,
      measured_value: `ratio: ${ratio.toFixed(2)}:1, weight: ${el.font_weight}, size: ${el.font_size}px`,
    };
  }

  if (thinWeightRisk) {
    return {
      criterion_id: 'TYP-CONTRAST-WEIGHT',
      criterion: 'Text contrast — passes WCAG, fails design judgment (thin weight)',
      severity: 'major',
      wcag_reference: 'WCAG 1.4.3 (advisory)',
      what_scanners_miss:
        'Automated tools only check the contrast ratio number. They cannot evaluate how font weight affects perceived legibility. A 4.6:1 ratio in weight-300 reads harder than the same ratio in weight-700.',
      finding: `Contrast ratio ${ratio.toFixed(2)}:1 technically passes, but font-weight ${el.font_weight} at ${el.font_size}px significantly reduces perceived legibility. Users with low vision or cognitive disabilities are disproportionately affected.`,
      recommendation: `Either increase contrast to 7:1+ or increase font-weight to 400+. For body text at this weight, aim for 6:1 minimum as a practical standard.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `ratio: ${ratio.toFixed(2)}:1, weight: ${el.font_weight}, size: ${el.font_size}px`,
    };
  }

  return null;
}

function checkMinimumSize(el: TypographyElement): RubricIssue | null {
  const isBody = ['body', 'caption', 'label'].includes(el.element_type);
  const isUI = el.element_type === 'ui';

  if (isBody && el.font_size < 16) {
    return {
      criterion_id: 'TYP-SIZE-BODY',
      criterion: 'Body text size — below recommended minimum',
      severity: el.font_size < 12 ? 'critical' : 'major',
      wcag_reference: 'WCAG 1.4.4',
      what_scanners_miss:
        'WCAG 1.4.4 only requires text to be resizable, not that it starts at a readable size. Scanners do not flag small base sizes.',
      finding: `Body text at ${el.font_size}px. Minimum recommended for comfortable reading is 16px. Users with low vision reading without zoom are affected.`,
      recommendation: `Increase to 16px minimum for paragraph text. 18px is preferable for long-form reading. If space is constrained, consider a 15px floor with increased line-height.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `${el.font_size}px`,
    };
  }

  if (isUI && el.font_size < 14) {
    return {
      criterion_id: 'TYP-SIZE-UI',
      criterion: 'UI text size — below practical minimum',
      severity: 'minor',
      wcag_reference: 'WCAG 1.4.4',
      what_scanners_miss:
        'Scanners do not evaluate base font size, only zoom behavior.',
      finding: `UI text at ${el.font_size}px. Below 14px, interactive labels become difficult to read, especially on high-resolution screens where rendering may appear smaller.`,
      recommendation: `Increase UI labels to 14px minimum. 16px is preferable for primary actions.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `${el.font_size}px`,
    };
  }

  return null;
}

function checkLineHeight(el: TypographyElement): RubricIssue | null {
  const isBody = ['body', 'caption'].includes(el.element_type);
  if (!isBody) return null;

  if (el.line_height < 1.4) {
    return {
      criterion_id: 'TYP-LEADING-TIGHT',
      criterion: 'Line height — too tight for body text',
      severity: el.line_height < 1.2 ? 'critical' : 'major',
      wcag_reference: 'WCAG 1.4.12',
      what_scanners_miss:
        'WCAG 1.4.12 requires that text spacing can be overridden without loss of content. It does not require the default spacing to be adequate. Scanners check the ability to override, not the default value.',
      finding: `Line height is ${el.line_height}. Body text below 1.4 creates visual crowding that impedes reading speed, particularly for users with dyslexia or cognitive disabilities.`,
      recommendation: `Set line-height to 1.5 minimum for body text (WCAG recommends 1.5 as a good default). 1.6–1.7 is preferable for long-form content.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `line-height: ${el.line_height}`,
    };
  }

  if (el.line_height > 2.2) {
    return {
      criterion_id: 'TYP-LEADING-LOOSE',
      criterion: 'Line height — too loose, disrupts reading flow',
      severity: 'minor',
      wcag_reference: 'WCAG 1.4.12',
      what_scanners_miss:
        'Excessive line height is never flagged by automated tools — they only check minimums.',
      finding: `Line height is ${el.line_height}. Above 2.2, excessive spacing disrupts the visual connection between lines and can make text harder to follow for users with tracking difficulties.`,
      recommendation: `Reduce line-height to between 1.5 and 2.0 for body text.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `line-height: ${el.line_height}`,
    };
  }

  return null;
}

function checkLineLength(el: TypographyElement): RubricIssue | null {
  const isBody = ['body'].includes(el.element_type);
  if (!isBody || el.content_length === undefined) return null;

  // Rough heuristic: if content_length per "line" is provided
  // More accurately we'd need container width + font-size but this works as a flag
  if (el.content_length > 85) {
    return {
      criterion_id: 'TYP-LINE-LENGTH',
      criterion: 'Line length — likely exceeds optimal measure',
      severity: 'minor',
      wcag_reference: 'WCAG 1.4.8 (AAA)',
      what_scanners_miss:
        'No automated tool checks line length for body text. WCAG AAA recommends no more than 80 characters per line but automated tools do not enforce this.',
      finding: `Content length of ${el.content_length} characters suggests lines may exceed the 45–80 character optimal range. Long lines increase cognitive load, particularly for users with dyslexia or attention disorders.`,
      recommendation: `Constrain paragraph width to ~65ch for body text. Use max-width on text containers rather than on the full layout.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `content length: ${el.content_length} chars`,
    };
  }

  return null;
}

function checkAllCaps(el: TypographyElement): RubricIssue | null {
  if (el.text_transform !== 'uppercase') return null;
  const length = el.content_length ?? 0;

  if (length > 30) {
    const severity: Severity = length > 80 ? 'major' : 'minor';
    return {
      criterion_id: 'TYP-ALL-CAPS',
      criterion: 'Extended all-caps text — impedes readability',
      severity,
      wcag_reference: 'WCAG 1.4.8 (AAA)',
      what_scanners_miss:
        'No automated scanner checks for all-caps text. It technically passes all WCAG criteria at AA level.',
      finding: `All-caps applied to ${length} characters. Extended uppercase text reduces reading speed by eliminating ascender/descender cues. This disproportionately affects users with dyslexia and cognitive disabilities.`,
      recommendation: `Reserve all-caps for short labels (under 20 characters), acronyms, or decorative headings. For longer text, use mixed case with letter-spacing for visual distinction instead.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `text-transform: uppercase, ${length} chars`,
    };
  }

  return null;
}

function checkExtendedItalic(el: TypographyElement): RubricIssue | null {
  if (el.font_style !== 'italic') return null;
  const length = el.content_length ?? 0;

  if (length > 80) {
    return {
      criterion_id: 'TYP-ITALIC-EXTENDED',
      criterion: 'Extended italic text — impedes readability',
      severity: length > 200 ? 'major' : 'minor',
      wcag_reference: 'WCAG 1.4.8 (AAA)',
      what_scanners_miss:
        'No scanner flags extended italic use. It passes all automated checks.',
      finding: `Italic applied to ${length} characters. Italic type significantly reduces reading speed over extended passages. Users with dyslexia, cognitive disabilities, or astigmatism are particularly affected.`,
      recommendation: `Limit italic to emphasis within a sentence (fewer than 30 words). For block quotes or callouts, use a weight change or color change for distinction instead of italic.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `font-style: italic, ${length} chars`,
    };
  }

  return null;
}

function checkLetterSpacing(el: TypographyElement): RubricIssue | null {
  if (el.letter_spacing === undefined) return null;
  const isBody = ['body', 'caption'].includes(el.element_type);

  if (isBody && el.letter_spacing < -0.02) {
    return {
      criterion_id: 'TYP-TRACKING-TIGHT',
      criterion: 'Letter spacing — negative tracking on body text',
      severity: el.letter_spacing < -0.05 ? 'major' : 'minor',
      wcag_reference: 'WCAG 1.4.12',
      what_scanners_miss:
        'WCAG 1.4.12 checks that letter-spacing can be overridden, not that defaults are set appropriately. Negative tracking on body text is never flagged.',
      finding: `Letter-spacing of ${el.letter_spacing}em on body text. Negative tracking reduces inter-character spacing and significantly impairs reading for users with dyslexia.`,
      recommendation: `Set letter-spacing to 0 or slightly positive (0.01–0.02em) for body text. Reserve negative tracking for display text only, never body copy.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `letter-spacing: ${el.letter_spacing}em`,
    };
  }

  return null;
}

function checkTextOnNonSolid(el: TypographyElement): RubricIssue | null {
  if (!el.background_type || el.background_type === 'solid') return null;

  return {
    criterion_id: 'TYP-BACKGROUND-TEXTURE',
    criterion: 'Text on non-solid background — requires manual review',
    severity: 'major',
    wcag_reference: 'WCAG 1.4.3',
    what_scanners_miss:
      'Contrast checkers compute an average or sampled color value. They cannot evaluate contrast across the full range of a gradient or image. A ratio that passes at the sampled point may fail elsewhere in the container.',
    finding: `Text is placed over a ${el.background_type} background. The computed contrast ratio from a single hex value is unreliable here. The darkest foreground-to-lightest background combination must meet the minimum threshold across the entire text region.`,
    recommendation: `Apply a solid color overlay (semi-transparent scrim) behind text on image or gradient backgrounds. Ensure the text+scrim combination meets contrast minimums at the lowest-contrast region of the background.`,
    passes_wcag_minimum: false, // Cannot be confirmed without image analysis
    passes_design_judgment: false,
    measured_value: `background-type: ${el.background_type}`,
  };
}

function checkHeadingContext(el: TypographyElement): RubricIssue | null {
  if (el.element_type !== 'heading' || !el.heading_level) return null;

  // Check that heading size creates meaningful visual hierarchy
  // H1 should be noticeably larger than H2, etc.
  // We can only check this in context (checkHeadingHierarchy below handles sets)
  // Here we flag headings that are body-sized
  if (el.font_size <= 18 && el.heading_level <= 3) {
    return {
      criterion_id: 'TYP-HEADING-SIZE',
      criterion: 'Heading size — H1-H3 visually indistinct from body',
      severity: 'major',
      wcag_reference: 'WCAG 1.3.1',
      what_scanners_miss:
        'Scanners verify that heading markup exists. They do not verify that heading styles are visually distinguishable from body text. A screen reader user benefits from heading markup regardless of visual size; a sighted user with cognitive disabilities relies on the visual hierarchy.',
      finding: `H${el.heading_level} at ${el.font_size}px is at or near body text size. The structural relationship is present in markup but not communicated visually.`,
      recommendation: `H${el.heading_level} should be at least 1.25× body font size (typically 20–24px+). Reinforce hierarchy with weight or spacing, not size alone.`,
      passes_wcag_minimum: true,
      passes_design_judgment: false,
      measured_value: `H${el.heading_level} at ${el.font_size}px`,
    };
  }

  return null;
}

// ─── Element Evaluator ──────────────────────────────────────────────────────

export function evaluateTypographyElement(
  el: TypographyElement,
  bodyFontSize: number = 16
): ElementEvaluation {
  const checks = [
    // Core accessibility checks
    checkContrastWithWeight(el),
    checkMinimumSize(el),
    checkLineHeight(el),
    checkLineLength(el),
    checkAllCaps(el),
    checkExtendedItalic(el),
    checkLetterSpacing(el),
    checkTextOnNonSolid(el),
    checkHeadingContext(el),
    // Bringhurst + Lupton craft checks
    ...BRINGHURST_LUPTON_ELEMENT_CHECKS.map((fn) => fn(el)),
    brng_headingScale(el, bodyFontSize),
  ];

  const issues: RubricIssue[] = checks.filter((c): c is RubricIssue => c !== null);

  const issueCount = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };

  const deduction = issues.reduce((sum, i) => sum + DEDUCTIONS[i.severity], 0);
  const score = Math.max(0, 100 - deduction);

  const passes: string[] = [];
  const ratio = contrastRatio(el.color_hex, el.background_color_hex);
  const large = isLargeText(el.font_size, el.font_weight);
  const minimum = large ? WCAG_AA_LARGE : WCAG_AA_NORMAL;

  if (ratio !== null && ratio >= minimum && el.font_weight >= 400) {
    passes.push(`Contrast ratio ${ratio.toFixed(2)}:1 passes WCAG AA with adequate font weight`);
  }
  if (el.line_height >= 1.4 && el.line_height <= 2.2 && ['body', 'caption'].includes(el.element_type)) {
    passes.push(`Line height ${el.line_height} within optimal range`);
  }
  if (el.text_transform !== 'uppercase') {
    passes.push('No extended all-caps text');
  }

  return {
    element_id: el.element_id,
    element_type: el.element_type,
    context: el.context,
    issues,
    issue_count: issueCount,
    score,
    passes,
  };
}
