from pathlib import Path
import difflib

base = Path(r"C:\Users\Mizauka\Desktop\CatsOnPlains\Docs\第0章")
v12 = (base / "v12" / "全文.md").read_text(encoding="utf-8")
v13 = (base / "v13" / "全文.md").read_text(encoding="utf-8")
print("v12 chars:", len(v12), "lines:", v12.count(chr(10)) + 1)
print("v13 chars:", len(v13), "lines:", v13.count(chr(10)) + 1)
a = v12.splitlines()
b = v13.splitlines()
diff = list(difflib.unified_diff(a, b, fromfile="v12", tofile="v13", lineterm="", n=2))
out = base / "v13" / "_diff_v12_v13.md"
out.write_text("\n".join(diff), encoding="utf-8")
print("diff lines:", len(diff))
print("added:", sum(1 for l in diff if l.startswith("+") and not l.startswith("+++")))
print("removed:", sum(1 for l in diff if l.startswith("-") and not l.startswith("---")))
