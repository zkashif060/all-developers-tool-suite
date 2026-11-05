export interface RegexFlags {
  g?: boolean;
  i?: boolean;
  m?: boolean;
  s?: boolean;
  u?: boolean;
}

export interface RegexCaptureGroup {
  index: number;
  name?: string;
  value: string;
}

export interface RegexMatchItem {
  index: number;
  endIndex: number;
  match: string;
  groups: RegexCaptureGroup[];
}

export interface RegexTestSuccess {
  success: true;
  matches: RegexMatchItem[];
  matchCount: number;
  executionTimeMs: number;
  hasTruncatedMatches: boolean;
}

export interface RegexTestError {
  success: false;
  error: string;
}

export type RegexTestResult = RegexTestSuccess | RegexTestError;

/**
 * Builds a flags string from the boolean flags configuration.
 */
export function buildFlagsString(flags: RegexFlags): string {
  let str = '';
  if (flags.g) str += 'g';
  if (flags.i) str += 'i';
  if (flags.m) str += 'm';
  if (flags.s) str += 's';
  if (flags.u) str += 'u';
  return str;
}

/**
 * Safely executes a regular expression against test input with loop guards and execution timeouts.
 */
export function testRegex(
  pattern: string,
  testString: string,
  flags: RegexFlags = { g: true, i: true }
): RegexTestResult {
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern) {
    return {
      success: true,
      matches: [],
      matchCount: 0,
      executionTimeMs: 0,
      hasTruncatedMatches: false
    };
  }

  // Input length guards to protect the browser thread
  if (testString.length > 200000) {
    return {
      success: false,
      error: `Input test string length (${testString.length.toLocaleString()} characters) exceeds the 200,000 character safety threshold to prevent browser freezing.`
    };
  }

  if (trimmedPattern.length > 1000) {
    return {
      success: false,
      error: `Regular expression pattern length (${trimmedPattern.length} characters) exceeds the 1,000 character safety threshold.`
    };
  }

  const flagsStr = buildFlagsString(flags);

  let regex: RegExp;
  try {
    regex = new RegExp(trimmedPattern, flagsStr);
  } catch (err: any) {
    return {
      success: false,
      error: `Invalid Regular Expression: ${err.message}`
    };
  }

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const matches: RegexMatchItem[] = [];
  const MAX_MATCH_LIMIT = 2000;
  const MAX_EXECUTION_TIME_MS = 250; // Terminate if catastrophic backtracking occurs
  let hasTruncatedMatches = false;

  try {
    if (flags.g) {
      let match: RegExpExecArray | null;
      let iterations = 0;

      while ((match = regex.exec(testString)) !== null) {
        iterations++;
        if (iterations > MAX_MATCH_LIMIT) {
          hasTruncatedMatches = true;
          break;
        }

        // Catastrophic backtracking check every 50 iterations
        if (iterations % 50 === 0) {
          const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
          if (now - startTime > MAX_EXECUTION_TIME_MS) {
            return {
              success: false,
              error: `Execution timed out (${Math.round(now - startTime)}ms). The pattern exhibited excessive backtracking (possible ReDoS). Processing halted safely to prevent browser lockup.`
            };
          }
        }

        const matchText = match[0];
        const matchIndex = match.index;
        const endIndex = matchIndex + matchText.length;

        const groups: RegexCaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            if (match[i] !== undefined) {
              groups.push({
                index: i,
                value: match[i]
              });
            }
          }
        }

        // Named capture groups
        if (match.groups) {
          for (const name of Object.keys(match.groups)) {
            const val = match.groups[name];
            if (val !== undefined) {
              const existing = groups.find(g => g.value === val);
              if (existing) {
                existing.name = name;
              } else {
                groups.push({
                  index: groups.length + 1,
                  name,
                  value: val
                });
              }
            }
          }
        }

        matches.push({
          index: matchIndex,
          endIndex,
          match: matchText,
          groups
        });

        // Safe advancement for zero-length matches (e.g., ^, \b, a*)
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        const groups: RegexCaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            if (match[i] !== undefined) {
              groups.push({
                index: i,
                value: match[i]
              });
            }
          }
        }

        if (match.groups) {
          for (const name of Object.keys(match.groups)) {
            const val = match.groups[name];
            if (val !== undefined) {
              const existing = groups.find(g => g.value === val);
              if (existing) {
                existing.name = name;
              } else {
                groups.push({
                  index: groups.length + 1,
                  name,
                  value: val
                });
              }
            }
          }
        }

        matches.push({
          index: match.index,
          endIndex: match.index + match[0].length,
          match: match[0],
          groups
        });
      }
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    return {
      success: true,
      matches,
      matchCount: matches.length,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      hasTruncatedMatches
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Execution failed: ${err.message}`
    };
  }
}
