import { describe, it, expect, vi } from 'vitest';
import {
  generateSingleUuidV4,
  generateUuids,
  formatUuid,
  isCryptoAvailable
} from './uuid-generator.engine';

describe('UUID Generator Engine', () => {
  const standardUuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('should generate a valid RFC 4122 version 4 UUID', () => {
    const uuid = generateSingleUuidV4();
    expect(uuid).toMatch(standardUuidV4Regex);
  });

  it('should have version 4 bits in position 14 and variant bits [89ab] in position 19', () => {
    for (let i = 0; i < 20; i++) {
      const uuid = generateSingleUuidV4().toLowerCase();
      // Position 14 must be '4' (e.g. xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
      expect(uuid.charAt(14)).toBe('4');
      // Position 19 must be 8, 9, a, or b (RFC 4122 variant)
      expect(['8', '9', 'a', 'b']).toContain(uuid.charAt(19));
    }
  });

  it('should generate multiple unique values in a batch with zero collisions', () => {
    const result = generateUuids({ count: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.uuids.length).toBe(100);
      const uniqueSet = new Set(result.uuids);
      expect(uniqueSet.size).toBe(100);
      result.uuids.forEach(u => expect(u).toMatch(standardUuidV4Regex));
    }
  });

  it('should format UUIDs in uppercase when requested', () => {
    const result = generateUuids({ count: 5, uppercase: true });
    expect(result.success).toBe(true);
    if (result.success) {
      result.uuids.forEach(u => {
        expect(u).toBe(u.toUpperCase());
        expect(u.toLowerCase()).toMatch(standardUuidV4Regex);
      });
    }
  });

  it('should format UUIDs without hyphens when hyphens is false', () => {
    const result = generateUuids({ count: 5, hyphens: false });
    expect(result.success).toBe(true);
    if (result.success) {
      result.uuids.forEach(u => {
        expect(u).not.toContain('-');
        expect(u.length).toBe(32);
        expect(u).toMatch(/^[0-9a-f]{32}$/);
      });
    }
  });

  it('should wrap UUIDs in registry braces when requested', () => {
    const result = generateUuids({ count: 3, braces: true });
    expect(result.success).toBe(true);
    if (result.success) {
      result.uuids.forEach(u => {
        expect(u.startsWith('{')).toBe(true);
        expect(u.endsWith('}')).toBe(true);
      });
    }
  });

  it('should wrap UUIDs in quotes when requested', () => {
    const result = generateUuids({ count: 3, quotes: true });
    expect(result.success).toBe(true);
    if (result.success) {
      result.uuids.forEach(u => {
        expect(u.startsWith('"')).toBe(true);
        expect(u.endsWith('"')).toBe(true);
      });
    }
  });

  it('should reject invalid quantity inputs', () => {
    const zeroResult = generateUuids({ count: 0 });
    expect(zeroResult.success).toBe(false);

    const negResult = generateUuids({ count: -5 });
    expect(negResult.success).toBe(false);

    const floatResult = generateUuids({ count: 3.5 });
    expect(floatResult.success).toBe(false);

    const tooLargeResult = generateUuids({ count: 501 });
    expect(tooLargeResult.success).toBe(false);
    if (!tooLargeResult.success) {
      expect(tooLargeResult.error).toContain('Maximum limit is 500');
    }
  });

  it('should confirm Web Crypto is available', () => {
    expect(isCryptoAvailable()).toBe(true);
  });
});

