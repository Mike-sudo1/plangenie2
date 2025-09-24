import type { ValidRangeType } from './Calendar';
export default function useDateInput({ locale, value, validRange, inputMode, onChange, onValidationError, }: {
    onChange: (d: Date) => void;
    locale: undefined | string;
    value: Date | undefined;
    validRange: ValidRangeType | undefined;
    inputMode: 'start' | 'end';
    onValidationError?: ((error: string | null) => void) | undefined;
}): {
    onChange: (d: Date) => void;
    error: string | null;
    formattedValue: string;
    onChangeText: (date: string) => void;
    inputFormat: string;
};
//# sourceMappingURL=inputUtils.d.ts.map