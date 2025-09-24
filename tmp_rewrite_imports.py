from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text().replace("\r\n", "\n")
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.split("\n")

lines[0] = "import React, { useCallback, useEffect, useMemo, useState } from 'react';"

start = None
end = None
for idx, line in enumerate(lines):
    if line.strip() == "import {" and "react-native-paper" in lines[idx + 12]:
        start = idx
    if line.strip() == "} from 'react-native-paper';":
        end = idx
        break

if start is None or end is None:
    raise SystemExit(f'Could not locate react-native-paper import block: start={start}, end={end}')

new_block = [
    "import {",
    "  Button,",
    "  Chip,",
    "  Dialog,",
    "  Divider,",
    "  HelperText,",
    "  Portal,",
    "  ProgressBar,",
    "  Surface,",
    "  Switch,",
    "  Text,",
    "  TextInput,",
    "  useTheme,",
    "} from 'react-native-paper';",
]
lines = lines[:start] + new_block + lines[end + 1:]

text = "\n".join(lines)
path.write_text(text)
print(lines[0])
print("block start line:", lines[start])
