import { describe, it, expect } from 'vitest';
import { formatJson } from './json-formatter.engine';

describe('JSON Formatter Engine', () => {
  it('should format a valid JSON object with 2 spaces', () => {
    const input = '{"name":"DevTools","version":1}';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toBe('{\n  "name": "DevTools",\n  "version": 1\n}');
      expect(result.lineCount).toBe(4);
    }
  });

  it('should format a valid JSON object with 4 spaces', () => {
    const input = '{"key":"value"}';
    const result = formatJson(input, { indent: 4 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toBe('{\n    "key": "value"\n}');
    }
  });

  it('should minify JSON when indent is minify', () => {
    const input = '{\n  "a": 1,\n  "b": [2, 3]\n}';
    const result = formatJson(input, { indent: 'minify' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toBe('{"a":1,"b":[2,3]}');
      expect(result.lineCount).toBe(1);
    }
  });

  it('should format a valid JSON array', () => {
    const input = '[1, "two", true, null]';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toBe('[\n  1,\n  "two",\n  true,\n  null\n]');
    }
  });

  it('should format deeply nested objects and arrays', () => {
    const input = '{"user":{"profile":{"tags":["frontend","security"]}}}';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toContain('"tags": [');
      expect(result.formatted).toContain('"frontend"');
      expect(result.formatted).toContain('"security"');
      expect(JSON.parse(result.formatted)).toEqual(JSON.parse(input));
    }
  });

  it('should handle strings with escaped characters correctly', () => {
    const input = '{"text":"Line 1\\nLine 2\\t\\"quoted\\"\\\\slash"}';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toContain('"text": "Line 1\\nLine 2\\t\\"quoted\\"\\\\slash"');
    }
  });

  it('should preserve numbers (integers, floats, exponents) and booleans', () => {
    const input = '{"int":42,"float":3.14159,"exp":1e5,"bool":false}';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.formatted);
      expect(parsed.int).toBe(42);
      expect(parsed.float).toBe(3.14159);
      expect(parsed.exp).toBe(100000);
      expect(parsed.bool).toBe(false);
    }
  });

  it('should preserve complex Unicode and Multilingual strings', () => {
    const input = '{"emoji":"🚀 🌍 ✨","urdu":"ڈیولپر ٹولز","cjk":"开发者工具"}';
    const result = formatJson(input, { indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toContain('🚀 🌍 ✨');
      expect(result.formatted).toContain('ڈیولپر ٹولز');
      expect(result.formatted).toContain('开发者工具');
    }
  });

  it('should handle empty or whitespace-only input gracefully', () => {
    const result = formatJson('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Input is empty');
    }
  });

  it('should return error with line and column coordinates on invalid JSON when provided by engine', () => {
    const brokenInput = '{\n  "name": "DevTools",\n  "broken": \n}';
    const result = formatJson(brokenInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      if (result.line !== undefined) {
        expect(result.line).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should sort object keys when sortKeys option is enabled', () => {
    const input = '{"zeta":1,"alpha":2,"gamma":{"b":20,"a":10}}';
    const result = formatJson(input, { indent: 'minify', sortKeys: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.formatted).toBe('{"alpha":2,"gamma":{"a":10,"b":20},"zeta":1}');
    }
  });
});
