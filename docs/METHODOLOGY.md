# Methodology — how the CRS rules were reconstructed and verified

The goal was an engine that returns **exactly** what the official IRCC Express Entry
CRS calculator returns, for any profile — so the scenario/comparison layer can be trusted.

## 1. Extracting the rules

- The official calculator's point tables (age, education, and the language tables) are defined
  as data arrays in the page's own scoring script. These were read directly to get the exact
  values, including the "with spouse" / "without spouse" columns.
- The remaining components (Canadian work experience, spouse factors, skill transferability,
  and additional points) are computed in code on the official page. Their values and thresholds
  were taken from the official **CRS criteria** documentation and then confirmed empirically
  (below).

All of this is captured in [`../data/crs-rules.json`](../data/crs-rules.json).

## 2. Reconstructing the logic

The engine (`engine/crs-engine.js`, mirrored in `engine/crs_engine.py`) implements:

- **Core / human capital:** age, education, first + second official language (per ability, by
  CLB level, capped), Canadian work experience — each using the with/without-spouse column
  selected by marital status and whether an eligible spouse is *accompanying*.
- **Spouse factors:** education, language, Canadian experience (only when an eligible spouse
  accompanies the applicant).
- **Skill transferability:** education×language, education×Canadian-experience,
  foreign-experience×language, foreign×Canadian-experience, and certificate-of-qualification×language,
  with the documented tier logic and the 50-per-bucket / 100-total caps.
- **Additional points:** provincial nomination, Canadian study, French-language bonus,
  sibling in Canada, and job offer.

## 3. Verification (the important part)

The reconstructed engine was run against the **live official calculator** on **5,073 randomly
generated full profiles**. Every profile was scored by both, and compared on the grand total
**and each sub-score**. Result: **0 mismatches.**

This random testing is also what surfaced three behaviors that aren't obvious from the
documentation, all of which the engine now reproduces:

| Behavior | What the official tool does |
|---|---|
| **Job offer** | 0 points for every option (arranged-employment points removed 25 Mar 2025). |
| **French bonus asymmetry** | 50 points only when **English is the first language at CLB 5+** and French is second at CLB 7+. French-as-first pays 25 regardless of the English second-language level. |
| **PTE-as-second quirk** | PTE Core used as the **second** language never triggers the 50-point French tier (gives 25), even at CLB 9. PTE as a *first* language behaves normally. |
| **TCF at CLB 4** | Scores 0 (not 6) for the first official language. |

The `test/` scripts lock in a handful of anchor scores (379, 391, 353, 979, 432) so any future
edit that breaks the engine fails loudly.

## 4. Baselines used for the sensitivity workbook

- **No spouse:** single, age 29, bachelor's, IELTS CLB 9 (all four abilities), no work
  experience, no extras → **379**.
- **With spouse:** married + accompanying spouse, age 29, bachelor's, CLB 9, spouse with no
  credentials → **353**.

Each workbook "sensitivity" sheet changes one answer at a time from its baseline and records the
new total plus the full sub-score breakdown, so the marginal value of each choice is explicit.
