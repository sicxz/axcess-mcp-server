# Axcess — Design Accessibility Evaluation

## What it does

Evaluates UI designs for accessibility issues that automated scanners (axe, Lighthouse, WAVE) miss. Two paid tools: typography evaluation and UI accessibility evaluation. Returns per-element scores, severity-ranked issues, WCAG references, and fix recommendations.

Automated scanners catch ~30% of real accessibility issues. Axcess catches the rest: contrast failures on thin-weight fonts, body text below readable base sizes, weak heading hierarchy, touch targets below minimum size, color-only state conveyance, missing or low-quality focus indicators.

## Endpoint

```
POST https://axcess-mcp-server.fly.dev/mcp
```

Protocol: MCP (Model Context Protocol) over HTTP
Payment: x402 — USDC on Base mainnet (eip155:8453)

## Tools

### list_capabilities
Free. Returns available tools, pricing, and rubric categories.

### evaluate_typography
**Cost: $0.005 USDC**

Input: 1–50 typography element objects

```json
{
  "screen_name": "Hero Section",
  "elements": [
    {
      "element_type": "body",
      "font_size": 14,
      "font_weight": 400,
      "line_height": 1.4,
      "color_hex": "#666666",
      "background_color_hex": "#ffffff"
    }
  ]
}
```

Output: per-element issues with severity (critical/major/minor), WCAG reference, finding, recommendation, and overall verdict (pass/needs_work/fail).

### evaluate_accessibility
**Cost: $0.01 USDC**

Input: 1–50 UI element objects

```json
{
  "screen_name": "Login Screen",
  "elements": [
    {
      "element_type": "button",
      "width_px": 40,
      "height_px": 32,
      "is_interactive": true,
      "focus_visible": true,
      "focus_indicator_color_hex": "#0057d8",
      "focus_indicator_background_color_hex": "#ffffff",
      "focus_indicator_width_px": 2,
      "context": "Submit button"
    }
  ]
}
```

Checks: touch target sizing (WCAG 2.5.5/2.5.8), color-only information conveyance (WCAG 1.4.1), focus indicator presence and contrast (WCAG 2.4.7/2.4.11).

Output: per-element issues with severity (critical/major/minor), WCAG reference, finding, recommendation, and overall verdict (pass/needs_work/fail).

## What agents get back

```json
{
  "summary": {
    "overall_score": 60,
    "verdict": "fail",
    "by_severity": { "critical": 1, "major": 1, "minor": 0 }
  },
  "top_issues": [
    {
      "criterion_id": "ACC-TOUCH-CRITICAL",
      "severity": "critical",
      "finding": "Target measures 40×20px. WCAG 2.5.8 requires a minimum of 24×24px.",
      "recommendation": "Increase the touch target to at least 24×24px.",
      "passes_wcag_minimum": false
    }
  ]
}
```

## Payment

Uses x402 protocol. Client needs a wallet funded with USDC on Base mainnet.
Recommended: `@x402/fetch` (npm) handles the 402 → pay → retry loop automatically.
Payment goes directly to seller wallet. No invoices. No chargebacks.

## Use cases for agents

- Pre-ship accessibility audit on UI designs
- Validate AI-generated layouts before delivery
- Check design system tokens against accessibility standards
- Flag compliance issues before legal review
- Evaluate contractor or student work against objective rubric

## Source

https://github.com/sicxz/axcess-mcp-server
