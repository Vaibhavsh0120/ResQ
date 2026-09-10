import { MINIMUM_AGE, ageFromDob, meetsMinimumAge, parseDob } from '@/utils/age';

describe('parseDob', () => {
  it('parses a well-formed DD / MM / YYYY string', () => {
    expect(parseDob('05/06/2000')).toEqual({ day: 5, month: 6, year: 2000 });
  });

  it('tolerates the spaced format the input mask actually produces', () => {
    expect(parseDob('05 / 06 / 2000')).toEqual({ day: 5, month: 6, year: 2000 });
  });

  it('rejects an impossible calendar date instead of silently clamping it', () => {
    // Date(2001, 1, 31) rolls over to March 3rd rather than throwing —
    // this is exactly the silent-clamp case parseDob has to catch.
    expect(parseDob('31/02/2001')).toBeNull();
  });

  it('accepts a real leap-day date', () => {
    expect(parseDob('29/02/2000')).toEqual({ day: 29, month: 2, year: 2000 });
  });

  it('rejects garbage input', () => {
    expect(parseDob('')).toBeNull();
    expect(parseDob('not a date')).toBeNull();
    expect(parseDob('13/13/2000')).toBeNull();
  });
});

describe('ageFromDob', () => {
  const now = new Date(2026, 8, 10); // September 10, 2026 — matches "today" for this project

  it('counts a full year for someone whose birthday already passed this year', () => {
    expect(ageFromDob({ day: 1, month: 1, year: 2000 }, now)).toBe(26);
  });

  it('does not count this year until the birthday actually arrives', () => {
    expect(ageFromDob({ day: 15, month: 9, year: 2000 }, now)).toBe(25);
  });

  it('counts the birthday itself as already turned', () => {
    expect(ageFromDob({ day: 10, month: 9, year: 2000 }, now)).toBe(26);
  });
});

describe('meetsMinimumAge', () => {
  // Fixed reference date, injected explicitly — these assertions must not
  // depend on the real current date, or they'd start failing on their own
  // birthday each year.
  const now = new Date(2026, 8, 10);

  it('passes for someone exactly the minimum age as of `now`', () => {
    expect(meetsMinimumAge('10/09/2008', MINIMUM_AGE, now)).toBe(true);
  });

  it('fails for someone one day away from the minimum age', () => {
    expect(meetsMinimumAge('11/09/2008', MINIMUM_AGE, now)).toBe(false);
  });

  it('fails for unparseable input rather than throwing', () => {
    expect(meetsMinimumAge('', MINIMUM_AGE, now)).toBe(false);
    expect(meetsMinimumAge('gibberish', MINIMUM_AGE, now)).toBe(false);
  });
});
