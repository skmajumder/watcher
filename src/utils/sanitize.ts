// src/utils/sanitize.ts

import { ErrorPayload } from '../types/types';

const SENSITIVE_KEYS = [
  'token',
  'auth',
  'authorization',
  'password',
  'passwd',
  'secret',
  'api_key',
  'apikey',
  'access_key',
  'session',
  'cookie',
];

export function sanitizeUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') return;

  try {
    const u: URL = new URL(
      url,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost',
    );

    for (const [key, value] of u.searchParams.entries()) {
      if (isSensitive(key)) u.searchParams.set(key, 'REDACTED');
    }

    return u.toString();
  } catch {
    return url; // If the URL is invalid, return the original URL
  }
}

/**
 * Truncates a string to a specified maximum length and appends a truncation marker if needed.
 *
 * This function ensures that very long strings (such as error messages, stack traces, or payloads)
 * do not exceed the specified maximum length. If the string exceeds the limit, it is sliced and
 * a '…[truncated]' marker is appended to indicate truncation.
 *
 * @param {string | undefined} s - The input string to potentially truncate.
 * @param {number} [max=10_000] - The maximum allowed length for the string.
 * @returns {string | undefined} The original string if within the limit, the truncated string with marker if exceeded, or undefined if input is not a string.
 *
 * @example
 *   truncate('Hello World', 5); // "Hello…[truncated]"
 *   truncate('Short', 10);      // "Short"
 */
export function truncate(s?: string, max = 10_000): string | undefined {
  if (typeof s !== 'string') return s as any;
  return s.length > max ? s.slice(0, max) + '…[truncated]' : s;
}

/**
 * Checks if a given key is considered sensitive.
 *
 * This function performs a case-insensitive check to determine if the provided key
 * contains any substring from the SENSITIVE_KEYS list. It is used to identify
 * sensitive information such as tokens, passwords, or API keys for sanitization.
 *
 * @param {string} key - The key to check for sensitivity.
 * @returns {boolean} True if the key is sensitive, false otherwise.
 */
const isSensitive = (key: string): boolean => {
  const k = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitiveKey) => k.includes(sensitiveKey));
};

export function sanitizePayload(p: ErrorPayload): ErrorPayload {
  return {
    ...p,
    url: sanitizeUrl(p.url ?? ''),
    message: truncate(p.message, 2_000),
    stack: truncate(p.stack, 50_000),
    source: truncate(p.source, 2_000),
  };
}
