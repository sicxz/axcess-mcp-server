export type ElementType = 'heading' | 'body' | 'caption' | 'label' | 'button' | 'display' | 'ui';
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern';
export type Severity = 'critical' | 'major' | 'minor';
export interface TypographyElement {
    element_id?: string;
    element_type: ElementType;
    heading_level?: number;
    font_size: number;
    font_weight: number;
    line_height: number;
    letter_spacing?: number;
    text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    font_style?: 'normal' | 'italic';
    content_length?: number;
    color_hex: string;
    background_color_hex: string;
    background_type?: BackgroundType;
    context?: string;
}
export interface TypographySet {
    elements: TypographyElement[];
    screen_name?: string;
    context?: string;
}
export interface RubricIssue {
    criterion_id: string;
    criterion: string;
    severity: Severity;
    wcag_reference?: string;
    what_scanners_miss: string;
    finding: string;
    recommendation: string;
    passes_wcag_minimum: boolean;
    passes_design_judgment: boolean;
    measured_value?: string;
}
export interface ElementEvaluation {
    element_id?: string;
    element_type: string;
    context?: string;
    issues: RubricIssue[];
    issue_count: {
        critical: number;
        major: number;
        minor: number;
    };
    score: number;
    passes: string[];
}
export interface EvaluationReport {
    screen_name?: string;
    evaluated_at: string;
    element_evaluations: ElementEvaluation[];
    summary: {
        total_elements: number;
        elements_with_issues: number;
        total_issues: number;
        by_severity: {
            critical: number;
            major: number;
            minor: number;
        };
        overall_score: number;
        verdict: 'pass' | 'needs_work' | 'fail';
    };
    top_issues: RubricIssue[];
}
//# sourceMappingURL=types.d.ts.map