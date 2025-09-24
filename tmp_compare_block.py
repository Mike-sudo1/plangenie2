from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
marker = "        <View style={styles.datesRow}>"
helper = "        <Text variant=\"bodySmall\" style={styles.helperCopy}"
before, rest = text.split(marker, 1)
block, after = rest.split(helper, 1)
print(block[:200])
