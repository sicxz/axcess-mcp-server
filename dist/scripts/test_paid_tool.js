import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';
const serverUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3000/mcp';
const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey) {
    console.error('EVM_PRIVATE_KEY is required.');
    console.error('Example: EVM_PRIVATE_KEY=0x... npm run test:paid');
    process.exit(1);
}
const account = privateKeyToAccount(privateKey);
const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
        {
            network: 'eip155:*',
            client: new ExactEvmScheme(account),
        },
    ],
});
const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'evaluate_typography',
        arguments: {
            elements: [
                {
                    element_type: 'body',
                    font_size: 14,
                    font_weight: 400,
                    line_height: 1.4,
                    color_hex: '#777777',
                    background_color_hex: '#ffffff',
                },
            ],
        },
    },
};
async function main() {
    const response = await fetchWithPayment(serverUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            'mcp-protocol-version': '2025-03-26',
        },
        body: JSON.stringify(body),
    });
    const settlementHeader = response.headers.get('PAYMENT-RESPONSE');
    if (settlementHeader) {
        const settlement = decodePaymentResponseHeader(settlementHeader);
        console.log('Settlement:');
        console.log(JSON.stringify(settlement, null, 2));
    }
    const payload = await response.json();
    console.log('Status:', response.status);
    console.log(JSON.stringify(payload, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=test_paid_tool.js.map