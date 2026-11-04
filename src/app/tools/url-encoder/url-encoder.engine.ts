export type UrlEncodeMode = 'component' | 'full_url';
export type SpaceEncodingMode = 'standard' | 'form'; // '%20' vs '+'

export interface UrlEncodeOptions {
  mode?: UrlEncodeMode;
  spaceEncoding?: SpaceEncodingMode;
  encodeSpecialCharacters?: boolean; // RFC 3986 strict for !, ', (, ), *
}

export interface UrlDecodeOptions {
  mode?: UrlEncodeMode;
  decodePlusAsSpace?: boolean;
}

export interface UrlEngineSuccess {
  success: true;
  output: string;
  charCount: number;
}

export interface UrlEngineError {
  success: false;
  error: string;
}

export type UrlEngineResult = UrlEngineSuccess | UrlEngineError;

/**
 * Encodes a URL or URL component into a percent-encoded string.
 */
export function encodeUrl(input: string, options: UrlEncodeOptions = {}): UrlEngineResult {
  if (input === '') {
    return {
      success: true,
      output: '',
      charCount: 0
    };
  }

  try {
    const mode = options.mode || 'component';
    let encoded = mode === 'component' ? encodeURIComponent(input) : encodeURI(input);

    // RFC 3986 strict encoding for characters not escaped by encodeURIComponent: !, ', (, ), *
    if (options.encodeSpecialCharacters) {
      encoded = encoded.replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    }

    // Support application/x-www-form-urlencoded where spaces become '+'
    if (options.spaceEncoding === 'form') {
      encoded = encoded.replace(/%20/g, '+');
    }

    return {
      success: true,
      output: encoded,
      charCount: encoded.length
    };
  } catch (err: any) {
    return {
      success: false,
      error: `URL encoding failed: ${err.message}`
    };
  }
}

/**
 * Decodes a percent-encoded URL or URL component.
 * Catches URIError for malformed percent sequences (e.g. %ZZ, truncated %) and reports clear diagnostics.
 */
export function decodeUrl(input: string, options: UrlDecodeOptions = {}): UrlEngineResult {
  if (input === '') {
    return {
      success: true,
      output: '',
      charCount: 0
    };
  }

  try {
    let prepared = input;
    if (options.decodePlusAsSpace ?? true) {
      // Decode '+' into spaces (standard for query string form data)
      prepared = prepared.replace(/\+/g, ' ');
    }

    const mode = options.mode || 'component';
    const decoded = mode === 'component' ? decodeURIComponent(prepared) : decodeURI(prepared);

    return {
      success: true,
      output: decoded,
      charCount: decoded.length
    };
  } catch (err: any) {
    let message = err.message || 'URI malformed';
    if (message.includes('URI malformed')) {
      message = 'Invalid percent-encoded sequence. Check for incomplete percent signs (e.g. "%" not followed by two hex digits) or invalid hex characters.';
    }
    return {
      success: false,
      error: `URL decoding failed: ${message}`
    };
  }
}

