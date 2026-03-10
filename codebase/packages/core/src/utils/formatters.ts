/**
 * Formats a USD dollar amount into a human-readable currency string.
 *
 * Examples:
 *   1_200_000    → "$1.2M"
 *   500_000      → "$500K"
 *   1_234        → "$1,234"
 *   999          → "$999"
 */
export function formatCurrency(usd: number): string {
  const abs = Math.abs(usd);
  const sign = usd < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${sign}$${formatted}M`;
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}$${formatted}K`;
  }

  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

/**
 * Formats a market size (in USD) as a TAM string.
 *
 * Example: 1_200_000_000 → "$1.2B TAM"
 */
export function formatMarketSize(usd: number): string {
  const abs = Math.abs(usd);

  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000;
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
    return `$${formatted}B TAM`;
  }

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `$${formatted}M TAM`;
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `$${formatted}K TAM`;
  }

  return `$${Math.round(abs).toLocaleString('en-US')} TAM`;
}

/**
 * Formats a numeric score as "X/100".
 *
 * Example: 72.4 → "72/100"
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * Examples:
 *   150_000 → "2m 30s"
 *   45_000  → "45s"
 *   3_600_000 → "1h 0m"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Formats an ISO date string to a readable date.
 *
 * Example: "2025-01-15T10:30:00Z" → "Jan 15, 2025"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats an ISO date string as a relative time expression.
 *
 * Examples:
 *   (30 seconds ago)   → "30 seconds ago"
 *   (3 hours ago)      → "3 hours ago"
 *   (2 days ago)       → "2 days ago"
 */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  }

  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  if (weeks < 4) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  return years === 1 ? '1 year ago' : `${years} years ago`;
}
