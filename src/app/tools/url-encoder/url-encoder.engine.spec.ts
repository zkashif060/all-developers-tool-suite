import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl } from './url-encoder.engine';

describe('URL Encoder Engine', () => {
  it('should encode and decode normal text and spaces', () => {
    const text = 'Hello ZeroTrace Tools';
    const encResult = encodeUrl(text);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).toBe('Hello%20ZeroTrace%20Tools');
      const decResult = decodeUrl(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should support form-style space encoding with plus signs (+)', () => {
    const text = 'query with spaces';
    const encResult = encodeUrl(text, { spaceEncoding: 'form' });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).toBe('query+with+spaces');
      const decResult = decodeUrl(encResult.output, { decodePlusAsSpace: true });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should distinguish between Component encoding and Full URL encoding', () => {
    const fullUrl = 'https://example.com/search?category=dev tools&page=1#results';

    // Component mode encodes all delimiters
    const compResult = encodeUrl(fullUrl, { mode: 'component' });
    expect(compResult.success).toBe(true);
    if (compResult.success) {
      expect(compResult.output).toContain('%2F%2F'); // Slashes encoded
      expect(compResult.output).toContain('%3F');   // Question mark encoded
      expect(compResult.output).toContain('%26');   // Ampersand encoded
    }

    // Full URL mode preserves URL structure delimiters
    const fullResult = encodeUrl(fullUrl, { mode: 'full_url' });
    expect(fullResult.success).toBe(true);
    if (fullResult.success) {
      expect(fullResult.output).toContain('https://example.com/search?category=dev%20tools&page=1#results');
    }
  });

  it('should encode and decode special characters and RFC 3986 strict characters', () => {
    const text = "name=O'Connor & items=(1,2,3)*!";
    const encResult = encodeUrl(text, { encodeSpecialCharacters: true });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).toContain('%27'); // '
      expect(encResult.output).toContain('%28'); // (
      expect(encResult.output).toContain('%29'); // )
      expect(encResult.output).toContain('%2A'); // *
      expect(encResult.output).toContain('%21'); // !

      const decResult = decodeUrl(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should encode and decode multilingual Unicode text and emojis correctly', () => {
    const text = 'لاہور پاکستان 🇵🇰 & 🚀 ✨';
    const encResult = encodeUrl(text);
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      expect(encResult.output).toContain('%DB%81%D9%88%D8%B1');
      const decResult = decodeUrl(encResult.output);
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect(decResult.output).toBe(text);
      }
    }
  });

  it('should handle empty input gracefully', () => {
    const enc = encodeUrl('');
    expect(enc.success).toBe(true);
    if (enc.success) {
      expect(enc.output).toBe('');
      expect(enc.charCount).toBe(0);
    }

    const dec = decodeUrl('');
    expect(dec.success).toBe(true);
    if (dec.success) {
      expect(dec.output).toBe('');
      expect(dec.charCount).toBe(0);
    }
  });

  it('should reject invalid percent-encoded sequences with a descriptive error', () => {
    const invalidHex = 'https://example.com/search?q=%ZZ';
    const result1 = decodeUrl(invalidHex);
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error).toContain('Invalid percent-encoded sequence');
    }

    const uncompletedPercent = 'test%';
    const result2 = decodeUrl(uncompletedPercent);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error).toContain('Invalid percent-encoded sequence');
    }
  });

  it('should decode complete URLs without corrupting valid delimiters', () => {
    const raw = 'https://example.com/path with spaces?param=لاہور';
    const encoded = encodeUrl(raw, { mode: 'full_url' });
    expect(encoded.success).toBe(true);
    if (encoded.success) {
      const result = decodeUrl(encoded.output, { mode: 'full_url' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toBe(raw);
      }
    }
  });
});
