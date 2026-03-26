# Axcess — Typography Accessibility Evaluation

## What it does

Evaluates typography elements for accessibility issues that automated scanners (axe, Lighthouse, WAVE) miss. Returns per-element scores, severity-ranked issues, WCAG references, and fix recommendations.

Automated scanners catch ~30% of real accessibility issues. Axcess catches the rest: contrast failures on thin-weight fonts, body text below readable base sizes, weak heading hierarchy, line height and measure problems, extended all-caps and italic use, and Bringhurst/Lupton typographic craft failures.

## Endpoint

```
POST https://axcess-mcp-server.fly.dev/mcp
```

Protocol: MCP (Model Context Protocol) over HTTP
Payment: x402 — $0.005 USDC per call on Base mainnet (eip155:8453)

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
      "criterion_id": "TYP-CONTRAST-FAIL",
      "severity": "critical",
      "finding": "Contrast ratio is 4.48:1. Required minimum is 4.5:1.",
      "recommendation": "Increase contrast to at least 4.5:1.",
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
