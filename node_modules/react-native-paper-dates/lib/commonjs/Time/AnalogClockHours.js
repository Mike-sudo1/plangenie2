"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _reactNativePaper = require("react-native-paper");
var _timeUtils = require("./timeUtils");
var _utils = require("../shared/utils");
var _react = require("react");
var _jsxRuntime = require("react/jsx-runtime");
function AnalogClockHours({
  is24Hour,
  hours
}) {
  const outerRange = getHourNumbers(false, _timeUtils.circleSize, 12, 12);
  const innerRange = getHourNumbers(true, _timeUtils.circleSize, 12, 12);
  const color = (0, _utils.useTextColorOnPrimary)();
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [outerRange.map((a, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      pointerEvents: "none",
      style: [styles.hourRoot, {
        top: a[1] || 0,
        left: a[0] || 0
      }],
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        style: styles.hourInner,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
          maxFontSizeMultiplier: 1.5,
          style: !is24Hour && i + 1 === hours || hours === i + 1 && hours !== 12 || i + 1 === 12 && hours === 0 ? {
            color
          } : null,
          variant: "bodyLarge",
          selectable: false,
          children: is24Hour && i + 1 === 12 ? '00' : i + 1
        })
      })
    }, i)), is24Hour ? innerRange.map((a, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      pointerEvents: "none",
      style: [styles.hourRoot, {
        top: a[1] || 0,
        left: a[0] || 0
      }],
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        style: styles.hourInner,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
          maxFontSizeMultiplier: 1.5,
          selectable: false,
          style: [i + 13 === hours || i + 13 === 24 && hours === 12 ? {
            color
          } : null],
          variant: "bodyLarge",
          children: i + 13 === 24 ? '12' : i + 13
        })
      })
    }, i)) : null]
  });
}
const styles = _reactNative.StyleSheet.create({
  hourInner: {
    borderRadius: 24
  },
  hourRoot: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24
  }
});
function getHourNumbers(is24Hour, size, count, arrayLength) {
  let angle = 0;
  let step = 2 * Math.PI / count;
  let radius = size / (is24Hour ? 4 : 2.5);
  angle = -90 * Math.PI / 180 + Math.PI / 6;
  return Array(arrayLength).fill(true).map(() => {
    let x = Math.round(size / 2 + radius * Math.cos(angle));
    let y = Math.round(size / 2 + radius * Math.sin(angle));
    angle += step;
    return [x, y];
  });
}
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(AnalogClockHours);
//# sourceMappingURL=AnalogClockHours.js.map