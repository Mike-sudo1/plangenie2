from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
marker = "  const invalidRange = tripLength < 1;"
pos = lines.index(marker)
print('before insert snippet:', lines[pos:pos+5])
handler_lines = [
    "  const handleToggleDayPlan = useCallback((value: boolean) => {",
    "    updateField('isDayPlan', value);",
    "  }, [updateField]);",
    "",
    "  useEffect(() => {",
    "    if (form.isDayPlan && showEndPicker) {",
    "      setShowEndPicker(false);",
    "    }",
    "  }, [form.isDayPlan, showEndPicker]);",
    "",
]
new_lines = lines[:pos + 1] + [""] + handler_lines + lines[pos + 1:]
print('after insert snippet:', new_lines[pos:pos+8])
