"use strict";

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { circleSize } from './timeUtils';
import { useTextColorOnPrimary } from '../shared/utils';
import { memo } from 'react';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function AnalogClockHours({
  is24Hour,
  hours
}) {
  const outerRange = getHourNumbers(false, circleSize, 12, 12);
  const innerRange = getHourNumbers(true, circleSize, 12, 12);
  const color = useTextColorOnPrimary();
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [outerRange.map((a, i) => /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: [styles.hourRoot, {
        top: a[1] || 0,
        left: a[0] || 0
      }],
      children: /*#__PURE__*/_jsx(View, {
        style: styles.hourInner,
        children: /*#__PURE__*/_jsx(Text, {
          maxFontSizeMultiplier: 1.5,
          style: !is24Hour && i + 1 === hours || hours === i + 1 && hours !== 12 || i + 1 === 12 && hours === 0 ? {
            color
          } : null,
          variant: "bodyLarge",
          selectable: false,
          children: is24Hour && i + 1 === 12 ? '00' : i + 1
        })
      })
    }, i)), is24Hour ? innerRange.map((a, i) => /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: [styles.hourRoot, {
        top: a[1] || 0,
        left: a[0] || 0
      }],
      children: /*#__PURE__*/_jsx(View, {
        style: styles.hourInner,
        children: /*#__PURE__*/_jsx(Text, {
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
const styles = StyleSheet.create({
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
export default /*#__PURE__*/memo(AnalogClockHours);
//# sourceMappingURL=AnalogClockHours.js.map