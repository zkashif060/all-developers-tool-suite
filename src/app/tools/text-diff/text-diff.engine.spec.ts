import { describe, expect, it } from 'vitest';
import {
  computeIntraLineParts,
  computeTextDiff,
  splitLinesSafely
} from './text-diff.engine';

describe('text-diff engine', () => {
  it('should split lines safely across CRLF and LF', () => {
    const text = 'line1\r\nline2\nline3\n';
    const lines = splitLinesSafely(text);
    expect(lines).toEqual(['line1', 'line2', 'line3']);
  });

  it('should return 100% similarity and isIdentical: true for identical text', () => {
    const text = 'function sum(a, b) {\n  return a + b;\n}';
    const result = computeTextDiff(text, text);

    expect(result.success).toBe(true);
    expect(result.stats.isIdentical).toBe(true);
    expect(result.stats.similarityPercentage).toBe(100);
    expect(result.stats.additions).toBe(0);
    expect(result.stats.deletions).toBe(0);
    expect(result.stats.unchanged).toBe(3);
    expect(result.splitRows.length).toBe(3);
    expect(result.splitRows[0].isDiff).toBe(false);
  });

  it('should detect added lines accurately', () => {
    const original = 'const a = 1;\nconst b = 2;';
    const modified = 'const a = 1;\nconst added = 99;\nconst b = 2;';
    const result = computeTextDiff(original, modified);

    expect(result.success).toBe(true);
    expect(result.stats.isIdentical).toBe(false);
    expect(result.stats.additions).toBe(1);
    expect(result.stats.deletions).toBe(0);
    expect(result.stats.unchanged).toBe(2);
    expect(result.unifiedLines.some(l => l.type === 'added' && l.text.includes('added = 99'))).toBe(true);
  });

  it('should detect deleted lines accurately', () => {
    const original = 'const a = 1;\nconst removeMe = 0;\nconst b = 2;';
    const modified = 'const a = 1;\nconst b = 2;';
    const result = computeTextDiff(original, modified);

    expect(result.success).toBe(true);
    expect(result.stats.isIdentical).toBe(false);
    expect(result.stats.additions).toBe(0);
    expect(result.stats.deletions).toBe(1);
    expect(result.stats.unchanged).toBe(2);
    expect(result.splitRows.some(r => r.left.type === 'deleted' && r.left.text.includes('removeMe'))).toBe(true);
  });

  it('should compute intra-line word parts for modified lines', () => {
    const original = 'const version = 1;';
    const modified = 'const version = 2;';
    const result = computeTextDiff(original, modified, { granularity: 'words' });

    expect(result.success).toBe(true);
    expect(result.stats.additions).toBe(1);
    expect(result.stats.deletions).toBe(1);

    const diffRow = result.splitRows.find(r => r.isDiff);
    expect(diffRow).toBeDefined();
    expect(diffRow?.left.parts).toBeDefined();
    expect(diffRow?.right.parts).toBeDefined();

    const deletedPart = diffRow?.left.parts?.find(p => p.type === 'deleted');
    expect(deletedPart?.text).toBe('1');

    const addedPart = diffRow?.right.parts?.find(p => p.type === 'added');
    expect(addedPart?.text).toBe('2');
  });

  it('should support intra-line character granularity', () => {
    const parts = computeIntraLineParts('cat', 'bat', 'chars');
    expect(parts.leftParts.some(p => p.type === 'deleted' && p.text === 'c')).toBe(true);
    expect(parts.rightParts.some(p => p.type === 'added' && p.text === 'b')).toBe(true);
  });

  it('should respect ignoreWhitespace option', () => {
    const original = 'const name = "ZeroTrace";   ';
    const modified = 'const name = "ZeroTrace";';

    const diffWithoutFlag = computeTextDiff(original, modified, { ignoreWhitespace: false });
    expect(diffWithoutFlag.stats.isIdentical).toBe(false);

    const diffWithFlag = computeTextDiff(original, modified, { ignoreWhitespace: true });
    expect(diffWithFlag.stats.additions).toBe(0);
    expect(diffWithFlag.stats.deletions).toBe(0);
  });

  it('should respect ignoreCase option', () => {
    const original = 'HELLO WORLD';
    const modified = 'hello world';

    const normalDiff = computeTextDiff(original, modified, { ignoreCase: false });
    expect(normalDiff.stats.isIdentical).toBe(false);

    const caseInsensitiveDiff = computeTextDiff(original, modified, { ignoreCase: true });
    expect(caseInsensitiveDiff.stats.isIdentical).toBe(true);
  });

  it('should generate standard Git unified patch', () => {
    const original = 'line A\nline B';
    const modified = 'line A\nline MODIFIED';
    const result = computeTextDiff(original, modified);

    expect(result.unifiedPatch).toContain('--- Original');
    expect(result.unifiedPatch).toContain('+++ Modified');
    expect(result.unifiedPatch).toContain('-line B');
    expect(result.unifiedPatch).toContain('+line MODIFIED');
  });

  it('should guard against payload exceeding 500,000 characters', () => {
    const hugeText = 'a'.repeat(550000);
    const result = computeTextDiff(hugeText, 'short text');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Input text length exceeds safe threshold');
  });

  it('should handle completely empty original and modified strings', () => {
    const result = computeTextDiff('', '');
    expect(result.success).toBe(true);
    expect(result.stats.isIdentical).toBe(true);
    expect(result.stats.similarityPercentage).toBe(100);
  });
});
