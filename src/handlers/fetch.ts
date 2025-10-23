/**
 * Watcher SDK - Fetch Wrapper
 *
 * Wraps the browser's fetch API to capture network errors for reporting.
 *
 * Features:
 * - Captures 4xx/5xx responses as 'network_error'
 * - Captures thrown errors (including AbortError) with timing
 * - Reads small, safe snippets of request/response bodies (text-like only)
 * - No-op on server; installs once in browsers
 */
import { isBrowser } from '../utils';
import { truncate } from '../utils/sanitize';

/** Internal marker attached to wrapped fetch to prevent double wrapping. */
const WRAPPED = '__watcher_fetch_wrapped__' as const;

/** Fetch-compatible function signature for strong typing. */
type FetchLike = typeof fetch;
/** Holds original window.fetch for later restoration. */
let originalFetch: FetchLike | null = null;

/**
 * Best-effort HTTP method detection from fetch arguments.
 * Returns 'GET' when no method is explicitly provided.
 */
function guessMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (
    typeof input === 'object' &&
    'method' in input &&
    (input as Request).method
  ) {
    return (input as Request).method.toLowerCase();
  }

  return 'GET';
}

/** Extracts a URL string from Request | URL | string inputs safely. */
function getUrl(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    if (typeof input === 'object' && 'url' in input)
      return (input as Request).url;
  } catch {}

  return String(input);
}

/**
 * Reads a non-destructive textual request body snippet when available.
 * Only attempts for text-like content types (json/text/xml/html/form).
 */
async function readRequestBody(
  init?: RequestInit,
  input?: RequestInfo | URL,
): Promise<string | undefined> {
  try {
    // If a Request was passed, try to read its body text (non-destructive clone)
    if (typeof input === 'object' && input instanceof Request) {
      const clone: Request = input.clone();
      const ct: string = clone.headers.get('content-type') ?? '';

      if (/json|text|xml|html|form/i.test(ct)) {
        return await clone.text();
      }
      return undefined;
    }

    // If body was provided in init
    if (init?.body && typeof init.body === 'string') return init.body;
  } catch {}

  return undefined;
}

/**
 * Reads a small textual response snippet from a cloned Response for diagnostics.
 * Skips non-text content types and returns undefined on failure.
 */
async function readResponseSnippet(
  resp: Response,
): Promise<string | undefined> {
  try {
    const ct = resp.headers.get('content-type') ?? '';
    if (/json|text|xml|html/i.test(ct)) {
      const clone = resp.clone();
      const text = await clone.text();

      return text;
    }
  } catch {}

  return undefined;
}

/**
 * Installs a wrapper around window.fetch to emit 'network_error' payloads.
 *
 * Behavior:
 * - Idempotent: Won't re-wrap if already installed
 * - Client-only: No-ops outside the browser
 * - Reports 4xx/5xx responses and thrown errors with timing and snippets
 */
export function installFetchWrapper(
  process: (payload: any) => void,
  getBase: () => Record<string, any>,
) {
  if (!isBrowser()) return;

  const anyFetch = window.fetch as any;
  if (anyFetch && anyFetch[WRAPPED]) return;

  originalFetch = window.fetch;

  const wrapped: FetchLike = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const start = performance.now?.() ?? Date.now();

    try {
      const resp: Response = await originalFetch!(input as any, init as any);

      // Treat 4xx/5xx as errors; 3xx/2xx pass through
      if (resp.status >= 400) {
        const base = getBase();
        const method = guessMethod(input, init);
        const url = getUrl(input);
        const [requestBody, responseText] = await Promise.all([
          readRequestBody(init, input),
          readResponseSnippet(resp),
        ]);

        process({
          type: 'network_error',
          message: `HTTP ${resp.status} ${resp.statusText} for ${method} ${url}`,
          status: resp.status,
          statusText: resp.statusText,
          method,
          url,
          requestBodySnippet: truncate(requestBody),
          responseSnippet: truncate(responseText),
          durationMs: (performance.now?.() ?? Date.now()) - start,
          ...base,
        });
      }

      return resp;
    } catch (e: any) {
      const base = getBase();
      const method = guessMethod(input, init);
      const url = getUrl(input);
      const aborted =
        (e && (e.name === 'AbortError' || e.code === 20)) ||
        (init && (init.signal as any)?.aborted);

      process({
        type: 'network_error',
        name: e?.name,
        message: aborted
          ? `AbortError during ${method} ${url}`
          : (e?.message ?? 'Network error'),
        stack: e?.stack,
        method,
        url,
        durationMs: (performance.now?.() ?? Date.now()) - start,
        ...base,
      });

      throw e;
    }
  };

  (wrapped as any)[WRAPPED] = true;
  window.fetch = wrapped;
}

/** Restores the original window.fetch if it was wrapped. Safe to call multiple times. */
export function uninstallFetchWrapper() {
  if (isBrowser() && originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}
