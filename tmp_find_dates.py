from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
start = text.index("<Surface")
print(text[start:start+2000])
