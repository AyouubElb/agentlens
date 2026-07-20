const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** ISO string → "12 Jun 2026". */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** ISO string → "2 minutes ago" / "just now". */
export function formatRelativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  for (const [unit, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return rtf.format(-value, unit);
  }
  return "just now";
}

const STALE_AFTER_HOURS = 12;

/** ISO string → terse elapsed time for the queue's "Waiting" column: "just now" / "2m" / "3h" / "5d". */
export function formatWaiting(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** A run that has waited long enough to flag (amber) in the queue. */
export function isStale(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() >= STALE_AFTER_HOURS * 3600 * 1000;
}
