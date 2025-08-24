/**
 * Watcher SDK - Core Error Processor
 *
 * This file contains the core error processing logic for the Watcher SDK.
 * It implements error deduplication, hash-based identification, sampling,
 * and the main processing pipeline for incoming error payloads.
 *
 * **Core Features:**
 * - **Error Sampling**: Configurable rate limiting based on sampleRate
 * - **Deduplication**: Prevents duplicate error spam with time-based memory management
 * - **Hash Generation**: Creates unique error signatures for identification
 * - **Safe Processing**: Never throws errors, ensuring SDK resilience
 * - **Non-blocking Output**: Uses queueMicrotask for console logging
 *
 * **Processing Pipeline:**
 * 1. Configuration Retrieval: Get current SDK configuration
 * 2. Sampling Check: Determine if error should be processed
 * 3. Hash Generation: Create unique error identifier
 * 4. Deduplication: Check if error was recently processed
 * 5. Memory Management: Schedule hash cleanup
 * 6. Error Output: Log to console (non-blocking)
 *
 * **Current Implementation Status:**
 * - ✅ Error sampling with configurable rates
 * - ✅ Hash-based deduplication with memory management
 * - ✅ Console output using queueMicrotask
 * - ✅ Configuration-driven processing
 * - 🔄 Transport layer integration (planned for Milestone 1.4)
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
 * **Memory Management:**
 * - Hashes are automatically removed after dedupeMs milliseconds
 * - Prevents memory leaks while maintaining deduplication effectiveness
 * - Uses setTimeout for cleanup scheduling
 * - Maximum memory usage is bounded by error frequency and dedupeMs
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
 * **Current Value: 3 seconds (3000ms)**
 * This provides a good balance between:
 * - Preventing error spam from rapid-fire errors
 * - Allowing legitimate repeated errors to be tracked after a delay
 * - Maintaining reasonable memory usage
 *
 * **Tuning Considerations:**
 * - Shorter windows: Less memory, more error reports
 * - Longer windows: More memory, fewer duplicate reports
 * - 3 seconds is optimal for most web applications
 * - Can be made configurable in future versions
 *
 * @private
 * @type {number}
 * @constant
 */
const dedupeMs: number = 3000;

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
 * Processes incoming error payloads with comprehensive error handling
 *
 * This function is the main entry point for error processing in the SDK.
 * It implements a robust pipeline that handles errors safely without
 * ever throwing exceptions that could crash the application.
 *
 * **Processing Steps:**
 * 1. **Configuration Retrieval**: Get current SDK settings
 * 2. **Sampling Check**: Apply rate limiting if configured
 * 3. **Hash Generation**: Create unique error identifier
 * 4. **Deduplication**: Skip if error was recently processed
 * 5. **Memory Management**: Schedule hash cleanup
 * 6. **Error Output**: Log to console using non-blocking approach
 *
 * **Error Resilience:**
 * - Wrapped in try-catch to prevent SDK crashes
 * - Graceful degradation if any step fails
 * - Never throws errors to calling code
 * - Maintains application stability
 *
 * **Performance Characteristics:**
 * - Early returns for sampled-out and duplicate errors
 * - Non-blocking console output using queueMicrotask
 * - Memory-efficient deduplication with automatic cleanup
 * - Minimal impact on application performance
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
 * // The function will:
 * // 1. Check if error should be sampled
 * // 2. Generate a unique hash
 * // 3. Check for duplicates
 * // 4. Log to console if new
 * // 5. Schedule cleanup after 3 seconds
 * ```
 *
 * **Current Implementation (Milestone 1.2):**
 * - ✅ Basic error processing with sampling and deduplication
 * - ✅ Console output using queueMicrotask for non-blocking behavior
 * - ✅ Memory-efficient deduplication with automatic cleanup
 * - ✅ Configuration-driven sampling rates
 * - 🔄 Transport layer integration (planned for Milestone 1.4)
 *
 * **Future Enhancements (Milestone 1.4+):**
 * - Transport layer integration (HTTP, WebSocket, etc.)
 * - Advanced sampling strategies
 * - Error categorization and filtering
 * - Performance metrics collection
 * - Breadcrumb correlation
 * - Error grouping and aggregation
 *
 * @throws {never} This function is designed to never throw errors
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function processError(p: ErrorPayload) {
  try {
    // Step 1: Retrieve current SDK configuration
    // This provides access to sampling rates, environment, and other settings
    const config = getConfig();

    // Step 2: Apply sampling if configured
    // Skip processing if this error doesn't meet sampling criteria
    if (!shouldSample(config)) return; // Early exit for sampled-out errors

    // Step 3: Generate unique hash for deduplication
    // Combine message, name, and stack trace for comprehensive identification
    // Filter out undefined values to ensure consistent hashing
    const key: string = simpleHash(
      [p.message, p.name, p.stack].filter(Boolean).join('|'),
    );

    // Step 4: Check for duplicate errors
    // Skip if this exact error was recently processed
    if (recent.has(key)) {
      return; // Early exit for duplicate errors
    }

    // Step 5: Add to recent set for future deduplication
    // This prevents the same error from being processed multiple times
    recent.add(key);

    // Step 6: Schedule memory cleanup
    // Remove hash after deduplication window to prevent memory leaks
    setTimeout(() => {
      recent.delete(key);
    }, dedupeMs);

    // Step 7: Output error information (non-blocking)
    // Use queueMicrotask to ensure console logging doesn't block the main thread
    // This is important for maintaining application performance
    queueMicrotask(() => {
      console.log('[Watcher] Error Processed:', p);
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
     */
  }
}
