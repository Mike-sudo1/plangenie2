from pathlib import Path
text = Path(r"src/hooks/usePlanner.ts").read_text()
text = text.replace("const createDefaultForm = (): PlannerFormValues => ({\r\n  city: '',\r\n  startDate: new Date(),\r\n  endDate: addDays(new Date(), 1),\r\n  preferences: [],\r\n  budgetUsd: undefined\r\n});","const createDefaultForm = (): PlannerFormValues => ({\n  city: '',\n  startDate: new Date(),\n  endDate: addDays(new Date(), 1),\n  preferences: [],\n  budgetUsd: undefined,\n  isDayPlan: false,\n});")
Path(r"src/hooks/usePlanner.ts").write_text(text)
