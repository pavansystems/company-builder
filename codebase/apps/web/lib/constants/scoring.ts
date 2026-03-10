export const DEFAULT_THRESHOLDS = {
  high: 70,
  low: 40,
} as const;

export const SCORE_BANDS = {
  high: {
    label: 'Strong',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  medium: {
    label: 'Moderate',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  low: {
    label: 'Weak',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
} as const;
