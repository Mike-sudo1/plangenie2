"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AnimatedClockSwitcher;
var _reactNative = require("react-native");
var _timeUtils = require("./timeUtils");
var _react = require("react");
var _jsxRuntime = require("react/jsx-runtime");
function AnimatedClockSwitcher({
  focused,
  hours,
  minutes
}) {
  const collapsed = focused === _timeUtils.clockTypes.hours;
  const animatedCollapsed = (0, _react.useRef)(new _reactNative.Animated.Value(collapsed ? 1 : 0));
  (0, _react.useEffect)(() => {
    _reactNative.Animated.timing(animatedCollapsed.current, {
      toValue: collapsed ? 1 : 0,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [collapsed]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
    style: _reactNative.StyleSheet.absoluteFill,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
      pointerEvents: collapsed ? 'auto' : 'none',
      style: [_reactNative.StyleSheet.absoluteFill, {
        opacity: animatedCollapsed.current,
        transform: [{
          scale: animatedCollapsed.current.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1]
          })
        }]
      }],
      children: hours
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Animated.View, {
      pointerEvents: collapsed ? 'none' : 'auto',
      style: [_reactNative.StyleSheet.absoluteFill, {
        opacity: animatedCollapsed.current.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0]
        }),
        transform: [{
          scale: animatedCollapsed.current.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.95]
          })
        }]
      }],
      children: minutes
    })]
  });
}
//# sourceMappingURL=AnimatedClockSwitcher.js.map