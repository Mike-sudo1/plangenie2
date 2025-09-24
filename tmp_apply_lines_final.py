from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
if text.startswith("\ufeff"):
    text = text[1:]
lines = text.splitlines()

idx = lines.index("        <View style={styles.datesRow}>")
end_idx = idx
while end_idx < len(lines) and lines[end_idx] != "":
    end_idx += 1
end_idx += 1

lines = lines[:idx] + lines[end_idx:]

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
"""
lines[idx:idx] = new_block.splitlines()

if not any("handleToggleDayPlan" in line for line in lines):
    marker = "  const invalidRange = tripLength < 1;"
    pos = lines.index(marker)
    lines = (
        lines[:pos]
        + [
            marker,
            "",
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
            "  useFocusEffect(",
        ]
        + lines[pos + 2 :]
    )

for i, line in enumerate(lines):
    if "visible={showEndPicker}" in line:
        lines[i] = "          visible={!form.isDayPlan && showEndPicker}"
        break

if not any("dayPlanToggleRow" in line for line in lines):
    helper_idx = lines.index("  helperCopy: {")
    lines = (
        lines[:helper_idx]
        + [
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
        + lines[helper_idx + 3 :]
    )

text = "\n".join(lines) + "\n"
path.write_text(text)
