import type { ValidRangeType } from './Calendar';
export type DisableWeekDaysType = number[];
export declare function showWeekDay(dayIndex: number, disableWeekDays?: DisableWeekDaysType): boolean;
export declare function dateToUnix(d: Date): number;
export declare function addMonths(date: Date, count: number): Date;
export declare function getDaysInMonth({ year, month, }: {
    year: number;
    month: number;
}): number;
export declare function getFirstDayOfMonth({ year, month, startWeekOnMonday, }: {
    year: number;
    month: number;
    startWeekOnMonday: boolean;
}): number;
export declare function useRangeChecker(validRange: ValidRangeType | undefined): {
    isDisabled: (day: Date) => boolean;
    isWithinValidRange: (day: Date) => boolean;
    validStart: Date | undefined;
    validEnd: Date | undefined;
};
export declare function areDatesOnSameDay(a: Date, b?: Date | null | undefined): boolean;
export declare function isDateBetween(date: Date, { startDate, endDate, }: {
    startDate?: Date | null | undefined;
    endDate?: Date | null | undefined;
}): boolean;
/**
 * Check if a date is within an optional range.
 *
 * If the range doesn't exist, it defaults to `true`.
 */
export declare function isDateWithinOptionalRange(date: Date, { startUnix, endUnix, }: {
    startUnix: number | undefined;
    endUnix: number | undefined;
}): boolean;
export declare function isLeapYear({ year }: {
    year: number;
}): boolean;
export declare const daySize = 46;
export declare const estimatedMonthHeight = 360;
export declare const defaultStartYear = 1800;
export declare const defaultEndYear = 2200;
export declare function getStartAtIndex(startYear?: number, _endYear?: number): number;
export declare function getTotalMonths(startYear?: number, endYear?: number): number;
export declare function getBeginOffset(startYear?: number, endYear?: number): number;
export declare const startAtIndex = 2800;
export declare const totalMonths: number;
export declare const beginOffset: number;
export declare function createGridCounts(count: number): Array<number | undefined>;
export declare const gridCounts: (number | undefined)[];
export declare function getGridCount(index: number, startWeekOnMonday: boolean, startYear?: number, endYear?: number): number;
export declare function getGridCountForDate(date: Date, startWeekOnMonday: boolean): number;
export declare function getRealIndex(index: number, startYear?: number, endYear?: number): number;
export declare function getInitialIndex(date: Date | undefined, startYear?: number, endYear?: number): number;
export declare function useInputFormatter({ locale }: {
    locale: string | undefined;
}): Intl.DateTimeFormat;
export declare function getStartOfDay(d: Date): Date;
export declare function getEndOfDay(d: Date): Date;
export declare function useInputFormat({ formatter, locale, }: {
    formatter: Intl.DateTimeFormat;
    locale: string | undefined;
}): string;
export declare function differenceInMonths(firstDate: Date, secondDate: Date): number;
//# sourceMappingURL=dateUtils.d.ts.map