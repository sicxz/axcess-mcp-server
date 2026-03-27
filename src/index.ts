#!/usr/bin/env node
// ─── Axcess MCP Server — Entry Point ────────────────────────────────────────
//
// HTTP transport with official x402 payment middleware.
// AI agents call /mcp — free tools pass through, paid tools require x402.
//
// Environment variables:
//   PORT                 Server port (default: 3000)
//   PAYMENT_ADDRESS      Your USDC recipient address on Base
//   X402_NETWORK         CAIP-2 network identifier (default: eip155:84532 / Base Sepolia)
//   X402_FACILITATOR_URL Facilitator base URL (default: https://x402.org/facilitator)
//   TRANSPORT            "http" (default) or "stdio" for local use

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { getX402Config, x402PaymentMiddleware } from './payment/x402.js';

const PORT = parseInt(process.env.PORT ?? '3000');
const TRANSPORT = process.env.TRANSPORT ?? 'http';

// ─── HTTP Mode (default) ─────────────────────────────────────────────────────

async function runHTTP(): Promise<void> {
  if (!process.env.PAYMENT_ADDRESS) {
    console.error('WARNING: PAYMENT_ADDRESS not set. Set it to your Base USDC address.');
  }

  const x402Config = getX402Config();
  const app = express();
  app.use(express.json());

  // Health check (free)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'axcess-mcp-server',
      version: '0.1.0',
      transport: 'http',
      x402: {
        network: x402Config.network,
        facilitatorUrl: x402Config.facilitatorUrl,
        recipientConfigured: Boolean(x402Config.recipientAddress),
      },
    });
  });

  // llms.txt — AI-readable description of this service
  app.get('/llms.txt', (_req, res) => {
    res.type('text/plain').send(`# Axcess — Design Accessibility Evaluation

A paid MCP server that evaluates UI designs for accessibility issues beyond what automated scanners catch.
Built by a visual communication design educator with 18 years of critique experience.

## Endpoint
MCP Server: https://axcess-mcp-server.fly.dev/mcp
Protocol: Model Context Protocol (MCP) over HTTP
Payment: x402 — USDC on Base mainnet (eip155:8453)

## Tools

### list_capabilities
Free. Returns available tools, pricing, and rubric categories.
No payment required.

### evaluate_typography
Cost: $0.005 USDC (paid automatically via x402)
Input: 1–50 typography element objects + optional screen_name
Output: per-element accessibility scores, issues with severity, WCAG references, fix recommendations

Required fields per element:
- element_type: heading | body | caption | label | button | display | ui
- font_size: number (px)
- font_weight: number (100–900)
- line_height: number (multiplier, e.g. 1.5)
- color_hex: string (#rrggbb)
- background_color_hex: string (#rrggbb)

Optional fields:
- element_id, heading_level, letter_spacing, text_transform, font_style
- content_length, background_type, context

### evaluate_accessibility
Cost: $0.01 USDC (paid automatically via x402)
Input: 1–50 UI element objects + optional screen_name
Output: per-element issues for touch targets, color conveyance, and focus indicators

Required fields per element:
- element_type: button | link | input | checkbox | radio | select | icon | badge | alert | text | image | navigation | heading

Optional fields (provide what you have — each unlocks more checks):
- width_px, height_px: enables touch target checks (WCAG 2.5.5 / 2.5.8)
- uses_color_only, has_text_label, has_icon_label, has_pattern_or_shape: enables color conveyance check (WCAG 1.4.1)
- is_interactive, focus_visible: enables focus presence check (WCAG 2.4.7)
- focus_indicator_color_hex, focus_indicator_background_color_hex, focus_indicator_width_px: enables focus quality checks (WCAG 2.4.11)
- state, context

## What It Catches That axe / Lighthouse / WAVE Miss

### Typography
- Contrast failures on thin-weight fonts (scanners use flat thresholds regardless of weight)
- Body text below 16px (WCAG only requires text to be resizable, not that it starts readable)
- Line height too tight for dyslexic users
- Line length (measure) outside comfortable reading range
- Extended all-caps and italic use that degrades readability
- Letter spacing extremes that impair word recognition
- Text on gradient, image, or pattern backgrounds (requires manual flag)
- Weak heading hierarchy — headings that lack visual distinction from body text
- Bringhurst and Lupton typographic craft rules beyond WCAG minimum compliance

### UI Accessibility
- Touch targets below 24×24px (WCAG 2.5.8 AA hard fail)
- Touch targets below 44×44px (WCAG 2.5.5 AAA recommended)
- Color as the only indicator of state or meaning, with no secondary indicator (WCAG 1.4.1)
- Interactive elements with no visible focus ring (WCAG 2.4.7)
- Focus rings thinner than 2px (WCAG 2.4.11)
- Focus ring contrast below 3:1 against adjacent background (WCAG 2.4.11)

## Verdict Scale
- pass: no critical issues, overall score >= 75
- needs_work: major issues or score < 75
- fail: any critical issue or score < 50

## Payment
Uses x402 protocol. Clients need a wallet funded with USDC on Base mainnet.
Recommended client library: @x402/fetch (npm)
Network: eip155:8453 (Base mainnet)

## Source
https://github.com/sicxz/axcess-mcp-server
`);
  });

  // x402 payment gate — runs before MCP processes the request
  app.use('/mcp', x402PaymentMiddleware());

  // MCP endpoint
  app.post('/mcp', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get('/mcp', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });

  app.listen(PORT, () => {
    console.error(`Axcess MCP server running at http://localhost:${PORT}/mcp`);
    console.error(`Health check: http://localhost:${PORT}/health`);
    console.error(`x402 network: ${x402Config.network}`);
    console.error(`x402 facilitator: ${x402Config.facilitatorUrl}`);
  });
}

// ─── stdio Mode (for local Cowork/Claude Code integration) ───────────────────

async function runStdio(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Axcess MCP server running via stdio');
}

// ─── Start ───────────────────────────────────────────────────────────────────

if (TRANSPORT === 'stdio') {
  runStdio().catch((err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
} else {
  runHTTP().catch((err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}
