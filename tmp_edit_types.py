from pathlib import Path
path = Path(r"src/types/plans.ts")
text = path.read_text()
text = text.replace("\r\n", "\n")
old = "export type PlannerFormValues = {\n  city: string;\n  startDate: Date;\n  endDate: Date;\n  preferences: PreferenceOption[];\n  budgetUsd?: number;\n};"
new = "export type PlannerFormValues = {\n  city: string;\n  startDate: Date;\n  endDate: Date;\n  preferences: PreferenceOption[];\n  budgetUsd?: number;\n  isDayPlan: boolean;\n};"
if old not in text:
    raise SystemExit('block not found')
text = text.replace(old, new, 1)
old_trip = "  days: ItineraryDay[];\n};"
new_trip = "  days: ItineraryDay[];\n  isDayPlan?: boolean;\n};"
if old_trip not in text:
    raise SystemExit('trip block not found')
text = text.replace(old_trip, new_trip, 1)
path.write_text(text.replace("\n", "\r\n"))
