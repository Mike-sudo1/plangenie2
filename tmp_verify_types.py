from pathlib import Path
text = Path(r"src/types/plans.ts").read_text().replace("\r\n", "\n")
old = "export type PlannerFormValues = {\n  city: string;\n  startDate: Date;\n  endDate: Date;\n  preferences: PreferenceOption[];\n  budgetUsd?: number;\n};"
print(old in text)
