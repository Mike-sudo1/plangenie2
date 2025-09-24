from pathlib import Path
text = Path(r"src/hooks/usePlanner.ts").read_text()
print(text[:2000])
