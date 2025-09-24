"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AutoSizer;
var _react = require("react");
var _reactNative = require("react-native");
var _styles = require("../shared/styles");
var _jsxRuntime = require("react/jsx-runtime");
function AutoSizer({
  children
}) {
  const [layout, setLayout] = (0, _react.useState)(null);
  const onLayout = (0, _react.useCallback)(event => {
    const nl = event.nativeEvent.layout;
    // https://github.com/necolas/react-native-web/issues/1704
    if (!layout || layout.width !== nl.width || layout.height !== nl.height) {
      setLayout({
        width: nl.width,
        height: nl.height
      });
    }
  }, [layout, setLayout]);
  const isLayoutInitialized = layout && layout.height > 0 && layout.width > 0;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
    onLayout: onLayout,
    style: [_styles.sharedStyles.overflowHidden, _styles.sharedStyles.root, isLayoutInitialized && layout],
    children: isLayoutInitialized ? children(layout) : null
  });
}
//# sourceMappingURL=AutoSizer.js.map