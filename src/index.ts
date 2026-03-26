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
