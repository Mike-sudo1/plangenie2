"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _utils = require("../shared/utils");
var _color = _interopRequireDefault(require("color"));
var _reactNative = require("react-native");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function DatePickerModalStatusBar({
  disableSafeTop,
  disableStatusBar,
  statusBarOnTopOfBackdrop
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const headerBackgroundColor = (0, _utils.useHeaderBackgroundColor)();
  const onDarkBackground = (0, _color.default)(headerBackgroundColor).isDark() || statusBarOnTopOfBackdrop;
  const statusBarTheme = onDarkBackground ? 'light-content' : 'dark-content';
  const statusBarBackground = statusBarOnTopOfBackdrop ? 'transparent' : headerBackgroundColor;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [!disableSafeTop && !statusBarOnTopOfBackdrop && /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
      style: [{
        backgroundColor: statusBarBackground,
        height: insets.top || _reactNative.StatusBar.currentHeight
      }]
    }), !disableStatusBar && /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.StatusBar, {
      barStyle: statusBarTheme,
      translucent: true,
      backgroundColor: "transparent"
    })]
  });
}
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(DatePickerModalStatusBar);
//# sourceMappingURL=DatePickerModalStatusBar.js.map