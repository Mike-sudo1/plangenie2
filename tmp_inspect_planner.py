from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
print(repr(text.splitlines()[0]))
print(repr(text.splitlines()[10]))
