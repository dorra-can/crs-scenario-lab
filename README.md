# CRS Scenario Lab

An interactive tool and reference dataset for Canada's **Express Entry Comprehensive Ranking System (CRS)**.

Set a baseline profile, choose which factors to vary (and which values — e.g. *age 28–32 only*), and instantly compare the resulting scores side by side, with a full sub-score breakdown. It's a scoring engine that **reproduces the official Government of Canada (IRCC) CRS calculator**, plus a scenario/​sensitivity layer the official tool doesn't have.

> **Verification:** the scoring engine was checked against the official IRCC calculator on **5,073 random full profiles** — exact match on the grand total and every sub-score.

---

## What's in here

```
index.html                    ← the tool (self-contained; open it in a browser)
data/
  crs-rules.json              ← THE single source of truth: every point table & rule constant
  CRS_Master_Workbook.xlsx    ← point tables + one-factor-at-a-time sensitivity data
engine/
  crs-engine.js               ← scoring engine (browser + Node), reads the rules object
  crs_engine.py               ← same engine in Python, reads data/crs-rules.json
src/
  head.html, app.js, tail.html ← the tool's markup/CSS and UI logic (assembled into index.html)
scripts/
  build.py                    ← rebuilds index.html + the workbook from the canonical sources
  build_workbook.py           ← generates the Excel workbook
test/
  test_engine.py, test_engine.js ← anchor-score checks for both engines
docs/
  METHODOLOGY.md              ← how the rules were reverse-engineered and verified
```

## Use it

- **Just use the tool:** open `index.html` in any modern browser. No build, no server, no dependencies.
- **Live version:** see [Hosting](#hosting-a-live-website) below.

## How the score is built

`Total = Core/human-capital + Spouse factors + Skill transferability + Additional points`, capped at 1,200.
Core covers age, education, official languages and Canadian work experience; the "with spouse" columns apply only to an *accompanying* spouse (they lower the core caps but add up to 40 spouse points). See `docs/METHODOLOGY.md` and `data/crs-rules.json` for every number.

Three non-obvious behaviors of the official tool that this project reproduces faithfully:

1. **Job offer / arranged employment = 0 points** (removed 25 March 2025).
2. **French bonus is asymmetric** — 50 points only when English is the *first* language at CLB 5+ and French is second at CLB 7+; French-as-first pays 25. And **PTE Core used as the *second* language never reaches the 50 tier** (a quirk in the official tool).
3. **TCF Canada at CLB 4** scores 0 for the first official language.

## Keeping it up to date (when IRCC changes the rules)

Everything is driven by **`data/crs-rules.json`**. When points or thresholds change:

1. Edit the numbers in `data/crs-rules.json`.
2. Run the build:
   ```bash
   python scripts/build.py
   ```
   This re-validates the engine, rebuilds `index.html`, and regenerates the Excel workbook.

Only if the scoring *logic* changes (not just numbers) do you also touch `engine/crs-engine.js` and `engine/crs_engine.py` — they share the exact same structure.

## Tests

```bash
python test/test_engine.py     # Python engine anchor scores
node   test/test_engine.js      # JS engine anchor scores
```

Both assert the engine reproduces scores captured from the official calculator (379, 391, 353, 979, 432).

## Hosting a live website

The tool is a single static file, so any static host works. Easiest options:

- **GitHub Pages** — in the repo, go to **Settings → Pages**, set the source to the `main` branch (root), and it publishes at `https://<user>.github.io/crs-scenario-lab/`. (Pages on a *private* repo needs a paid GitHub plan; a public repo hosts for free.)
- **Netlify / Cloudflare Pages / Vercel** — drag-and-drop or connect the repo; point it at the repo root, no build command needed.

## Disclaimer

Independent project. **Not affiliated with or endorsed by the Government of Canada or IRCC.** Scores are estimates for planning and comparison; always confirm a real application against the [official calculator](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html). Point rules current to 2026.

## License

MIT — see [LICENSE](LICENSE).
