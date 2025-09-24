from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text().replace("\r\n", "\n")
if text.startswith("\ufeff"):
    text = text[1:]
start = text.index("        <View style={styles.datesRow}>")
print(text[start:start+400])
