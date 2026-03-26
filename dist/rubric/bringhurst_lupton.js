// ─── Bringhurst + Lupton Typography Rubric Extensions ───────────────────────
//
// Checks derived from two canonical references:
//
//   Robert Bringhurst — "The Elements of Typographic Style" (4th ed.)
//   Ellen Lupton — "Thinking with Type" (2nd ed.)
//
// These rules go beyond WCAG entirely — they are craft standards, not legal
// minimums. No automated scanner references either book. The findings here
// represent the gap between "technically compliant" and "professionally sound."
//
// Each check cites the principle source and the relevant passage context.
// ─── Bringhurst Checks ──────────────────────────────────────────────────────
// Bringhurst §2.1.2: "Anything from 45 to 75 characters is widely regarded as
// a satisfactory length of line for a single-column page... The 66-character
// line is widely regarded as ideal. A slightly shorter line — 60 to 66
// characters — is preferable for justified text."
export function brng_measureTooWide(el) {
    if (!['body', 'caption'].includes(el.element_type))
        return null;
    if (!el.content_length)
        return null;
    if (el.content_length > 80) {
        return {
            criterion_id: 'BRNG-MEASURE-WIDE',
            criterion: 'Line measure — exceeds Bringhurst maximum (75 chars)',
            severity: el.content_length > 100 ? 'major' : 'minor',
            wcag_reference: 'WCAG 1.4.8 (AAA) — §2.1.2 Elements of Typographic Style',
            what_scanners_miss: 'No accessibility scanner checks line measure against typographic standards. WCAG 1.4.8 (AAA) recommends max 80 characters but does not appear in AA audits.',
            finding: `Estimated line length of ${el.content_length} characters exceeds the 75-character maximum Bringhurst identifies as the outer limit of comfortable reading. Beyond 75 characters, the eye struggles to find the start of the next line, increasing cognitive load and reading errors.`,
            recommendation: "Constrain body text columns to approximately 65–66 characters per line (Bringhurst ideal). Use max-width: 65ch on text containers. For justified text, aim for 60–66 characters.",
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `~${el.content_length} chars`,
        };
    }
    return null;
}
// Bringhurst §2.1.2: Narrow measure — below 45 characters fragments reading rhythm
export function brng_measureTooNarrow(el) {
    if (!['body'].includes(el.element_type))
        return null;
    if (!el.content_length)
        return null;
    if (el.content_length < 40) {
        return {
            criterion_id: 'BRNG-MEASURE-NARROW',
            criterion: 'Line measure — too narrow for comfortable body reading',
            severity: 'minor',
            wcag_reference: '§2.1.2 Elements of Typographic Style',
            what_scanners_miss: 'Narrow measure is never flagged by accessibility tools. It is a craft problem, not a compliance problem.',
            finding: `Estimated line length of ${el.content_length} characters is below the 45-character minimum Bringhurst recommends for single-column body text. Narrow measure forces excessive hyphenation, creates uneven word spacing in justified text, and increases the number of eye return trips per page.`,
            recommendation: 'Widen the text column or reduce font size to achieve a measure of 45–65 characters. For multi-column layouts, 40–50 characters per column is acceptable.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `~${el.content_length} chars`,
        };
    }
    return null;
}
// Bringhurst §2.2: "Add space between the lines in proportion to the length
// of the line... increase the leading as the measure increases."
// Rule of thumb: line_height should scale with measure.
// Wide measure (>65 chars) needs line_height ≥ 1.5.
// Very wide measure (>80 chars) needs line_height ≥ 1.6.
export function brng_leadingToMeasure(el) {
    if (!['body'].includes(el.element_type))
        return null;
    if (!el.content_length)
        return null;
    const wideMeasure = el.content_length > 65;
    const veryWideMeasure = el.content_length > 80;
    if (veryWideMeasure && el.line_height < 1.6) {
        return {
            criterion_id: 'BRNG-LEADING-MEASURE',
            criterion: 'Leading insufficient for measure — Bringhurst proportion rule',
            severity: 'major',
            wcag_reference: '§2.2.1 Elements of Typographic Style',
            what_scanners_miss: 'The relationship between line length and line height is invisible to automated tools. A scanner sees line-height: 1.4 and passes it. It cannot know the column is 95 characters wide.',
            finding: `Line height ${el.line_height} is insufficient for a line measure of ~${el.content_length} characters. Bringhurst's principle: as measure increases, leading must increase proportionally so the eye can track back to the start of the next line. At this measure, 1.6 minimum is recommended.`,
            recommendation: 'Increase line-height to 1.6–1.7 for this column width, or reduce the column width to 65 characters and drop leading to 1.5.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `line-height: ${el.line_height}, measure: ~${el.content_length} chars`,
        };
    }
    if (wideMeasure && el.line_height < 1.5) {
        return {
            criterion_id: 'BRNG-LEADING-MEASURE',
            criterion: 'Leading insufficient for measure — Bringhurst proportion rule',
            severity: 'minor',
            wcag_reference: '§2.2.1 Elements of Typographic Style',
            what_scanners_miss: 'The measure-to-leading relationship is not checkable by automated tools.',
            finding: `Line height ${el.line_height} is borderline for a ~${el.content_length}-character measure. Bringhurst recommends increasing leading as measure widens. At 65+ characters, 1.5 is the practical minimum.`,
            recommendation: 'Increase line-height to 1.5–1.6 for this measure.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `line-height: ${el.line_height}, measure: ~${el.content_length} chars`,
        };
    }
    return null;
}
// Bringhurst §3.4: Optical sizing — type set small needs more open spacing.
// "Text set at 9pt or below needs wider word spacing and letter spacing
// than type set at 12pt, because the white inside the letters (the
// counterforms) is optically smaller at reduced sizes."
export function brng_opticalSizeSmall(el) {
    const isSmall = el.font_size < 13; // ~10pt
    if (!isSmall)
        return null;
    if (!el.letter_spacing || el.letter_spacing >= 0)
        return null;
    return {
        criterion_id: 'BRNG-OPTICAL-SMALL',
        criterion: 'Small type with tight tracking — violates optical sizing principle',
        severity: 'major',
        wcag_reference: '§3.4 Elements of Typographic Style / WCAG 1.4.12',
        what_scanners_miss: 'Optical sizing is a craft concept with no automated equivalent. WCAG 1.4.12 checks that spacing can be overridden, not that defaults are optically correct at a given size.',
        finding: `Type at ${el.font_size}px (≈${Math.round(el.font_size * 0.75)}pt) with letter-spacing ${el.letter_spacing}em. At small sizes, the counterforms of letterforms are already optically compressed. Negative tracking at this size compounds that compression, making individual letters harder to distinguish — particularly affecting users with low vision or dyslexia.`,
        recommendation: 'Remove negative tracking on small type. At sizes below 13px, increase letter-spacing to 0.02–0.04em to compensate for optical compression. Use a typeface designed for text sizes, not a display face scaled down.',
        passes_wcag_minimum: true,
        passes_design_judgment: false,
        measured_value: `${el.font_size}px, letter-spacing: ${el.letter_spacing}em`,
    };
}
// Bringhurst §3.4: Display type (large) benefits from tighter tracking.
// "At display sizes (18pt and above), type can generally be set more tightly
// than at text sizes... many display faces have too much built-in spacing
// at large sizes."
export function brng_displayTracking(el) {
    const isDisplay = el.font_size >= 48; // ≈36pt+
    const isHeading = el.element_type === 'heading' || el.element_type === 'display';
    if (!isDisplay || !isHeading)
        return null;
    // At large display sizes, default (0) or positive tracking creates loose, airy type
    if (el.letter_spacing !== undefined && el.letter_spacing > 0.02) {
        return {
            criterion_id: 'BRNG-DISPLAY-TRACKING',
            criterion: 'Display type — positive tracking loosens color and rhythm',
            severity: 'minor',
            wcag_reference: '§3.4 Elements of Typographic Style',
            what_scanners_miss: 'No scanner evaluates display tracking. Positive letter-spacing technically aids readability by automated measures — but at display sizes it creates visual gaps that undermine the word shapes readers rely on for fast recognition.',
            finding: `Display type at ${el.font_size}px with letter-spacing +${el.letter_spacing}em. At large sizes, positive tracking creates a loose, airy appearance that weakens the visual weight and rhythm of the headline. Bringhurst: "At display sizes, tighter spacing generally produces a stronger visual effect."`,
            recommendation: 'Reduce letter-spacing to 0 or slightly negative (-0.01 to -0.02em) for display type above 48px. This tightens the word shapes and improves visual color at large sizes.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `${el.font_size}px, letter-spacing: +${el.letter_spacing}em`,
        };
    }
    return null;
}
// Bringhurst §2.4: "Use one space between sentences, not two."
// Not directly checkable from element properties, but we can flag
// context-specific issues with monospaced or typewriter-convention contexts.
// Bringhurst §4.2: Scale — heading must create real visual contrast with body.
// The ideal scale relationships are modular: major third (1.25×), perfect
// fourth (1.333×), perfect fifth (1.5×), golden section (1.618×).
// An H1 that is only 1.1× body size creates false hierarchy.
export function brng_headingScale(el, bodyFontSize) {
    if (el.element_type !== 'heading' || !el.heading_level)
        return null;
    const level = el.heading_level;
    const ratio = el.font_size / bodyFontSize;
    // H1 should be at least a major third above body (1.25×)
    // H2 at least a minor third (1.125×)
    const minimumRatios = {
        1: 1.6, // golden section minimum for primary heading
        2: 1.25, // major third
        3: 1.125, // major second
    };
    const minimumRatio = minimumRatios[level] ?? 1.0;
    if (level <= 3 && ratio < minimumRatio) {
        return {
            criterion_id: 'BRNG-HEADING-SCALE',
            criterion: `H${level} scale insufficient — Bringhurst modular scale principle`,
            severity: ratio < minimumRatio * 0.9 ? 'major' : 'minor',
            wcag_reference: '§4.2 Elements of Typographic Style / WCAG 1.3.1',
            what_scanners_miss: 'Scanners verify heading markup exists. They cannot evaluate whether the visual scale relationship communicates the hierarchy that the markup implies.',
            finding: `H${level} at ${el.font_size}px is only ${ratio.toFixed(2)}× body size (${bodyFontSize}px). Bringhurst's modular scale principles suggest H${level} should be at least ${minimumRatio}× body (≈${Math.round(bodyFontSize * minimumRatio)}px). Without sufficient scale contrast, the heading reads as body text and the hierarchy collapses for sighted users.`,
            recommendation: `Increase H${level} to at least ${Math.round(bodyFontSize * minimumRatio)}px to achieve a ${minimumRatio}× scale ratio. Consider a modular scale — major third (1.25×), perfect fourth (1.333×), or golden section (1.618×) — for the full heading system.`,
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `H${level}: ${el.font_size}px vs body: ${bodyFontSize}px (${ratio.toFixed(2)}× ratio)`,
        };
    }
    return null;
}
// ─── Lupton Checks ──────────────────────────────────────────────────────────
// Lupton "Thinking with Type" §Type/Tracking:
// "All-caps text should always be tracked more openly than mixed-case text.
// Capital letters are designed to work with lowercase; set in all-caps,
// they need extra space between them to maintain legibility."
// Minimum recommendation: 0.05em for all-caps labels; 0.08–0.12em for
// all-caps headings.
export function lupt_capsTracking(el) {
    if (el.text_transform !== 'uppercase')
        return null;
    const tracking = el.letter_spacing ?? 0;
    if (tracking < 0.05) {
        const isDisplay = el.font_size >= 24;
        return {
            criterion_id: 'LUPT-CAPS-TRACKING',
            criterion: 'All-caps text needs wider tracking — Lupton tracking principle',
            severity: tracking < 0 ? 'major' : 'minor',
            wcag_reference: 'Thinking with Type §Tracking / WCAG 1.4.12',
            what_scanners_miss: 'No automated tool checks whether all-caps text has been tracked appropriately. WCAG 1.4.12 checks that spacing can be overridden; it does not require the default to reflect typographic practice.',
            finding: `All-caps text with letter-spacing ${tracking}em. Lupton's principle: capital letters were designed to sit beside lowercase; in all-caps setting, the tight spacing built into the font becomes inappropriate. The result is a dense, compressed appearance that impedes word recognition. ${isDisplay ? 'At display size, the effect is pronounced.' : 'For labels and UI text, cramped all-caps reads as shouting without emphasis.'}`,
            recommendation: `Increase letter-spacing to at least 0.05–0.08em for all-caps text. For display-size all-caps headings, 0.08–0.15em is common practice. This restores visual rhythm and improves recognition for users with dyslexia and cognitive disabilities.`,
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `text-transform: uppercase, letter-spacing: ${tracking}em`,
        };
    }
    return null;
}
// Lupton "Thinking with Type" §Hierarchy:
// "Establish hierarchy through differences in scale, weight, color, and spacing.
// Avoid relying on a single variable — contrast must be clear, not subtle."
// Visual hierarchy requires at least one strong contrast variable between levels.
// If heading and body differ only slightly in size with the same weight, hierarchy fails.
export function lupt_weakHierarchy(el) {
    if (el.element_type !== 'heading' || !el.heading_level)
        return null;
    if (el.heading_level > 3)
        return null;
    // Flag when a heading uses the same weight as typical body (400) with modest size
    // The rubric can't see the body text weight without context, but we can flag
    // headings that rely on size alone with no weight contrast
    const hasWeightContrast = el.font_weight >= 600;
    const hasScaleContrast = el.font_size >= 24; // assumed vs. 16px body baseline
    if (!hasWeightContrast && !hasScaleContrast) {
        return {
            criterion_id: 'LUPT-WEAK-HIERARCHY',
            criterion: 'Heading has neither weight nor scale contrast — hierarchy collapses',
            severity: 'major',
            wcag_reference: 'Thinking with Type §Hierarchy / WCAG 1.3.1',
            what_scanners_miss: 'Scanners confirm heading markup. They cannot evaluate whether the visual treatment communicates the structural role. A heading at 400 weight and 18px looks like body text regardless of its HTML tag.',
            finding: `H${el.heading_level} at ${el.font_size}px, weight ${el.font_weight}. Lupton's hierarchy principle: heading relationships must be established through visible contrast — scale, weight, color, or spacing — not just markup. This heading has neither meaningful scale (≥24px vs. 16px body baseline) nor weight contrast (≥600). The hierarchy exists in structure but not in perception.`,
            recommendation: `Either increase font-weight to 600–700 (semibold/bold) or increase font-size to at least 24px — or both. Using only one variable creates fragile hierarchy; using two creates clear, robust levels.`,
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `${el.font_size}px, weight: ${el.font_weight}`,
        };
    }
    return null;
}
// Lupton "Thinking with Type" §Type as Texture:
// "Body text should create an even gray value when viewed as a mass.
// Variations in word spacing, tracking, or weight within a paragraph
// create visible 'rivers' and 'holes' that interrupt reading."
// This principle is behind the tracking and leading checks, but also
// applies to mixed-weight inline text — we flag excessive font_weight
// for body text (ultra-bold body reads as noise, not text).
export function lupt_bodyWeight(el) {
    if (!['body', 'caption'].includes(el.element_type))
        return null;
    if (el.font_weight >= 700) {
        return {
            criterion_id: 'LUPT-BODY-WEIGHT',
            criterion: 'Body text weight too heavy — disrupts typographic texture',
            severity: 'minor',
            wcag_reference: 'Thinking with Type §Type as Texture',
            what_scanners_miss: 'Bold body text passes all accessibility checks. No scanner evaluates typographic texture.',
            finding: `Body text at font-weight ${el.font_weight}. Lupton's texture principle: body type should create a consistent "gray" when viewed as a mass. Weight 700+ on running text creates a dark, dense texture that increases visual fatigue and reduces the contrast available for emphasis. Bold is an emphasis tool; applied uniformly, it eliminates emphasis entirely.`,
            recommendation: 'Use weight 400 (regular) for body text. Reserve 500–600 for lead text or introductory paragraphs. 700+ should appear only for inline emphasis — a word or phrase, not a paragraph.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `element_type: body, font-weight: ${el.font_weight}`,
        };
    }
    return null;
}
// Lupton "Thinking with Type" §Scale:
// "Use scale to create contrast. Big is not better; difference is."
// A display element (font_size > 60px) that also uses heavy weight AND
// positive tracking is overworking the contrast variables redundantly.
// Over-designed display type loses its impact through excess.
export function lupt_displayOverworked(el) {
    if (!['heading', 'display'].includes(el.element_type))
        return null;
    if (el.font_size < 48)
        return null;
    const heavyWeight = el.font_weight >= 800;
    const allCaps = el.text_transform === 'uppercase';
    const positiveTracking = (el.letter_spacing ?? 0) > 0.05;
    const contrastVariables = [heavyWeight, allCaps, positiveTracking].filter(Boolean).length;
    if (contrastVariables >= 3) {
        return {
            criterion_id: 'LUPT-DISPLAY-OVERWORKED',
            criterion: 'Display type stacks too many contrast variables — reduces impact',
            severity: 'minor',
            wcag_reference: 'Thinking with Type §Scale',
            what_scanners_miss: 'Over-designed display type passes all automated checks. The problem is not accessibility in the technical sense — it is legibility and visual hierarchy in the design sense.',
            finding: `Display type at ${el.font_size}px combines: ${heavyWeight ? `weight-${el.font_weight}` : ''} ${allCaps ? 'all-caps' : ''} ${positiveTracking ? `+${el.letter_spacing}em tracking` : ''}. Lupton: "When everything is emphasized, nothing is." Stacking scale, weight, caps, and tracking simultaneously creates visual noise. Each variable competes rather than reinforcing a clear hierarchy.`,
            recommendation: 'Choose one or two contrast variables for display type. Large size alone is often sufficient. If all-caps, reduce weight to 400–600. If heavy weight, use mixed case. Trust the scale to do the work.',
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `${el.font_size}px, weight: ${el.font_weight}, caps: ${allCaps}, tracking: ${el.letter_spacing}em`,
        };
    }
    return null;
}
// ─── Set-Level Checks (require multiple elements) ────────────────────────────
// These run on the full TypographySet, not individual elements.
// Lupton §Hierarchy: A well-structured type system should have at least
// two visibly distinct levels of hierarchy. If all elements in a set
// share the same weight, the hierarchy is structural only, not visual.
export function lupt_monotoneWeight(set) {
    if (set.elements.length < 2)
        return null;
    const weights = new Set(set.elements.map((e) => e.font_weight));
    const hasHeading = set.elements.some((e) => e.element_type === 'heading');
    const hasBody = set.elements.some((e) => ['body', 'caption'].includes(e.element_type));
    if (weights.size === 1 && hasHeading && hasBody) {
        const w = [...weights][0];
        return {
            criterion_id: 'LUPT-MONOTONE-WEIGHT',
            criterion: 'All elements share the same weight — no weight-based hierarchy',
            severity: 'major',
            wcag_reference: 'Thinking with Type §Hierarchy / WCAG 1.3.1',
            what_scanners_miss: 'Weight hierarchy is invisible to automated tools. A page can have perfect heading structure in markup with zero visual differentiation between heading and body weight.',
            finding: `All ${set.elements.length} elements use font-weight ${w}. Lupton: hierarchy requires visible contrast between levels. When headings and body text share the same weight, the size difference alone must carry all the hierarchy — which is often insufficient, especially for users with low vision or cognitive disabilities who rely on multiple visual cues.`,
            recommendation: `Introduce weight contrast: set headings to 600–700 and body to 400. Weight is the most reliable single variable for communicating text hierarchy, more robust than size or color alone.`,
            passes_wcag_minimum: true,
            passes_design_judgment: false,
            measured_value: `all elements: weight-${w}`,
        };
    }
    return null;
}
// Bringhurst §4.1: Type size monotony — if all text in a set is the same size,
// there is no typographic scale. This is a structural failure, not a styling choice.
export function brng_sizeMonotony(set) {
    if (set.elements.length < 2)
        return null;
    const sizes = new Set(set.elements.map((e) => e.font_size));
    const hasHeading = set.elements.some((e) => e.element_type === 'heading');
    const hasBody = set.elements.some((e) => ['body', 'caption'].includes(e.element_type));
    if (sizes.size === 1 && hasHeading && hasBody) {
        const s = [...sizes][0];
        return {
            criterion_id: 'BRNG-SIZE-MONOTONY',
            criterion: 'All elements share the same size — no typographic scale',
            severity: 'critical',
            wcag_reference: '§4.1 Elements of Typographic Style / WCAG 1.3.1',
            what_scanners_miss: 'Scanners verify heading markup. They cannot detect that all elements are visually indistinguishable in size.',
            finding: `All ${set.elements.length} elements are set at ${s}px. Without a size scale, the typographic hierarchy is carried entirely by markup — invisible to sighted users who are not using assistive technology. Bringhurst: a functioning type system requires visible scale relationships between levels.`,
            recommendation: 'Establish a modular scale. A minimum: body at 16px, H3 at 20px (1.25×), H2 at 24px (1.5×), H1 at 32px (2×). For a more refined system, use a consistent ratio throughout — major third (×1.25), perfect fourth (×1.333), or golden section (×1.618).',
            passes_wcag_minimum: false,
            passes_design_judgment: false,
            measured_value: `all elements: ${s}px`,
        };
    }
    return null;
}
// Export all single-element checks as an array for easy integration
export const BRINGHURST_LUPTON_ELEMENT_CHECKS = [
    brng_measureTooWide,
    brng_measureTooNarrow,
    brng_leadingToMeasure,
    brng_opticalSizeSmall,
    brng_displayTracking,
    lupt_capsTracking,
    lupt_weakHierarchy,
    lupt_bodyWeight,
    lupt_displayOverworked,
];
// Set-level checks (need all elements)
export const BRINGHURST_LUPTON_SET_CHECKS = [
    lupt_monotoneWeight,
    brng_sizeMonotony,
];
//# sourceMappingURL=bringhurst_lupton.js.map