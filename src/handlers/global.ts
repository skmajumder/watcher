/**
 * Watcher SDK - Global Error Handlers
 *
 * This file contains the global error handling setup for the Watcher SDK.
 * It provides functions to install and manage global error handlers that
 * capture unhandled errors and promise rejections across the entire application.
 *
 * **Current Status (Milestone 1.2):**
 * - Fully implemented global error handlers
 * - Browser-specific error capture (window.onerror, onunhandledrejection)
 * - Automatic error payload creation and processing
 * - Integration with the error processor
 *
 * **Implemented Features:**
 * - **window.onerror**: Captures synchronous JavaScript runtime errors
 * - **window.onunhandledrejection**: Captures unhandled promise rejections
 * - **Error Payload Creation**: Converts browser errors to SDK format
 * - **Context Collection**: URL, route, user agent, and environment info
 * - **Safe Processing**: Error handlers never throw exceptions
 *
 * **Error Capture Strategy:**
 * Global handlers act as a "safety net" to catch errors that weren't
 * handled by try/catch blocks or error boundaries. This ensures comprehensive
 * error coverage across the entire application.
 */

import { processError } from '../core/processor';
import { ErrorPayload, WatcherConfig } from '../types/types';
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
 *
 * **Handler Types:**
 *
 * **window.onerror (Synchronous Errors):**
 * - Captures general JavaScript runtime errors
 * - Provides error message, source file, line number, and column
 * - Handles syntax errors and other runtime exceptions
 * - Last-line defense for unhandled synchronous errors
 *
 * **window.onunhandledrejection (Asynchronous Errors):**
 * - Captures unhandled promise rejections
 * - Provides rejection reason and promise details
 * - Critical for async error tracking
 * - Handles Promise.reject() without .catch()
 *
 * **Error Processing Pipeline:**
 * 1. Capture error/rejection event
 * 2. Extract relevant information (message, stack, source)
 * 3. Create standardized ErrorPayload object
 * 4. Add contextual information (URL, route, user agent)
 * 5. Send to error processor for deduplication and sampling
 * 6. Forward to transport layer for reporting
 *
 * @param {WatcherConfig} _config - Configuration object for error handling
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
 * @since 0.1.0
 * @version Milestone 1.2 (fully implemented)
 */
export function installGlobalHandlers(_config: WatcherConfig): void {
  // Prevent multiple installations to avoid duplicate handlers
  if (installed) return;

  // Mark handlers as installed to prevent re-installation
  installed = true;

  // Only install handlers in browser environments
  // Server-side error handling is handled separately
  if (!isBrowser()) return;

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
   * - message: Error message string
   * - source: Source file URL
   * - lineno: Line number where error occurred
   * - colno: Column number where error occurred
   * - error: Error object with stack trace
   */
  window.onerror = (message, source, lineno, colno, error): boolean => {
    try {
      // Create standardized error payload from browser error information
      const payload: ErrorPayload = {
        type: 'runtime_error',
        name: error?.name, // Error constructor name
        message: String(message), // Convert to string for consistency
        stack: error?.stack, // Full stack trace if available
        source, // Source file URL
        position:
          lineno !== null && colno !== null
            ? `line: ${lineno}, col: ${colno}` // Precise position information
            : undefined,
        url: window.location.href, // Current page URL
        route: window.location.pathname, // Current route/path
        userAgent: navigator?.userAgent, // Browser identification
        environment: _config.environment, // Environment from config
        timestamp: nowIso(), // ISO timestamp
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
   - Async function errors without try/catch
   * - Promise chain failures
   * - Network request rejections
   * - Timer and event promise rejections
   *
   * **Event Structure:**
   * The event contains a 'reason' property that can be:
   * - An Error object with stack trace
   * - A string message
   * - Any other value passed to Promise.reject()
   */
  window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
    try {
      // Extract rejection reason from the event
      const reason: any = event.reason;

      // Create standardized error payload
      const payload: ErrorPayload = {
        type: 'unhandled_promise',
        name: reason?.name, // Error constructor name if available
        message:
          reason?.message ?? (typeof reason === 'string' ? reason : undefined),
        stack: reason?.stack, // Stack trace if available
        url: window.location.href, // Current page URL
        route: window.location.pathname, // Current route/path
        userAgent: navigator?.userAgent, // Browser identification
        environment: _config.environment, // Environment from config
        timestamp: nowIso(), // ISO timestamp
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
  };
}
