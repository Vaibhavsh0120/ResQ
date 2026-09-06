import { config } from '@/config/env';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * Thin fetch wrapper shared by every service. Centralizes:
 *  - base URL + auth header injection (add the token lookup once here when
 *    auth is implemented, instead of in every service file)
 *  - JSON encode/decode
 *  - timeout handling
 *  - consistent error shape (ApiError) so screens can show one kind of
 *    "something went wrong" UI regardless of which endpoint failed
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!config.apiBaseUrl) {
    throw new ApiError('No API base URL configured. Set EXPO_PUBLIC_API_BASE_URL.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        // TODO: inject auth token once auth is implemented, e.g.
        // Authorization: `Bearer ${await getAuthToken()}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new ApiError(message || `Request failed with status ${response.status}`, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection and try again.');
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network request failed.');
  } finally {
    clearTimeout(timeout);
  }
}

/** Small helper used by mock service implementations to simulate latency. */
export function mockDelay<T>(value: T, ms = config.mockLatencyMs): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
