import { DEFAULT_THRESHOLDS } from '@/lib/constants/scoring';

/**
 * Normalize a score to the 0-100 scale.
 * DB stores scores as 0-1.0; UI expects 0-100.
 * Scores <= 1.0 are assumed to be on the 0-1 scale and are multiplied by 100.
 */
export function normalizeScore(score: number): number {
  return score <= 1 ? score * 100 : score;
}

export function getScoreBand(score: number): 'high' | 'medium' | 'low' {
  const normalized = normalizeScore(score);
  if (normalized >= DEFAULT_THRESHOLDS.high) return 'high';
  if (normalized >= DEFAULT_THRESHOLDS.low) return 'medium';
  return 'low';
}

export function getScoreColor(score: number): string {
  const band = getScoreBand(score);
  if (band === 'high') return 'text-green-600';
  if (band === 'medium') return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBg(score: number): string {
  const band = getScoreBand(score);
  if (band === 'high') return 'bg-green-50';
  if (band === 'medium') return 'bg-amber-50';
  return 'bg-red-50';
}

export function getScoreBorderColor(score: number): string {
  const band = getScoreBand(score);
  if (band === 'high') return 'border-green-200';
  if (band === 'medium') return 'border-amber-200';
  return 'border-red-200';
}

export function formatScore(score: number, withTotal = false): string {
  const rounded = Math.round(normalizeScore(score));
  if (withTotal) return `${rounded}/100`;
  return `${rounded}`;
}
