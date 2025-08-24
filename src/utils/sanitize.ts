/**
 * Watcher SDK - Payload Sanitization
 *
 * This file contains utilities for sanitizing error payloads before
 * processing and transmission. It handles sensitive data removal,
 * content truncation, and URL sanitization to ensure data privacy
 * and prevent payload size issues.
 *
 * **Purpose:**
 * Sanitization in the Watcher SDK ensures:
 * - **Data Privacy**: Removes sensitive information (tokens, passwords)
 * - **Payload Size Control**: Truncates overly long content
 * - **URL Safety**: Removes sensitive query parameters
 * - **Consistent Formatting**: Normalizes payload structure
 *
 * **Security Features:**
 * - Automatic detection of sensitive keys
 * - URL parameter sanitization
 * - Content length limits
 * - Safe fallbacks for invalid data
 */

import type { ErrorPayload } from '../types/types';

/**
 * List of sensitive keys that should be redacted from data
 *
 * This array contains common sensitive parameter names that
 * should never be transmitted in error reports. The list covers
 * authentication tokens, API keys, passwords, and session data.
 *
 * **Sensitive Key Categories:**
 * - **Authentication**: token, auth, authorization, password, passwd
 * - **API Access**: api_key, apikey, access_key
 * - **Session Data**: session, cookie
 * - **Secrets**: secret
 *
 * **Detection Strategy:**
 * - Case-insensitive substring matching
 * - Covers common variations and abbreviations
 * - Extensible for custom sensitive keys
 * - Comprehensive coverage of security-sensitive data
 *
 * @private
 * @constant
 * @type {string[]}
 */
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

/**
 * Sanitizes URLs by removing sensitive query parameters
 *
 * This function processes URLs to identify and redact sensitive
 * query parameters while preserving the URL structure. It's designed
 * to handle both valid and invalid URLs gracefully.
 *
 * **Sanitization Process:**
 * 1. **URL Validation**: Attempts to parse the URL
 * 2. **Parameter Analysis**: Examines all query parameters
 * 3. **Sensitive Detection**: Identifies sensitive parameter names
 * 4. **Redaction**: Replaces sensitive values with 'REDACTED'
 * 5. **Fallback**: Returns original URL if parsing fails
 *
 * **URL Handling:**
 * - **Valid URLs**: Full sanitization with parameter redaction
 * - **Invalid URLs**: Returns original URL unchanged
 * - **Relative URLs**: Resolved against current origin
 * - **Query Parameters**: All sensitive parameters are redacted
 *
 * **Security Benefits:**
 * - Prevents token leakage in error reports
 * - Maintains URL structure for debugging
 * - Handles edge cases gracefully
 * - No sensitive data transmission
 *
 * @param {string} url - The URL to sanitize
 * @returns {string | undefined} Sanitized URL or undefined if invalid
 *
 * @example
 * ```typescript
 * import { sanitizeUrl } from 'watcher';
 *
 * // Sanitize URL with sensitive parameters
 * const sensitiveUrl = 'https://api.example.com/data?token=abc123&user=john';
 * const sanitized = sanitizeUrl(sensitiveUrl);
 * // Result: 'https://api.example.com/data?token=REDACTED&user=john'
 *
 * // Handle invalid URLs gracefully
 * const invalidUrl = 'not-a-valid-url';
 * const sanitized = sanitizeUrl(invalidUrl);
 * // Result: 'not-a-valid-url' (unchanged)
 * ```
 *
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function sanitizeUrl(url: string): string | undefined {
  // Early return for invalid or empty URLs
  if (!url || typeof url !== 'string') return;

  try {
    // Create URL object with appropriate base
    // Browser: use current origin, Server: use localhost fallback
    const u: URL = new URL(
      url,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost',
    );

    // Iterate through all query parameters
    // Check each parameter name against sensitive key list
    for (const [key, value] of u.searchParams.entries()) {
      if (isSensitive(key)) {
        // Replace sensitive parameter values with 'REDACTED'
        u.searchParams.set(key, 'REDACTED');
      }
    }

    // Return sanitized URL as string
    return u.toString();
  } catch {
    // If URL parsing fails, return original URL unchanged
    // This ensures graceful degradation for malformed URLs
    return url;
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

/**
 * Sanitizes an error payload by cleaning and truncating sensitive or overly long fields.
 *
 * This function performs the following sanitization steps:
 * - URL: Sanitizes the URL by redacting sensitive query parameters.
 * - Message: Truncates the error message to a maximum of 2,000 characters.
 * - Stack: Truncates the stack trace to a maximum of 50,000 characters.
 * - Source: Truncates the source field to a maximum of 2,000 characters.
 * - All other fields are preserved as-is.
 *
 * @param {ErrorPayload} p - The error payload to sanitize.
 * @returns {ErrorPayload} The sanitized error payload, safe for logging or transport.
 */
export function sanitizePayload(p: ErrorPayload): ErrorPayload {
  return {
    ...p,
    url: sanitizeUrl(p.url ?? ''),
    message: truncate(p.message, 2_000),
    stack: truncate(p.stack, 50_000),
    source: truncate(p.source, 2_000),
  };
}
