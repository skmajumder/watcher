/**
 * Watcher SDK - Core Error Processor
 *
 * This file contains the core error processing logic for the Watcher SDK.
 * It implements advanced error handling with rate limiting, fingerprinting,
 * deduplication, sanitization, and the main processing pipeline.
 *
 * **Core Features:**
 * - **Error Sampling**: Configurable rate limiting based on sampleRate
 * - **Rate Limiting**: Prevents error flooding with sliding window counters
 * - **Advanced Deduplication**: Time-based fingerprint deduplication with automatic cleanup
 * - **Error Fingerprinting**: Creates unique error signatures for identification
 * - **Payload Sanitization**: Removes sensitive data and truncates long content
 * - **Safe Processing**: Never throws errors, ensuring SDK resilience
 * - **Non-blocking Output**: Uses queueMicrotask for console logging
 *
 * **Processing Pipeline:**
 * 1. Configuration Retrieval: Get current SDK configuration
 * 2. Sampling Check: Determine if error should be processed
 * 3. Rate Limiting: Check if error count exceeds window limits
 * 4. Payload Sanitization: Clean and normalize error data
 * 5. Fingerprint Generation: Create unique error identifier
 * 6. Deduplication: Check if error was recently processed
 * 7. Memory Management: Automatic cleanup of expired fingerprints
 * 8. Error Output: Log to console with fingerprint (non-blocking)
 *
 * **Current Implementation Status:**
 * - ✅ Error sampling with configurable rates
 * - ✅ Rate limiting with sliding window (50 errors per 5 seconds)
 * - ✅ Advanced fingerprint-based deduplication
 * - ✅ Automatic memory cleanup and management
 * - ✅ Payload sanitization and normalization
 * - ✅ Console output using queueMicrotask
 * - ✅ Configuration-driven processing
 * - 🔄 Transport layer integration (planned for Milestone 1.4)
 */

import type { ErrorPayload, WatcherConfig } from '../types/types';
import { simpleHash } from '../utils/hash';
import { sanitizePayload } from '../utils/sanitize';
import { getConfig } from './config';

/**
 * Type alias for error fingerprint strings
 * 
 * Fingerprints are unique identifiers generated from error characteristics
 * that allow for reliable deduplication and correlation across systems.
 * 
 * @type {string}
 */
type Fingerprint = string;

/**
 * Map of recently processed error fingerprints with expiry timestamps
 *
 * This Map stores error fingerprints along with their expiration times
 * for advanced deduplication. Each fingerprint maps to a timestamp
 * indicating when the deduplication period expires.
 *
 * **Memory Management:**
 * - Automatic cleanup when map size exceeds 500 entries
 * - Expired fingerprints are removed during cleanup
 * - Prevents memory leaks while maintaining deduplication effectiveness
 * - Uses timestamp-based expiration for precise control
 *
 * **Key Benefits:**
 * - More efficient than Set-based deduplication
 * - Automatic cleanup prevents memory bloat
 * - Time-based expiration allows for flexible deduplication windows
 * - Better performance for high-frequency error scenarios
 *
 * @private
 * @type {Map<Fingerprint, number>}
 */
const recent: Map<Fingerprint, number> = new Map<Fingerprint, number>(); // key -> expiry ts

/**
 * Rate limiting configuration constants
 * 
 * These constants control the rate limiting behavior to prevent
 * error flooding while maintaining error visibility.
 * 
 * **Rate Limiting Strategy:**
 * - **Window Size**: 5 seconds for counting errors
 * - **Maximum Errors**: 50 errors allowed per window
 * - **Sliding Window**: Resets counter when window expires
 * - **Graceful Degradation**: Drops excess errors without crashing
 */
const RATE_WINDOW_MS: number = 5_000;  // 5 second window
const RATE_MAX: number = 50;           // Maximum 50 errors per window

/**
 * Rate limiting state variables
 * 
 * These variables track the current rate limiting window and
 * maintain the error count within the current time window.
 * 
 * @private
 */
let windowStart: number = Date.now();    // Start time of current window
let countInWindow: number = 0;           // Error count in current window

/**
 * Determines if an error should be sampled based on the configuration
 *
 * This function implements a simple random sampling strategy to control
 * the volume of errors processed. It's useful for production environments
 * where you want to reduce data volume while maintaining error visibility.
 *
 * **Sampling Strategy:**
 * - Uses Math.random() for simple random sampling
 * - sampleRate of 0.0 = no errors processed
 * - sampleRate of 1.0 = all errors processed
 * - sampleRate of 0.1 = approximately 10% of errors processed
 *
 * **Example Scenarios:**
 * - Development: sampleRate = 1.0 (100% of errors)
 * - Staging: sampleRate = 0.5 (50% of errors)
 * - Production: sampleRate = 0.1 (10% of errors)
 * - High-traffic: sampleRate = 0.01 (1% of errors)
 *
 * **Future Improvements:**
 * - Deterministic sampling based on error hash
 * - Time-based sampling windows
 * - Error type-specific sampling rates
 * - Adaptive sampling based on error frequency
 *
 * @param {WatcherConfig} cfg - The Watcher configuration object
 * @returns {boolean} True if the error should be processed, false to skip
 *
 * @example
 * ```typescript
 * // Process 10% of errors in production
 * const config = { sampleRate: 0.1 };
 * const shouldProcess = shouldSample(config);
 *
 * // Process all errors in development
 * const devConfig = { sampleRate: 1.0 };
 * const devShouldProcess = shouldSample(devConfig);
 * ```
 *
 * @note This is a simple random sampling strategy. Future versions may
 * implement more sophisticated sampling algorithms for better error coverage.
 */
function shouldSample(cfg: WatcherConfig): boolean {
  // Get sample rate from config, default to 1.0 (100%) if not specified
  const sampleRate = cfg?.sampleRate ?? 1;

  // Simple random sampling: return true if random value is less than sample rate
  return Math.random() < sampleRate;
}

/**
 * Generates a unique fingerprint for an error payload
 *
 * This function creates a deterministic fingerprint by normalizing
 * error characteristics and combining them into a hash. The fingerprint
 * is used for deduplication and correlation across systems.
 *
 * **Fingerprint Strategy:**
 * - **Normalization**: Trims whitespace and removes extra spaces
 * - **Key Fields**: Combines type, name, message, stack, and source
 * - **Consistent Hashing**: Uses FNV-1a hash for reliable results
 * - **Noise Reduction**: Strips whitespace to handle formatting differences
 *
 * **Normalization Process:**
 * 1. **Type**: Error category (runtime_error, unhandled_promise, etc.)
 * 2. **Name**: Error constructor name (TypeError, ReferenceError, etc.)
 * 3. **Message**: Error message with whitespace normalization
 * 4. **Stack**: Stack trace with whitespace normalization
 * 5. **Source**: Source file with whitespace normalization
 *
 * **Benefits:**
 * - Consistent fingerprints for similar errors
 * - Reduces false positives from formatting differences
 * - Enables cross-system error correlation
 * - Supports server-side deduplication
 *
 * @param {ErrorPayload} p - The error payload to fingerprint
 * @returns {Fingerprint} Unique fingerprint string for the error
 *
 * @example
 * ```typescript
 * const error = {
 *   type: 'runtime_error',
 *   name: 'TypeError',
 *   message: 'Cannot read property of undefined',
 *   stack: 'Error: Cannot read property...',
 *   source: 'app.js'
 * };
 * 
 * const fp = fingerprint(error);
 * // Result: 'a1b2c3d4' (consistent hash for this error)
 * ```
 */
function fingerprint(p: ErrorPayload): Fingerprint {
  // Normalize to reduce noisy differences: trim/strip whitespace
  const name = (p?.name || '').trim();
  const msg = (p?.message || '').replace(/\s+/g, '').trim();
  const stack = (p?.stack || '').replace(/\s+/g, '').trim();
  const src = (p?.source || '').trim();

  // Combine with separator to create a unique fingerprint
  return simpleHash([p.type, name, msg, stack, src].join('|'));
}

/**
 * Checks if an error is a duplicate based on its fingerprint
 *
 * This function implements advanced deduplication using time-based
 * expiration and automatic memory cleanup. It prevents the same error
 * from being processed multiple times within a configurable window.
 *
 * **Deduplication Strategy:**
 * - **Time-based Expiration**: Each fingerprint has a TTL (time to live)
 * - **Automatic Cleanup**: Expired fingerprints are removed during checks
 * - **Memory Management**: Cleanup triggered when map size exceeds 500
 * - **Flexible TTL**: Configurable deduplication window per fingerprint
 *
 * **Process Flow:**
 * 1. Check if fingerprint exists and is still valid
 * 2. If valid → return true (duplicate, skip processing)
 * 3. If expired or new → set new expiry and return false (process)
 * 4. Trigger cleanup if map is too large
 *
 * **Memory Cleanup:**
 * - Triggered when map size exceeds 500 entries
 * - Removes all expired fingerprints
 * - Prevents memory bloat in high-error scenarios
 * - Maintains deduplication effectiveness
 *
 * @param {Fingerprint} key - The error fingerprint to check
 * @param {number} ttl - Time to live in milliseconds (default: 3000ms)
 * @returns {boolean} True if duplicate, false if new/expired
 *
 * @example
 * ```typescript
 * const fp = fingerprint(error);
 * 
 * // Check if error is duplicate (3 second window)
 * if (deduped(fp)) {
 *   return; // Skip processing duplicate
 * }
 * 
 * // Process new error
 * processError(error);
 * ```
 */
function deduped(key: Fingerprint, ttl = 3_000): boolean {
  // Current timestamp
  const now = Date.now();
  
  // Lookup this fingerprint's expiry timestamp
  const expiry = recent.get(key);

  // If the map is too large, purge any expired fingerprints
  // This prevents memory bloat while maintaining deduplication
  if (recent.size > 500) {
    for (const [key, exp] of recent) {
      if (exp <= now) recent.delete(key);
    }
  }

  // If expiry timestamp exists and is still valid → DUPLICATE
  if (expiry && expiry > now) return true;
  
  // First time (or stamp expired) → issue new expiry timestamp
  recent.set(key, now + ttl);
  
  // NOT duplicate (let it through)
  return false;
}

/**
 * Checks if error processing should be rate limited
 *
 * This function implements sliding window rate limiting to prevent
 * error flooding while maintaining error visibility. It allows a
 * maximum number of errors per time window.
 *
 * **Rate Limiting Strategy:**
 * - **Sliding Window**: 5-second window that moves with time
 * - **Error Limit**: Maximum 50 errors per window
 * - **Window Reset**: Counter resets when window expires
 * - **Graceful Degradation**: Drops excess errors without crashing
 *
 * **Window Behavior:**
 * - Window starts when first error is processed
 * - Counter increments with each error
 * - Window resets after 5 seconds
 * - Counter resets to 0 on window reset
 *
 * **Benefits:**
 * - Prevents error flooding in high-error scenarios
 * - Maintains system stability during error storms
 * - Provides predictable error processing limits
 * - Enables graceful degradation under load
 *
 * @returns {boolean} True if rate limited, false if processing allowed
 *
 * @example
 * ```typescript
 * // Check if error processing is rate limited
 * if (rateLimited()) {
 *   return; // Skip processing due to rate limiting
 * }
 * 
 * // Process error normally
 * processError(error);
 * ```
 */
function rateLimited(): boolean {
  // Current timestamp
  const now = Date.now();

  // Check if current window has expired
  if (now - windowStart > RATE_WINDOW_MS) {
    // Reset window and counter
    windowStart = now;
    countInWindow = 0;
  }
  
  // Increment error counter for current window
  countInWindow++;
  
  // Return true if error count exceeds limit
  return countInWindow > RATE_MAX;
}

/**
 * Processes incoming error payloads with comprehensive error handling
 *
 * This function is the main entry point for error processing in the SDK.
 * It implements a robust pipeline that handles errors safely without
 * ever throwing exceptions that could crash the application.
 *
 * **Processing Steps:**
 * 1. **Configuration Retrieval**: Get current SDK settings
 * 2. **Sampling Check**: Apply rate limiting if configured
 * 3. **Rate Limiting**: Check if error count exceeds window limits
 * 4. **Payload Sanitization**: Clean and normalize error data
 * 5. **Fingerprint Generation**: Create unique error identifier
 * 6. **Deduplication**: Skip if error was recently processed
 * 7. **Memory Management**: Automatic cleanup of expired fingerprints
 * 8. **Error Output**: Log to console with fingerprint (non-blocking)
 *
 * **Error Resilience:**
 * - Wrapped in try-catch to prevent SDK crashes
 * - Graceful degradation if any step fails
 * - Never throws errors to calling code
 * - Maintains application stability
 *
 * **Performance Characteristics:**
 * - Early returns for sampled-out, rate-limited, and duplicate errors
 * - Non-blocking console output using queueMicrotask
 * - Memory-efficient deduplication with automatic cleanup
 * - Minimal impact on application performance
 *
 * **Advanced Features:**
 * - **Rate Limiting**: Prevents error flooding (50 errors per 5 seconds)
 * - **Smart Deduplication**: Time-based fingerprint deduplication
 * - **Payload Sanitization**: Removes sensitive data and truncates content
 * - **Fingerprinting**: Enables cross-system error correlation
 *
 * @param {ErrorPayload} raw - The raw error payload to process
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
 * // The function will:
 * // 1. Check if error should be sampled
 * // 2. Check if rate limiting applies
 * // 3. Sanitize and normalize the payload
 * // 4. Generate a unique fingerprint
 * // 5. Check for duplicates
 * // 6. Log to console with fingerprint
 * // 7. Schedule automatic cleanup
 * ```
 *
 * **Current Implementation (Milestone 1.2):**
 * - ✅ Basic error processing with sampling and deduplication
 * - ✅ Rate limiting with sliding window (50 errors per 5 seconds)
 * - ✅ Advanced fingerprint-based deduplication with TTL
 * - ✅ Automatic memory cleanup and management
 * - ✅ Payload sanitization and normalization
 * - ✅ Console output using queueMicrotask
 * - ✅ Configuration-driven processing
 * - 🔄 Transport layer integration (planned for Milestone 1.4)
 *
 * **Future Enhancements (Milestone 1.4+):**
 * - Transport layer integration (HTTP, WebSocket, etc.)
 * - Advanced sampling strategies
 * - Error categorization and filtering
 * - Performance metrics collection
 * - Breadcrumb correlation
 * - Error grouping and aggregation
 * - Server-side fingerprint correlation
 *
 * @throws {never} This function is designed to never throw errors
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function processError(raw: ErrorPayload) {
  try {
    // Step 1: Retrieve current SDK configuration
    // This provides access to sampling rates, environment, and other settings
    const config = getConfig();

    // Step 2: Apply sampling if configured
    // Skip processing if this error doesn't meet sampling criteria
    if (!shouldSample(config)) return;
    
    // Step 3: Apply rate limiting
    // Skip processing if error count exceeds window limits
    if (rateLimited()) return;

    // Step 4: Sanitize and normalize the error payload
    // Remove sensitive data, truncate long content, and normalize formatting
    const sanitized = sanitizePayload(raw);
    
    // Step 5: Generate unique fingerprint for deduplication
    // Create deterministic identifier from error characteristics
    const key = fingerprint(sanitized);

    // Step 6: Check for duplicate errors
    // Skip if this exact error was recently processed
    if (deduped(key)) return;

    // Step 7: Attach fingerprint for cross-system correlation
    // This enables server-side deduplication and error tracking
    const payload = { ...sanitized, fingerprint: key };

    // Step 8: Output error information (non-blocking)
    // Use queueMicrotask to ensure console logging doesn't block the main thread
    // Real transports will plug in here later for production use
    queueMicrotask(() => {
      console.log('[Watcher] Error Processed:', payload);
    });

  } catch (processingError) {
    /**
     * Error processing should never throw
     *
     * This catch block ensures that even if error processing fails,
     * it doesn't crash the application. This is critical for an error
     * tracking SDK - it must be resilient to its own failures.
     *
     * **What happens here:**
     * - Any errors in the processing pipeline are caught
     * - The error is silently handled to prevent crashes
     * - The original error is not processed (fail-safe behavior)
     * - Application continues running normally
     *
     * **In production environments, you might want to:**
     * - Log these internal errors to a separate monitoring system
     * - Send alerts to development team
     * - Track SDK health metrics
     * - Implement circuit breaker patterns
     * - Monitor error processing success rates
     * - Track processing pipeline failures
     */
  }
}
