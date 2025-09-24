"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const ar = {
  save: 'حفظ',
  selectSingle: 'حدد تاريخ',
  selectMultiple: 'حدد التواريخ',
  selectRange: 'حدد الفترة',
  notAccordingToDateFormat: inputFormat => `يجب أن يكون تنسيق التاريخ ${inputFormat}`,
  mustBeHigherThan: date => `يجب أن يكون بعد  ${date}`,
  mustBeLowerThan: date => `يجب أن يكون قبل  ${date}`,
  mustBeBetween: (startDate, endDate) => `يجب أن يكون بين ${startDate} - ${endDate}`,
  dateIsDisabled: 'اليوم غير مسموح به',
  previous: 'السابق',
  next: 'التالي',
  typeInDate: 'اكتب التاريخ',
  pickDateFromCalendar: 'اختر التاريخ من التقويم',
  close: 'أغلق',
  hour: 'ساعة',
  minute: 'دقيقة'
};
var _default = exports.default = ar;
//# sourceMappingURL=ar.js.map