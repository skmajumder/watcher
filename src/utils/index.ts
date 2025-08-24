/**
 * Watcher SDK - Utility Functions
 *
 * This module contains helper functions used throughout the SDK
 * for common operations like environment detection and data processing.
 */

/**
 * Determines if the code is running in a browser environment
 *
 * This function checks for the presence of both 'window' and 'document' objects
 * to reliably detect browser environments. It's used throughout the SDK to:
 * - Choose appropriate error handling strategies
 * - Initialize browser-specific features
 * - Avoid server-side code from running in browser contexts
 *
 * @returns {boolean} True if running in browser, false if in server environment
 *
 * @example
 * ```typescript
 * import { isBrowser } from 'watcher';
 *
 * if (isBrowser()) {
 *   // Setup browser-specific error handlers
 *   window.addEventListener('error', handleError);
 * } else {
 *   // Setup server-specific error handlers
 *   process.on('uncaughtException', handleError);
 * }
 * ```
 */
export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Determines if the code is running in a server environment
 *
 * This is the inverse of isBrowser() and provides a more semantic way
 * to check for server-side execution contexts.
 *
 * @returns {boolean} True if running in server environment, false if in browser
 *
 * @example
 * ```typescript
 * import { isServer } from 'watcher';
 *
 * if (isServer()) {
 *   // Server-specific error handling
 *   process.on('uncaughtException', handleError);
 * }
 * ```
 */
export const isServer = (): boolean => !isBrowser();

/**
 * Determines if the code is running in a Node.js environment
 *
 * This function checks for the presence of the Node.js process object
 * to identify Node.js runtime environments.
 *
 * @returns {boolean} True if running in Node.js, false otherwise
 *
 * @example
 * ```typescript
 * import { isNode } from 'watcher';
 *
 * if (isNode()) {
 *   // Node.js specific features
 *   const os = require('os');
 *   console.log('Platform:', os.platform());
 * }
 * ```
 * @since 0.1.0
 * @version Milestone 1.2
 */
export const isNode = (): boolean => typeof process !== 'undefined';

/**
 * Determines if the code is running in a Web Worker context
 *
 * This function checks for Web Worker specific global scope properties
 * to identify dedicated worker execution contexts.
 *
 * @returns {boolean} True if running in Web Worker, false otherwise
 *
 * @example
 * ```typescript
 * import { isWebWorker } from 'watcher';
 *
 * if (isWebWorker()) {
 *   // Web Worker specific error handling
 *   // Use postMessage for communication
 * }
 * ```
 */
export const isWebWorker = (): boolean =>
  typeof self !== 'undefined' &&
  self.constructor.name === 'DedicatedWorkerGlobalScope';

/**
 * Generates a current timestamp in ISO string format
 *
 * This function creates a standardized timestamp string that can be used
 * for error tracking, logging, and data synchronization.
 *
 * @returns {string} Current timestamp in ISO string format
 *
 * @example
 * ```typescript
 * import { nowIso } from 'watcher';
 *
 * const timestamp = nowIso();
 * console.log('Error occurred at:', timestamp);
 * // Output: Error occurred at: Mon Dec 16 2024 10:30:45 GMT+0000
 * ```
 */
export const nowIso = (): string => new Date().toDateString();

/**
 * Generates a simple non-cryptographic hash for string deduplication
 *
 * This function implements a fast hash algorithm (FNV-1a variant) that's
 * suitable for generating unique identifiers and detecting duplicate strings.
 * It's NOT cryptographically secure and should only be used for:
 * - Error deduplication
 * - Cache keys
 * - Quick string comparison
 *
 * @param {string} input - The string to hash
 * @returns {string} Hexadecimal hash string
 *
 * @example
 * ```typescript
 * import { simpleHash } from 'watcher';
 *
 * const hash1 = simpleHash('error message 1');
 * const hash2 = simpleHash('error message 1');
 * console.log(hash1 === hash2); // true - same input produces same hash
 *
 * const hash3 = simpleHash('different error message');
 * console.log(hash1 === hash3); // false - different inputs produce different hashes
 * ```
 *
 * @note This is NOT a cryptographic hash function. For security purposes,
 * use crypto.createHash() or similar cryptographic functions.
 */
export const simpleHash = (input: string): string => {
  const length = input.length;
  let hash = 2166136261 >>> 0; // FNV offset basis

  for (let i = 0; i < length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  return (hash >>> 0).toString(16);
};

/**
 * Checks if a value is Error-like (has 'name' and 'message' string properties).
 *
 * @param {unknown} err - The value to check.
 * @returns {err is Error} True if the value is Error-like, false otherwise.
 */
export const isErrorLike = (err: unknown): err is Error => {
  if (!err || typeof err !== 'object') return false;
  const maybeError = err as {
    name?: unknown;
    message?: unknown;
    stack?: unknown;
  };
  return (
    typeof maybeError.name === 'string' &&
    typeof maybeError.message === 'string' &&
    typeof maybeError.stack === 'string'
  );
};

/**
 * Type guard for string values.
 *
 * @param {unknown} str - The value to check.
 * @returns {str is string} True if the value is a string, false otherwise.
 */
export const isString = (str: unknown): str is string =>
  typeof str === 'string';

/**
 * Type guard for number values.
 *
 * @param {unknown} num - The value to check.
 * @returns {num is number} True if the value is a number, false otherwise.
 */
export const isNumber = (num: unknown): num is number =>
  typeof num === 'number';

/**
 * Type guard for boolean values.
 *
 * @param {unknown} bool - The value to check.
 * @returns {bool is boolean} True if the value is a boolean, false otherwise.
 */
export const isBoolean = (bool: unknown): bool is boolean =>
  typeof bool === 'boolean';

/**
 * Type guard for plain object values (excluding null).
 *
 * @param {unknown} obj - The value to check.
 * @returns {obj is Record<string, unknown>} True if the value is a non-null object, false otherwise.
 */
export const isObject = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === 'object' && obj !== null;

/**
 * Type guard for function values.
 *
 * @param {unknown} func - The value to check.
 * @returns {func is (...args: unknown[]) => unknown} True if the value is a function, false otherwise.
 */
export const isFunction = (
  func: unknown,
): func is (...args: unknown[]) => unknown => typeof func === 'function';

/**
 * Type guard for array values.
 *
 * @param {unknown} arr - The value to check.
 * @returns {arr is unknown[]} True if the value is an array, false otherwise.
 */
export const isArray = (arr: unknown): arr is unknown[] => Array.isArray(arr);

/**
 * Safely serializes a value to JSON.
 *
 * @param {unknown} v - The value to serialize.
 * @returns {string | undefined} The JSON string if serialization succeeds, otherwise undefined.
 */
export function safeJson(v: unknown): string | undefined {
  try {
    return JSON.stringify(v);
  } catch {
    return undefined;
  }
}
