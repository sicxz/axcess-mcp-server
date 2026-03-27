// ─── Input Types ────────────────────────────────────────────────────────────

export type ElementType =
  | 'heading'
  | 'body'
  | 'caption'
  | 'label'
  | 'button'
  | 'display'
  | 'ui';

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern';

export type Severity = 'critical' | 'major' | 'minor';

// A single typographic element extracted from a design file or DOM
export interface TypographyElement {
  element_id?: string;
  element_type: ElementType;
  heading_level?: number; // 1–6

  // Typography properties
  font_size: number;           // px
  font_weight: number;         // 100–900
  line_height: number;         // multiplier (e.g. 1.5, not px)
  letter_spacing?: number;     // em (e.g. -0.02)
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  font_style?: 'normal' | 'italic';
  content_length?: number;     // character count of actual content

  // Color properties
  color_hex: string;            // foreground, e.g. "#1a1a1a"
  background_color_hex: string; // background, e.g. "#ffffff"
  background_type?: BackgroundType;

  // Context
  context?: string;            // brief description, e.g. "hero heading", "footer legal copy"
}

// A collection of typography elements representing a screen or component
export interface TypographySet {
  elements: TypographyElement[];
  screen_name?: string;
  context?: string;
}

// ─── Accessibility Element (broader UI accessibility audit) ─────────────────

export type AccessibilityElementType =
  | 'button'
  | 'link'
  | 'input'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'icon'
  | 'badge'
  | 'alert'
  | 'text'
  | 'image'
  | 'navigation'
  | 'heading';

export type InteractionState =
  | 'default'
  | 'hover'
  | 'focus'
  | 'active'
  | 'disabled'
  | 'error'
  | 'success';

export interface AccessibilityElement {
  element_id?: string;
  element_type: AccessibilityElementType;

  // Dimensions — used for touch target checks
  width_px?: number;
  height_px?: number;

  // Color — used for color-only conveyance checks
  color_hex?: string;
  background_color_hex?: string;

  // Color-only information conveyance (WCAG 1.4.1)
  uses_color_only?: boolean;        // true if color is the sole indicator of state/meaning
  has_text_label?: boolean;         // has a visible text label in addition to color
  has_icon_label?: boolean;         // has a supplementary icon
  has_pattern_or_shape?: boolean;   // uses shape/pattern as a secondary indicator

  // Focus indicator (WCAG 2.4.7 / 2.4.11)
  is_interactive?: boolean;
  focus_visible?: boolean;          // is focus indicator visible?
  focus_indicator_color_hex?: string;
  focus_indicator_background_color_hex?: string; // background behind the focus ring
  focus_indicator_width_px?: number;             // CSS outline/border width in px

  state?: InteractionState;
  context?: string;
}

export interface AccessibilitySet {
  elements: AccessibilityElement[];
  screen_name?: string;
  context?: string;
}

// ─── Output Types ───────────────────────────────────────────────────────────

export interface RubricIssue {
  criterion_id: string;
  criterion: string;
  severity: Severity;
  wcag_reference?: string;       // e.g. "WCAG 1.4.3"
  what_scanners_miss: string;    // why axe/Lighthouse won't catch this
  finding: string;               // what specifically is wrong
  recommendation: string;        // concrete fix
  passes_wcag_minimum: boolean;  // technically compliant?
  passes_design_judgment: boolean; // design-judgment compliant?
  measured_value?: string;       // e.g. "contrast ratio: 4.8:1, weight: 300"
}

export interface ElementEvaluation {
  element_id?: string;
  element_type: string;
  context?: string;
  issues: RubricIssue[];
  issue_count: { critical: number; major: number; minor: number };
  score: number; // 0–100, starts at 100 and deducts per issue
  passes: string[]; // things that are done correctly
}

export interface EvaluationReport {
  screen_name?: string;
  evaluated_at: string;
  element_evaluations: ElementEvaluation[];
  summary: {
    total_elements: number;
    elements_with_issues: number;
    total_issues: number;
    by_severity: { critical: number; major: number; minor: number };
    overall_score: number;
    verdict: 'pass' | 'needs_work' | 'fail';
  };
  top_issues: RubricIssue[];
}
