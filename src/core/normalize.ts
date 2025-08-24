/**
 * Watcher SDK - Error Normalization
 *
 * This file contains the error normalization logic for the Watcher SDK.
 * It provides functions to standardize various types of throwable values
 * into a consistent format that can be processed by the error handling system.
 *
 * **Purpose:**
 * JavaScript allows throwing any value (Error objects, strings, objects, etc.).
 * This module normalizes all these different types into a consistent structure
 * with name, message, and stack properties for uniform error processing.
 *
 * **Supported Input Types:**
 * - Native Error objects (with name, message, stack)
 * - String values (converted to message-only)
 * - Object-like errors (extracted properties)
 * - Unknown values (converted to string representation)
 *
 * **Normalization Strategy:**
 * The function uses a type-aware approach to extract meaningful information
 * from different throwable types while maintaining backward compatibility
 * and providing fallbacks for edge cases.
 */

import { safeJson } from '../utils';

/**
 * Normalizes any throwable value into a standardized error structure
 *
 * This function takes any value that could be thrown in JavaScript and
 * converts it into a consistent format with name, message, and stack
 * properties. This ensures uniform error processing regardless of how
 * the error was originally thrown.
 *
 * **Normalization Process:**
 * 1. **Native Error Objects**: Direct property extraction
 * 2. **String Values**: Convert to message-only structure
 * 3. **Object-like Errors**: Extract name, message, stack if available
 * 4. **Unknown Values**: Convert to string representation
 *
 * **Input Type Handling:**
 *
 * **Error Objects (instanceof Error):**
 * - name: Error constructor name (e.g., "TypeError", "ReferenceError")
 * - message: Human-readable error description
 * - stack: Full stack trace for debugging
 *
 * **String Values:**
 * - name: undefined (strings don't have constructor names)
 * - message: The string value itself
 * - stack: undefined (strings don't have stack traces)
 *
 * **Object-like Errors:**
 * - name: String value of name property if available
 * - message: String value of message property, or JSON representation
 * - stack: String value of stack property if available
 *
 * **Unknown Values:**
 * - name: undefined
 * - message: String representation of the value
 * - stack: undefined
 *
 * @param {unknown} err - Any value that could be thrown (Error, string, object, etc.)
 * @returns {Object} Normalized error structure with name, message, and stack properties
 *
 * @example
 * ```typescript
 * import { normalizeThrowable } from 'watcher';
 *
 * // Native Error object
 * const error = new TypeError('Invalid type');
 * const normalized = normalizeThrowable(error);
 * // Result: { name: 'TypeError', message: 'Invalid type', stack: '...' }
 *
 * // String value
 * const stringError = 'Something went wrong';
 * const normalized = normalizeThrowable(stringError);
 * // Result: { message: 'Something went wrong' }
 *
 * // Object-like error
 * const objError = { name: 'CustomError', message: 'Custom message' };
 * const normalized = normalizeThrowable(objError);
 * // Result: { name: 'CustomError', message: 'Custom message' }
 *
 * // Unknown value
 * const unknownError = 42;
 * const normalized = normalizeThrowable(unknownError);
 * // Result: { message: '42' }
 * ```
 *
 * **Use Cases:**
 * - Standardizing errors from different sources (libraries, custom code)
 * - Ensuring consistent error payload structure
 * - Handling edge cases in error reporting
 * - Providing fallbacks for malformed error objects
 *
 * **Error Handling:**
 * The function is designed to never throw errors itself, even when
 * processing malformed input. It provides sensible defaults and
 * fallbacks for all edge cases.
 *
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function normalizeThrowable(err: unknown): {
  name?: string;
  message?: string;
  stack?: string;
} {
  // Case 1: Native Error objects (most common)
  // These have the standard Error interface with name, message, and stack
  if (err instanceof Error) {
    return { 
      name: err.name, 
      message: err.message, 
      stack: err.stack 
    };
  }

  // Case 2: String values thrown directly
  // Convert to message-only structure since strings don't have other properties
  if (typeof err === 'string') {
    return { message: err };
  }

  // Case 3: Object-like errors from libraries or custom code
  // Extract available properties while handling type safety
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;

    // Extract name property if it's a string
    const name = typeof anyErr.name === 'string' ? anyErr.name : undefined;
    
    // Extract message property, with fallback to JSON representation
    const message = typeof anyErr.message === 'string'
      ? anyErr.message
      : safeJson(anyErr.message);
    
    // Extract stack property if it's a string
    const stack = typeof anyErr.stack === 'string' ? anyErr.stack : undefined;

    return { name, message, stack };
  }

  // Case 4: Everything else (numbers, booleans, null, undefined, etc.)
  // Convert to string representation for consistent handling
  return { message: String(err) };
}
