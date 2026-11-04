import { describe, it, expect } from 'vitest';
import { testRegex, buildFlagsString } from './regex-tester.engine';

describe('Regex Tester Engine', () => {
  it('should find basic matches in a test string', () => {
    const pattern = 'DevTools';
    const text = 'Welcome to DevTools Hub suite.';
    const result = testRegex(pattern, text, { g: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].match).toBe('DevTools');
      expect(result.matches[0].index).toBe(11);
      expect(result.matches[0].endIndex).toBe(19);
    }
  });

  it('should find all occurrences with global flag (g)', () => {
    const pattern = '\\d+';
    const text = 'Values: 10, 200, and 3000.';
    const result = testRegex(pattern, text, { g: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(3);
      expect(result.matches.map(m => m.match)).toEqual(['10', '200', '3000']);
    }
  });

  it('should perform case-insensitive matching with i flag', () => {
    const pattern = 'angular';
    const text = 'Angular, ANGULAR, and angular are identical here.';
    const result = testRegex(pattern, text, { g: true, i: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(3);
    }
  });

  it('should handle multiline anchors with m flag', () => {
    const pattern = '^Item \\d+';
    const text = 'Item 1\nItem 2\nOther text\nItem 3';
    const result = testRegex(pattern, text, { g: true, m: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(3);
    }
  });

  it('should extract numbered and named capture groups', () => {
    const pattern = '(?<city>[A-Za-z]+), (?<country>[A-Za-z]+)';
    const text = 'Locations: Lahore, Pakistan; London, UK';
    const result = testRegex(pattern, text, { g: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(2);
      const first = result.matches[0];
      expect(first.match).toBe('Lahore, Pakistan');
      expect(first.groups.some(g => g.name === 'city' && g.value === 'Lahore')).toBe(true);
      expect(first.groups.some(g => g.name === 'country' && g.value === 'Pakistan')).toBe(true);
    }
  });

  it('should handle zero-length matches without hanging or infinite looping', () => {
    // Pattern that matches empty strings at boundaries or zero-or-more 'a's
    const pattern = 'a*';
    const text = 'bb';
    const result = testRegex(pattern, text, { g: true });
    expect(result.success).toBe(true);
    if (result.success) {
      // Should cleanly find empty matches at position 0, 1, 2 without looping
      expect(result.matchCount).toBeGreaterThan(0);
      result.matches.forEach(m => expect(typeof m.index).toBe('number'));
    }
  });

  it('should support Unicode property escapes with the u flag', () => {
    const pattern = '\\p{Emoji}';
    const text = 'Hello 🚀 world ✨!';
    const result = testRegex(pattern, text, { g: true, u: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(2);
      expect(result.matches[0].match).toBe('🚀');
      expect(result.matches[1].match).toBe('✨');
    }
  });

  it('should support dotAll mode with s flag (dot matches newline)', () => {
    const pattern = 'start.*?end';
    const text = 'start\nmiddle\nend';
    const withoutS = testRegex(pattern, text, { s: false });
    expect(withoutS.success).toBe(true);
    if (withoutS.success) {
      expect(withoutS.matchCount).toBe(0);
    }

    const withS = testRegex(pattern, text, { s: true });
    expect(withS.success).toBe(true);
    if (withS.success) {
      expect(withS.matchCount).toBe(1);
    }
  });

  it('should report an invalid regular expression pattern gracefully', () => {
    const invalidPattern = '[unclosed-bracket';
    const result = testRegex(invalidPattern, 'test');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid Regular Expression');
    }
  });

  it('should return empty matches for empty pattern without error', () => {
    const result = testRegex('', 'some text');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(0);
    }
  });

  it('should return empty matches when no matches exist', () => {
    const result = testRegex('xyz123', 'abc456', { g: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
    }
  });

  it('should construct correct flags strings', () => {
    expect(buildFlagsString({ g: true, i: true, m: true })).toBe('gim');
    expect(buildFlagsString({ s: true, u: true })).toBe('su');
    expect(buildFlagsString({})).toBe('');
  });
});

