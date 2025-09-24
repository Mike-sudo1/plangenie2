from pathlib import Path
text = Path(r"src/lib/api.ts").read_text()
start = text.index("const prompt =")
print(text[start:start+1200])
