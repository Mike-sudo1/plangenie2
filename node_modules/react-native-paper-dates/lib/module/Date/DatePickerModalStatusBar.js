"use strict";

import { memo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderBackgroundColor } from '../shared/utils';
import Color from 'color';
import { Animated, StatusBar } from 'react-native';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function DatePickerModalStatusBar({
  disableSafeTop,
  disableStatusBar,
  statusBarOnTopOfBackdrop
}) {
  const insets = useSafeAreaInsets();
  const headerBackgroundColor = useHeaderBackgroundColor();
  const onDarkBackground = Color(headerBackgroundColor).isDark() || statusBarOnTopOfBackdrop;
  const statusBarTheme = onDarkBackground ? 'light-content' : 'dark-content';
  const statusBarBackground = statusBarOnTopOfBackdrop ? 'transparent' : headerBackgroundColor;
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [!disableSafeTop && !statusBarOnTopOfBackdrop && /*#__PURE__*/_jsx(Animated.View, {
      style: [{
        backgroundColor: statusBarBackground,
        height: insets.top || StatusBar.currentHeight
      }]
    }), !disableStatusBar && /*#__PURE__*/_jsx(StatusBar, {
      barStyle: statusBarTheme,
      translucent: true,
      backgroundColor: "transparent"
    })]
  });
}
export default /*#__PURE__*/memo(DatePickerModalStatusBar);
//# sourceMappingURL=DatePickerModalStatusBar.js.map