import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from './base64.engine';

describe('Base64 Engine', () => {
  it('should encode and decode plain English strings', () => {
    const text = 'Hello, World! DevTools Hub is awesome.';
    const encResult = encodeBase64(text);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).toBe('SGVsbG8sIFdvcmxkISBEZXZUb29scyBIdWIgaXMgYXdlc29tZS4=');
      const decResult = decodeBase64(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should encode and decode Urdu and Arabic Unicode text without corruption', () => {
    const text = 'سلام پاکستان! لاہور ایک خوبصورت شہر ہے۔';
    const encResult = encodeBase64(text);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = decodeBase64(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should encode and decode emojis and multi-byte characters', () => {
    const text = '🚀 DevTools ✨ 💻 👨‍👩‍👧‍👦 🇵🇰';
    const encResult = encodeBase64(text);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = decodeBase64(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should return empty string for empty input on both encode and decode', () => {
    const enc = encodeBase64('');
    expect(enc.success).toBe(true);
    if (enc.success) {
      expect(enc.output).toBe('');
      expect(enc.byteCount).toBe(0);
    }

    const dec = decodeBase64('');
    expect(dec.success).toBe(true);
    if (dec.success) {
      expect(dec.output).toBe('');
      expect(dec.byteCount).toBe(0);
    }
  });

  it('should support URL-safe Base64 encoding without padding', () => {
    const text = 'subjects?name=Ali&level=senior';
    const encResult = encodeBase64(text, { urlSafe: true, padding: false });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).not.toContain('+');
      expect(encResult.output).not.toContain('/');
      expect(encResult.output).not.toContain('=');

      // Decoding should automatically succeed even without padding
      const decResult = decodeBase64(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should correctly handle Base64 strings with missing padding', () => {
    // "DevTools" encoded standard is "RGV2VG9vbHM=" (1 padding character)
    const withoutPadding = 'RGV2VG9vbHM';
    const decResult = decodeBase64(withoutPadding);
    expect(decResult.success).toBe(true);
    if (decResult.success) {
      expect(decResult.output).toBe('DevTools');
    }
  });

  it('should reject invalid Base64 characters with a descriptive error', () => {
    const invalidInput = 'SGVsbG8h@#$%';
    const result = decodeBase64(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid Base64');
    }
  });

  it('should reject Base64 with invalid length (remainder of 1 when divided by 4)', () => {
    const invalidLength = 'ABCDE'; // length 5 % 4 = 1
    const result = decodeBase64(invalidLength);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('remainder of 1');
    }
  });

  it('should process large text blocks efficiently without call stack overflow', () => {
    const largeText = 'DevTools Hub Suite '.repeat(3000); // ~57,000 chars
    const encResult = encodeBase64(largeText);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = decodeBase64(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(largeText);
      }
    }
  });
});

