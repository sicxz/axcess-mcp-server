import type { NextFunction, Request, Response } from 'express';
import type { Network } from '@x402/core/types';
export declare const TOOL_PRICING: Record<string, number>;
export declare const BILLABLE_TOOLS: readonly ["evaluate_typography"];
export declare const DEFAULT_X402_NETWORK: Network;
export declare const DEFAULT_X402_FACILITATOR_URL = "https://x402.org/facilitator";
export declare function getX402Config(): {
    network: `${string}:${string}`;
    facilitatorUrl: string;
    recipientAddress: string;
};
export declare function x402PaymentMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=x402.d.ts.map