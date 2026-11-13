from pathlib import Path
import re
import difflib

base = Path(r"C:\Users\Mizauka\Desktop\CatsOnPlains\Docs\第0章")
v10 = (base / "v10" / "全文.md").read_text(encoding="utf-8")
v11 = (base / "v11" / "全文.md").read_text(encoding="utf-8")
print("v10 chars:", len(v10), "lines:", v10.count(chr(10)) + 1)
print("v11 chars:", len(v11), "lines:", v11.count(chr(10)) + 1)
print("--- v11 acts ---")
for part in re.split(r"(?m)^## ", v11)[1:]:
    title = part.splitlines()[0].strip()
    print(f"{title}: {len('## ' + part)}")
a = v10.splitlines()
b = v11.splitlines()
diff = list(difflib.unified_diff(a, b, fromfile="v10", tofile="v11", lineterm="", n=2))
out = base / "v11" / "_diff_v10_v11.md"
out.write_text("\n".join(diff), encoding="utf-8")
print("diff lines:", len(diff))
print("added:", sum(1 for l in diff if l.startswith("+") and not l.startswith("+++")))
print("removed:", sum(1 for l in diff if l.startswith("-") and not l.startswith("---")))
