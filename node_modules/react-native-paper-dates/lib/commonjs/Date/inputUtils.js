"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useDateInput;
var _dateUtils = require("./dateUtils");
var _utils = require("../translations/utils");
var _react = require("react");
function useDateInput({
  locale,
  value,
  validRange,
  inputMode,
  onChange,
  onValidationError
}) {
  const formatter = (0, _dateUtils.useInputFormatter)({
    locale
  });
  const inputFormat = (0, _dateUtils.useInputFormat)({
    formatter,
    locale
  });
  const formattedValue = value ? formatter.format(value) : '';
  const [error, setError] = (0, _react.useState)(null);
  const {
    isDisabled,
    isWithinValidRange,
    validStart,
    validEnd
  } = (0, _dateUtils.useRangeChecker)(validRange);
  const onChangeText = date => {
    const dayIndex = inputFormat.indexOf('DD');
    const monthIndex = inputFormat.indexOf('MM');
    const yearIndex = locale === 'pt' ? inputFormat.indexOf('AAAA') : inputFormat.indexOf('YYYY');
    const day = Number(date.slice(dayIndex, dayIndex + 2));
    const year = Number(date.slice(yearIndex, yearIndex + 4));
    const month = Number(date.slice(monthIndex, monthIndex + 2));
    if (Number.isNaN(day) || Number.isNaN(year) || Number.isNaN(month)) {
      const inputError = (0, _utils.getTranslation)(locale, 'notAccordingToDateFormat', () => 'notAccordingToDateFormat')(inputFormat);
      setError(inputError);
      onValidationError && onValidationError(inputError);
      return;
    }
    const finalDate = inputMode === 'end' ? new Date(year, month - 1, day, 23, 59, 59) : new Date(year, month - 1, day);
    if (isDisabled(finalDate)) {
      const inputError = (0, _utils.getTranslation)(locale, 'dateIsDisabled');
      setError(inputError);
      onValidationError && onValidationError(inputError);
      return;
    }
    if (!isWithinValidRange(finalDate)) {
      let errors = validStart && validEnd ? [`${(0, _utils.getTranslation)(locale, 'mustBeBetween', () => 'mustBeBetween')(formatter.format(validStart), formatter.format(validEnd))}`] : [validStart ? (0, _utils.getTranslation)(locale, 'mustBeHigherThan', () => 'mustBeHigherThan')(formatter.format(validStart)) : '', validEnd ? (0, _utils.getTranslation)(locale, 'mustBeLowerThan', () => 'mustBeLowerThan')(formatter.format(validEnd)) : ''];
      const inputError = errors.filter(n => n).join(' ');
      setError(errors.filter(n => n).join(' '));
      onValidationError && onValidationError(inputError);
      return;
    }
    setError(null);
    onValidationError && onValidationError(null);
    if (inputMode === 'end') {
      onChange(finalDate);
    } else {
      onChange(finalDate);
    }
  };
  return {
    onChange,
    error,
    formattedValue,
    onChangeText,
    inputFormat
  };
}
//# sourceMappingURL=inputUtils.js.map