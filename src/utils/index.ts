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
 * and its version information to identify Node.js runtime environments.
 *
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
 */
export const isNode = (): string | false =>
  typeof process !== 'undefined' && process.versions?.node;

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
