from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
idx = lines.index("  helperCopy: {")
print(lines[idx:idx+10])
