from pathlib import Path
path = Path(r"src/screens/PlannerScreen.tsx")
text = path.read_text()
old = "        <DatePickerModal\r\n          visible={showEndPicker}\r\n          mode=\"single\"\r\n          date={form.endDate}\r\n          onDismiss={() => setShowEndPicker(false)}\r\n          onConfirm={({ date }) => {"
if old not in text:
    raise SystemExit('End picker block not found')
new = "        <DatePickerModal\n          visible={!form.isDayPlan && showEndPicker}\n          mode=\"single\"\n          date={form.endDate}\n          onDismiss={() => setShowEndPicker(false)}\n          onConfirm={({ date }) => {"
path.write_text(text.replace(old, new))
