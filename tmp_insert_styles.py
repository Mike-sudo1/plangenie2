from pathlib import Path
text = Path(r"src/screens/PlannerScreen.tsx").read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()
if not any("dayPlanToggleRow:" in line for line in lines):
    idx = lines.index("  helperCopy: {")
    insert_pos = idx + 3  # after helperCopy block
    new_lines = [
        "  dayPlanToggleRow: {",
        "    flexDirection: 'row',",
        "    alignItems: 'center',",
        "    justifyContent: 'space-between',",
        "    marginTop: 8,",
        "  },",
        "  dayPlanToggleLabel: {",
        "    fontWeight: '600',",
        "  },",
    ]
    lines = lines[:insert_pos] + new_lines + lines[insert_pos:]
    Path(r"src/screens/PlannerScreen.tsx").write_text("\n".join(lines) + "\n")
