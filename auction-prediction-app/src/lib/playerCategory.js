/**
 * playerCategory.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for:
 *   • Performance score formulas (role-based)
 *   • Category classification  A / B / C
 *   • Base price from category
 *
 * Same input always → same output (fully deterministic).
 * Import and use across AddPlayer, PredictPrice, PlayerDetails.
 */

// ── 1. PERFORMANCE SCORE ─────────────────────────────────────
/**
 * @param {string} role
 * @param {{ matches, runs, strikeRate, wickets, economy, catches, stumps }} stats
 * @returns {number} score
 */
export function computePerformanceScore(role, stats) {
  const m   = parseFloat(stats.matches)    || 0;
  const r   = parseFloat(stats.runs)       || 0;
  const sr  = parseFloat(stats.strikeRate) || 0;
  const w   = parseFloat(stats.wickets)    || 0;
  const eco = parseFloat(stats.economy)    || 0;
  const ct  = parseFloat(stats.catches)    || 0;
  const st  = parseFloat(stats.stumps)     || 0;

  switch (role) {
    case 'Batsman':
      return (0.4 * (r / 100))
           + (0.3 * sr)
           + (0.3 * m);

    case 'Bowler':
      return (0.5 * w)
           + (0.3 * m)
           - (0.2 * eco * 10);

    case 'All-Rounder':
      return (0.25 * (r / 100))
           + (0.25 * sr)
           + (0.25 * w)
           + (0.15 * m)
           - (0.1 * eco * 10);

    case 'Wicketkeeper Batsman':
      return (0.30 * (r / 100))
           + (0.25 * sr)
           + (0.15 * m)
           + (0.15 * ct)
           + (0.15 * st);

    default:
      return 0;
  }
}

// ── 2. CATEGORY CLASSIFICATION ───────────────────────────────
/**
 * @param {number} score
 * @returns {'A'|'B'|'C'}
 */
export function classifyCategory(score) {
  if (score >= 100) return 'A';
  if (score >= 60)  return 'B';
  return 'C';
}

/**
 * Convenience: compute + classify together.
 * @param {string} role
 * @param {object} stats
 * @returns {'A'|'B'|'C'}
 */
export function getAutoCategory(role, stats) {
  return classifyCategory(computePerformanceScore(role, stats));
}

// ── 3. BASE PRICE FROM CATEGORY ──────────────────────────────
export const CATEGORY_COLORS = {
  A: '#16A34A',   // green
  B: '#F97316',   // orange
  C: '#DC2626',   // red
};

export const CATEGORY_BASE_PRICE = {
  A: 25000000,    // ₹2.5 Cr
  B: 12000000,    // ₹1.2 Cr
  C:  8000000,    // ₹80 L
};

/**
 * Deterministic predicted price (no Math.random).
 * @param {number} score
 * @param {'A'|'B'|'C'} category
 * @returns {number}
 */
export function computePredictedPrice(score, category) {
  // Use category base price as floor, then add a score-driven bonus
  const base    = CATEGORY_BASE_PRICE[category] || 8000000;
  const bonus   = Math.floor(score * 150000);   // 1.5L per score point
  return base + bonus;
}
