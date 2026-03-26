// ─── Official x402 Payment Middleware ───────────────────────────────────────
//
// This wraps the official @x402/express middleware so only paid MCP tools
// trigger payment requirements. Free MCP tools on the same /mcp endpoint
// continue to work without payment.
import { paymentMiddleware } from '@x402/express';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator as cdpFacilitator } from '@coinbase/x402';
export const TOOL_PRICING = {
    evaluate_typography: 0.05,
    evaluate_accessibility: 0.10,
};
// Only tools that are actually implemented should be billable.
export const BILLABLE_TOOLS = ['evaluate_typography'];
export const DEFAULT_X402_NETWORK = 'eip155:84532';
export const DEFAULT_X402_FACILITATOR_URL = 'https://x402.org/facilitator';
function extractToolName(body) {
    const requestBody = body;
    const params = requestBody?.params;
    const name = params?.name;
    return typeof name === 'string' ? name : undefined;
}
function isBillableTool(toolName) {
    return typeof toolName === 'string' && BILLABLE_TOOLS.includes(toolName);
}
function formatUsdPrice(amount) {
    return `$${amount.toFixed(2)}`;
}
function buildRoutesConfig(recipientAddress, network) {
    return {
        'POST /': {
            accepts: {
                scheme: 'exact',
                payTo: recipientAddress,
                network,
                price: async (context) => {
                    const toolName = extractToolName(context.adapter.getBody?.());
                    return formatUsdPrice(TOOL_PRICING[toolName ?? 'evaluate_typography'] ?? TOOL_PRICING.evaluate_typography);
                },
            },
            description: 'Paid Axcess MCP tool call',
            mimeType: 'application/json',
            unpaidResponseBody: async (context) => {
                const toolName = extractToolName(context.adapter.getBody?.());
                return {
                    contentType: 'application/json',
                    body: {
                        error: 'Payment required',
                        tool: toolName,
                        protocol: 'x402',
                        message: 'Inspect the PAYMENT-REQUIRED response header, create a payment payload, then retry with PAYMENT-SIGNATURE.',
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
    const network = (process.env.X402_NETWORK ?? DEFAULT_X402_NETWORK);
    const facilitatorUrl = process.env.X402_FACILITATOR_URL ?? DEFAULT_X402_FACILITATOR_URL;
    const recipientAddress = process.env.PAYMENT_ADDRESS ?? '';
    return {
        network,
        facilitatorUrl,
        recipientAddress,
    };
}
function logConfigWarnings() {
    const { network, facilitatorUrl, recipientAddress } = getX402Config();
    if (!recipientAddress) {
        console.error('[x402] WARNING: PAYMENT_ADDRESS not set in environment');
    }
    if (network === 'eip155:8453' && !process.env.CDP_API_KEY_ID) {
        console.error('[x402] WARNING: mainnet Base selected but CDP_API_KEY_ID is not set. Get a free API key at https://cdp.coinbase.com');
    }
}
export function x402PaymentMiddleware() {
    logConfigWarnings();
    const { network, facilitatorUrl, recipientAddress } = getX402Config();
    const isMainnet = network === 'eip155:8453';
    const facilitatorClient = isMainnet
        ? new HTTPFacilitatorClient(cdpFacilitator)
        : new HTTPFacilitatorClient({ url: facilitatorUrl });
    const resourceServer = new x402ResourceServer(facilitatorClient).register('eip155:*', new ExactEvmScheme());
    const officialMiddleware = paymentMiddleware(buildRoutesConfig(recipientAddress, network), resourceServer, {
        testnet: network === DEFAULT_X402_NETWORK,
        appName: 'Axcess MCP Server',
    });
    return async (req, res, next) => {
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
//# sourceMappingURL=x402.js.map