"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _Month = require("./Month");
var _SwiperUtils = require("./SwiperUtils");
var _dateUtils = require("./dateUtils");
var _AutoSizer = _interopRequireDefault(require("./AutoSizer"));
var _react = require("react");
var _styles = require("../shared/styles");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_AutoSizer.default, {
    children: ({
      width,
      height
    }) => /*#__PURE__*/(0, _jsxRuntime.jsx)(SwiperInner, {
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
  const idx = (0, _react.useRef)(initialIndex);
  const isHorizontal = scrollMode === 'horizontal';
  const [visibleIndexes, setVisibleIndexes] = (0, _react.useState)(getVisibleArray(initialIndex, {
    isHorizontal,
    height
  }));
  const parentRef = (0, _react.useRef)(null);
  const scrollTo = (0, _react.useCallback)((index, animated) => {
    if (!(0, _SwiperUtils.isIndexWithinRange)(index, startYear, endYear)) {
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
    const offset = isHorizontal ? (0, _Month.getHorizontalMonthOffset)(index, width) : (0, _Month.getVerticalMonthsOffset)(index, startWeekOnMonday, startYear, endYear) - _Month.montHeaderHeight;
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
  const onPrev = (0, _react.useCallback)(() => {
    const newIndex = idx.current - 1;
    if ((0, _SwiperUtils.isIndexWithinRange)(newIndex, startYear, endYear)) {
      scrollTo(newIndex, true);
    }
  }, [scrollTo, idx, startYear, endYear]);
  const onNext = (0, _react.useCallback)(() => {
    const newIndex = idx.current + 1;
    if ((0, _SwiperUtils.isIndexWithinRange)(newIndex, startYear, endYear)) {
      scrollTo(newIndex, true);
    }
  }, [scrollTo, idx, startYear, endYear]);
  const scrollToInitial = (0, _react.useCallback)(() => {
    scrollTo(idx.current, false);
  }, [scrollTo]);
  const onMomentumScrollEnd = (0, _react.useCallback)(e => {
    const contentOffset = e.nativeEvent.contentOffset;
    const viewSize = e.nativeEvent.layoutMeasurement;
    const dynamicBeginOffset = (0, _dateUtils.getBeginOffset)(startYear, endYear);
    const newIndex = isHorizontal ? Math.round(contentOffset.x / viewSize.width) : (0, _Month.getIndexFromVerticalOffset)(contentOffset.y - dynamicBeginOffset, startWeekOnMonday, startYear, endYear);
    if (newIndex === 0) {
      return;
    }
    if (!(0, _SwiperUtils.isIndexWithinRange)(newIndex, startYear, endYear)) {
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
  (0, _SwiperUtils.useYearChange)(newIndex => {
    if (newIndex && (0, _SwiperUtils.isIndexWithinRange)(newIndex, startYear, endYear)) {
      scrollTo(newIndex, false);
    }
  }, {
    selectedYear,
    currentIndexRef: idx,
    startYear,
    endYear
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.ScrollView, {
      scrollsToTop: false,
      ref: parentRef,
      horizontal: isHorizontal,
      pagingEnabled: isHorizontal,
      style: _styles.sharedStyles.root,
      onMomentumScrollEnd: onMomentumScrollEnd,
      onScrollEndDrag: onMomentumScrollEnd,
      onLayout: scrollToInitial,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      decelerationRate: "fast",
      scrollEventThrottle: 10,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
        style: [styles.inner, {
          height: isHorizontal ? height : _dateUtils.estimatedMonthHeight * (0, _dateUtils.getTotalMonths)(startYear, endYear),
          width: isHorizontal ? width * (0, _dateUtils.getTotalMonths)(startYear, endYear) : width
        }],
        children: visibleIndexes ? new Array(visibleIndexes.length).fill(undefined).map((_, vi) => /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          // eslint-disable-next-line react-native/no-inline-styles
          style: {
            top: isHorizontal ? 0 : (0, _Month.getVerticalMonthsOffset)(visibleIndexes[vi], startWeekOnMonday, startYear, endYear),
            left: isHorizontal ? (0, _Month.getHorizontalMonthOffset)(visibleIndexes[vi], width) : 0,
            right: isHorizontal ? undefined : 0,
            bottom: isHorizontal ? 0 : undefined,
            position: 'absolute',
            width: isHorizontal ? width : undefined,
            height: isHorizontal ? undefined : (0, _Month.getMonthHeight)(scrollMode, visibleIndexes[vi], startWeekOnMonday, startYear, endYear)
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
const styles = _reactNative.StyleSheet.create({
  inner: {
    position: 'relative'
  }
});
var _default = exports.default = /*#__PURE__*/(0, _react.memo)(Swiper);
//# sourceMappingURL=Swiper.native.js.map