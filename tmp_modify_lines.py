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
print('idx', idx, 'end_idx', end_idx)
print(lines[idx:end_idx])
