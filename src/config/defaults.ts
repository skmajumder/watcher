/**
 * Watcher SDK - Default Configuration
 *
 * This file contains the default configuration values for the Watcher SDK.
 * These defaults provide sensible starting points for common use cases.
 */

import type { WatcherConfig } from '../types/types';

/**
 * Default configuration values for the Watcher SDK
 *
 * This configuration object provides sensible defaults for:
 * - sampleRate: Controls how many errors are collected (useful for production)
 * - maxBreadcrumbs: Limits memory usage from breadcrumb storage
 *
 * Note: The 'environment' field is required and must be provided by the user
 * as it's context-dependent and cannot have a meaningful default.
 */
export const defaultConfig: Required<
  Pick<WatcherConfig, 'sampleRate' | 'maxBreadcrumbs'>
> = {
  /**
   * Default sampling rate: 1.0 (100% of errors collected)
   * In production, you might want to reduce this to 0.1 (10%) to reduce data volume
   */
  sampleRate: 1,
  /**
   * Default maximum breadcrumbs: 20 per error
   * Breadcrumbs provide user action context but consume memory
   * Adjust based on your application's needs and memory constraints
   */
  maxBreadcrumbs: 20,
};
