import { describe, it, expect } from 'vitest';
import {
  computeSha256,
  isSubtleCryptoSupported
} from './sha256.engine';

describe('SHA-256 Engine', () => {
  it('should confirm Web Crypto Subtle API is supported', () => {
    expect(isSubtleCryptoSupported()).toBe(true);
  });

  it('should compute exact SHA-256 digest for empty string matching official NIST vector', async () => {
    // Official SHA-256 vector for empty string
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const result = await computeSha256('');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash).toBe(expected);
      expect(result.byteCount).toBe(0);
      expect(result.charCount).toBe(64);
    }
  });

  it('should compute exact SHA-256 digest for "abc" matching NIST test vector', async () => {
    // Official test vector
    const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    const result = await computeSha256('abc');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash).toBe(expected);
    }
  });

  it('should compute exact digest for "The quick brown fox jumps over the lazy dog"', async () => {
    const input = 'The quick brown fox jumps over the lazy dog';
    const expected = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
    const result = await computeSha256(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash).toBe(expected);
    }
  });

  it('should compute exact digest for "The quick brown fox jumps over the lazy dog."', async () => {
    const input = 'The quick brown fox jumps over the lazy dog.';
    const expected = 'ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c';
    const result = await computeSha256(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash).toBe(expected);
    }
  });

  it('should format hex digest in uppercase when requested', async () => {
    const result = await computeSha256('abc', { uppercase: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash).toBe('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
    }
  });

  it('should compute deterministic SHA-256 digests for Urdu and Unicode text', async () => {
    const text = 'سلام پاکستان! لاہور ایک خوبصورت تاریخی شہر ہے۔';
    const result1 = await computeSha256(text);
    const result2 = await computeSha256(text);
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.hash).toBe(result2.hash);
      expect(result1.hash.length).toBe(64);
    }
  });

  it('should compute deterministic SHA-256 digests for emojis', async () => {
    const emojiText = 'DevTools Hub 🚀 ✨ 💻 🇵🇰';
    const result = await computeSha256(emojiText);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(result.hash)).toBe(true);
    }
  });

  it('should compute SHA-256 for large inputs without error', async () => {
    const large = 'Antigravity DevTools Hub '.repeat(2000); // ~50,000 characters
    const result = await computeSha256(large);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.hash.length).toBe(64);
    }
  });
});
