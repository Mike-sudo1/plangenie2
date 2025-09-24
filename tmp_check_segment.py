from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
print("Plan just one day?" in text)
