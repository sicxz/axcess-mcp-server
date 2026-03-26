# Axcess — Typography Accessibility Evaluation via MCP

A paid MCP server that evaluates typography for accessibility issues beyond what automated scanners catch.

**$0.05 USDC per evaluation · Base mainnet · x402 micropayments**

---

## What It Catches

Automated tools (axe, Lighthouse, WAVE) catch roughly 30% of WCAG failures and almost none of the design-judgment failures. Axcess evaluates:

- Contrast ratio with font-weight context — thin fonts require higher ratios than bold fonts at the same size
- Minimum font size for body text, captions, and labels
- Line height adequacy (including for dyslexic users)
- Line length (measure) comfort — too wide or too narrow
- Extended all-caps and italic use
- Letter spacing extremes
- Text on gradient, image, or pattern backgrounds
- Heading hierarchy and visual distinction between levels
- Display type scaling and tracking
- Bringhurst and Lupton design-craft rules beyond WCAG

---

## Connect as an MCP Client

### Claude.ai (web — Pro / Max / Team / Enterprise)

Settings → Integrations → Add MCP Server

```
https://axcess-mcp-server.fly.dev/mcp
```

### Claude Desktop / Cursor (via mcp-remote)

Add to `claude_desktop_config.json` (or Cursor MCP settings):

```json
{
  "mcpServers": {
    "axcess": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://axcess-mcp-server.fly.dev/mcp"
      ]
    }
  }
}
```

### Programmatic (AI agents and scripts)

Use `@x402/fetch` to handle payment automatically:

```typescript
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: 'eip155:*', client: new ExactEvmScheme(account) }],
});

const response = await fetchWithPayment(
  'https://axcess-mcp-server.fly.dev/mcp',
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'mcp-protocol-version': '2025-03-26',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'evaluate_typography',
        arguments: {
          screen_name: 'Hero Section',
          elements: [
            {
              element_type: 'heading',
              heading_level: 1,
              font_size: 48,
              font_weight: 300,
              line_height: 1.1,
              color_hex: '#888888',
              background_color_hex: '#ffffff',
            },
          ],
        },
      },
    }),
  }
);
```

See [`src/scripts/test_paid_tool.ts`](src/scripts/test_paid_tool.ts) for a complete working example.

---

## Pricing

| Tool | Price | Status |
|------|-------|--------|
| `list_capabilities` | Free | Live |
| `evaluate_typography` | $0.05 USDC | Live |
| `evaluate_accessibility` | $0.10 USDC | Coming soon |

Payment: USDC on Base mainnet (`eip155:8453`) via [x402 protocol](https://x402.org).

---

## Tools

### `list_capabilities` (free)

Returns available tools, pricing, and rubric categories. No payment required.

### `evaluate_typography` ($0.05)

Evaluates 1–50 typography elements and returns a structured accessibility report.

**Input:**

```typescript
{
  screen_name?: string;          // optional label for the report
  elements: Array<{
    element_id?: string;
    element_type: 'heading' | 'body' | 'caption' | 'label' | 'button' | 'display' | 'ui';
    heading_level?: 1 | 2 | 3 | 4 | 5 | 6;
    font_size: number;           // px
    font_weight: number;         // 100–900
    line_height: number;         // multiplier (e.g. 1.5, not px)
    letter_spacing?: number;     // em units
    text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    font_style?: 'normal' | 'italic' | 'oblique';
    content_length?: number;     // character count
    color_hex: string;           // '#rrggbb'
    background_color_hex: string;
    background_type?: 'solid' | 'gradient' | 'image' | 'pattern' | 'video';
    context?: string;            // e.g. 'hero section', 'navigation'
  }>;
}
```

**Output:**

```typescript
{
  screen_name?: string;
  evaluated_at: string;
  element_evaluations: Array<{
    element_id: string;
    element_type: string;
    issues: Array<{
      criterion_id: string;
      criterion: string;
      severity: 'critical' | 'major' | 'minor';
      wcag_reference: string;
      what_scanners_miss: string;
      finding: string;
      recommendation: string;
      passes_wcag_minimum: boolean;
      passes_design_judgment: boolean;
    }>;
    score: number;              // 0–100
    passes: string[];
  }>;
  summary: {
    overall_score: number;
    verdict: 'pass' | 'needs_work' | 'fail';
    total_issues: number;
    by_severity: { critical: number; major: number; minor: number };
  };
  top_issues: Issue[];
}
```

---

## Deploy to Fly.io (free tier)

Requirements: [flyctl](https://fly.io/docs/flyctl/install/), USDC wallet on Base, free CDP API key

```bash
fly auth login
fly launch --name axcess-mcp-server --no-deploy

# Set secrets (never committed to git)
fly secrets set PAYMENT_ADDRESS=0x...
fly secrets set X402_NETWORK=eip155:8453
fly secrets set CDP_API_KEY_ID=...
fly secrets set CDP_API_KEY_SECRET=...

fly deploy
```

Your app will be live at `https://axcess-mcp-server.fly.dev`.

Update the URL in [smithery.yaml](smithery.yaml) and the Connect section above before submitting to registries.

## Self-Hosting Locally

Requirements: Node.js 18+

```bash
git clone <repo>
cd axcess-mcp-server
cp .env.example .env
# Edit .env with your PAYMENT_ADDRESS, CDP keys, and X402_NETWORK
npm install
npm run build
npm start
```

**Local dev on testnet (no real payments):**

```bash
PAYMENT_ADDRESS=0x... X402_NETWORK=eip155:84532 npm run dev
EVM_PRIVATE_KEY=0x... npm run test:paid
```

See [`.env.example`](.env.example) for all configuration options.
