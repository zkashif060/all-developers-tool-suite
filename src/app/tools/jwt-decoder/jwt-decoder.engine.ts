export interface JwtHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: any;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface ExpirationInfo {
  timestamp: number;
  formattedUtc: string;
  formattedLocal: string;
  isExpired: boolean;
  relativeTime: string;
}

export interface IssuedAtInfo {
  timestamp: number;
  formattedUtc: string;
  formattedLocal: string;
}

export interface NotBeforeInfo {
  timestamp: number;
  formattedUtc: string;
  formattedLocal: string;
  isValidNow: boolean;
}

export interface DecodedJwtSuccess {
  success: true;
  rawHeader: string;
  rawPayload: string;
  signature: string;
  header: JwtHeader;
  payload: JwtPayload;
  headerFormatted: string;
  payloadFormatted: string;
  expiration?: ExpirationInfo;
  issuedAt?: IssuedAtInfo;
  notBefore?: NotBeforeInfo;
  isExpired?: boolean;
}

export interface DecodedJwtError {
  success: false;
  error: string;
}

export type DecodedJwtResult = DecodedJwtSuccess | DecodedJwtError;

/**
 * Decodes a Base64URL encoded string into a UTF-8 string safely.
 */
export function decodeBase64Url(str: string): string {
  let normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Calculates human-readable relative time (e.g. "expired 2 hours ago", "expires in 5 days").
 */
function getRelativeTimeString(seconds: number, nowSeconds: number): string {
  const diffSec = seconds - nowSeconds;
  const absDiff = Math.abs(diffSec);

  const minutes = Math.floor(absDiff / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let timeString = '';
  if (days > 0) {
    timeString = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    timeString = `${absDiff} second${absDiff !== 1 ? 's' : ''}`;
  }

  return diffSec < 0 ? `Expired ${timeString} ago` : `Expires in ${timeString}`;
}

/**
 * Decodes and inspects a JSON Web Token (JWT) strictly on the client side.
 * Note: Decoding does NOT verify the cryptographic signature.
 */
export function decodeJwt(token: string, referenceTimeMs: number = Date.now()): DecodedJwtResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'JWT input is empty. Please paste a valid JWT token.'
    };
  }

  const parts = trimmed.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return {
      success: false,
      error: `Invalid JWT structure: Token has ${parts.length} segment${parts.length === 1 ? '' : 's'}. A valid JWT must consist of 2 or 3 segments separated by dots (header.payload[.signature]).`
    };
  }

  const [headerB64, payloadB64, signatureB64 = ''] = parts;

  let decodedHeaderStr: string;
  try {
    decodedHeaderStr = decodeBase64Url(headerB64);
  } catch (err: any) {
    return {
      success: false,
      error: `Malformed JWT Header Base64URL: ${err.message}`
    };
  }

  let decodedPayloadStr: string;
  try {
    decodedPayloadStr = decodeBase64Url(payloadB64);
  } catch (err: any) {
    return {
      success: false,
      error: `Malformed JWT Payload Base64URL: ${err.message}`
    };
  }

  let headerJson: JwtHeader;
  try {
    headerJson = JSON.parse(decodedHeaderStr);
    if (typeof headerJson !== 'object' || headerJson === null || Array.isArray(headerJson)) {
      throw new Error('Header must be a JSON object');
    }
  } catch (err: any) {
    return {
      success: false,
      error: `JWT Header is not valid JSON: ${err.message}`
    };
  }

  let payloadJson: JwtPayload;
  try {
    payloadJson = JSON.parse(decodedPayloadStr);
    if (typeof payloadJson !== 'object' || payloadJson === null || Array.isArray(payloadJson)) {
      throw new Error('Payload must be a JSON object');
    }
  } catch (err: any) {
    return {
      success: false,
      error: `JWT Payload is not valid JSON: ${err.message}`
    };
  }

  const nowSeconds = Math.floor(referenceTimeMs / 1000);
  let expiration: ExpirationInfo | undefined;
  let isExpired: boolean | undefined;

  if (typeof payloadJson.exp === 'number' && !isNaN(payloadJson.exp)) {
    const expDate = new Date(payloadJson.exp * 1000);
    const expired = payloadJson.exp <= nowSeconds;
    isExpired = expired;
    expiration = {
      timestamp: payloadJson.exp,
      formattedUtc: expDate.toUTCString(),
      formattedLocal: expDate.toLocaleString(),
      isExpired: expired,
      relativeTime: getRelativeTimeString(payloadJson.exp, nowSeconds)
    };
  }

  let issuedAt: IssuedAtInfo | undefined;
  if (typeof payloadJson.iat === 'number' && !isNaN(payloadJson.iat)) {
    const iatDate = new Date(payloadJson.iat * 1000);
    issuedAt = {
      timestamp: payloadJson.iat,
      formattedUtc: iatDate.toUTCString(),
      formattedLocal: iatDate.toLocaleString()
    };
  }

  let notBefore: NotBeforeInfo | undefined;
  if (typeof payloadJson.nbf === 'number' && !isNaN(payloadJson.nbf)) {
    const nbfDate = new Date(payloadJson.nbf * 1000);
    notBefore = {
      timestamp: payloadJson.nbf,
      formattedUtc: nbfDate.toUTCString(),
      formattedLocal: nbfDate.toLocaleString(),
      isValidNow: payloadJson.nbf <= nowSeconds
    };
  }

  return {
    success: true,
    rawHeader: headerB64,
    rawPayload: payloadB64,
    signature: signatureB64,
    header: headerJson,
    payload: payloadJson,
    headerFormatted: JSON.stringify(headerJson, null, 2),
    payloadFormatted: JSON.stringify(payloadJson, null, 2),
    expiration,
    issuedAt,
    notBefore,
    isExpired
  };
}
