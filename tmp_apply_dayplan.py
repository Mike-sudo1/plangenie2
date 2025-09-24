from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text().replace("\r\n", "\n")
if text.startswith("\ufeff"):
    text = text[1:]

# Insert handler and effect if not present
if "handleToggleDayPlan" not in text:
    marker = "  const invalidRange = tripLength < 1;\n\n  useFocusEffect("
    replacement = "  const invalidRange = tripLength < 1;\n\n  const handleToggleDayPlan = useCallback((value: boolean) => {\n    updateField('isDayPlan', value);\n  }, [updateField]);\n\n  useEffect(() => {\n    if (form.isDayPlan && showEndPicker) {\n      setShowEndPicker(false);\n    }\n  }, [form.isDayPlan, showEndPicker]);\n\n  useFocusEffect("
    if marker not in text:
      raise SystemExit('Unable to find insertion point for handler')
    text = text.replace(marker, replacement)

# Replace dates block
if "Plan just one day?" not in text:
    old_block = "        <View style={styles.datesRow}>\n          <TouchableOpacity\n            style={styles.dateColumn}\n            onPress={() => setShowStartPicker(true)}\n          >\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          <TouchableOpacity\n            style={styles.dateColumn}\n            onPress={() => setShowEndPicker(true)}\n          >\n            <TextInput\n              label=\"Depart\"\n              value={formattedEnd}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n        </View>\n"
    new_block = "        <View style={styles.dayPlanToggleRow}>\n          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>\n            Plan just one day?\n          </Text>\n          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />\n        </View>\n\n        <View style={styles.datesRow}>\n          <TouchableOpacity style={styles.dateColumn} onPress={() => setShowStartPicker(true)}>\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          {!form.isDayPlan ? (\n            <TouchableOpacity style={styles.dateColumn} onPress={() => setShowEndPicker(true)}>\n              <TextInput\n                label=\"Depart\"\n                value={formattedEnd}\n                editable={false}\n                pointerEvents=\"none\"\n                mode=\"outlined\"\n                right={<TextInput.Icon icon=\"calendar\" />}\n              />\n            </TouchableOpacity>\n          ) : null}\n        </View>\n"
    if old_block not in text:
        raise SystemExit('Could not locate original date block for replacement')
    text = text.replace(old_block, new_block)

# Update end date picker visibility
text = text.replace(
    "        <DatePickerModal\n          visible={showEndPicker}\n          mode=\"single\"",
    "        <DatePickerModal\n          visible={!form.isDayPlan && showEndPicker}\n          mode=\"single\"",
)

# Inject new styles if missing
if "dayPlanToggleRow" not in text:
    style_marker = "  helperCopy: {\n    color: '#64748b',\n  },\n  datesRow: {"
    style_replacement = "  helperCopy: {\n    color: '#64748b',\n  },\n  dayPlanToggleRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginTop: 8,\n  },\n  dayPlanToggleLabel: {\n    fontWeight: '600',\n  },\n  datesRow: {"
    if style_marker not in text:
        raise SystemExit('Could not find style marker for day plan toggle styles')
    text = text.replace(style_marker, style_replacement)

path.write_text(text)
