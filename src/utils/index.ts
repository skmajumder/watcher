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
export const isBrowser = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

export const isServer = () => !isBrowser();

export const isNode = () =>
  typeof process !== 'undefined' && process.versions?.node;

export const isReactNative = () =>
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

export const isElectron = () =>
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

export const isWebWorker = () =>
  typeof self !== 'undefined' &&
  self.constructor.name === 'DedicatedWorkerGlobalScope';

export const nowIso = () => new Date().toDateString();

// Tiny non-crypto hash for dedupe
export const simpleHash = (input: string) => {
  const length = input.length;
  let hash = 2166136261 >>> 0;

  for (let i = 0; i < length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};
