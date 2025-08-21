/**
 * Watcher SDK - Type Definitions
 *
 * This file contains all the core type definitions for the Watcher SDK,
 * which is a high-performance error tracking SDK for Next.js and React applications.
 */

/**
 * Environment types supported by the Watcher SDK
 * Used to categorize errors and configure behavior based on deployment environment
 */
export type WatcherEnv = 'development' | 'production' | 'test' | 'staging';

/**
 * Configuration interface for the Watcher SDK
 * Contains all configurable options for error tracking and SDK behavior
 */
export interface WatcherConfig {
  /** The environment where the SDK is running */
  environment: WatcherEnv;
  /**
   * Sampling rate for error collection (0.0 to 1.0)
   * 0.0 = no errors collected, 1.0 = all errors collected
   * Useful for production environments to reduce data volume
   */
  sampleRate?: number;
  /**
   * Maximum number of breadcrumbs to store per error
   * Breadcrumbs provide context about user actions leading to errors
   */
  maxBreadcrumbs?: number;
}

/**
 * Categories of errors that the Watcher SDK can track
 * Each type represents a different source or nature of errors
 */
export type ErrorKind =
  | 'runtime_error' // General JavaScript runtime errors
  | 'unhandled_promise' // Unhandled promise rejections
  | 'render_error' // React rendering errors
  | 'network_error'; // Network request failures

/**
 * Complete error information payload
 * Contains all relevant data about an error for analysis and debugging
 */
export interface ErrorPayload {
  /** The type/category of the error */
  type: ErrorKind;
  /** The error name/constructor (e.g., "TypeError", "ReferenceError") */
  name?: string;
  /** Human-readable error message */
  message?: string;
  /** Full error stack trace for debugging */
  stack?: string;
  /** Source file or component where error occurred */
  source?: string;
  /** Line and column position in the source file (format: "line:col") */
  position?: string;
  /** Current URL when error occurred */
  url?: string;
  /** Current route/path when error occurred */
  route?: string;
  /** User agent string for browser identification */
  userAgent?: string;
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** Environment where error occurred */
  environment?: WatcherEnv;
  /** Unique session identifier for user tracking */
  sessionId?: string;
}
