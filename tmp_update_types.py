from pathlib import Path
path = Path(r"src/types/plans.ts")
text = path.read_text()
text = text.replace("export type PlannerFormValues = {\r\n  city: string;\r\n  startDate: Date;\r\n  endDate: Date;\r\n  preferences: PreferenceOption[];\r\n  budgetUsd?: number;\r\n};","export type PlannerFormValues = {\n  city: string;\n  startDate: Date;\n  endDate: Date;\n  preferences: PreferenceOption[];\n  budgetUsd?: number;\n  isDayPlan: boolean;\n};")
text = text.replace("  days: ItineraryDay[];\r\n};","  days: ItineraryDay[];\n  isDayPlan?: boolean;\n};")
path.write_text(text)
