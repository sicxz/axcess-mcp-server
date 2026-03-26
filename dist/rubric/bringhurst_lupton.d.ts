import { TypographyElement, TypographySet, RubricIssue } from './types.js';
export declare function brng_measureTooWide(el: TypographyElement): RubricIssue | null;
export declare function brng_measureTooNarrow(el: TypographyElement): RubricIssue | null;
export declare function brng_leadingToMeasure(el: TypographyElement): RubricIssue | null;
export declare function brng_opticalSizeSmall(el: TypographyElement): RubricIssue | null;
export declare function brng_displayTracking(el: TypographyElement): RubricIssue | null;
export declare function brng_headingScale(el: TypographyElement, bodyFontSize: number): RubricIssue | null;
export declare function lupt_capsTracking(el: TypographyElement): RubricIssue | null;
export declare function lupt_weakHierarchy(el: TypographyElement): RubricIssue | null;
export declare function lupt_bodyWeight(el: TypographyElement): RubricIssue | null;
export declare function lupt_displayOverworked(el: TypographyElement): RubricIssue | null;
export declare function lupt_monotoneWeight(set: TypographySet): RubricIssue | null;
export declare function brng_sizeMonotony(set: TypographySet): RubricIssue | null;
export declare const BRINGHURST_LUPTON_ELEMENT_CHECKS: (typeof brng_measureTooWide)[];
export declare const BRINGHURST_LUPTON_SET_CHECKS: (typeof lupt_monotoneWeight)[];
//# sourceMappingURL=bringhurst_lupton.d.ts.map