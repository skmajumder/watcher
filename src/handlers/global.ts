/**
 * Watcher SDK - Global Error Handlers
 *
 * This file contains the global error handling setup for the Watcher SDK.
 * It provides functions to install and manage global error handlers that
 * capture unhandled errors and promise rejections across the entire application.
 *
 * **Current Status (Milestone 1.2):**
 * - Placeholder structure for global error handlers
 * - Will be implemented in Step 1.4
 *
 * **Future Implementation (Step 1.4):**
 * - window.onerror for general JavaScript errors
 * - window.addEventListener('unhandledrejection') for promise rejections
 * - Error categorization and processing
 * - Breadcrumb tracking for error context
 * - Integration with the error processor
 */

import { processError } from '../core/processor';
import { ErrorPayload, WatcherConfig } from '../types/types';
import { isBrowser, nowIso } from '../utils';

/**
 * Flag to track if global handlers have been installed
 *
 * This flag prevents multiple installations of global handlers
 * to avoid duplicate event listeners and potential memory leaks
 */
let installed: boolean = false;

/**
 * Installs global error handlers for the application
 *
 * This function sets up global error monitoring by attaching event listeners
 * to capture unhandled errors and promise rejections. It's a critical component
 * for comprehensive error tracking across the entire application.
 *
 * **Handler Types to be Implemented:**
 *
 * **window.onerror:**
 * - Captures general JavaScript runtime errors
 * - Provides error message, source file, and line number
 * - Handles syntax errors and other runtime exceptions
 *
 * **unhandledrejection:**
 * - Captures unhandled promise rejections
 * - Provides rejection reason and promise details
 * - Critical for async error tracking
 *
 * **Error Processing Pipeline:**
 * 1. Capture error/rejection event
 * 2. Extract relevant information (message, stack, source)
 * 3. Create ErrorPayload object
 * 4. Send to error processor for deduplication
 * 5. Forward to transport layer for reporting
 *
 * @param {WatcherConfig} _cfg - Configuration object for error handling
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
 * // After installation, all unhandled errors will be automatically captured
 * // and processed by the Watcher SDK
 * ```
 *
 * **Current Implementation:**
 * - Placeholder function awaiting Step 1.4 implementation
 * - Will integrate with core error processor
 * - Will support configuration-based error handling
 *
 * @since 0.1.0
 * @version Milestone 1.2 (placeholder)
 */

export function installGlobalHandlers(_config: WatcherConfig) {
  // If global handlers have already been installed, exit early
  if (installed) return;

  // Set the installed flag to true to prevent multiple installations
  installed = true;

  // If not in browser, exit early. Browser only.
  if (!isBrowser) return;

  // uncaught synchronous exceptions.
  // it is net for synchronous errors.
  // window.onerror is the last-line defense to catch runtime errors that didn’t handle with try/catch or error boundaries,
  // so we can report them to our SDK
  window.onerror = (message, source, lineno, colno, error) => {
    try {
      const payload: ErrorPayload = {
        type: 'runtime_error',
        name: error?.name,
        message: String(message),
        stack: error?.stack,
        source,
        position:
          lineno !== null && colno !== null
            ? `line: ${lineno}, col: ${colno}`
            : undefined,
        url: window.location.href,
        route: window.location.pathname,
        userAgent: navigator?.userAgent,
        environment: _config.environment,
        timestamp: nowIso(),
      };

      processError(payload);
    } catch {
      /* swallow */
    }

    return false; // let browser also log the error in console
  };

  // unhandled promise rejections.
  // window.onunhandledrejection is the net for asynchronous errors (unhandled Promise rejections).
  // Fires when a Promise rejects and no .catch() (or try/catch with await) handles it.
  // The handler receives a PromiseRejectionEvent object.
  window.onunhandledrejection = (event) => {
    try {
      const reason: any = (event as any).reason;
      const payload: ErrorPayload = {
        type: 'unhandled_promise',
        name: reason?.name,
        message:
          reason?.message ?? (typeof reason === 'string' ? reason : undefined),
        stack: reason?.stack,
        url: window.location.href,
        route: window.location.pathname,
        userAgent: navigator?.userAgent,
        environment: _config.environment,
        timestamp: nowIso(),
      };

      processError(payload);
    } catch {
      /* swallow */
    }
  };
}
