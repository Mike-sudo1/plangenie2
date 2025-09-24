"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const es = {
  save: 'Guardar',
  selectSingle: 'Seleccionar fecha',
  selectMultiple: 'Seleccionar fechas',
  selectRange: 'Seleccionar periodo',
  notAccordingToDateFormat: inputFormat => `Formato de fecha debe ser ${inputFormat}`,
  mustBeHigherThan: date => `Debe ser posterior a ${date}`,
  mustBeLowerThan: date => `Debe ser anterior a ${date}`,
  mustBeBetween: (startDate, endDate) => `Debe estar entre ${startDate} - ${endDate}`,
  dateIsDisabled: 'Día no permitido',
  previous: 'Anterior',
  next: 'Siguiente',
  typeInDate: 'Escribir fecha',
  pickDateFromCalendar: 'Seleccionar fecha del calendario',
  close: 'Cerrar',
  hour: 'Hora',
  minute: 'Minuto'
};
var _default = exports.default = es;
//# sourceMappingURL=es.js.map