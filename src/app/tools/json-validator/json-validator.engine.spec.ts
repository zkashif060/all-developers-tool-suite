import { describe, it, expect } from 'vitest';
import { validateJson } from './json-validator.engine';

describe('JSON Validator Engine', () => {
  it('should validate a standard JSON object', () => {
    const input = '{"status": "ok", "code": 200}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.metadata.dataType).toBe('object');
      expect(result.metadata.itemCount).toBe(2);
      expect(result.metadata.depth).toBe(2);
      expect(result.metadata.totalKeys).toBe(2);
    }
  });

  it('should validate a JSON array and compute elements count', () => {
    const input = '["alpha", "beta", "gamma", 123]';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.metadata.dataType).toBe('array');
      expect(result.metadata.itemCount).toBe(4);
    }
  });

  it('should validate primitive JSON values (string, number, boolean, null)', () => {
    expect(validateJson('"Hello World"').valid).toBe(true);
    expect(validateJson('42.5').valid).toBe(true);
    expect(validateJson('true').valid).toBe(true);
    expect(validateJson('false').valid).toBe(true);
    expect(validateJson('null').valid).toBe(true);

    const stringRes = validateJson('"Valid String"');
    if (stringRes.valid) expect(stringRes.metadata.dataType).toBe('string');

    const numRes = validateJson('999');
    if (numRes.valid) expect(numRes.metadata.dataType).toBe('number');

    const nullRes = validateJson('null');
    if (nullRes.valid) expect(nullRes.metadata.dataType).toBe('null');
  });

  it('should detect trailing commas as invalid in objects', () => {
    const input = '{\n  "name": "DevTools",\n  "active": true,\n}';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBeDefined();
      expect(result.line).toBeGreaterThanOrEqual(1);
    }
  });

  it('should detect trailing commas as invalid in arrays', () => {
    const input = '[1, 2, 3,]';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
  });

  it('should detect missing property quotes (unquoted keys)', () => {
    const input = '{ name: "DevTools" }';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBeDefined();
    }
  });

  it('should detect unclosed / missing curly braces', () => {
    const input = '{\n  "title": "Unclosed Object"';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
  });

  it('should detect single-quoted strings as invalid in strict JSON', () => {
    const input = "{ 'title': 'Single quotes are invalid in JSON' }";
    const result = validateJson(input);
    expect(result.valid).toBe(false);
  });

  it('should handle empty or whitespace-only input gracefully', () => {
    const result = validateJson('   \n\t  ');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Input is empty');
    }
  });

  it('should validate complex Unicode content', () => {
    const input = '{"salutation": "السلام علیکم", "emoji": "🎉", "symbols": "€ § ©"}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.metadata.totalKeys).toBe(3);
    }
  });

  it('should calculate deep structure depth correctly', () => {
    const input = '{"l1": {"l2": {"l3": {"l4": ["leaf"]}}}}';
    const result = validateJson(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.metadata.depth).toBe(6);
    }
  });
});
