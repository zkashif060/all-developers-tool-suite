import * as Diff from 'diff';

export type DiffGranularity = 'lines' | 'words' | 'chars';

export interface DiffOptions {
  granularity?: DiffGranularity;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  contextLines?: number;
}

export interface DiffPart {
  text: string;
  type: 'unchanged' | 'added' | 'deleted';
}

export interface SplitDiffSide {
  lineNumber?: number;
  type: 'unchanged' | 'added' | 'deleted' | 'empty';
  text: string;
  parts?: DiffPart[];
}

export interface SplitDiffRow {
  id: number;
  left: SplitDiffSide;
  right: SplitDiffSide;
  isDiff: boolean;
}

export interface UnifiedDiffLine {
  id: number;
  oldLineNumber?: number;
  newLineNumber?: number;
  type: 'unchanged' | 'added' | 'deleted';
  text: string;
  parts?: DiffPart[];
  isDiff: boolean;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
  totalOriginalLines: number;
  totalModifiedLines: number;
  similarityPercentage: number;
  isIdentical: boolean;
}

export interface TextDiffResult {
  success: boolean;
  error?: string;
  stats: DiffStats;
  splitRows: SplitDiffRow[];
  unifiedLines: UnifiedDiffLine[];
  unifiedPatch: string;
  executionTimeMs: number;
}

/**
 * Normalizes input newlines and splits text into individual lines safely.
 */
export function splitLinesSafely(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/**
 * Calculates string similarity between two lines using Dice's bigram coefficient (0 to 1).
 */
export function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const bigrams1 = new Set<string>();
  for (let i = 0; i < str1.length - 1; i++) {
    bigrams1.add(str1.slice(i, i + 2));
  }
  const bigrams2 = new Set<string>();
  for (let i = 0; i < str2.length - 1; i++) {
    bigrams2.add(str2.slice(i, i + 2));
  }

  let intersection = 0;
  for (const b of bigrams1) {
    if (bigrams2.has(b)) intersection++;
  }

  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

/**
 * Aligns removed lines with added lines in a replacement block by pairing the most similar lines
 * while preserving monotonic sequence order.
 */
export function alignReplacementLines(
  removedLines: string[],
  addedLines: string[]
): Array<{ remIndex?: number; addIndex?: number }> {
  const n = removedLines.length;
  const m = addedLines.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) return addedLines.map((_, j) => ({ remIndex: undefined, addIndex: j }));
  if (m === 0) return removedLines.map((_, i) => ({ remIndex: i, addIndex: undefined }));

  if (n === m) {
    return Array.from({ length: n }, (_, i) => ({ remIndex: i, addIndex: i }));
  }

  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const backtrack = Array.from({ length: n + 1 }, () => Array(m + 1).fill(''));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = stringSimilarity(removedLines[i - 1], addedLines[j - 1]);
      const matchScore = sim >= 0.3 ? dp[i - 1][j - 1] + sim : dp[i - 1][j - 1];

      const scoreSkipRem = dp[i - 1][j];
      const scoreSkipAdd = dp[i][j - 1];

      if (matchScore >= scoreSkipRem && matchScore >= scoreSkipAdd && sim >= 0.3) {
        dp[i][j] = matchScore;
        backtrack[i][j] = 'diag';
      } else if (scoreSkipRem >= scoreSkipAdd) {
        dp[i][j] = scoreSkipRem;
        backtrack[i][j] = 'up';
      } else {
        dp[i][j] = scoreSkipAdd;
        backtrack[i][j] = 'left';
      }
    }
  }

  let i = n;
  let j = m;
  const pairs: Array<{ remIndex?: number; addIndex?: number }> = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && backtrack[i][j] === 'diag') {
      pairs.push({ remIndex: i - 1, addIndex: j - 1 });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || backtrack[i][j] === 'up')) {
      pairs.push({ remIndex: i - 1, addIndex: undefined });
      i--;
    } else {
      pairs.push({ remIndex: undefined, addIndex: j - 1 });
      j--;
    }
  }

  pairs.reverse();
  return pairs;
}

/**
 * Computes intra-line sub-token differences (words or characters) between an original line and modified line.
 */
export function computeIntraLineParts(
  oldLine: string,
  newLine: string,
  granularity: DiffGranularity = 'words',
  ignoreCase = false
): { leftParts: DiffPart[]; rightParts: DiffPart[] } {
  if (granularity === 'lines' || oldLine === newLine) {
    return {
      leftParts: [{ text: oldLine, type: 'unchanged' }],
      rightParts: [{ text: newLine, type: 'unchanged' }]
    };
  }

  const subDiff =
    granularity === 'chars'
      ? Diff.diffChars(oldLine, newLine, { ignoreCase })
      : Diff.diffWordsWithSpace(oldLine, newLine, { ignoreCase });

  const leftParts: DiffPart[] = [];
  const rightParts: DiffPart[] = [];

  for (const part of subDiff) {
    if (part.removed) {
      leftParts.push({ text: part.value, type: 'deleted' });
    } else if (part.added) {
      rightParts.push({ text: part.value, type: 'added' });
    } else {
      leftParts.push({ text: part.value, type: 'unchanged' });
      rightParts.push({ text: part.value, type: 'unchanged' });
    }
  }

  return { leftParts, rightParts };
}

/**
 * Main engine executing comprehensive text difference comparison.
 */
export function computeTextDiff(
  original: string,
  modified: string,
  options: DiffOptions = {}
): TextDiffResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const granularity = options.granularity || 'words';
  const ignoreWhitespace = !!options.ignoreWhitespace;
  const ignoreCase = !!options.ignoreCase;

  // Maximum character boundary protection (prevents UI freeze on multi-megabyte payloads)
  const MAX_INPUT_CHARS = 500000;
  if (original.length > MAX_INPUT_CHARS || modified.length > MAX_INPUT_CHARS) {
    return {
      success: false,
      error: `Input text length exceeds safe threshold (${MAX_INPUT_CHARS.toLocaleString()} characters) for browser-based difference computation.`,
      stats: {
        additions: 0,
        deletions: 0,
        unchanged: 0,
        totalOriginalLines: 0,
        totalModifiedLines: 0,
        similarityPercentage: 0,
        isIdentical: false
      },
      splitRows: [],
      unifiedLines: [],
      unifiedPatch: '',
      executionTimeMs: 0
    };
  }

  // Fast path for empty or identical inputs
  const normOriginal = original.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const normModified = modified.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const origLines = splitLinesSafely(original);
  const modLines = splitLinesSafely(modified);

  const isStrictEqual =
    ignoreCase
      ? normOriginal.toLowerCase() === normModified.toLowerCase()
      : normOriginal === normModified;

  if (isStrictEqual) {
    const splitRows: SplitDiffRow[] = origLines.map((line, idx) => ({
      id: idx + 1,
      left: { lineNumber: idx + 1, type: 'unchanged', text: line },
      right: { lineNumber: idx + 1, type: 'unchanged', text: line },
      isDiff: false
    }));

    const unifiedLines: UnifiedDiffLine[] = origLines.map((line, idx) => ({
      id: idx + 1,
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
      type: 'unchanged',
      text: line,
      isDiff: false
    }));

    const executionTimeMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    return {
      success: true,
      stats: {
        additions: 0,
        deletions: 0,
        unchanged: origLines.length,
        totalOriginalLines: origLines.length,
        totalModifiedLines: modLines.length,
        similarityPercentage: 100,
        isIdentical: true
      },
      splitRows,
      unifiedLines,
      unifiedPatch: '',
      executionTimeMs: Math.round(executionTimeMs * 100) / 100
    };
  }

  // Line diff options
  const lineDiffOptions: {
    ignoreWhitespace?: boolean;
    comparator?: (left: string, right: string) => boolean;
  } = {};

  if (ignoreWhitespace) {
    lineDiffOptions.ignoreWhitespace = true;
  }

  if (ignoreCase) {
    lineDiffOptions.comparator = (left: string, right: string) => {
      const l = ignoreWhitespace ? left.trim().toLowerCase() : left.toLowerCase();
      const r = ignoreWhitespace ? right.trim().toLowerCase() : right.toLowerCase();
      return l === r;
    };
  }

  const lineChanges: Diff.Change[] = Diff.diffLines(normOriginal, normModified, lineDiffOptions);

  const splitRows: SplitDiffRow[] = [];
  const unifiedLines: UnifiedDiffLine[] = [];

  let oldLineCounter = 1;
  let newLineCounter = 1;
  let rowIdCounter = 1;

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  let i = 0;
  while (i < lineChanges.length) {
    const cur = lineChanges[i];

    if (!cur.added && !cur.removed) {
      // Unchanged chunk
      const lines = splitLinesSafely(cur.value);
      for (const line of lines) {
        unchanged++;
        splitRows.push({
          id: rowIdCounter,
          left: { lineNumber: oldLineCounter, type: 'unchanged', text: line },
          right: { lineNumber: newLineCounter, type: 'unchanged', text: line },
          isDiff: false
        });

        unifiedLines.push({
          id: rowIdCounter,
          oldLineNumber: oldLineCounter,
          newLineNumber: newLineCounter,
          type: 'unchanged',
          text: line,
          isDiff: false
        });

        oldLineCounter++;
        newLineCounter++;
        rowIdCounter++;
      }
      i++;
    } else if (cur.removed && i + 1 < lineChanges.length && lineChanges[i + 1].added) {
      // Replacement block: Removed lines followed directly by Added lines
      const next = lineChanges[i + 1];
      const removedLines = splitLinesSafely(cur.value);
      const addedLines = splitLinesSafely(next.value);

      deletions += removedLines.length;
      additions += addedLines.length;

      // Smart alignment: align the most similar lines while preserving order
      const alignedPairs = alignReplacementLines(removedLines, addedLines);

      for (const pair of alignedPairs) {
        const hasLeft = pair.remIndex !== undefined;
        const hasRight = pair.addIndex !== undefined;

        const leftText = hasLeft ? removedLines[pair.remIndex!] : '';
        const rightText = hasRight ? addedLines[pair.addIndex!] : '';

        let leftParts: DiffPart[] | undefined = undefined;
        let rightParts: DiffPart[] | undefined = undefined;

        if (hasLeft && hasRight && granularity !== 'lines') {
          const parts = computeIntraLineParts(leftText, rightText, granularity, ignoreCase);
          leftParts = parts.leftParts;
          rightParts = parts.rightParts;
        }

        splitRows.push({
          id: rowIdCounter++,
          left: hasLeft
            ? {
                lineNumber: oldLineCounter + pair.remIndex!,
                type: 'deleted',
                text: leftText,
                parts: leftParts
              }
            : { type: 'empty', text: '' },
          right: hasRight
            ? {
                lineNumber: newLineCounter + pair.addIndex!,
                type: 'added',
                text: rightText,
                parts: rightParts
              }
            : { type: 'empty', text: '' },
          isDiff: true
        });
      }

      // Construct Unified rows: list aligned pairs or sequential removals/additions
      for (const pair of alignedPairs) {
        if (pair.remIndex !== undefined) {
          const remText = removedLines[pair.remIndex];
          const addText = pair.addIndex !== undefined ? addedLines[pair.addIndex] : undefined;
          let leftParts: DiffPart[] | undefined = undefined;

          if (addText !== undefined && granularity !== 'lines') {
            leftParts = computeIntraLineParts(remText, addText, granularity, ignoreCase).leftParts;
          }

          unifiedLines.push({
            id: rowIdCounter++,
            oldLineNumber: oldLineCounter + pair.remIndex,
            type: 'deleted',
            text: remText,
            parts: leftParts,
            isDiff: true
          });
        }

        if (pair.addIndex !== undefined) {
          const addText = addedLines[pair.addIndex];
          const remText = pair.remIndex !== undefined ? removedLines[pair.remIndex] : undefined;
          let rightParts: DiffPart[] | undefined = undefined;

          if (remText !== undefined && granularity !== 'lines') {
            rightParts = computeIntraLineParts(remText, addText, granularity, ignoreCase).rightParts;
          }

          unifiedLines.push({
            id: rowIdCounter++,
            newLineNumber: newLineCounter + pair.addIndex,
            type: 'added',
            text: addText,
            parts: rightParts,
            isDiff: true
          });
        }
      }

      oldLineCounter += removedLines.length;
      newLineCounter += addedLines.length;
      i += 2;
    } else if (cur.removed) {
      // Pure deletion
      const removedLines = splitLinesSafely(cur.value);
      deletions += removedLines.length;

      for (let k = 0; k < removedLines.length; k++) {
        splitRows.push({
          id: rowIdCounter++,
          left: {
            lineNumber: oldLineCounter + k,
            type: 'deleted',
            text: removedLines[k]
          },
          right: { type: 'empty', text: '' },
          isDiff: true
        });

        unifiedLines.push({
          id: rowIdCounter++,
          oldLineNumber: oldLineCounter + k,
          type: 'deleted',
          text: removedLines[k],
          isDiff: true
        });
      }

      oldLineCounter += removedLines.length;
      i++;
    } else {
      // Pure addition
      const addedLines = splitLinesSafely(cur.value);
      additions += addedLines.length;

      for (let k = 0; k < addedLines.length; k++) {
        splitRows.push({
          id: rowIdCounter++,
          left: { type: 'empty', text: '' },
          right: {
            lineNumber: newLineCounter + k,
            type: 'added',
            text: addedLines[k]
          },
          isDiff: true
        });

        unifiedLines.push({
          id: rowIdCounter++,
          newLineNumber: newLineCounter + k,
          type: 'added',
          text: addedLines[k],
          isDiff: true
        });
      }

      newLineCounter += addedLines.length;
      i++;
    }
  }

  // Generate standard Git-compatible unified patch
  let unifiedPatch = '';
  try {
    unifiedPatch = Diff.createTwoFilesPatch(
      'Original',
      'Modified',
      normOriginal,
      normModified,
      '',
      '',
      { context: 3, ignoreWhitespace }
    );
  } catch {
    unifiedPatch = '';
  }

  // Similarity score calculation (Dice's coefficient over line sets)
  const totalComparedLines = origLines.length + modLines.length;
  let similarityPercentage = 0;
  if (totalComparedLines > 0) {
    const rawRatio = (unchanged * 2) / totalComparedLines;
    similarityPercentage = Math.round(Math.min(100, Math.max(0, rawRatio * 100)));
  }

  const executionTimeMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

  return {
    success: true,
    stats: {
      additions,
      deletions,
      unchanged,
      totalOriginalLines: origLines.length,
      totalModifiedLines: modLines.length,
      similarityPercentage,
      isIdentical: additions === 0 && deletions === 0
    },
    splitRows,
    unifiedLines,
    unifiedPatch,
    executionTimeMs: Math.round(executionTimeMs * 100) / 100
  };
}
