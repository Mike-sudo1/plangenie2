"use strict";

import { ScrollView, StyleSheet, View } from 'react-native';
import { getHorizontalMonthOffset, getIndexFromVerticalOffset, getMonthHeight, getVerticalMonthsOffset, montHeaderHeight } from './Month';
import { useYearChange, isIndexWithinRange } from './SwiperUtils';
import { estimatedMonthHeight, getTotalMonths, getBeginOffset } from './dateUtils';
import AutoSizer from './AutoSizer';
import { memo, useCallback, useRef, useState } from 'react';
import { sharedStyles } from '../shared/styles';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function getVisibleArray(i, {
  isHorizontal,
  height
}) {
  if (isHorizontal || height < 700) {
    return [i - 1, i, i + 1];
  }
  return [i - 2, i - 1, i, i + 1, i + 2];
}
function Swiper(props) {
  return /*#__PURE__*/_jsx(AutoSizer, {
    children: ({
      width,
      height
    }) => /*#__PURE__*/_jsx(SwiperInner, {
      ...props,
      width: width,
      height: height
    })
  });
}
function SwiperInner({
  scrollMode,
  renderItem,
  renderHeader,
  renderFooter,
  selectedYear,
  initialIndex,
  width,
  height,
  startWeekOnMonday,
  startYear,
  endYear
}) {
  const idx = useRef(initialIndex);
  const isHorizontal = scrollMode === 'horizontal';
  const [visibleIndexes, setVisibleIndexes] = useState(getVisibleArray(initialIndex, {
    isHorizontal,
    height
  }));
  const parentRef = useRef(null);
  const scrollTo = useCallback((index, animated) => {
    if (!isIndexWithinRange(index, startYear, endYear)) {
      return;
    }
    idx.current = index;
    setVisibleIndexes(getVisibleArray(index, {
      isHorizontal,
      height
    }));
    if (!parentRef.current) {
      return;
    }
    const offset = isHorizontal ? getHorizontalMonthOffset(index, width) : getVerticalMonthsOffset(index, startWeekOnMonday, startYear, endYear) - montHeaderHeight;
    if (isHorizontal) {
      parentRef.current.scrollTo({
        y: 0,
        x: offset,
        animated
      });
    } else {
      parentRef.current.scrollTo({
        y: offset,
        x: 0,
        animated
      });
    }
  }, [parentRef, isHorizontal, width, height, startWeekOnMonday, startYear, endYear]);
  const onPrev = useCallback(() => {
    const newIndex = idx.current - 1;
    if (isIndexWithinRange(newIndex, startYear, endYear)) {
      scrollTo(newIndex, true);
    }
  }, [scrollTo, idx, startYear, endYear]);
  const onNext = useCallback(() => {
    const newIndex = idx.current + 1;
    if (isIndexWithinRange(newIndex, startYear, endYear)) {
      scrollTo(newIndex, true);
    }
  }, [scrollTo, idx, startYear, endYear]);
  const scrollToInitial = useCallback(() => {
    scrollTo(idx.current, false);
  }, [scrollTo]);
  const onMomentumScrollEnd = useCallback(e => {
    const contentOffset = e.nativeEvent.contentOffset;
    const viewSize = e.nativeEvent.layoutMeasurement;
    const dynamicBeginOffset = getBeginOffset(startYear, endYear);
    const newIndex = isHorizontal ? Math.round(contentOffset.x / viewSize.width) : getIndexFromVerticalOffset(contentOffset.y - dynamicBeginOffset, startWeekOnMonday, startYear, endYear);
    if (newIndex === 0) {
      return;
    }
    if (!isIndexWithinRange(newIndex, startYear, endYear)) {
      return;
    }
    if (idx.current !== newIndex) {
      idx.current = newIndex;
      setVisibleIndexes(getVisibleArray(newIndex, {
        isHorizontal,
        height
      }));
    }
  }, [idx, height, isHorizontal, startWeekOnMonday, startYear, endYear]);
  const renderProps = {
    index: 0,
    onPrev,
    onNext
  };
  useYearChange(newIndex => {
    if (newIndex && isIndexWithinRange(newIndex, startYear, endYear)) {
      scrollTo(newIndex, false);
    }
  }, {
    selectedYear,
    currentIndexRef: idx,
    startYear,
    endYear
  });
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(ScrollView, {
      scrollsToTop: false,
      ref: parentRef,
      horizontal: isHorizontal,
      pagingEnabled: isHorizontal,
      style: sharedStyles.root,
      onMomentumScrollEnd: onMomentumScrollEnd,
      onScrollEndDrag: onMomentumScrollEnd,
      onLayout: scrollToInitial,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      decelerationRate: "fast",
      scrollEventThrottle: 10,
      children: /*#__PURE__*/_jsx(View, {
        style: [styles.inner, {
          height: isHorizontal ? height : estimatedMonthHeight * getTotalMonths(startYear, endYear),
          width: isHorizontal ? width * getTotalMonths(startYear, endYear) : width
        }],
        children: visibleIndexes ? new Array(visibleIndexes.length).fill(undefined).map((_, vi) => /*#__PURE__*/_jsx(View, {
          // eslint-disable-next-line react-native/no-inline-styles
          style: {
            top: isHorizontal ? 0 : getVerticalMonthsOffset(visibleIndexes[vi], startWeekOnMonday, startYear, endYear),
            left: isHorizontal ? getHorizontalMonthOffset(visibleIndexes[vi], width) : 0,
            right: isHorizontal ? undefined : 0,
            bottom: isHorizontal ? 0 : undefined,
            position: 'absolute',
            width: isHorizontal ? width : undefined,
            height: isHorizontal ? undefined : getMonthHeight(scrollMode, visibleIndexes[vi], startWeekOnMonday, startYear, endYear)
          },
          children: renderItem({
            index: visibleIndexes[vi],
            onPrev: onPrev,
            onNext: onNext
          })
        }, vi)) : null
      })
    }), renderHeader && renderHeader(renderProps), renderFooter && renderFooter(renderProps)]
  });
}
const styles = StyleSheet.create({
  inner: {
    position: 'relative'
  }
});
export default /*#__PURE__*/memo(Swiper);
//# sourceMappingURL=Swiper.native.js.map