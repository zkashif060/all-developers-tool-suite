import { describe, it, expect } from 'vitest';
import {
  timestampToDate,
  dateToTimestamp,
  getRelativeTimeString
} from './timestamp.engine';

describe('Timestamp Converter Engine', () => {
  it('should convert epoch seconds to readable UTC, local, and ISO date', () => {
    // 1700000000 seconds = 2023-11-14T22:13:20.000Z
    const result = timestampToDate(1700000000, 'seconds');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.unit).toBe('seconds');
      expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
      expect(result.utc).toBe('Tue, 14 Nov 2023 22:13:20 GMT');
      expect(result.timestamp).toBe(1700000000);
    }
  });

  it('should convert epoch milliseconds to date when unit is explicitly milliseconds', () => {
    // 1700000000000 ms = 2023-11-14T22:13:20.000Z
    const result = timestampToDate('1700000000000', 'milliseconds');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.unit).toBe('milliseconds');
      expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
      expect(result.utc).toBe('Tue, 14 Nov 2023 22:13:20 GMT');
    }
  });

  it('should auto-detect seconds vs milliseconds based on magnitude', () => {
    // 10 digits = seconds
    const secResult = timestampToDate('1700000000', 'auto');
    expect(secResult.success).toBe(true);
    if (secResult.success) {
      expect(secResult.unit).toBe('seconds');
    }

    // 13 digits = milliseconds
    const msResult = timestampToDate('1700000000000', 'auto');
    expect(msResult.success).toBe(true);
    if (msResult.success) {
      expect(msResult.unit).toBe('milliseconds');
    }
  });

  it('should convert zero (0) to Unix epoch baseline (1970-01-01T00:00:00.000Z)', () => {
    const result = timestampToDate(0, 'seconds');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
      expect(result.utc).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    }
  });

  it('should handle negative timestamps for dates prior to 1970', () => {
    // -86400 seconds = 1 day before epoch = 1969-12-31T00:00:00.000Z
    const result = timestampToDate(-86400, 'seconds');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.iso).toBe('1969-12-31T00:00:00.000Z');
      expect(result.utc).toBe('Wed, 31 Dec 1969 00:00:00 GMT');
    }
  });

  it('should truncate decimal inputs without corrupting timestamp', () => {
    // 1700000000.999 seconds should truncate to 1700000000
    const result = timestampToDate('1700000000.999', 'seconds');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.timestamp).toBe(1700000000);
      expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
    }
  });

  it('should reject invalid non-numeric text with a clear error', () => {
    const result = timestampToDate('abc_not_a_number');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid timestamp format');
    }
  });

  it('should reject empty or whitespace input', () => {
    const result = timestampToDate('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('empty');
    }
  });

  it('should reject out-of-range timestamps exceeding JavaScript Date limits', () => {
    // 1e16 ms exceeds 8.64e15 ms
    const result = timestampToDate(10000000000000000, 'milliseconds');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('out of range');
    }
  });

  it('should convert a Date to Unix epoch seconds and milliseconds', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    const result = dateToTimestamp(d);
    expect('seconds' in result).toBe(true);
    if ('seconds' in result) {
      expect(result.seconds).toBe(1704067200);
      expect(result.milliseconds).toBe(1704067200000);
      expect(result.iso).toBe('2024-01-01T00:00:00.000Z');
    }
  });

  it('should convert an ISO date string to Unix epoch', () => {
    const result = dateToTimestamp('2024-01-01T00:00:00.000Z');
    expect('seconds' in result).toBe(true);
    if ('seconds' in result) {
      expect(result.seconds).toBe(1704067200);
    }
  });

  it('should calculate relative time strings', () => {
    const now = Date.now();
    expect(getRelativeTimeString(now, now)).toBe('just now');
    expect(getRelativeTimeString(now - 3600 * 1000, now)).toContain('1 hour ago');
    expect(getRelativeTimeString(now + 86400 * 1000 * 2, now)).toContain('in 2 days');
  });
});

