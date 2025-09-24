"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const th = {
  save: 'บันทึก',
  selectSingle: 'เลือกวันที่',
  selectMultiple: 'เลือกวันที่',
  selectRange: 'เลือกช่วงวันที่',
  notAccordingToDateFormat: inputFormat => `รูปแบบวันที่จะต้องเป็น ${inputFormat}`,
  mustBeHigherThan: date => `ต้องอยู่ภายหลังวันที่ ${date}`,
  mustBeLowerThan: date => `ต้องอยู่ก่อนวันที่ ${date}`,
  mustBeBetween: (startDate, endDate) => `ต้องอยู่ในช่วงวันที่ ${startDate} - ${endDate}`,
  dateIsDisabled: 'ไม่สามารถใช้วันที่นี้ได้',
  previous: 'ก่อนหน้า',
  next: 'ถัดไป',
  typeInDate: 'พิมพ์วันที่',
  pickDateFromCalendar: 'เลือกวันที่จากปฏิทิน',
  close: 'ปิด',
  minute: 'นาที',
  hour: 'ชั่วโมง'
};
var _default = exports.default = th;
//# sourceMappingURL=th.js.map