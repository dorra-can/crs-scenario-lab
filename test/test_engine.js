/* Node test: the JS engine reproduces the anchor scores captured from the
   official IRCC calculator. Run:  node test/test_engine.js  */
const fs = require("fs");
const path = require("path");
const CRSEngine = require("../engine/crs-engine.js");
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "crs-rules.json"), "utf8"));
const ENG = CRSEngine.createEngine(RULES);

const L = (v) => ({ "q5i-b-speaking": v, "q5i-b-listening": v, "q5i-b-reading": v, "q5i-b-writing": v });
const cases = [
  [Object.assign({ q1: "F", q3: "M", q4: "E", "q5i-a": "B" }, L("G")), 379],
  [Object.assign({ q1: "F", q3: "M", q4: "E", "q5i-a": "B" }, L("H")), 391],
  [Object.assign({ q1: "E", q2i: "A", q2ii: "B", q3: "M", q4: "E", "q5i-a": "B" }, L("G")), 353],
  [Object.assign({ q1: "F", q3: "M", q4: "E", q9: "B", "q5i-a": "B" }, L("G")), 979],
  [Object.assign({ q1: "F", q3: "M", q4: "E", q6i: "B", "q5i-a": "B" }, L("G")), 432],
];
let fail = 0;
for (const [prof, exp] of cases) {
  const got = ENG.score(ENG.full(prof)).GRAND_TOTAL;
  if (got !== exp) { console.error("FAIL", exp, "got", got); fail++; }
}
if (fail) { console.error(fail + " anchor(s) failed"); process.exit(1); }
console.log("JS engine anchors OK (" + cases.length + " cases)");
