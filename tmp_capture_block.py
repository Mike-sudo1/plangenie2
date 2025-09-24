from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
start = text.index("        <View style={styles.datesRow}>")
end = text.index("        <Text variant=\"bodySmall\" style={styles.helperCopy}", start)
block = text[start:end]
print(repr(block))
