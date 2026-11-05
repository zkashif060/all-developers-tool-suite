import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildFullUrl,
  parseQueryParamsFromUrl,
  generateCurlCommand,
  formatByteSize,
  formatDurationMs,
  executeApiRequest,
  ApiRequestConfig
} from './api-tester.engine';

describe('ApiTesterEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildFullUrl', () => {
    it('should return empty string for empty url', () => {
      expect(buildFullUrl('', [])).toBe('');
    });

    it('should return baseUrl unchanged when no params provided or enabled', () => {
      expect(buildFullUrl('https://api.example.com/users', [])).toBe('https://api.example.com/users');
      expect(
        buildFullUrl('https://api.example.com/users', [
          { id: '1', key: 'page', value: '2', enabled: false }
        ])
      ).toBe('https://api.example.com/users');
    });

    it('should append active query params properly', () => {
      const url = buildFullUrl('https://api.example.com/items', [
        { id: '1', key: 'q', value: 'angular', enabled: true },
        { id: '2', key: 'limit', value: '10', enabled: true },
        { id: '3', key: 'disabled', value: 'skip', enabled: false }
      ]);
      expect(url).toContain('https://api.example.com/items?');
      expect(url).toContain('q=angular');
      expect(url).toContain('limit=10');
      expect(url).not.toContain('disabled');
    });
  });

  describe('parseQueryParamsFromUrl', () => {
    it('should extract query parameters from URL', () => {
      const parsed = parseQueryParamsFromUrl('https://api.example.com/search?q=test&lang=en');
      expect(parsed.baseUrl).toBe('https://api.example.com/search');
      expect(parsed.params.length).toBe(2);
      expect(parsed.params[0].key).toBe('q');
      expect(parsed.params[0].value).toBe('test');
      expect(parsed.params[1].key).toBe('lang');
      expect(parsed.params[1].value).toBe('en');
    });

    it('should handle URL with no parameters', () => {
      const parsed = parseQueryParamsFromUrl('https://api.example.com/status');
      expect(parsed.baseUrl).toBe('https://api.example.com/status');
      expect(parsed.params.length).toBe(0);
    });
  });

  describe('generateCurlCommand', () => {
    it('should generate basic GET curl command', () => {
      const config: ApiRequestConfig = {
        url: 'https://api.example.com/v1/posts',
        method: 'GET',
        queryParams: [{ id: '1', key: 'sort', value: 'desc', enabled: true }],
        headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
        bodyType: 'none',
        rawBody: ''
      };
      const curl = generateCurlCommand(config);
      expect(curl).toContain('curl --request GET');
      expect(curl).toContain("'https://api.example.com/v1/posts?sort=desc'");
      expect(curl).toContain("--header 'Accept: application/json'");
    });

    it('should include request body and escaped data for POST', () => {
      const config: ApiRequestConfig = {
        url: 'https://api.example.com/v1/users',
        method: 'POST',
        queryParams: [],
        headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
        bodyType: 'json',
        rawBody: '{"name":"John Doe"}'
      };
      const curl = generateCurlCommand(config);
      expect(curl).toContain('curl --request POST');
      expect(curl).toContain("--data '{\"name\":\"John Doe\"}'");
    });
  });

  describe('format helpers', () => {
    it('should format byte sizes accurately', () => {
      expect(formatByteSize(512)).toBe('512 B');
      expect(formatByteSize(2048)).toBe('2.0 KB');
      expect(formatByteSize(1048576 * 2.5)).toBe('2.50 MB');
    });

    it('should format duration times accurately', () => {
      expect(formatDurationMs(45)).toBe('45 ms');
      expect(formatDurationMs(1500)).toBe('1.50 s');
    });
  });

  describe('executeApiRequest', () => {
    it('should throw error if url is missing', async () => {
      await expect(
        executeApiRequest({
          url: '',
          method: 'GET',
          queryParams: [],
          headers: [],
          bodyType: 'none',
          rawBody: ''
        })
      ).rejects.toThrow('Please enter a valid request URL.');
    });

    it('should successfully execute request and return parsed JSON result', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'success', count: 42 })
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      const res = await executeApiRequest({
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET',
        queryParams: [],
        headers: [],
        bodyType: 'none',
        rawBody: ''
      });

      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
      expect(res.isJson).toBe(true);
      expect(res.formattedJson).toContain('"count": 42');
      expect(res.sizeBytes).toBeGreaterThan(0);
    });

    it('should detect and handle CORS/Network failures gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      const res = await executeApiRequest({
        url: 'https://internal-api.corp/data',
        method: 'GET',
        queryParams: [],
        headers: [],
        bodyType: 'none',
        rawBody: ''
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(0);
      expect(res.isCorsError).toBe(true);
      expect(res.statusText).toBe('CORS / Network Blocked');
    });
  });
});
