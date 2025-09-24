from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
if not any("const handleToggleDayPlan" in line for line in lines):
    marker = "  const invalidRange = tripLength < 1;"
    pos = lines.index(marker)
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
    lines = lines[:pos + 1] + [""] + handler_lines + lines[pos + 1:]
    path.write_text("\n".join(lines) + "\n")
    print('handler inserted')
else:
    print('handler already present')
