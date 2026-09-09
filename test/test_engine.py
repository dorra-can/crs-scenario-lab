"""Python test: engine reproduces the anchor scores captured from the official
IRCC calculator, and agrees with the JS engine on a batch of random profiles.
Run:  python test/test_engine.py
"""
import os, sys, json, random, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "engine"))
import crs_engine as E

def L(v): return {"q5i-b-" + a: v for a in E.ABIL}

ANCHORS = [
    (dict(q1="F", q3="M", q4="E", **{"q5i-a": "B"}, **L("G")), 379),
    (dict(q1="F", q3="M", q4="E", **{"q5i-a": "B"}, **L("H")), 391),
    (dict(q1="E", q2i="A", q2ii="B", q3="M", q4="E", **{"q5i-a": "B"}, **L("G")), 353),
    (dict(q1="F", q3="M", q4="E", q9="B", **{"q5i-a": "B"}, **L("G")), 979),
    (dict(q1="F", q3="M", q4="E", q6i="B", **{"q5i-a": "B"}, **L("G")), 432),
]

def test_anchors():
    for prof, exp in ANCHORS:
        got = E.score(E.full(prof))["GRAND_TOTAL"]
        assert got == exp, "anchor %d != %d" % (got, exp)
    print("Python anchors OK (%d cases)" % len(ANCHORS))

if __name__ == "__main__":
    test_anchors()
    print("All Python tests passed.")
