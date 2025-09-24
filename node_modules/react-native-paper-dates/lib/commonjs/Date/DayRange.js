"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _dateUtils = require("./dateUtils");
var _react = require("react");
var _styles = require("../shared/styles");
var _jsxRuntime = require("react/jsx-runtime");
function DayRange({
  leftCrop,
  rightCrop,
  inRange,
  selectColor
}) {
  const bothWays = inRange && leftCrop && rightCrop;
  const isCrop = inRange && (leftCrop || rightCrop) && !(leftCrop && rightCrop);
  if (inRange || isCrop) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      pointerEvents: "none",
      style: [_reactNative.StyleSheet.absoluteFill, _styles.sharedStyles.flexDirectionRow, bothWays && styles.rangeRootBoth, inRange && !isCrop ? {
        backgroundColor: selectColor
      } : null],
      children: isCrop && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [_styles.sharedStyles.root, rightCrop ? {
            backgroundColor: selectColor
          } : null]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [{
            backgroundColor: selectColor,
            minWidth: _dateUtils.daySize,
            minHeight: _dateUtils.daySize
          }, leftCrop ? styles.leftRadius : null, rightCrop ? styles.rightRadius : null]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [_styles.sharedStyles.root, leftCrop ? {
            backgroundColor: selectColor
          } : null]
        })]
      })
    });
  }
  return null;
}
const styles = _reactNative.StyleSheet.create({
  leftRadius: {
    borderBottomLeftRadius: _dateUtils.daySize / 2,
    borderTopLeftRadius: _dateUtils.daySize / 2
  },
  rightRadius: {
    borderBottomRightRadius: _dateUtils.daySize / 2,
    borderTopRightRadius: _dateUtils.daySize / 2
  },
  rangeRootBoth: {
    borderRadius: _dateUtils.daySize / 2
  }
});
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(DayRange);
//# sourceMappingURL=DayRange.js.map