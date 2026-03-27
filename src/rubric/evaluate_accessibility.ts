// ─── Accessibility Evaluation Report Builder ─────────────────────────────────

import { AccessibilitySet, EvaluationReport, ElementEvaluation, RubricIssue } from './types.js';
import { ACCESSIBILITY_ELEMENT_CHECKS } from './accessibility.js';

function evaluateAccessibilityElement(el: AccessibilitySet['elements'][number]): ElementEvaluation {
  const issues: RubricIssue[] = ACCESSIBILITY_ELEMENT_CHECKS
    .map((fn) => fn(el))
    .filter((issue): issue is RubricIssue => issue !== null);

  const issueCounts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };

  const score = Math.max(
    0,
    100 -
      issueCounts.critical * 25 -
      issueCounts.major * 15 -
      issueCounts.minor * 5
  );

  const passes: string[] = [];
  const isInteractiveEl =
    el.is_interactive === true ||
    ['button', 'link', 'input', 'checkbox', 'radio', 'select', 'navigation'].includes(
      el.element_type
    );

  if (isInteractiveEl) {
    if (el.focus_visible === true) passes.push('Focus indicator present');
    const w = el.width_px ?? 0;
    const h = el.height_px ?? 0;
    if (w >= 44 && h >= 44) passes.push('Touch target meets 44×44px recommended size');
    else if (w >= 24 && h >= 24) passes.push('Touch target meets 24×24px minimum');
  }
  if (el.uses_color_only === true) {
    if (
      el.has_text_label === true ||
      el.has_icon_label === true ||
      el.has_pattern_or_shape === true
    ) {
      passes.push('Color-coded information has a secondary non-color indicator');
    }
  }

  return {
    element_id: el.element_id,
    element_type: el.element_type,
    context: el.context,
    issues,
    issue_count: issueCounts,
    score,
    passes,
  };
}

export function evaluateAccessibilitySet(input: AccessibilitySet): EvaluationReport {
  const elementEvaluations: ElementEvaluation[] = input.elements.map((el) =>
    evaluateAccessibilityElement(el)
  );

  const allIssues = elementEvaluations.flatMap((e) => e.issues);
  const bySeverity = {
    critical: allIssues.filter((i) => i.severity === 'critical').length,
    major: allIssues.filter((i) => i.severity === 'major').length,
    minor: allIssues.filter((i) => i.severity === 'minor').length,
  };

  const elementsWithIssues = elementEvaluations.filter((e) => e.issues.length > 0).length;
  const overallScore =
    elementEvaluations.length > 0
      ? Math.round(
          elementEvaluations.reduce((sum, e) => sum + e.score, 0) / elementEvaluations.length
        )
      : 100;

  const verdict =
    bySeverity.critical > 0 || overallScore < 50
      ? 'fail'
      : bySeverity.major > 0 || overallScore < 75
      ? 'needs_work'
      : 'pass';

  const topIssues = [...allIssues]
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, major: 1, minor: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);

  return {
    screen_name: input.screen_name,
    evaluated_at: new Date().toISOString(),
    element_evaluations: elementEvaluations,
    summary: {
      total_elements: elementEvaluations.length,
      elements_with_issues: elementsWithIssues,
      total_issues: allIssues.length,
      by_severity: bySeverity,
      overall_score: overallScore,
      verdict,
    },
    top_issues: topIssues,
  };
}
