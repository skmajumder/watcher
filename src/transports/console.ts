/**
 * Watcher SDK - Console Transport
 *
 * This file contains the console transport implementation for the Watcher SDK.
 * The console transport provides a simple way to output error information
 * to the browser console or Node.js console for debugging and development.
 *
 * **Transport Layer:**
 * Transports are responsible for delivering error data to various destinations.
 * The console transport is the simplest implementation, ideal for:
 * - Development and debugging
 * - Testing error processing
 * - Fallback error reporting
 * - Local development environments
 *
 * **Current Implementation (Milestone 1.2):**
 * - Basic console.error output
 * - ErrorPayload formatting
 * - Development-friendly error display
 *
 * **Future Enhancements (Milestone 1.4+):**
 * - Structured console output
 * - Error grouping and categorization
 * - Performance metrics display
 * - Breadcrumb visualization
 * - Environment-specific formatting
 */

import { ErrorPayload } from '../types/types';

/**
 * Console transport function for error reporting
 * 
 * This function takes an ErrorPayload and outputs it to the console
 * in a readable format. It's designed to be simple and effective
 * for development and debugging purposes.
 * 
 * **Output Format:**
 * The function prefixes all output with '[Watcher]:' to clearly
 * identify Watcher SDK error reports in the console.
 * 
 * **Use Cases:**
 * - Development environment error tracking
 * - Testing error processing pipeline
 * - Local debugging and troubleshooting
 * - Fallback when other transports fail
 * 
 * **Integration:**
 * This transport can be used as:
 * - Primary transport for development
 * - Fallback transport for production
 * - Testing transport for error processing
 * - Debug transport for troubleshooting
 * 
 * @param {ErrorPayload} p - The error payload to transport
 * 
 * @example
 * ```typescript
 * import { consoleTransport } from 'watcher';
 * 
 * // Transport an error to console
 * consoleTransport({
 *   type: 'runtime_error',
 *   name: 'TypeError',
 *   message: 'Cannot read property of undefined',
 *   stack: 'Error: Cannot read property...',
 *   timestamp: new Date().toISOString(),
 *   environment: 'development'
 * });
 * 
 * // Console output:
 * // [Watcher]: { type: 'runtime_error', name: 'TypeError', ... }
 * ```
 * 
 * **Console Output Benefits:**
 * - Immediate visibility of errors
 * - No network dependencies
 * - Easy debugging and inspection
 * - Consistent with development workflow
 * - No external service requirements
 * 
 * @since 0.1.0
 * @version Milestone 1.2
 */
export const consoleTransport = (p: ErrorPayload) => {
  // Output error payload to console with Watcher prefix
  // This provides immediate visibility for development and debugging
  console.error('[Watcher]:', p);
};
