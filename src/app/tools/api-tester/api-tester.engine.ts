export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValueParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type RequestBodyType = 'none' | 'json' | 'text' | 'x-www-form-urlencoded';

export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  queryParams: KeyValueParam[];
  headers: KeyValueParam[];
  bodyType: RequestBodyType;
  rawBody: string;
  timeoutMs?: number;
}

export interface ApiResponseResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: { key: string; value: string }[];
  body: string;
  isJson: boolean;
  formattedJson?: string;
  error?: string;
  isCorsError?: boolean;
  isTimeout?: boolean;
}

export interface ApiPreset {
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers?: { key: string; value: string }[];
  queryParams?: { key: string; value: string }[];
  bodyType?: RequestBodyType;
  body?: string;
}

/**
 * Common presets for quick testing and onboarding.
 */
export const API_PRESETS: ApiPreset[] = [
  {
    name: 'JSONPlaceholder - Fetch Post',
    description: 'GET public mock post with comments and user metadata',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [{ key: 'Accept', value: 'application/json' }]
  },
  {
    name: 'JSONPlaceholder - Create Post',
    description: 'POST payload to test resource creation',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [{ key: 'Content-Type', value: 'application/json; charset=UTF-8' }],
    bodyType: 'json',
    body: JSON.stringify(
      {
        title: 'ZeroTrace In-Browser API Test',
        body: 'Testing direct client-side request execution with full privacy.',
        userId: 1
      },
      null,
      2
    )
  },
  {
    name: 'HTTPBin - Echo Headers',
    description: 'GET request to inspect client request headers',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    headers: [
      { key: 'Accept', value: 'application/json' },
      { key: 'X-Client-Agent', value: 'ZeroTrace-Tools/1.0' }
    ]
  },
  {
    name: 'GitHub API - Public User',
    description: 'GET public profile information for GitHub Octocat',
    method: 'GET',
    url: 'https://api.github.com/users/octocat',
    headers: [{ key: 'Accept', value: 'application/vnd.github.v3+json' }]
  }
];

/**
 * Builds the fully qualified URL including active query parameters.
 */
export function buildFullUrl(rawUrl: string, params: KeyValueParam[]): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const activeParams = params.filter(p => p.enabled && p.key.trim().length > 0);
  if (activeParams.length === 0) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    for (const p of activeParams) {
      urlObj.searchParams.append(p.key.trim(), p.value);
    }
    return urlObj.toString();
  } catch {
    // If URL is relative or partial, manually append parameters
    const separator = trimmed.includes('?') ? '&' : '?';
    const queryString = activeParams
      .map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`)
      .join('&');
    return `${trimmed}${separator}${queryString}`;
  }
}

/**
 * Extracts query parameters from a URL string and returns the base URL and parsed parameter list.
 */
export function parseQueryParamsFromUrl(fullUrl: string): { baseUrl: string; params: KeyValueParam[] } {
  try {
    const parsed = new URL(fullUrl.startsWith('http://') || fullUrl.startsWith('https://') ? fullUrl : `http://placeholder.local/${fullUrl}`);
    const params: KeyValueParam[] = [];
    let idCounter = 1;

    parsed.searchParams.forEach((value, key) => {
      params.push({
        id: `param-${idCounter++}`,
        key,
        value,
        enabled: true
      });
    });

    // Remove search and hash to get base URL
    const baseUrl = fullUrl.split('?')[0].split('#')[0];
    return { baseUrl, params };
  } catch {
    return { baseUrl: fullUrl, params: [] };
  }
}

/**
 * Generates an executable cURL command line representing this API request.
 */
export function generateCurlCommand(config: ApiRequestConfig): string {
  const fullUrl = buildFullUrl(config.url, config.queryParams);
  const parts: string[] = [`curl --request ${config.method}`];

  parts.push(`'${fullUrl || 'https://api.example.com'}'`);

  const activeHeaders = config.headers.filter(h => h.enabled && h.key.trim().length > 0);
  for (const h of activeHeaders) {
    parts.push(`--header '${h.key.trim()}: ${h.value}'`);
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.bodyType !== 'none' && config.rawBody.trim()) {
    const escaped = config.rawBody.replace(/'/g, `'\\''`);
    parts.push(`--data '${escaped}'`);
  }

  return parts.join(' \\\n  ');
}

/**
 * Formats byte size into human readable string (B, KB, MB).
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Formats duration in milliseconds or seconds.
 */
export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Performs client-side HTTP request execution with safety bounds, metrics, and CORS detection.
 */
export async function executeApiRequest(
  config: ApiRequestConfig,
  customSignal?: AbortSignal
): Promise<ApiResponseResult> {
  const fullUrl = buildFullUrl(config.url, config.queryParams);
  if (!fullUrl) {
    throw new Error('Please enter a valid request URL.');
  }

  // Ensure absolute URL
  let targetUrl = fullUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  const timeoutMs = config.timeoutMs ?? 30000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const activeHeaders = config.headers.filter(h => h.enabled && h.key.trim().length > 0);
  const headerInit: Record<string, string> = {};

  for (const h of activeHeaders) {
    headerInit[h.key.trim()] = h.value;
  }

  // Prepare body if applicable
  let requestBody: string | undefined = undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.bodyType !== 'none') {
    requestBody = config.rawBody;
    if (config.bodyType === 'json' && !headerInit['Content-Type']) {
      headerInit['Content-Type'] = 'application/json';
    } else if (config.bodyType === 'x-www-form-urlencoded' && !headerInit['Content-Type']) {
      headerInit['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }

  const startTime = performance.now();

  try {
    const combinedSignal = customSignal
      ? anySignal([customSignal, timeoutController.signal])
      : timeoutController.signal;

    const response = await fetch(targetUrl, {
      method: config.method,
      headers: headerInit,
      body: requestBody,
      signal: combinedSignal
    });

    const endTime = performance.now();
    clearTimeout(timeoutId);

    const durationMs = Math.max(1, endTime - startTime);
    const textBody = await response.text();
    const sizeBytes = new TextEncoder().encode(textBody).length;

    // Parse response headers
    const resHeaders: { key: string; value: string }[] = [];
    response.headers.forEach((value, key) => {
      resHeaders.push({ key, value });
    });
    resHeaders.sort((a, b) => a.key.localeCompare(b.key));

    // Try parsing JSON
    let isJson = false;
    let formattedJson: string | undefined = undefined;
    try {
      const parsed = JSON.parse(textBody);
      isJson = true;
      formattedJson = JSON.stringify(parsed, null, 2);
    } catch {
      isJson = false;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || getStandardStatusText(response.status),
      durationMs,
      sizeBytes,
      headers: resHeaders,
      body: textBody,
      isJson,
      formattedJson
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const durationMs = Math.max(1, endTime - startTime);

    const errorMsg = err instanceof Error ? err.message : String(err);
    const isTimeout = timeoutController.signal.aborted || errorMsg.toLowerCase().includes('timeout') || errorMsg.toLowerCase().includes('aborted');

    // In modern browsers, a failed fetch due to CORS is reported as TypeError: Failed to fetch
    const isCors = !isTimeout && (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('Load failed')
    );

    return {
      ok: false,
      status: 0,
      statusText: isTimeout ? 'Request Timeout' : isCors ? 'CORS / Network Blocked' : 'Error',
      durationMs,
      sizeBytes: 0,
      headers: [],
      body: '',
      isJson: false,
      error: errorMsg,
      isCorsError: isCors,
      isTimeout
    };
  }
}

/**
 * Standard HTTP status text mapping for accurate status labeling.
 */
function getStandardStatusText(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return map[status] || 'Unknown';
}

/**
 * Fallback helper for combining multiple abort signals.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
