#!/usr/bin/env python3
"""Build the project from its canonical sources.

Single source of truth: data/crs-rules.json  (the point tables & rule constants).

Running this script:
  1. validates the Python engine against the anchor scores,
  2. assembles the self-contained tool  ->  index.html
     (from src/head.html + data/crs-rules.json + engine/crs-engine.js + src/app.js + src/tail.html),
  3. rebuilds the Excel workbook  ->  data/CRS_Master_Workbook.xlsx,
  4. validates the JS engine (if Node is available).

To update the tool after IRCC changes points or rules:
  * edit data/crs-rules.json  (and, only if the scoring LOGIC changed, engine/crs-engine.js + engine/crs_engine.py),
  * run:  python scripts/build.py
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def p(*a): return os.path.join(ROOT, *a)

def read(*a):
    with open(p(*a), encoding="utf-8") as f:
        return f.read()

def main():
    # 1) Python engine anchor check
    sys.path.insert(0, p("engine"))
    import crs_engine  # noqa  (asserts run on demand below)
    checks = [
        ({"q1": "F", "q3": "M", "q4": "E", "q5i-a": "B", "q5i-b-speaking": "G", "q5i-b-listening": "G", "q5i-b-reading": "G", "q5i-b-writing": "G"}, 379),
        ({"q1": "F", "q3": "M", "q4": "E", "q5i-a": "B", "q5i-b-speaking": "H", "q5i-b-listening": "H", "q5i-b-reading": "H", "q5i-b-writing": "H"}, 391),
        ({"q1": "E", "q2i": "A", "q2ii": "B", "q3": "M", "q4": "E", "q5i-a": "B", "q5i-b-speaking": "G", "q5i-b-listening": "G", "q5i-b-reading": "G", "q5i-b-writing": "G"}, 353),
        ({"q1": "F", "q3": "M", "q4": "E", "q9": "B", "q5i-a": "B", "q5i-b-speaking": "G", "q5i-b-listening": "G", "q5i-b-reading": "G", "q5i-b-writing": "G"}, 979),
    ]
    for prof, exp in checks:
        got = crs_engine.score(crs_engine.full(prof))["GRAND_TOTAL"]
        assert got == exp, "Python anchor failed: %d != %d" % (got, exp)
    print("[1/4] Python engine anchors OK")

    # 2) assemble index.html
    rules_raw = read("data", "crs-rules.json")
    json.loads(rules_raw)  # validate JSON
    engine_js = read("engine", "crs-engine.js")
    app_js = read("src", "app.js")
    head = read("src", "head.html")
    tail = read("src", "tail.html")
    html = (head
            + '\n<script type="application/json" id="crs-rules">\n' + rules_raw.strip() + "\n</script>\n"
            + "<script>\n" + engine_js.strip() + "\n</script>\n"
            + "<script>\n" + app_js.strip() + "\n</script>\n"
            + tail)
    with open(p("index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("[2/4] Built index.html (%d KB)" % (len(html) // 1024))

    # 3) rebuild workbook
    r = subprocess.run([sys.executable, p("scripts", "build_workbook.py")], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout); print(r.stderr); raise SystemExit("workbook build failed")
    print("[3/4] Rebuilt data/CRS_Master_Workbook.xlsx")

    # 4) JS engine anchor check (best effort)
    if which("node"):
        r = subprocess.run(["node", p("test", "test_engine.js")], capture_output=True, text=True)
        print("[4/4] " + (r.stdout.strip() or r.stderr.strip()))
        if r.returncode != 0:
            raise SystemExit("JS engine test failed")
    else:
        print("[4/4] Node not found - skipped JS engine test (run `node test/test_engine.js` to verify)")
    print("\nBuild complete.")

def which(cmd):
    for d in os.environ.get("PATH", "").split(os.pathsep):
        if os.path.isfile(os.path.join(d, cmd)):
            return True
    return False

if __name__ == "__main__":
    main()
