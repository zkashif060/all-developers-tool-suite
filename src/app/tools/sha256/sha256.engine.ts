export interface Sha256Options {
  uppercase?: boolean;
}

export interface Sha256Success {
  success: true;
  hash: string;
  byteCount: number;
  charCount: number;
}

export interface Sha256Error {
  success: false;
  error: string;
}

export type Sha256Result = Sha256Success | Sha256Error;

/**
 * Checks whether the Web Crypto Subtle API is supported and available in the current context.
 */
export function isSubtleCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined' && typeof crypto.subtle.digest === 'function';
}

/**
 * Asynchronously calculates the SHA-256 cryptographic hash digest of a UTF-8 string using the Web Crypto API.
 */
export async function computeSha256(
  input: string,
  options: Sha256Options = {}
): Promise<Sha256Result> {
  if (!isSubtleCryptoSupported()) {
    return {
      success: false,
      error: 'Web Crypto API (crypto.subtle) is unavailable in this environment. SubtleCrypto requires a secure context (HTTPS or localhost).'
    };
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashBytes = new Uint8Array(hashBuffer);

    let hex = Array.from(hashBytes, b => b.toString(16).padStart(2, '0')).join('');
    if (options.uppercase) {
      hex = hex.toUpperCase();
    }

    return {
      success: true,
      hash: hex,
      byteCount: data.length,
      charCount: hex.length
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to compute SHA-256 hash: ${err.message}`
    };
  }
}

