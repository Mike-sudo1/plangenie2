from pathlib import Path
import re

path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text().replace("\r\n", "\n")
if text.startswith("\ufeff"):
    text = text[1:]

pattern = r"        <View style=\{styles\.datesRow\}>[\s\S]*?        </View>\n"
replacement = "        <View style={styles.dayPlanToggleRow}>\n          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>\n            Plan just one day?\n          </Text>\n          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />\n        </View>\n\n        <View style={styles.datesRow}>\n          <TouchableOpacity style={styles.dateColumn} onPress={() => setShowStartPicker(true)}>\n            <TextInput\n              label=\"Arrive\"\n              value={formattedStart}\n              editable={false}\n              pointerEvents=\"none\"\n              mode=\"outlined\"\n              right={<TextInput.Icon icon=\"calendar\" />}\n            />\n          </TouchableOpacity>\n          {!form.isDayPlan ? (\n            <TouchableOpacity style={styles.dateColumn} onPress={() => setShowEndPicker(true)}>\n              <TextInput\n                label=\"Depart\"\n                value={formattedEnd}\n                editable={false}\n                pointerEvents=\"none\n              ?'"""?"
