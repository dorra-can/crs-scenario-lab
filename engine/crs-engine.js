/*
 * CRS scoring engine — canonical implementation.
 * Pure function of a RULES object (see data/crs-rules.json), so updating the
 * point tables never touches this logic. Verified against the official IRCC
 * calculator on 5,073 random full profiles (exact on total and all sub-scores).
 *
 * Works in the browser (window.CRSEngine) and Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CRSEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var ABIL = ["speaking", "listening", "reading", "writing"];
  var FRENCH = { C: 1, D: 1 }; // first-language test codes that are French (TEF, TCF)

  function createEngine(R) {
    var clb = R.clb;
    var minCLB = function (vals) {
      var m = Infinity;
      for (var i = 0; i < vals.length; i++) { var c = clb[vals[i]] || 0; if (c < m) m = c; }
      return m;
    };
    // first-language points per ability, honouring the TCF-at-CLB4 quirk
    var fol = function (test, v, ws) {
      if (test === "D" && v === "B") return 0;
      return R.first_official_language_per_ability[v][ws ? 0 : 1];
    };

    // Complete a partial profile with safe defaults (every field present).
    var DEFAULTS = {
      q1: "F", q2i: "A", q2ii: "A", q3: "M", q4: "E", q4b: "A", q4c: "A", q5i: "A", "q5i-a": "B",
      "q5i-b-speaking": "A", "q5i-b-listening": "A", "q5i-b-reading": "A", "q5i-b-writing": "A",
      q5ii: "C", "q5ii-sol-speaking": "A", "q5ii-sol-listening": "A", "q5ii-sol-reading": "A", "q5ii-sol-writing": "A",
      q6i: "A", q6ii: "A", q7: "A", q8: "A", q8a: "A", q9: "A", q10i: "A",
      q10: "A", q11: "A", q12i: "F", "q12ii-fol-speaking": "A", "q12ii-fol-listening": "A", "q12ii-fol-reading": "A", "q12ii-fol-writing": "A"
    };
    function full(p) { var d = {}, k; for (k in DEFAULTS) d[k] = DEFAULTS[k]; for (k in p) d[k] = p[k]; return d; }

    function score(p) {
      var g = function (k) { return p[k]; };
      var married = g("q1") === "B" || g("q1") === "E";
      var ws = married && g("q2i") === "A" && g("q2ii") === "B";
      var R2 = {};
      R2.core_age = R.age[g("q3")][ws ? 0 : 1];
      R2.core_education = R.education[g("q4")][ws ? 0 : 1];
      var t1 = g("q5i-a");
      var v1 = ABIL.map(function (a) { return g("q5i-b-" + a); });
      R2.core_lang_first = v1.reduce(function (s, v) { return s + fol(t1, v, ws); }, 0);
      var hasSecond = g("q5ii") && g("q5ii") !== "C";
      var v2 = ABIL.map(function (a) { return g("q5ii-sol-" + a) || "A"; });
      var sec = 0;
      if (hasSecond) {
        sec = v2.reduce(function (s, v) { return s + R.second_official_language_per_ability[v][ws ? 0 : 1]; }, 0);
        sec = Math.min(ws ? R.caps.second_lang_with_spouse : R.caps.second_lang_without_spouse, sec);
      }
      R2.core_lang_second = sec;
      R2.core_lang_total = R2.core_lang_first + R2.core_lang_second;
      R2.core_cdn_exp = R.canadian_work_experience[g("q6i")][ws ? 0 : 1];
      R2.core_subtotal = R2.core_age + R2.core_education + R2.core_lang_total + R2.core_cdn_exp;

      var se = 0, sl = 0, sc = 0;
      if (ws) {
        se = R.spouse_education[g("q10")] || 0;
        sc = R.spouse_canadian_experience[g("q11")] || 0;
        if (g("q12i") && g("q12i") !== "F") {
          sl = Math.min(R.caps.spouse_language_total, ABIL.reduce(function (s, a) {
            return s + (R.spouse_language_per_ability[g("q12ii-fol-" + a) || "A"] || 0);
          }, 0));
        }
      }
      R2.spouse_education = se; R2.spouse_lang = sl; R2.spouse_cdn_exp = sc; R2.spouse_subtotal = se + sl + sc;

      // ---- skill transferability ----
      var T = R.skill_transferability;
      var eduTier = T.education_tier0_levels.indexOf(g("q4")) >= 0 ? 0
        : (T.education_tier2_levels.indexOf(g("q4")) >= 0 ? 2 : 1);
      var pts = function (tier) { return T.points_by_tier[String(tier)]; }; // [half, full]
      var c9 = minCLB(v1) >= 9, c7 = minCLB(v1) >= 7, c5 = minCLB(v1) >= 5;
      var eL = 0; if (eduTier > 0) { if (c9) eL = pts(eduTier)[1]; else if (c7) eL = pts(eduTier)[0]; }
      var cdnLvl = g("q6i") === "A" ? 0 : (g("q6i") === "B" ? 1 : 2);
      var eC = 0; if (eduTier > 0) { if (cdnLvl === 2) eC = pts(eduTier)[1]; else if (cdnLvl === 1) eC = pts(eduTier)[0]; }
      var eduSub = Math.min(50, eL + eC);
      var fLvl = g("q6ii") === "A" ? 0 : (g("q6ii") === "D" ? 2 : 1);
      var fL = 0; if (fLvl > 0) { if (c9) fL = pts(fLvl)[1]; else if (c7) fL = pts(fLvl)[0]; }
      var fC = 0; if (fLvl > 0) { if (cdnLvl === 2) fC = pts(fLvl)[1]; else if (cdnLvl === 1) fC = pts(fLvl)[0]; }
      var forSub = Math.min(50, fL + fC);
      var cert = 0; if (g("q7") === "B") { cert = c7 ? T.certificate.clb7 : (c5 ? T.certificate.clb5 : 0); }
      R2.st_lang_education = eL; R2.st_cdnexp_education = eC; R2.st_edu_subtotal = eduSub;
      R2.st_lang_foreignexp = fL; R2.st_cdn_foreign = fC; R2.st_foreign_subtotal = forSub; R2.st_cert = cert;
      R2.st_subtotal = Math.min(R.caps.skill_transferability_total, eduSub + forSub + cert);

      // ---- additional ----
      var studyMap = { A: R.study_bonus.secondary, B: R.study_bonus.one_or_two_year, C: R.study_bonus.three_year_plus };
      var study = g("q4b") === "B" ? (studyMap[g("q4c")] || 0) : 0;
      var pnp = g("q9") === "B" ? R.additional.provincial_nomination : 0;
      var sib = g("q10i") === "B" ? R.additional.sibling_in_canada : 0;
      var firstIsFrench = !!FRENCH[t1], frenchMin = null, englishMin = null, pteSecond = false;
      if (firstIsFrench) { frenchMin = minCLB(v1); if (hasSecond) { englishMin = minCLB(v2); if (g("q5ii") === "E") pteSecond = true; } }
      else { englishMin = minCLB(v1); if (hasSecond) frenchMin = minCLB(v2); }
      var french = 0;
      if (frenchMin != null && frenchMin >= 7) {
        var eq = (englishMin != null && englishMin >= 5) && !pteSecond;
        french = eq ? R.additional.french_with_english_clb5 : R.additional.french_only;
      }
      R2.add_pnp = pnp; R2.add_study = study; R2.add_sibling = sib; R2.add_french = french;
      R2.add_subtotal = Math.min(R.caps.additional_total, pnp + study + sib + french);

      R2.GRAND_TOTAL = Math.min(R.caps.grand_total,
        R2.core_subtotal + R2.spouse_subtotal + R2.st_subtotal + R2.add_subtotal);
      return R2;
    }

    return { score: score, full: full, rules: R, ABIL: ABIL };
  }

  return { createEngine: createEngine };
});
