import { TextInputProps } from 'react-native';
import { PossibleClockTypes, PossibleInputTypes } from './timeUtils';
interface TimeInputProps extends Omit<Omit<Omit<TextInputProps, 'value'>, 'onFocus'>, 'onPress'> {
    value: number;
    clockType: PossibleClockTypes;
    onPress?: (type: PossibleClockTypes) => any;
    pressed: boolean;
    onChanged: (n: number) => any;
    inputType: PossibleInputTypes;
    inputFontSize?: number;
}
declare const _default: import("react").ForwardRefExoticComponent<TimeInputProps & import("react").RefAttributes<unknown>>;
export default _default;
//# sourceMappingURL=TimeInput.d.ts.map