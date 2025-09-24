from pathlib import Path
text = Path(r"src/lib/api.ts").read_text()
start = text.index("export const requestMultiDayItinerary")
print(text[start:start+1200])
