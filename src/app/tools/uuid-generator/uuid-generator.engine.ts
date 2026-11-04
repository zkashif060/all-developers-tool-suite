export interface UuidGeneratorOptions {
  count?: number;
  uppercase?: boolean;
  hyphens?: boolean;
  braces?: boolean;
  quotes?: boolean;
}

export interface UuidGeneratorSuccess {
  success: true;
  uuids: string[];
  output: string;
  count: number;
}

export interface UuidGeneratorError {
  success: false;
  error: string;
}

export type UuidGeneratorResult = UuidGeneratorSuccess | UuidGeneratorError;

/**
 * Checks if the Web Crypto API is available in the current environment.
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && (typeof crypto.randomUUID === 'function' || typeof crypto.getRandomValues === 'function');
}

/**
 * Generates a single RFC 4122 version 4 compliant UUID using cryptographically secure random bytes.
 * Uses crypto.randomUUID() when available, with a strict RFC 4122 fallback using crypto.getRandomValues().
 */
export function generateSingleUuidV4(): string {
  if (typeof crypto === 'undefined') {
    throw new Error('Web Crypto API is not supported in this browser environment. Cannot generate cryptographically secure UUIDs.');
  }

  // Primary: Native crypto.randomUUID()
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: crypto.getRandomValues() with strict RFC 4122 bitwise masks
  if (typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version to 0100 (v4): bytes[6] & 0x0f | 0x40
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to 10xx (RFC 4122): bytes[8] & 0x3f | 0x80
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  throw new Error('Neither crypto.randomUUID nor crypto.getRandomValues is available.');
}

/**
 * Formats a raw UUID according to specified display options (case, hyphens, braces, quotes).
 */
export function formatUuid(
  rawUuid: string,
  options: {
    uppercase?: boolean;
    hyphens?: boolean;
    braces?: boolean;
    quotes?: boolean;
  } = {}
): string {
  let formatted = rawUuid;

  if (options.hyphens === false) {
    formatted = formatted.replace(/-/g, '');
  }

  if (options.uppercase) {
    formatted = formatted.toUpperCase();
  } else {
    formatted = formatted.toLowerCase();
  }

  if (options.braces) {
    formatted = `{${formatted}}`;
  }

  if (options.quotes) {
    formatted = `"${formatted}"`;
  }

  return formatted;
}

/**
 * Generates a batch of cryptographically secure RFC 4122 v4 UUIDs.
 */
export function generateUuids(options: UuidGeneratorOptions = {}): UuidGeneratorResult {
  const count = options.count ?? 5;

  if (count <= 0 || !Number.isInteger(count)) {
    return {
      success: false,
      error: 'Quantity must be a positive integer between 1 and 500.'
    };
  }

  if (count > 500) {
    return {
      success: false,
      error: 'Maximum limit is 500 UUIDs per generation batch.'
    };
  }

  if (!isCryptoAvailable()) {
    return {
      success: false,
      error: 'Web Crypto API is unavailable in this environment. Insecure randomness (Math.random) is strictly disallowed.'
    };
  }

  try {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const raw = generateSingleUuidV4();
      list.push(formatUuid(raw, options));
    }

    return {
      success: true,
      uuids: list,
      output: list.join('\n'),
      count: list.length
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to generate UUIDs: ${err.message}`
    };
  }
}

