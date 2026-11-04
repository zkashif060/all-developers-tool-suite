import { describe, it, expect } from 'vitest';
import { decodeJwt, decodeBase64Url } from './jwt-decoder.engine';

describe('JWT Decoder Engine', () => {
  // Helper to build test JWTs
  function createTestJwt(header: any, payload: any, signature = 'mockSignature_123'): string {
    const toB64Url = (obj: any) =>
      btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${toB64Url(header)}.${toB64Url(payload)}.${signature}`;
  }

  it('should successfully decode a valid JWT with header and payload', () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '1234567890', name: 'John Doe', admin: true };
    const token = createTestJwt(header, payload);

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.header.alg).toBe('HS256');
      expect(result.payload.name).toBe('John Doe');
      expect(result.payload['admin']).toBe(true);
      expect(result.signature).toBe('mockSignature_123');
    }
  });

  it('should correctly detect an expired token based on exp claim', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const token = createTestJwt({ alg: 'HS256' }, { sub: 'user_1', exp: pastExp });

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.isExpired).toBe(true);
      expect(result.expiration).toBeDefined();
      expect(result.expiration?.isExpired).toBe(true);
      expect(result.expiration?.relativeTime).toContain('Expired');
    }
  });

  it('should correctly detect an active token with future expiration', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 86400 * 5; // 5 days in future
    const token = createTestJwt({ alg: 'RS256' }, { sub: 'user_2', exp: futureExp });

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.isExpired).toBe(false);
      expect(result.expiration?.isExpired).toBe(false);
      expect(result.expiration?.relativeTime).toContain('Expires in');
    }
  });

  it('should handle JWTs without an exp claim', () => {
    const token = createTestJwt({ alg: 'HS256' }, { sub: 'user_no_exp', role: 'developer' });

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.expiration).toBeUndefined();
      expect(result.isExpired).toBeUndefined();
      expect(result.payload.role).toBe('developer');
    }
  });

  it('should parse iat (issued at) and nbf (not before) claims correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = createTestJwt(
      { alg: 'HS256' },
      { sub: 'user_times', iat: now - 600, nbf: now + 300 }
    );

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.issuedAt).toBeDefined();
      expect(result.notBefore).toBeDefined();
      expect(result.notBefore?.isValidNow).toBe(false); // nbf is 300s in the future
    }
  });

  it('should decode Unicode claims and emoji in payloads correctly', () => {
    const token = createTestJwt(
      { alg: 'HS256' },
      { name: 'احمد خان', city: 'لاہور', status: 'Active 🚀✨' }
    );

    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload.name).toBe('احمد خان');
      expect(result.payload['city']).toBe('لاہور');
      expect(result.payload['status']).toBe('Active 🚀✨');
    }
  });

  it('should support 2-segment tokens without signature (unsecured JWTs)', () => {
    const token = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"anonymous"}')}`;
    const result = decodeJwt(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.header.alg).toBe('none');
      expect(result.payload.sub).toBe('anonymous');
      expect(result.signature).toBe('');
    }
  });

  it('should reject tokens with invalid segment counts', () => {
    const onePart = 'justAStringWithoutDots';
    const result1 = decodeJwt(onePart);
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error).toContain('Invalid JWT structure');
    }

    const fourParts = 'part1.part2.part3.part4';
    const result2 = decodeJwt(fourParts);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error).toContain('4 segments');
    }
  });

  it('should reject tokens with invalid Base64URL characters in header or payload', () => {
    const invalidBase64 = 'not@valid@base64.eyJzdWIiOiIxMjM0In0.sig';
    const result = decodeJwt(invalidBase64);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Malformed JWT Header');
    }
  });

  it('should reject tokens whose decoded segments are not valid JSON', () => {
    const notJsonHeader = `${btoa('this is plain text not json')}.${btoa('{"sub":"123"}')}.sig`;
    const result = decodeJwt(notJsonHeader);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not valid JSON');
    }
  });

  it('should reject empty or whitespace inputs', () => {
    const result = decodeJwt('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('empty');
    }
  });
});
