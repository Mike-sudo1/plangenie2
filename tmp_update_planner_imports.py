from pathlib import Path
path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
text = text.replace("import React, { useEffect, useMemo, useState } from 'react';","import React, { useCallback, useEffect, useMemo, useState } from 'react';")
text = text.replace("  HelperText,\r\n  Portal,\r\n  ProgressBar,\r\n  Surface,\r\n  Text,\r\n  TextInput,\r\n  useTheme\r\n} from 'react-native-paper';","  HelperText,\n  Portal,\n  ProgressBar,\n  Surface,\n  Switch,\n  Text,\n  TextInput,\n  useTheme\n} from 'react-native-paper';")
path.write_text(text)
