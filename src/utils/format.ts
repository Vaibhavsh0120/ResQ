/**
 * Derives up to 2 initials from a display name, e.g. "Alex Chen" -> "AC".
 * Falls back to a single "?" for guests / anyone with no name on file,
 * rather than a hardcoded placeholder like "AC".
 */
export function initialsFromName(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** "Good morning" / "Good afternoon" / "Good evening", based on the device's local time. */
export function timeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "TUESDAY, 8 SEPTEMBER" — uppercase, matches the existing Eyebrow style on Home. */
export function todayEyebrow(date: Date = new Date()): string {
  return date
    .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();
}

/**
 * "3 min ago" / "2h ago" / "5d ago" — relative time from an ISO
 * timestamp. Originally local to notifications.tsx; moved here
 * 2026-09-12 when chatHistoryService.ts needed the same thing for
 * conversation thread timestamps, rather than keeping two copies.
 */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
