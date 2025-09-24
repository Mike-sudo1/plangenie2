from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
if not any("dayPlanToggleRow" in line for line in lines):
    marker = "  helperCopy: {"
    idx = lines.index(marker)
    insertion = [
        "  helperCopy: {",
        "    color: '#64748b',",
        "  },",
        "  dayPlanToggleRow: {",
        "    flexDirection: 'row',",
        "    alignItems: 'center',",
        "    justifyContent: 'space-between',",
        "    marginTop: 8,",
        "  },",
        "  dayPlanToggleLabel: {",
        "    fontWeight: '600',",
        "  },",
        "  datesRow: {",
    ]
    # lines[idx:idx+3] currently helper copy block; replace with insertion
    lines = lines[:idx] + insertion + lines[idx + 3 :]
    path.write_text("\n".join(lines) + "\n")
