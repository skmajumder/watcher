/**
 * Watcher SDK - Core Error Processor
 *
 * This file contains the core error processing logic for the Watcher SDK.
 * It implements error deduplication, hash-based identification, and the
 * main processing pipeline for incoming error payloads.
 *
 * The processor provides:
 * - Error deduplication to prevent spam
 * - Hash-based error identification
 * - Configurable deduplication timeframes
 * - Safe error processing with try-catch protection
 * - Foundation for future transport layer integration
 */

import { ErrorPayload, WatcherConfig } from '../types/types';
import { simpleHash } from '../utils';
import { getConfig } from './config';

/**
 * Set of recently processed error hashes for deduplication
 *
 * This Set stores the hashes of recently processed errors to prevent
 * duplicate error reports from flooding the system. Each hash represents
 * a unique error signature based on message, name, and stack trace.
 *
 * @private
 * @type {Set<string>}
 */
const recent: Set<string> = new Set<string>();

/**
 * Deduplication time window in milliseconds
 *
 * This constant defines how long to remember processed errors to prevent
 * duplicates. After this time, the error hash is removed from the recent
 * set and can be processed again if it occurs.
 *
 * Current value: 3 seconds (3000ms)
 * This provides a good balance between preventing spam and allowing
 * legitimate repeated errors to be tracked.
 *
 * @private
 * @type {number}
 * @constant
 */
const dedupeMs: number = 3000;

/**
 * Determines if an error should be sampled based on the configuration
 *
 * - This function uses a simple random sampling strategy to determine
 * if an error should be sampled based on the sampleRate configuration.
 * - The sampleRate is a number between 0 and 1, where 0 means no errors
 * are sampled and 1 means all errors are sampled.
 *
 * @example
 * ```typescript
 * import { shouldSample } from 'watcher';
 *
 * const cfg: WatcherConfig = {
 *   sampleRate: 0.1,
 * };
 *
 * const shouldSample = shouldSample(cfg);
 * console.log(shouldSample); // true or false
 * ```
 *
 * @param {WatcherConfig} cfg - The Watcher configuration
 * @returns {boolean} True if the error should be sampled, false otherwise
 */
function shouldSample(cfg: WatcherConfig): boolean {
  const r = cfg?.sampleRate ?? 1;
  return Math.random() < r; // TODO: Implement a better sampling strategy
}

/**
 * Processes incoming error payloads with deduplication
 *
 * This function is the main entry point for error processing in the SDK.
 * It performs several key operations:
 *
 * 1. **Error Identification**: Generates a unique hash from error details
 * 2. **Deduplication**: Prevents processing duplicate errors within the time window
 * 3. **Memory Management**: Automatically cleans up old error hashes
 * 4. **Future Transport**: Prepares for transport layer integration
 *
 * **Hash Generation Strategy:**
 * The error hash is created from a combination of:
 * - Error message (primary identifier)
 * - Error name (constructor type)
 * - Stack trace (location information)
 *
 * This combination provides a good balance between uniqueness and
 * deduplication effectiveness.
 *
 * **Deduplication Logic:**
 * - If an error with the same hash exists in the recent set, it's skipped
 * - New errors are added to the recent set
 * - After dedupeMs milliseconds, the hash is automatically removed
 * - This prevents memory leaks while maintaining deduplication
 *
 * @param {ErrorPayload} p - The error payload to process
 *
 * @example
 * ```typescript
 * import { processError } from 'watcher';
 *
 * // Process a runtime error
 * processError({
 *   type: 'runtime_error',
 *   name: 'TypeError',
 *   message: 'Cannot read property of undefined',
 *   stack: 'Error: Cannot read property...',
 *   timestamp: new Date().toISOString(),
 *   environment: 'development'
 * });
 *
 * // Processing the same error again within 3 seconds will be skipped
 * // This prevents error spam while maintaining error tracking
 * ```
 *
 * **Current Implementation (Milestone 1.2):**
 * - Basic error processing and deduplication
 * - Hash-based error identification
 * - Memory-efficient deduplication with automatic cleanup
 * - Placeholder for transport layer (Step 1.4 will add console logging)
 *
 * **Future Implementation (Milestone 1.5+):**
 * - Transport layer integration (HTTP, WebSocket, etc.)
 * - Error categorization and filtering
 * - Performance metrics collection
 * - Breadcrumb correlation
 * - Advanced deduplication strategies
 *
 * @throws {never} This function is designed to never throw errors
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function processError(p: ErrorPayload) {
  try {
    // Retrieve the current configuration for error processing
    const config = getConfig(); // e.g. { environment: 'production', sampleRate: 0.1, maxBreadcrumbs: 50 }

    // If the current configuration does not meet the sampling criteria,
    // exit early to avoid unnecessary processing of this error.
    if (!shouldSample(config)) return; // e.g. if returns false, exit early, do not process this error

    // Generate unique hash from error details for deduplication
    // Combine message, name, and stack trace for comprehensive identification
    const key: string = simpleHash(
      [p.message, p.name, p.stack].filter(Boolean).join('|'),
    );

    // Skip processing if this error was recently handled
    if (recent.has(key)) return; // e.g. if returns true, exit early, do not process this error

    // Add to recent set for future deduplication
    recent.add(key); // e.g. add the hash to the recent set

    // Schedule removal of this hash after deduplication window
    // This prevents memory leaks while maintaining deduplication effectiveness
    setTimeout(() => recent.delete(key), dedupeMs); // e.g. remove the hash from the recent set after 3 seconds

    // For Milestone 1 we just print (non-blocking)
    queueMicrotask(() => {
      console.log('[Watcher]', p); // e.g. print the error payload to the console
    });
  } catch {
    /**
     * Error processing should never throw
     *
     * This catch block ensures that even if error processing fails,
     * it doesn't crash the application. This is critical for an error
     * tracking SDK - it must be resilient to its own failures.
     *
     * In production, you might want to log these internal errors
     * to a separate monitoring system for debugging.
     */
  }
}
