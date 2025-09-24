"use strict";

import { StyleSheet, View } from 'react-native';
import { daySize } from './dateUtils';
import { memo } from 'react';
import { sharedStyles } from '../shared/styles';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function DayRange({
  leftCrop,
  rightCrop,
  inRange,
  selectColor
}) {
  const bothWays = inRange && leftCrop && rightCrop;
  const isCrop = inRange && (leftCrop || rightCrop) && !(leftCrop && rightCrop);
  if (inRange || isCrop) {
    return /*#__PURE__*/_jsx(View, {
      pointerEvents: "none",
      style: [StyleSheet.absoluteFill, sharedStyles.flexDirectionRow, bothWays && styles.rangeRootBoth, inRange && !isCrop ? {
        backgroundColor: selectColor
      } : null],
      children: isCrop && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(View, {
          style: [sharedStyles.root, rightCrop ? {
            backgroundColor: selectColor
          } : null]
        }), /*#__PURE__*/_jsx(View, {
          style: [{
            backgroundColor: selectColor,
            minWidth: daySize,
            minHeight: daySize
          }, leftCrop ? styles.leftRadius : null, rightCrop ? styles.rightRadius : null]
        }), /*#__PURE__*/_jsx(View, {
          style: [sharedStyles.root, leftCrop ? {
            backgroundColor: selectColor
          } : null]
        })]
      })
    });
  }
  return null;
}
const styles = StyleSheet.create({
  leftRadius: {
    borderBottomLeftRadius: daySize / 2,
    borderTopLeftRadius: daySize / 2
  },
  rightRadius: {
    borderBottomRightRadius: daySize / 2,
    borderTopRightRadius: daySize / 2
  },
  rangeRootBoth: {
    borderRadius: daySize / 2
  }
});
export default /*#__PURE__*/memo(DayRange);
//# sourceMappingURL=DayRange.js.map