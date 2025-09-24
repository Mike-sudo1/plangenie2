from pathlib import Path
text = Path(r"src/hooks/usePlanner.ts").read_text()
marker = "  const updateField = useCallback(<K extends keyof PlannerFormValues>(key: K, value: PlannerFormValues[K]) => {\r\n    setForm((prev) => ({ ...prev, [key]: value }));\r\n  }, []);\r\n\r\n  const togglePreference = useCallback((preference: PreferenceOption) => {"
if marker not in text:
    raise SystemExit('marker not found')
insert = "  const updateField = useCallback(<K extends keyof PlannerFormValues>(key: K, value: PlannerFormValues[K]) => {\n    setForm((prev) => ({ ...prev, [key]: value }));\n  }, []);\n\n  useEffect(() => {\n    setForm((prev) => {\n      if (prev.isDayPlan && prev.endDate.getTime() !== prev.startDate.getTime()) {\n        return { ...prev, endDate: prev.startDate };\n      }\n      if (!prev.isDayPlan && prev.endDate < prev.startDate) {\n        return { ...prev, endDate: addDays(prev.startDate, 1) };\n      }\n      return prev;\n    });\n  }, [form.endDate, form.isDayPlan, form.startDate]);\n\n  const togglePreference = useCallback((preference: PreferenceOption) => {"
text = text.replace(marker, insert)
Path(r"src/hooks/usePlanner.ts").write_text(text)
