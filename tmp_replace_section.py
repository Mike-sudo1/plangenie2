from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
marker = "        <View style={styles.datesRow}>"
helper = "        <Text variant=\"bodySmall\" style={styles.helperCopy}"
if marker not in text or helper not in text:
    raise SystemExit('Markers not found for date section replacement')
before, rest = text.split(marker, 1)
_, after = rest.split(helper, 1)
new_section = "        <View style={styles.dayPlanToggleRow}>\n          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>\n            Plan just one day?\n          </Text>\n          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />\n        </View>\n\n        <View style={styles.datesRow}>\n          <TouchableOpacity\n            style={styles.dateColumn}\n            onPress={() => setShowStartPicker(true)}\n          >\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          {!form.isDayPlan ? (\n            <TouchableOpacity\n              style={styles.dateColumn}\n              onPress={() => setShowEndPicker(true)}\n            >\n              <TextInput\n                label=\"Depart\"\n                value={formattedEnd}\n                editable={false}\n                pointerEvents=\"none\"\n                mode=\"outlined\"\n                right={<TextInput.Icon icon=\"calendar\" />}\n              />\n            </TouchableOpacity>\n          ) : null}\n        </View>\n\n" + helper
text = before + new_section + after
path.write_text(text)
