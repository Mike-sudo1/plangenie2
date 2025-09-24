"use strict";

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { circleSize } from './timeUtils';
import { useTextColorOnPrimary } from '../shared/utils';
import { memo } from 'react';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
function AnalogClockMinutes({
  minutes
}) {
  const range = getMinuteNumbers(circleSize, 12);
  const color = useTextColorOnPrimary();
  return /*#__PURE__*/_jsx(_Fragment, {
    children: range.map((a, i) => {
      const currentMinutes = i * 5;
      const isZero = currentMinutes === 0;
      let isCurrent = currentMinutes - 1 <= minutes && currentMinutes + 1 >= minutes;
      if (isZero) {
        isCurrent = minutes >= 59 || currentMinutes + 1 >= minutes;
      }
      return /*#__PURE__*/_jsx(View, {
        pointerEvents: "none",
        style: [styles.outerHourRoot, {
          top: a[1] || 0,
          left: a[0] || 0
        }],
        children: /*#__PURE__*/_jsx(View, {
          style: styles.outerHourInner,
          children: /*#__PURE__*/_jsx(Text, {
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
const styles = StyleSheet.create({
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
export default /*#__PURE__*/memo(AnalogClockMinutes);
//# sourceMappingURL=AnalogClockMinutes.js.map