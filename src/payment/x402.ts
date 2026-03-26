// ─── Official x402 Payment Middleware ───────────────────────────────────────
//
// This wraps the official @x402/express middleware so only paid MCP tools
// trigger payment requirements. Free MCP tools on the same /mcp endpoint
// continue to work without payment.

import type { NextFunction, Request, Response } from 'express';
import { paymentMiddleware } from '@x402/express';
import type { HTTPRequestContext, RoutesConfig } from '@x402/core/server';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import type { Network } from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator as cdpFacilitator } from '@coinbase/x402';

export const TOOL_PRICING: Record<string, number> = {
  evaluate_typography: 0.005,
  evaluate_accessibility: 0.10,
};

// Only tools that are actually implemented should be billable.
export const BILLABLE_TOOLS = ['evaluate_typography'] as const;

export const DEFAULT_X402_NETWORK: Network = 'eip155:84532';
export const DEFAULT_X402_FACILITATOR_URL = 'https://x402.org/facilitator';

function extractToolName(body: unknown): string | undefined {
  const requestBody = body as Record<string, unknown> | undefined;
  const params = requestBody?.params as Record<string, unknown> | undefined;
  const name = params?.name;
  return typeof name === 'string' ? name : undefined;
}

function isBillableTool(toolName: string | undefined): toolName is typeof BILLABLE_TOOLS[number] {
  return typeof toolName === 'string' && BILLABLE_TOOLS.includes(toolName as typeof BILLABLE_TOOLS[number]);
}

function formatUsdPrice(amount: number): `$${string}` {
  return `$${amount.toFixed(2)}`;
}

function buildRoutesConfig(recipientAddress: string, network: Network): RoutesConfig {
  return {
    'POST /': {
      accepts: {
        scheme: 'exact',
        payTo: recipientAddress,
        network,
        price: async (context: HTTPRequestContext) => {
          const toolName = extractToolName(context.adapter.getBody?.());
          return formatUsdPrice(TOOL_PRICING[toolName ?? 'evaluate_typography'] ?? TOOL_PRICING.evaluate_typography);
        },
      },
      description: 'Paid Axcess MCP tool call',
      mimeType: 'application/json',
      unpaidResponseBody: async (context: HTTPRequestContext) => {
        const toolName = extractToolName(context.adapter.getBody?.());
        return {
          contentType: 'application/json',
          body: {
            error: 'Payment required',
            tool: toolName,
            protocol: 'x402',
            message:
              'Inspect the PAYMENT-REQUIRED response header, create a payment payload, then retry with PAYMENT-SIGNATURE.',
          },
        };
      },
      settlementFailedResponseBody: async (_context, settleResult) => {
        return {
          contentType: 'application/json',
          body: {
            error: 'Payment settlement failed',
            reason: settleResult.errorReason,
            message: settleResult.errorMessage,
          },
        };
      },
    },
  };
}

export function getX402Config() {
  const network = (process.env.X402_NETWORK ?? DEFAULT_X402_NETWORK) as Network;
  const facilitatorUrl = process.env.X402_FACILITATOR_URL ?? DEFAULT_X402_FACILITATOR_URL;
  const recipientAddress = process.env.PAYMENT_ADDRESS ?? '';

  return {
    network,
    facilitatorUrl,
    recipientAddress,
  };
}

function logConfigWarnings(): void {
  const { network, facilitatorUrl, recipientAddress } = getX402Config();

  if (!recipientAddress) {
    console.error('[x402] WARNING: PAYMENT_ADDRESS not set in environment');
  }

  if (network === 'eip155:8453' && !process.env.CDP_API_KEY_ID) {
    console.error(
      '[x402] WARNING: mainnet Base selected but CDP_API_KEY_ID is not set. Get a free API key at https://cdp.coinbase.com'
    );
  }
}

export function x402PaymentMiddleware() {
  logConfigWarnings();

  const { network, facilitatorUrl, recipientAddress } = getX402Config();
  const isMainnet = network === 'eip155:8453';
  const facilitatorClient = isMainnet
    ? new HTTPFacilitatorClient(cdpFacilitator)
    : new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    'eip155:*',
    new ExactEvmScheme()
  );

  const officialMiddleware = paymentMiddleware(
    buildRoutesConfig(recipientAddress, network),
    resourceServer,
    {
      testnet: network === DEFAULT_X402_NETWORK,
      appName: 'Axcess MCP Server',
    }
  );

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'POST') {
      next();
      return;
    }

    const toolName = extractToolName(req.body);
    if (!isBillableTool(toolName)) {
      next();
      return;
    }

    await officialMiddleware(req, res, next);
  };
}
