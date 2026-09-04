import pathlib, re, sys
# Resolve from this file, not the caller's cwd. Run from the repo root the
# relative path missed and the gate died with FileNotFoundError, which
# config-preflight reported as a broken line continuation -- a real-sounding
# failure that was only ever a path bug.
p = pathlib.Path(__file__).resolve().parent.parent / "images/kde/Containerfile"
lines = p.read_text().split("\n")
bad = []
for i, line in enumerate(lines[:-1]):
    s = line.rstrip()
    if not s or s.lstrip().startswith("#") or s.endswith("\\"):
        continue
    nxt = lines[i + 1]
    # An indented, non-comment, non-blank line after a line that does NOT
    # continue means the instruction ended where the author did not intend.
    if nxt[:1] in (" ", "\t") and nxt.strip() and not nxt.strip().startswith("#"):
        bad.append((i + 1, s[-70:], nxt.strip()[:60]))
for n, cur, nxt in bad:
    print(f"line {n}: ends without a backslash but the next line continues it")
    print(f"   ...{cur}")
    print(f"   -> {nxt}")
print(("FAIL %d broken continuation(s)" % len(bad)) if bad else "PASS Containerfile line continuations intact")
sys.exit(1 if bad else 0)
