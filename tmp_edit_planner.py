from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
text = text.replace("\r\n", "\n")

text = text.replace("import React, { useEffect, useMemo, useState } from 'react';", "import React, { useCallback, useEffect, useMemo, useState } from 'react';")
text = text.replace(
    "  HelperText,\n  Portal,\n  ProgressBar,\n  Surface,\n  Text,\n  TextInput,\n  useTheme\n} from 'react-native-paper';",
    "  HelperText,\n  Portal,\n  ProgressBar,\n  Surface,\n  Switch,\n  Text,\n  TextInput,\n  useTheme\n} from 'react-native-paper';"
)

old_dates = "        <View style={styles.datesRow}>\n          <TouchableOpacity\n            style={styles.dateColumn}\n            onPress={() => setShowStartPicker(true)}\n          >\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          <TouchableOpacity\n            style={styles.dateColumn}\n            onPress={() => setShowEndPicker(true)}\n          >\n            <TextInput\n              label=\"Depart\"\n              value={formattedEnd}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n        </View>\n"
new_dates = "        <View style={styles.dayPlanToggleRow}>\n          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>\n            Plan just one day?\n          </Text>\n          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />\n        </View>\n\n        <View style={styles.datesRow}>\n          <TouchableOpacity style={styles.dateColumn} onPress={() => setShowStartPicker(true)}>\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          {!form.isDayPlan ? (\n            <TouchableOpacity style={styles.dateColumn} onPress={() => setShowEndPicker(true)}>\n              <TextInput\n                label=\"Depart\"\n                value={formattedEnd}\n                editable={false}\n                pointerEvents=\"none\"\n                mode=\"outlined\"\n                right={<TextInput.Icon icon=\"calendar\" />}\n              />\n            </TouchableOpacity>\n          ) : null}\n        </View>\n"
if old_dates not in text:
    raise SystemExit('dates block not found after normalization')
text = text.replace(old_dates, new_dates)

marker = "  const invalidRange = tripLength < 1;\n\n  useFocusEffect("
if marker not in text:
    raise SystemExit('handler marker not found after normalization')
handler = "  const invalidRange = tripLength < 1;\n\n  const handleToggleDayPlan = useCallback((value: boolean) => {\n    updateField('isDayPlan', value);\n  }, [updateField]);\n\n  useEffect(() => {\n    if (form.isDayPlan && showEndPicker) {\n      setShowEndPicker(false);\n    }\n  }, [form.isDayPlan, showEndPicker]);\n\n  useFocusEffect("
text = text.replace(marker, handler)

old_visible = "        <DatePickerModal\n          visible={showEndPicker}\n          mode=\"single\""
text = text.replace(old_visible, "        <DatePickerModal\n          visible={!form.isDayPlan && showEndPicker}\n          mode=\"single\"")

style_marker = "  helperCopy: {\n    color: '#64748b',\n  },\n  datesRow: {"
style_insert = "  helperCopy: {\n    color: '#64748b',\n  },\n  dayPlanToggleRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginTop: 8,\n  },\n  dayPlanToggleLabel: {\n    fontWeight: '600',\n  },\n  datesRow: {"
if style_marker not in text:
    raise SystemExit('style marker not found')
text = text.replace(style_marker, style_insert)

path.write_text(text)
