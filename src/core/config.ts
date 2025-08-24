/**
 * Watcher SDK - Core Configuration Management
 *
 * This file contains the configuration management system for the Watcher SDK.
 * It implements a singleton pattern to store and retrieve the global configuration
 * object that controls SDK behavior across the entire application.
 *
 * The configuration system provides:
 * - Centralized configuration storage
 * - Type-safe configuration access
 * - Validation of configuration objects
 * - Error handling for invalid configurations
 * - Singleton pattern for global access
 */

import type { WatcherConfig } from '../types/types';

/**
 * Singleton configuration storage
 *
 * This variable holds the global configuration object for the entire SDK.
 * It's implemented as a singleton to ensure consistent configuration
 * across all SDK components and prevent configuration conflicts.
 *
 * @private
 * @type {WatcherConfig | null}
 */
let _config: WatcherConfig | null = null;

/**
 * Sets the global configuration for the Watcher SDK
 *
 * This function validates and stores the configuration object that will be used
 * throughout the SDK. It performs basic validation to ensure the configuration
 * is valid before storing it.
 *
 * **Configuration Validation:**
 * - Ensures the configuration object exists
 * - Verifies it's a valid object type
 * - Logs errors for invalid configurations
 *
 * **Usage:**
 * This function should be called once during SDK initialization, typically
 * in the initWatcher() function. The configuration will then be available
 * to all SDK components through getConfig().
 *
 * @param {WatcherConfig} c - The configuration object to set
 *
 * @example
 * ```typescript
 * import { setConfig } from 'watcher';
 *
 * // Set configuration during SDK initialization
 * setConfig({
 *   environment: 'production',
 *   sampleRate: 0.1,
 *   maxBreadcrumbs: 50
 * });
 *
 * // Invalid configuration (will log error and return early)
 * setConfig(null);
 * setConfig('invalid');
 * ```
 *
 * @throws {Error} Logs error to console for invalid configurations
 * @since 0.1.0
 */
export const setConfig = (c: WatcherConfig): void => {
  // Validate configuration object
  if (!c || typeof c !== 'object') {
    console.error('Invalid configuration object provided to setConfig.');
    return;
  }

  // Store the validated configuration
  _config = c;
};

/**
 * Retrieves the current global configuration
 *
 * This function returns the currently stored configuration object. If no
 * configuration has been set, it logs a warning and returns an empty
 * configuration object to prevent runtime errors.
 *
 * **Important Notes:**
 * - Always call setConfig() before getConfig() to ensure proper configuration
 * - The returned object is the same reference as stored internally
 * - Modifying the returned object will affect the global configuration
 *
 * @returns {WatcherConfig} The current configuration object
 *
 * @example
 * ```typescript
 * import { getConfig, setConfig } from 'watcher';
 *
 * // Set configuration first
 * setConfig({
 *   environment: 'development',
 *   sampleRate: 1.0,
 *   maxBreadcrumbs: 100
 * });
 *
 * // Retrieve configuration
 * const config = getConfig();
 * console.log('Environment:', config.environment);
 * console.log('Sample Rate:', config.sampleRate);
 *
 * // Without setting config first (will log warning)
 * const emptyConfig = getConfig(); // Returns {} as WatcherConfig
 * ```
 *
 * @throws {Error} Logs warning to console if no configuration is set
 * @since 0.1.0
 */
export const getConfig = (): WatcherConfig => {
  if (_config === null) {
    console.error(
      'Configuration has not been set. Returning empty config object.',
    );
    return {} as WatcherConfig;
  }
  return _config;
};
