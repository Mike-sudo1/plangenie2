import { type MutableRefObject } from 'react';
export type RenderProps = {
    index: number;
    onNext: () => any;
    onPrev: () => any;
};
export type SwiperProps = {
    initialIndex: number;
    scrollMode: 'horizontal' | 'vertical';
    renderItem: (renderProps: RenderProps) => any;
    renderHeader?: (renderProps: RenderProps) => any;
    renderFooter?: (renderProps: RenderProps) => any;
    selectedYear: number | undefined;
    startWeekOnMonday: boolean;
    startYear?: number;
    endYear?: number;
};
export declare function getMinIndex(startYear?: number, endYear?: number): number;
export declare function getMaxIndex(startYear?: number, endYear?: number): number;
export declare function isIndexWithinRange(index: number, startYear?: number, endYear?: number): boolean;
export declare function useYearChange(onChange: (index: number | undefined) => void, { selectedYear, currentIndexRef, startYear, endYear, }: {
    currentIndexRef: MutableRefObject<number>;
    selectedYear: number | undefined;
    startYear?: number;
    endYear?: number;
}): void;
//# sourceMappingURL=SwiperUtils.d.ts.map