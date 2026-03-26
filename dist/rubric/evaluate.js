// ─── Full Evaluation Report Builder ─────────────────────────────────────────
import { evaluateTypographyElement } from './typography.js';
import { BRINGHURST_LUPTON_SET_CHECKS } from './bringhurst_lupton.js';
export function evaluateTypographySet(input) {
    // Infer body font size from the set for scale-ratio checks
    const bodyElements = input.elements.filter((e) => ['body', 'caption'].includes(e.element_type));
    const bodyFontSize = bodyElements.length > 0
        ? Math.round(bodyElements.reduce((sum, e) => sum + e.font_size, 0) / bodyElements.length)
        : 16;
    const elementEvaluations = input.elements.map((el) => evaluateTypographyElement(el, bodyFontSize));
    // Run set-level checks (Bringhurst/Lupton rules that require seeing all elements)
    const setLevelIssues = BRINGHURST_LUPTON_SET_CHECKS
        .map((fn) => fn(input))
        .filter((issue) => issue !== null);
    // Attach set-level issues to first element for reporting, or create a synthetic entry
    if (setLevelIssues.length > 0) {
        const setEval = {
            element_id: 'set-level',
            element_type: 'set',
            context: `Set-level analysis: ${input.screen_name ?? 'all elements'}`,
            issues: setLevelIssues,
            issue_count: {
                critical: setLevelIssues.filter((i) => i.severity === 'critical').length,
                major: setLevelIssues.filter((i) => i.severity === 'major').length,
                minor: setLevelIssues.filter((i) => i.severity === 'minor').length,
            },
            score: Math.max(0, 100 - setLevelIssues.reduce((s, i) => s + (i.severity === 'critical' ? 25 : i.severity === 'major' ? 15 : 5), 0)),
            passes: [],
        };
        elementEvaluations.push(setEval);
    }
    const allIssues = elementEvaluations.flatMap((e) => e.issues);
    const bySeverity = {
        critical: allIssues.filter((i) => i.severity === 'critical').length,
        major: allIssues.filter((i) => i.severity === 'major').length,
        minor: allIssues.filter((i) => i.severity === 'minor').length,
    };
    const elementsWithIssues = elementEvaluations.filter((e) => e.issues.length > 0).length;
    const overallScore = elementEvaluations.length > 0
        ? Math.round(elementEvaluations.reduce((sum, e) => sum + e.score, 0) / elementEvaluations.length)
        : 100;
    const verdict = bySeverity.critical > 0 || overallScore < 50
        ? 'fail'
        : bySeverity.major > 0 || overallScore < 75
            ? 'needs_work'
            : 'pass';
    // Surface the most severe issues first
    const topIssues = [...allIssues]
        .sort((a, b) => {
        const order = { critical: 0, major: 1, minor: 2 };
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
//# sourceMappingURL=evaluate.js.map