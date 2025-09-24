"use strict";

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { sharedStyles } from '../shared/styles';
import { jsx as _jsx } from "react/jsx-runtime";
export default function AutoSizer({
  children
}) {
  const [layout, setLayout] = useState(null);
  const onLayout = useCallback(event => {
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
  return /*#__PURE__*/_jsx(View, {
    onLayout: onLayout,
    style: [sharedStyles.overflowHidden, sharedStyles.root, isLayoutInitialized && layout],
    children: isLayoutInitialized ? children(layout) : null
  });
}
//# sourceMappingURL=AutoSizer.js.map