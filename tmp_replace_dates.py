from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text().replace("\r\n", "\n")
if text.startswith("\ufeff"):
    text = text[1:]

start = text.index("        <View style={styles.datesRow}>")
helper_marker = "\n\n        <Text variant=\"bodySmall\" style={styles.helperCopy}")
end = text.index(helper_marker, start)
old_segment = text[start:end]
new_segment = "        <View style={styles.dayPlanToggleRow}>\n          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>\n            Plan just one day?\n          </Text>\n          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />\n        </View>\n\n        <View style={styles.datesRow}>\n          <TouchableOpacity style={styles.dateColumn} onPress={() => setShowStartPicker(true)}>\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          {!form.isDayPlan ? (\n            <TouchableOpacity style={styles.dateColumn} onPress={() => setShowEndPicker(true)}>\n              <TextInput\n                label=\"Depart\"\n                value={formattedEnd}\n                editable={false}\n                pointerEvents=\"none\"\n                mode=\"outlined\"\n                right={<TextInput.Icon icon=\"calendar\" />}\n              />\n            </TouchableOpacity>\n          ) : null}\n        </View>"
text = text[:start] + new_segment + text[end:]

# Insert handler/effect if missing
if "handleToggleDayPlan" not in text:
    marker = "  const invalidRange = tripLength < 1;\n\n  useFocusEffect("
    replacement = "  const invalidRange = tripLength < 1;\n\n  const handleToggleDayPlan = useCallback((value: boolean) => {\n    updateField('isDayPlan', value);\n  }, [updateField]);\n\n  useEffect(() => {\n    if (form.isDayPlan && showEndPicker) {\n      setShowEndPicker(false);\n    }\n  }, [form.isDayPlan, showEndPicker]);\n\n  useFocusEffect("
    if marker not in text:
        raise SystemExit('Handler insertion point not found')
    text = text.replace(marker, replacement)

text = text.replace(
    "        <DatePickerModal\n          visible={showEndPicker}\n          mode=\"single\"",
    "        <DatePickerModal\n          visible={!form.isDayPlan && showEndPicker}\n          mode=\"single\"",
)

if "dayPlanToggleRow" not in text:
    style_marker = "  helperCopy: {\n    color: '#64748b',\n  },\n  datesRow: {"
    style_replacement = "  helperCopy: {\n    color: '#64748b',\n  },\n  dayPlanToggleRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginTop: 8,\n  },\n  dayPlanToggleLabel: {\n    fontWeight: '600',\n  },\n  datesRow: {"
    if style_marker not in text:
        raise SystemExit('Style marker not found')
    text = text.replace(style_marker, style_replacement)

path.write_text(text)
