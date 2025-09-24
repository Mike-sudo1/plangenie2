from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()

# Replace date block
try:
    idx = lines.index("        <View style={styles.datesRow}>")
except ValueError:
    raise SystemExit('datesRow not found')
end_idx = idx
while end_idx < len(lines) and lines[end_idx] != "":
    end_idx += 1
end_idx += 1

new_block = """        <View style={styles.dayPlanToggleRow}>
          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>
            Plan just one day?
          </Text>
          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />
        </View>

        <View style={styles.datesRow}>
          <TouchableOpacity
            style={styles.dateColumn}
            onPress={() => setShowStartPicker(true)}
          >
            <TextInput
              label=\"Arrive\"
              value={formattedStart}
              editable={false}
              pointerEvents=\"none\"
              mode=\"outlined\"
              right={<TextInput.Icon icon=\"calendar\" />}
            />
          </TouchableOpacity>
          {!form.isDayPlan ? (
            <TouchableOpacity
              style={styles.dateColumn}
              onPress={() => setShowEndPicker(true)}
            >
              <TextInput
                label=\"Depart\"
                value={formattedEnd}
                editable={false}
                pointerEvents=\"none\"
                mode=\"outlined\"
                right={<TextInput.Icon icon=\"calendar\" />}
              />
            </TouchableOpacity>
          ) : null}
        </View>
""".splitlines()

lines = lines[:idx] + new_block + lines[end_idx:]

# Insert handler if missing
if not any("handleToggleDayPlan" in line for line in lines):
    marker = "  const invalidRange = tripLength < 1;"
    pos = lines.index(marker)
    insert_block = """  const handleToggleDayPlan = useCallback((value: boolean) => {
    updateField('isDayPlan', value);
  }, [updateField]);

  useEffect(() => {
    if (form.isDayPlan && showEndPicker) {
      setShowEndPicker(false);
    }
  }, [form.isDayPlan, showEndPicker]);
""".splitlines()
    lines = (
        lines[:pos + 1]
        + [""]
        + insert_block
        + [""]
        + lines[pos + 1 :]
    )

# Update DatePicker visible line
for i, line in enumerate(lines):
    if "visible={showEndPicker}" in line:
        lines[i] = "          visible={!form.isDayPlan && showEndPicker}"
        break

# Insert styles if missing
if not any("dayPlanToggleRow" in line for line in lines):
    helper_idx = lines.index("  helperCopy: {")
    style_block = [
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
    lines = lines[:helper_idx] + style_block + lines[helper_idx + 3 :]

path.write_text("\n".join(lines) + "\n")
