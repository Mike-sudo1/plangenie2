from pathlib import Path
text = Path(r"src/types/plans.ts").read_text()
print(repr(text.split("export type PlannerFormValues = {")[1].split("};",1)[0]))
