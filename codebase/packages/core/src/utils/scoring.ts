/**
 * Computes a weighted average score from a set of dimension scores.
 *
 * Each dimension score is expected to be in the range [0, 100].
 * Weights should sum to 1.0 (they are not re-normalized internally).
 * The result is clamped to [0, 100].
 *
 * Dimensions that have no corresponding weight entry are ignored.
 * Weight entries that have no corresponding dimension score are also ignored.
 */
export function computeWeightedScore(
  dimensions: Record<string, number>,
  weights: Record<string, number>,
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    const score = dimensions[dimension];
    if (score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  // If weights don't sum to 1, normalize by the actual total weight applied
  const raw = totalWeight === 1 ? weightedSum : weightedSum / totalWeight;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Maps a raw value from [min, max] to a [0, 100] scale.
 *
 * If min === max, returns 0 to avoid division by zero.
 * The result is clamped to [0, 100].
 */
export function normalizeScore(raw: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  const normalized = ((raw - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export type ScoreBand = 'high' | 'medium' | 'low';

/**
 * Categorizes a score into a named band.
 *
 * Defaults: high >= 70, low < 40, medium in between.
 */
export function getScoreBand(
  score: number,
  highThreshold: number = 70,
  lowThreshold: number = 40,
): ScoreBand {
  if (score >= highThreshold) return 'high';
  if (score < lowThreshold) return 'low';
  return 'medium';
}
