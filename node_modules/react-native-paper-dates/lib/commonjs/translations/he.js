"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const he = {
  save: 'שמור',
  selectSingle: 'בחר תאריך',
  selectMultiple: 'בחר תאריכים',
  selectRange: 'בחר טווח',
  notAccordingToDateFormat: inputFormat => `פורמט של תאריך צריך להיות ${inputFormat}`,
  mustBeHigherThan: date => `חייב להיות אחרי ${date}`,
  mustBeLowerThan: date => `חייב להיות לפני ${date}`,
  mustBeBetween: (startDate, endDate) => `חייב להיות בין ${startDate} - ${endDate}`,
  dateIsDisabled: 'יום לא מורשה',
  previous: 'הקודם',
  next: 'הבא',
  typeInDate: 'הקש תאריך',
  pickDateFromCalendar: 'בחר תאריך מהלוח שנה',
  close: 'סגור',
  hour: 'שעה',
  minute: 'דקה'
};
var _default = exports.default = he;
//# sourceMappingURL=he.js.map