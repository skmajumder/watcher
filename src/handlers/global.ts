/**
 * Watcher SDK - Global Error Handlers
 *
 * This file contains the global error handling setup for the Watcher SDK.
 * It provides functions to install and manage global error handlers that
 * capture unhandled errors and promise rejections across the entire application.
 *
 * **Current Status (Milestone 1.2):**
 * - ✅ Fully implemented global error handlers
 * - ✅ Browser-specific error capture (window.onerror, onunhandledrejection)
 * - ✅ Automatic error payload creation and processing
 * - ✅ Integration with the error processor
 * - ✅ Error normalization for consistent payload structure
 * - ✅ Handler chaining for compatibility with existing error handlers
 *
 * **Implemented Features:**
 * - **window.onerror**: Captures synchronous JavaScript runtime errors
 * - **window.onunhandledrejection**: Captures unhandled promise rejections
 * - **Error Payload Creation**: Converts browser errors to SDK format
 * - **Context Collection**: URL, route, user agent, and environment info
 * - **Safe Processing**: Error handlers never throw exceptions
 * - **Error Normalization**: Standardizes various error types
 * - **Handler Chaining**: Preserves existing error handlers
 *
 * **Error Capture Strategy:**
 * Global handlers act as a "safety net" to catch errors that weren't
 * handled by try/catch blocks or error boundaries. This ensures comprehensive
 * error coverage across the entire application while maintaining compatibility
 * with existing error handling code.
 *
 * **Handler Chaining:**
 * The SDK preserves any existing error handlers by calling them after
 * processing the error. This ensures that existing error handling logic
 * continues to work alongside the Watcher SDK.
 */

import { normalizeThrowable } from '../core/normalize';
import { processError } from '../core/processor';
import type { ErrorPayload, WatcherConfig } from '../types/types';
import { isBrowser, nowIso } from '../utils';

/**
 * Flag to track if global handlers have been installed
 *
 * This flag prevents multiple installations of global handlers
 * to avoid duplicate event listeners and potential memory leaks.
 *
 * **Why this is important:**
 * - Prevents duplicate error processing
 * - Avoids memory leaks from multiple listeners
 * - Ensures consistent error handling behavior
 * - Maintains clean event listener management
 *
 * @private
 * @type {boolean}
 */
let installed: boolean = false;

/**
 * Installs global error handlers for comprehensive error capture
 *
 * This function sets up global error monitoring by attaching event listeners
 * to capture unhandled errors and promise rejections. It's a critical component
 * for comprehensive error tracking across the entire application.
 *
 * **Installation Process:**
 * 1. **Duplicate Check**: Prevents multiple installations
 * 2. **Environment Validation**: Only installs in browser environments
 * 3. **Handler Setup**: Configures window.onerror and onunhandledrejection
 * 4. **Flag Management**: Sets installed flag to prevent re-installation
 * 5. **Handler Preservation**: Stores existing handlers for chaining
 *
 * **Handler Types:**
 *
 * **window.onerror (Synchronous Errors):**
 * - Captures general JavaScript runtime errors
 * - Provides error message, source file, line number, and column
 * - Handles syntax errors and other runtime exceptions
 * - Last-line defense for unhandled synchronous errors
 * - Preserves existing error handlers through chaining
 *
 * **window.onunhandledrejection (Asynchronous Errors):**
 * - Captures unhandled promise rejections
 * - Provides rejection reason and promise details
 * - Critical for async error tracking
 * - Handles Promise.reject() without .catch()
 * - Preserves existing rejection handlers through chaining
 *
 * **Error Processing Pipeline:**
 * 1. Capture error/rejection event
 * 2. Extract relevant information (message, stack, source)
 * 3. Normalize error to consistent format
 * 4. Create standardized ErrorPayload object
 * 5. Add contextual information (URL, route, user agent)
 * 6. Send to error processor for deduplication and sampling
 * 7. Chain to existing handlers if present
 * 8. Forward to transport layer for reporting
 *
 * @param {WatcherConfig} config - Configuration object for error handling
 *
 * @example
 * ```typescript
 * import { installGlobalHandlers } from 'watcher';
 *
 * // Install handlers with configuration
 * installGlobalHandlers({
 *   environment: 'production',
 *   sampleRate: 0.1,
 *   maxBreadcrumbs: 20
 * });
 *
 * **After installation, all unhandled errors will be automatically captured:**
 * - Runtime errors (TypeError, ReferenceError, etc.)
 * - Unhandled promise rejections
 * - Syntax errors (in some browsers)
 * - Network errors (in some cases)
 *
 * **Handler chaining ensures compatibility:**
 * - Existing error handlers continue to work
 * - No conflicts with other error monitoring libraries
 * - Gradual migration to Watcher SDK
 * ```
 *
 * **Browser Compatibility:**
 * - **window.onerror**: Supported in all modern browsers
 * - **window.onunhandledrejection**: Supported in all modern browsers
 * - Graceful degradation for older browsers
 * - Safe error handling with try-catch protection
 *
 * **Error Context Collection:**
 * Each captured error includes:
 * - Current URL and route information
 * - User agent string for browser identification
 * - Environment context from configuration
 * - Precise timestamp of occurrence
 * - Source file and line/column position
 *
 * **Error Normalization:**
 * The SDK normalizes various error types into consistent payloads:
 * - Native Error objects (with name, message, stack)
 * - String values (converted to message)
 * - Object-like errors (extracted properties)
 * - Unknown values (string representation)
 *
 * @since 0.1.0
 * @version Milestone 1.2 (fully implemented)
 */
export function installGlobalHandlers(config: WatcherConfig): void {
  // Prevent multiple installations to avoid duplicate handlers
  if (installed) return;

  // Mark handlers as installed to prevent re-installation
  installed = true;

  // Only install handlers in browser environments
  // Server-side error handling is handled separately
  if (!isBrowser()) return;

  // Store existing handlers for chaining
  // This ensures compatibility with existing error handling code
  const prevOnError = window.onerror;
  const prevOnRejection = window.onunhandledrejection;

  /**
   * Global error handler for synchronous JavaScript errors
   *
   * This handler catches runtime errors that weren't handled by try/catch
   * blocks or error boundaries. It's the last line of defense for
   * unhandled synchronous errors.
   *
   * **What it captures:**
   * - TypeError, ReferenceError, SyntaxError, etc.
   * - Runtime exceptions from JavaScript execution
   * - Errors in event handlers and callbacks
   * - Errors in imported modules and scripts
   *
   * **Parameters:**
   * - message: Error message string or Event object
   * - source: Source file URL (optional)
   * - lineno: Line number where error occurred (optional)
   * - colno: Column number where error occurred (optional)
   * - error: Error object with stack trace (optional)
   *
   * **Handler Chaining:**
   * After processing the error, the SDK calls any existing error
   * handlers to maintain compatibility with existing code.
   */
  window.onerror = function (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): boolean {
    try {
      // Get common fields for all error types
      const base = baseFields(config);
      
      // Normalize the error to consistent format
      // This handles various error types (Error, string, object, etc.)
      const norm = normalizeThrowable(error ?? message);

      // Create standardized error payload from browser error information
      const payload: ErrorPayload = {
        type: 'runtime_error',
        name: norm.name, // Error constructor name
        message: norm.message ?? String(message), // Convert to string for consistency
        stack: norm.stack, // Full stack trace if available
        source, // Source file URL
        position:
          lineno != null && colno != null
            ? `${lineno}:${colno}` // Precise position information
            : undefined,
        ...base, // Include common fields (environment, timestamp, url, route, userAgent)
      };

      // Send to error processor for deduplication and sampling
      processError(payload);
    } catch (handlerError) {
      /**
       * Error handler should never throw
       *
       * If the error handler itself fails, we silently catch it
       * to prevent the application from crashing. This is critical
       * for maintaining application stability.
       */
    }

    // Chain to existing error handler if present
    // This preserves compatibility with existing error handling code
    if (typeof prevOnError === 'function') {
      try {
        return prevOnError.apply(this, arguments as any);
      } catch {
        // Silently handle errors in existing handlers
      }
    }

    // Return false to allow browser's default error handling
    // This ensures errors still appear in console for debugging
    return false;
  };

  /**
   * Global handler for unhandled promise rejections
   *
   * This handler catches promise rejections that weren't handled by
   * .catch() methods or try/catch blocks with await. It's essential
   * for tracking asynchronous errors.
   *
   * **What it captures:**
   * - Promise.reject() calls without .catch()
   * - Async function errors without try/catch
   * - Promise chain failures
   * - Network request rejections
   * - Timer and event promise rejections
   *
   * **Event Structure:**
   * The event contains a 'reason' property that can be:
   * - An Error object with stack trace
   * - A string message
   * - Any other value passed to Promise.reject()
   *
   * **Handler Chaining:**
   * After processing the rejection, the SDK calls any existing
   * rejection handlers to maintain compatibility.
   */
  window.onunhandledrejection = function (event: PromiseRejectionEvent): void {
    try {
      // Get common fields for all error types
      const base = baseFields(config);
      
      // Extract rejection reason from the event
      // Handle both standard and non-standard event structures
      const reason: unknown = (event as PromiseRejectionEvent)?.reason ?? event;
      
      // Normalize the rejection reason to consistent format
      const norm = normalizeThrowable(reason);

      // Create standardized error payload
      const payload: ErrorPayload = {
        type: 'unhandled_promise',
        name: norm.name, // Error constructor name if available
        message: norm.message,
        stack: norm.stack, // Stack trace if available
        ...base, // Include common fields (environment, timestamp, url, route, userAgent)
      };

      // Send to error processor for deduplication and sampling
      processError(payload);
    } catch (handlerError) {
      /**
       * Promise rejection handler should never throw
       *
       * If the promise rejection handler fails, we silently catch it
       * to prevent the application from crashing. This maintains
       * the stability of the error handling system.
       */
    }

    // Chain to existing rejection handler if present
    // This preserves compatibility with existing rejection handling code
    if (typeof prevOnRejection === 'function') {
      try {
        // @ts-expect-error preserve original signature
        prevOnRejection.apply(this, arguments as any);
      } catch {
        // Silently handle errors in existing handlers
      }
    }
  };
}

/**
 * Generates common fields for all error payloads
 *
 * This helper function creates the standard fields that are common
 * to all error types, ensuring consistency across different error
 * sources and reducing code duplication.
 *
 * **Generated Fields:**
 * - environment: Current environment from configuration
 * - timestamp: ISO timestamp of error occurrence
 * - url: Current page URL (browser only)
 * - route: Current route/path (browser only)
 * - userAgent: Browser user agent string (browser only)
 *
 * **Environment Handling:**
 * The function automatically detects the runtime environment and
 * provides appropriate values for browser vs server contexts.
 *
 * @param {WatcherConfig} config - The Watcher configuration object
 * @returns {Object} Common fields object for error payloads
 *
 * @private
 */
function baseFields(config: WatcherConfig) {
  const now = nowIso();
  
  // Handle server-side environments (no window object)
  if (typeof window === 'undefined') {
    return {
      environment: config.environment,
      timestamp: now,
      url: undefined,
      route: undefined,
      userAgent: undefined,
    };
  }
  
  // Handle browser environments
  return {
    environment: config.environment,
    timestamp: now,
    url: window.location.href,
    route: window.location.pathname,
    userAgent: navigator.userAgent,
  };
}
