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
function AnalogClockMinutes({
  minutes
}) {
  const range = getMinuteNumbers(_timeUtils.circleSize, 12);
  const color = (0, _utils.useTextColorOnPrimary)();
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: range.map((a, i) => {
      const currentMinutes = i * 5;
      const isZero = currentMinutes === 0;
      let isCurrent = currentMinutes - 1 <= minutes && currentMinutes + 1 >= minutes;
      if (isZero) {
        isCurrent = minutes >= 59 || currentMinutes + 1 >= minutes;
      }
      return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        pointerEvents: "none",
        style: [styles.outerHourRoot, {
          top: a[1] || 0,
          left: a[0] || 0
        }],
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: styles.outerHourInner,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNativePaper.Text, {
            maxFontSizeMultiplier: 1.5,
            style: isCurrent ? {
              color
            } : undefined,
            selectable: false,
            variant: "bodyLarge",
            children: isZero ? '00' : currentMinutes
          })
        })
      }, i);
    })
  });
}
function getMinuteNumbers(size, count) {
  let angle = 0;
  let step = 2 * Math.PI / count;
  let radius = size / 2.5;
  angle = angle = -90 * Math.PI / 180;
  return Array(12).fill(true).map(() => {
    let x = Math.round(size / 2 + radius * Math.cos(angle));
    let y = Math.round(size / 2 + radius * Math.sin(angle));
    angle += step;
    return [x, y];
  });
}
const styles = _reactNative.StyleSheet.create({
  outerHourRoot: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24
  },
  outerHourInner: {
    borderRadius: 24
  }
});
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(AnalogClockMinutes);
//# sourceMappingURL=AnalogClockMinutes.js.map