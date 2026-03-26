// ─── MCP Server — Tool Registration ─────────────────────────────────────────

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SERVER_NAME, SERVER_VERSION, PRICING_INFO } from './constants.js';
import { evaluateTypographySet } from './rubric/evaluate.js';
import { evaluateTypographyElement } from './rubric/typography.js';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const TypographyElementSchema = z.object({
  element_id: z.string().optional().describe('Optional ID for tracking (e.g. Figma node ID)'),
  element_type: z
    .enum(['heading', 'body', 'caption', 'label', 'button', 'display', 'ui'])
    .describe('Semantic role of the text element'),
  heading_level: z.number().int().min(1).max(6).optional()
    .describe('Heading level if element_type is heading (1–6)'),
  font_size: z.number().positive().describe('Font size in px'),
  font_weight: z.number().int().min(100).max(900)
    .describe('Font weight (100=thin, 400=regular, 700=bold, 900=black)'),
  line_height: z.number().positive()
    .describe('Line height as a multiplier (e.g. 1.5, not px)'),
  letter_spacing: z.number().optional()
    .describe('Letter spacing in em (e.g. -0.02 for tight, 0.05 for loose)'),
  text_transform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional()
    .describe('CSS text-transform value'),
  font_style: z.enum(['normal', 'italic']).optional()
    .describe('CSS font-style'),
  content_length: z.number().int().min(0).optional()
    .describe('Character count of the actual text content'),
  color_hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .describe('Text color as hex (e.g. #1a1a1a)'),
  background_color_hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .describe('Background color as hex (e.g. #ffffff)'),
  background_type: z.enum(['solid', 'gradient', 'image', 'pattern']).optional()
    .describe('Background type — non-solid backgrounds require special handling'),
  context: z.string().optional()
    .describe('Brief description of role in design (e.g. "hero heading", "footer legal copy")'),
});

const EvaluateTypographyInputSchema = z.object({
  elements: z.array(TypographyElementSchema).min(1).max(50)
    .describe('Array of typography elements to evaluate'),
  screen_name: z.string().optional()
    .describe('Name of the screen or component being evaluated'),
}).strict();

// ─── Server Instance ──────────────────────────────────────────────────────────

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // ── Tool: list_capabilities (FREE) ─────────────────────────────────────────
  server.registerTool(
    'list_capabilities',
    {
      title: 'List Axcess Capabilities & Pricing',
      description: `Returns available evaluation tools, what they check, and their pricing.
Call this first to understand what Axcess can evaluate and how much each evaluation costs.

This tool is FREE. All evaluation tools require USDC payment on Base network.

Returns: JSON with tool descriptions, pricing, and rubric categories.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const capabilities = {
        service: 'Axcess — Principled Design Accessibility Evaluation',
        description:
          'Evaluates design work against an expert-crafted accessibility rubric that goes beyond WCAG technical compliance. Catches issues automated scanners miss because they require design judgment.',
        tools: [
          {
            name: 'evaluate_typography',
            price: PRICING_INFO.evaluate_typography,
            description:
              'Evaluates typography elements for accessibility issues beyond WCAG minimums. Checks contrast with font-weight context, minimum sizes, line height, line length, all-caps, extended italic, letter spacing, text on non-solid backgrounds, and heading hierarchy.',
            input: 'Array of typography element property objects (extracted from Figma, DOM, or design specs)',
            output: 'Structured report with per-element scores, specific issues, WCAG references, and fix recommendations',
          },
          {
            name: 'evaluate_accessibility',
            price: PRICING_INFO.evaluate_accessibility,
            description:
              'Full accessibility evaluation combining typography, color, and interaction checks. Produces an overall compliance score and prioritized issue list.',
            status: 'coming_soon',
          },
        ],
        rubric_categories: [
          'Typography: contrast with weight context, minimum size, line height, line length, extended all-caps/italic, tracking, text on non-solid backgrounds',
          'Color: contrast ratio, information conveyed by color alone, focus indicator visibility',
          'Interaction: touch target sizing, focus order reasonableness (coming soon)',
        ],
        what_makes_this_different:
          'Automated scanners (axe, Lighthouse, WAVE) catch ~30% of WCAG failures. They fail on design-time files (Figma), cannot evaluate perceived legibility vs. numeric compliance, and have no concept of design principles. This rubric was built by a visual communication design educator with 18 years of critique experience.',
        payment: {
          protocol: 'x402',
          network: 'Base Sepolia by default; configurable via X402_NETWORK/X402_FACILITATOR_URL',
          token: 'USDC',
          instructions:
            'Read the PAYMENT-REQUIRED header from the 402 response, create a payment payload, then retry with PAYMENT-SIGNATURE.',
        },
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(capabilities, null, 2) }],
        structuredContent: capabilities,
      };
    }
  );

  // ── Tool: evaluate_typography (PAID — $0.05) ───────────────────────────────
  server.registerTool(
    'evaluate_typography',
    {
      title: 'Evaluate Typography Accessibility',
      description: `Evaluates typography elements against a principled accessibility rubric.

COST: $0.05 USDC via x402 on Base-compatible EVM network per call.

Goes beyond what axe/Lighthouse/WAVE can check — evaluates design judgment, not just
numeric compliance. Catches issues like:
- Contrast that passes WCAG 4.5:1 but fails visually due to thin font weight
- Body text that meets minimum size requirements but is still too small for comfortable reading
- Line heights that technically comply but impede readability for dyslexic users
- Extended all-caps or italic text that passes all AA criteria but impairs reading
- Text on gradient/image backgrounds where scanner sampling is unreliable
- Heading sizes that are technically correct but visually indistinct from body

Args:
  - elements: Array of 1–50 typography element objects with font/color properties
  - screen_name: Optional label for the evaluation report

Each element requires: element_type, font_size, font_weight, line_height, color_hex, background_color_hex.

Returns: Structured report with:
  - Per-element scores (0–100)
  - Specific issues with severity (critical/major/minor)
  - WCAG references and what automated tools miss
  - Concrete fix recommendations
  - Overall score and verdict (pass/needs_work/fail)
  - Top issues sorted by severity

Example use: Extract text layer properties from Figma using get_design_context,
pass the typography properties to this tool for evaluation before shipping.`,
      inputSchema: EvaluateTypographyInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ elements, screen_name }) => {
      const report = evaluateTypographySet({ elements, screen_name });

      // Truncate if necessary
      const output = JSON.stringify(report, null, 2);
      const truncated = output.length > 25000
        ? JSON.stringify({ ...report, truncated: true, note: 'Response truncated. Evaluate in smaller batches.' }, null, 2)
        : output;

      return {
        content: [{ type: 'text', text: truncated }],
        structuredContent: report as unknown as Record<string, unknown>,
      };
    }
  );

  return server;
}
