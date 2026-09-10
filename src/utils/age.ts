/**
 * DOB parsing/age math shared between register.tsx's minimum-age gate and
 * onboarding/personal.tsx's date-of-birth field, both of which use the same
 * free-text "DD / MM / YYYY" format (see onboardingService.ts's
 * OnboardingPersonal.dob doc comment).
 *
 * India-first launch (see PROGRESS.md's working assumptions) — the DPDP
 * Act 2023 sets 18 as the age below which a "Data Fiduciary" needs
 * verifiable parental/guardian consent before processing a child's
 * personal data (Section 9). ResQ has no backend to verify a parent's
 * identity or consent today, so rather than fake a consent flow this app
 * can't actually honor, the honest choice (documented in PROGRESS.md's
 * decisions log) is: registration requires being 18+. A real
 * parental-consent flow is Phase 3+ scope, once there's a backend to
 * receive and verify it against.
 */

export const MINIMUM_AGE = 18;

export type ParsedDob = { day: number; month: number; year: number };

/**
 * Parses "DD / MM / YYYY" (spaces around the slashes optional — matches
 * what the input mask actually produces) into numeric parts. Returns null
 * for anything that doesn't match the expected shape; deliberately doesn't
 * try to guess other date orderings (MM/DD/YYYY etc.) since every DOB field
 * in this app uses one fixed format end to end.
 */
export function parseDob(raw: string): ParsedDob | null {
  const match = raw.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Reject impossible calendar dates (e.g. 31/02/2000) by round-tripping
  // through a real Date and checking nothing got silently clamped.
  const asDate = new Date(year, month - 1, day);
  if (asDate.getFullYear() !== year || asDate.getMonth() !== month - 1 || asDate.getDate() !== day) {
    return null;
  }
  return { day, month, year };
}

/** Age in whole years as of `now` (defaults to the real current date). */
export function ageFromDob(dob: ParsedDob, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.year;
  const hasHadBirthdayThisYear =
    now.getMonth() + 1 > dob.month || (now.getMonth() + 1 === dob.month && now.getDate() >= dob.day);
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/**
 * True if a "DD / MM / YYYY" string both parses and represents someone
 * `MINIMUM_AGE` or older. Used at registration to gate account creation —
 * see register.tsx. `now` defaults to the real current date; only
 * overridden by tests so date-relative assertions ("exactly 18 today")
 * don't silently go stale as real time passes.
 */
export function meetsMinimumAge(raw: string, minimumAge: number = MINIMUM_AGE, now: Date = new Date()): boolean {
  const parsed = parseDob(raw);
  if (!parsed) return false;
  return ageFromDob(parsed, now) >= minimumAge;
}
