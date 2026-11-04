export type JsonIndentOption = 2 | 4 | 'minify';

export interface JsonFormatOptions {
  indent: JsonIndentOption;
  sortKeys?: boolean;
}

export interface JsonFormatSuccess {
  success: true;
  formatted: string;
  byteSize: number;
  originalByteSize: number;
  lineCount: number;
}

export interface JsonFormatError {
  success: false;
  error: string;
  line?: number;
  column?: number;
}

export type JsonFormatResult = JsonFormatSuccess | JsonFormatError;

/**
 * Calculates line and column coordinates from a character position.
 */
export function calculateCoordinates(text: string, position: number): { line: number; column: number } {
  const safePos = Math.max(0, Math.min(position, text.length));
  const before = text.slice(0, safePos);
  const lines = before.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

/**
 * Parses SyntaxError messages from native JSON.parse to extract coordinates.
 */
export function parseJsonSyntaxError(error: SyntaxError, input: string): { message: string; line?: number; column?: number } {
  const msg = error.message;

  // Pattern 1: "...at line X column Y"
  const lineColMatch = msg.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      message: msg,
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10)
    };
  }

  // Pattern 2: "...at position X"
  const posMatch = msg.match(/position (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const coords = calculateCoordinates(input, pos);
    return {
      message: msg,
      line: coords.line,
      column: coords.column
    };
  }

  return { message: msg };
}

/**
 * Sorts object keys recursively if requested.
 */
function sortObjectKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((sorted: Record<string, any>, key) => {
        sorted[key] = sortObjectKeys(value[key]);
        return sorted;
      }, {});
  }
  return value;
}

/**
 * Pure JSON formatting engine.
 */
export function formatJson(input: string, options: JsonFormatOptions = { indent: 2 }): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Input is empty. Please enter or paste a JSON string.'
    };
  }

  const originalByteSize = new TextEncoder().encode(input).length;

  try {
    let parsed = JSON.parse(input);

    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    const formatted = options.indent === 'minify'
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, options.indent);

    const byteSize = new TextEncoder().encode(formatted).length;
    const lineCount = formatted.split('\n').length;

    return {
      success: true,
      formatted,
      byteSize,
      originalByteSize,
      lineCount
    };
  } catch (err: any) {
    const parsedErr = parseJsonSyntaxError(err, input);
    return {
      success: false,
      error: parsedErr.message,
      line: parsedErr.line,
      column: parsedErr.column
    };
  }
}

