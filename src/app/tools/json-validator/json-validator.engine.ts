import { calculateCoordinates, parseJsonSyntaxError } from '../json-formatter/json-formatter.engine';

export type JsonDataType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonMetadata {
  dataType: JsonDataType;
  depth: number;
  itemCount: number; // Top-level key count for object, or element count for array
  totalKeys: number; // Total keys across all nested levels
  byteSize: number;
}

export interface JsonValidationSuccess {
  valid: true;
  metadata: JsonMetadata;
  formattedPreview?: string;
}

export interface JsonValidationError {
  valid: false;
  error: string;
  line?: number;
  column?: number;
}

export type JsonValidationResult = JsonValidationSuccess | JsonValidationError;

/**
 * Calculates structural depth of parsed JSON.
 */
function calculateDepth(value: any, currentDepth = 1): number {
  if (value === null || typeof value !== 'object') {
    return currentDepth;
  }
  let maxChildDepth = currentDepth;
  if (Array.isArray(value)) {
    for (const item of value) {
      maxChildDepth = Math.max(maxChildDepth, calculateDepth(item, currentDepth + 1));
    }
  } else {
    for (const key of Object.keys(value)) {
      maxChildDepth = Math.max(maxChildDepth, calculateDepth(value[key], currentDepth + 1));
    }
  }
  return maxChildDepth;
}

/**
 * Counts total keys recursively.
 */
function countTotalKeys(value: any): number {
  if (value === null || typeof value !== 'object') {
    return 0;
  }
  let count = 0;
  if (Array.isArray(value)) {
    for (const item of value) {
      count += countTotalKeys(item);
    }
  } else {
    const keys = Object.keys(value);
    count += keys.length;
    for (const k of keys) {
      count += countTotalKeys(value[k]);
    }
  }
  return count;
}

/**
 * Determines exact JSON data type.
 */
export function getJsonDataType(value: any): JsonDataType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'object') return 'object';
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'string';
}

/**
 * Validates a JSON string using native JSON.parse and calculates structural metrics.
 */
export function validateJson(input: string): JsonValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Input is empty. Please enter or paste JSON to validate.'
    };
  }

  try {
    const parsed = JSON.parse(input);
    const dataType = getJsonDataType(parsed);
    const byteSize = new TextEncoder().encode(input).length;

    let itemCount = 0;
    if (dataType === 'array') {
      itemCount = parsed.length;
    } else if (dataType === 'object') {
      itemCount = Object.keys(parsed).length;
    } else {
      itemCount = 1;
    }

    const depth = calculateDepth(parsed);
    const totalKeys = countTotalKeys(parsed);

    return {
      valid: true,
      metadata: {
        dataType,
        depth,
        itemCount,
        totalKeys,
        byteSize
      }
    };
  } catch (err: any) {
    const parsedErr = parseJsonSyntaxError(err, input);
    return {
      valid: false,
      error: parsedErr.message,
      line: parsedErr.line,
      column: parsedErr.column
    };
  }
}

