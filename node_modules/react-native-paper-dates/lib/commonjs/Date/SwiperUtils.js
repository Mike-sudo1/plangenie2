"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMaxIndex = getMaxIndex;
exports.getMinIndex = getMinIndex;
exports.isIndexWithinRange = isIndexWithinRange;
exports.useYearChange = useYearChange;
var _react = require("react");
var _utils = require("../shared/utils");
var _dateUtils = require("./dateUtils");
// Helper function to get the minimum allowed index based on startYear
function getMinIndex(startYear, endYear) {
  if (!startYear) return 0;
  const today = new Date();
  const startDate = new Date(startYear, 0, 1); // January 1st of startYear
  const months = (0, _dateUtils.differenceInMonths)(today, startDate);
  const dynamicStartAtIndex = (0, _dateUtils.getStartAtIndex)(startYear, endYear);
  const minIndex = dynamicStartAtIndex + months;
  const totalMonths = (0, _dateUtils.getTotalMonths)(startYear, endYear);

  // Allow any valid index within the dynamic range, no hard minimum
  return Math.max(0, Math.min(minIndex, totalMonths - 1));
}

// Helper function to get the maximum allowed index based on endYear
function getMaxIndex(startYear, endYear) {
  const dynamicStartAtIndex = (0, _dateUtils.getStartAtIndex)(startYear, endYear);
  const totalMonths = (0, _dateUtils.getTotalMonths)(startYear, endYear);
  if (!endYear) return totalMonths - 1;
  const today = new Date();
  const endDate = new Date(endYear, 11, 31); // December 31st of endYear
  const months = (0, _dateUtils.differenceInMonths)(today, endDate);
  const maxIndex = dynamicStartAtIndex + months;

  // Allow any valid index within the dynamic range
  return Math.max(0, Math.min(maxIndex, totalMonths - 1));
}

// Helper function to check if an index is within allowed range
function isIndexWithinRange(index, startYear, endYear) {
  const minIndex = getMinIndex(startYear || _dateUtils.defaultStartYear, endYear);
  const maxIndex = getMaxIndex(startYear, endYear || _dateUtils.defaultEndYear);
  return index >= minIndex && index <= maxIndex;
}
function useYearChange(onChange, {
  selectedYear,
  currentIndexRef,
  startYear,
  endYear
}) {
  const onChangeRef = (0, _utils.useLatest)(onChange);
  (0, _react.useEffect)(() => {
    if (selectedYear) {
      const currentIndex = currentIndexRef.current || 0;
      const currentDate = (0, _dateUtils.addMonths)(new Date(), (0, _dateUtils.getRealIndex)(currentIndex, startYear, endYear));
      currentDate.setFullYear(selectedYear);
      const today = new Date();
      const months = (0, _dateUtils.differenceInMonths)(today, currentDate);
      const dynamicStartAtIndex = (0, _dateUtils.getStartAtIndex)(startYear, endYear);
      const totalMonths = (0, _dateUtils.getTotalMonths)(startYear, endYear);
      const newIndex = dynamicStartAtIndex + months;
      // Ensure the new index is within valid bounds
      const boundedIndex = Math.max(0, Math.min(newIndex, totalMonths - 1));
      if (currentIndex !== boundedIndex) {
        onChangeRef.current(boundedIndex);
      }
    }
  }, [currentIndexRef, onChangeRef, selectedYear, startYear, endYear]);
}
//# sourceMappingURL=SwiperUtils.js.map