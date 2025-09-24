from pathlib import Path
text = Path(r"src/types/plans.ts").read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
idx = lines.index("export type PlannerFormValues = {")
print(lines[idx:idx+8])
