from pathlib import Path
text = Path(r"src/hooks/usePlanner.ts").read_text()
start = text.index("const submit")
print(text[start:start+2000])
