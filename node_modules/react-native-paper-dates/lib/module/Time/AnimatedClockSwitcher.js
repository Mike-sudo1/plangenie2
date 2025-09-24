"use strict";

import { Animated, StyleSheet, View } from 'react-native';
import { clockTypes } from './timeUtils';
import { useEffect, useRef } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function AnimatedClockSwitcher({
  focused,
  hours,
  minutes
}) {
  const collapsed = focused === clockTypes.hours;
  const animatedCollapsed = useRef(new Animated.Value(collapsed ? 1 : 0));
  useEffect(() => {
    Animated.timing(animatedCollapsed.current, {
      toValue: collapsed ? 1 : 0,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [collapsed]);
  return /*#__PURE__*/_jsxs(View, {
    style: StyleSheet.absoluteFill,
    children: [/*#__PURE__*/_jsx(Animated.View, {
      pointerEvents: collapsed ? 'auto' : 'none',
      style: [StyleSheet.absoluteFill, {
        opacity: animatedCollapsed.current,
        transform: [{
          scale: animatedCollapsed.current.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1]
          })
        }]
      }],
      children: hours
    }), /*#__PURE__*/_jsx(Animated.View, {
      pointerEvents: collapsed ? 'none' : 'auto',
      style: [StyleSheet.absoluteFill, {
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