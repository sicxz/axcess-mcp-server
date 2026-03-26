export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
export declare function relativeLuminance(hex: string): number | null;
export declare function contrastRatio(fg: string, bg: string): number | null;
export declare const WCAG_AA_NORMAL = 4.5;
export declare const WCAG_AA_LARGE = 3;
export declare const WCAG_AAA_NORMAL = 7;
export declare const WCAG_AAA_LARGE = 4.5;
export declare function isLargeText(fontSizePx: number, fontWeight: number): boolean;
//# sourceMappingURL=color.d.ts.map