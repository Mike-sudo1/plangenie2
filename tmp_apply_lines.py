from pathlib import Path

path = Path(r"src/screens/PlannerScreen.tsx")
lines = path.read_text().splitlines()
if lines and lines[0].startswith('\ufeff'):
    lines[0] = lines[0].lstrip('\ufeff')

idx = lines.index("        <View style={styles.datesRow}>")
end_idx = idx
while end_idx < len(lines) and lines[end_idx] != "":
    end_idx += 1
end_idx += 1

new_lines = [
    "        <View style={styles.dayPlanToggleRow}>",
    "          <Text variant=\"bodyMedium\" style={styles.dayPlanToggleLabel}>",
    "            Plan just one day?",
    "          </Text>",
    "          <Switch value={form.isDayPlan} onValueChange={handleToggleDayPlan} />",
    "        </View>",
    "",
    "        <View style={styles.datesRow}>",
    "          <TouchableOpacity",
    "            style={styles.dateColumn}",
    "            onPress={() => setShowStartPicker(true)}",
    "          >",
    "            <TextInput",
    "              label=\"Arrive\"",
    "              value={formattedStart}",
    "              editable={false}",
    "              pointerEvents=\"none\"",
    "              mode=\"outlined\"",
    "              right={<TextInput.Icon icon=\"calendar\" />}\",
    "            />",
    "          </TouchableOpacity>",
    "          {!form.isDayPlan ? (",
    "            <TouchableOpacity",
    "              style={styles.dateColumn}",
    "              onPress={() => setShowEndPicker(true)}",
    "            >",
    "              <TextInput",
    "                label=\"Depart\"",
    "                value={formattedEnd}",
    "                editable={false}",
    "                pointerEvents=\"none\"",
    "                mode=\"outlined\"",
    "                right={<TextInput.Icon icon=\"calendar\" />}\",
    "              />",
    "            </TouchableOpacity>",
    "          ) : null}",
    "        </View>",
    "",
]

# Fix right lines last char - we used \" at end purposely? Wait we have to ensure correct.
