export interface Base64Options {
  urlSafe?: boolean;
  padding?: boolean;
}

export interface Base64Success {
  success: true;
  output: string;
  byteCount: number;
  charCount: number;
}

export interface Base64Error {
  success: false;
  error: string;
}

export type Base64Result = Base64Success | Base64Error;

/**
 * Encodes a Unicode / UTF-8 string into a Base64 or URL-Safe Base64 string.
 * Uses modern TextEncoder and chunked binary conversion to avoid stack overflows on large strings.
 */
export function encodeBase64(input: string, options: Base64Options = {}): Base64Result {
  if (input === '') {
    return {
      success: true,
      output: '',
      byteCount: 0,
      charCount: 0
    };
  }

  try {
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    let b64 = btoa(binary);

    if (options.urlSafe) {
      b64 = b64.replace(/\+/g, '-').replace(/\//g, '_');
      if (options.padding === false) {
        b64 = b64.replace(/=+$/, '');
      }
    } else if (options.padding === false) {
      b64 = b64.replace(/=+$/, '');
    }

    return {
      success: true,
      output: b64,
      byteCount: bytes.length,
      charCount: b64.length
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Base64 encoding failed: ${err.message}`
    };
  }
}

/**
 * Decodes a Base64 or URL-Safe Base64 string into a Unicode / UTF-8 string.
 * Handles missing padding, URL-safe variants, and non-ASCII character sets safely.
 */
export function decodeBase64(input: string): Base64Result {
  const trimmed = input.trim();
  if (trimmed === '') {
    return {
      success: true,
      output: '',
      byteCount: 0,
      charCount: 0
    };
  }

  // Transform URL-safe characters back to standard Base64
  let normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');

  // Strip internal whitespace / line breaks
  normalized = normalized.replace(/\s+/g, '');

  // Base64 string length modulo 4 can never be 1 in a valid encoding
  if (normalized.length % 4 === 1) {
    return {
      success: false,
      error: 'Invalid Base64 length. The string length cannot have a remainder of 1 when divided by 4.'
    };
  }

  // Restore padding if omitted
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }

  // Check for invalid Base64 characters
  const validBase64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!validBase64Regex.test(normalized)) {
    return {
      success: false,
      error: 'Invalid Base64 format. Input contains characters outside the valid Base64 alphabet.'
    };
  }

  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return {
      success: true,
      output: decoded,
      byteCount: bytes.length,
      charCount: decoded.length
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Base64 decoding failed: ${err.message || 'Malformed Base64 or non-UTF-8 sequence.'}`
    };
  }
}

