/**
 * Watcher SDK - Main Entry Point
 *
 * This is the primary entry point for the Watcher SDK, a high-performance
 * error tracking solution designed specifically for Next.js and React applications.
 *
 * The SDK automatically detects the runtime environment (browser vs server)
 * and adapts its error handling strategies accordingly. It provides:
 * - Real-time error monitoring and categorization
 * - Automatic breadcrumb tracking for debugging context
 * - Environment-aware error handling
 * - Configurable sampling and rate limiting
 * - Multiple transport backends for data transmission
 *
 * **Architecture Overview:**
 * 1. Configuration Management: User config merged with defaults and environment
 * 2. Environment Detection: Automatic browser/server detection
 * 3. Global Handlers: Error capture setup for the detected environment
 * 4. Transport Layer: Error reporting to various destinations
 * 5. Error Processing: Deduplication and categorization
 *
 * **Current Implementation Status (Milestone 1.2):**
 * - ✅ Configuration management with environment detection
 * - ✅ Global error handler installation
 * - ✅ Error processing pipeline
 * - ✅ Console transport for development
 * - 🔄 Advanced transport layers (planned for Milestone 1.4)
 * - 🔄 Breadcrumb tracking (planned for future milestones)
 *
 * @example
 * ```typescript
 * // Basic initialization
 * import { initWatcher } from 'watcher';
 * initWatcher();
 *
 * // Advanced configuration
 * import { initWatcher } from 'watcher';
 * initWatcher({
 *   environment: 'production',
 *   sampleRate: 0.1,        // Collect 10% of errors
 *   maxBreadcrumbs: 50      // Store up to 50 breadcrumbs per error
 * });
 * ```
 */

import { defaultConfig } from './config/defaults';
import { setConfig } from './core/config';
import { installGlobalHandlers } from './handlers/global';
import type { WatcherConfig, WatcherEnv } from './types/types';
import { isNode } from './utils';

/**
 * Initialization state flag
 *
 * This boolean flag prevents multiple initializations of the SDK.
 * Once set to true, subsequent calls to initWatcher() will return early.
 * This ensures the SDK is only initialized once per application lifecycle.
 *
 * **Why Single Initialization:**
 * - Prevents duplicate error handler installation
 * - Avoids configuration conflicts
 * - Maintains consistent SDK state
 * - Prevents memory leaks from multiple setups
 *
 * @private
 * @type {boolean}
 */
let didInit: boolean = false;

/**
 * Initializes the Watcher SDK for comprehensive error tracking
 *
 * This function sets up the complete error monitoring system based on the current
 * runtime environment. It's the main entry point that developers use to start
 * error tracking in their applications.
 *
 * **Initialization Process:**
 * 1. **Duplicate Check**: Prevents multiple initializations
 * 2. **Configuration Merge**: Combines user config with defaults and environment
 * 3. **Environment Detection**: Automatically detects browser vs server
 * 4. **Configuration Storage**: Stores merged config in global singleton
 * 5. **Handler Installation**: Sets up environment-specific error handlers
 * 6. **Initialization Complete**: Logs successful initialization
 *
 * **Configuration Priority (highest to lowest):**
 * 1. User-provided configuration
 * 2. Environment variables (NODE_ENV)
 * 3. Default configuration values
 * 4. Fallback values (e.g., 'production' environment)
 *
 * **Environment Detection Logic:**
 * - **Browser**: No process object available, defaults to 'production'
 * - **Server**: process.env.NODE_ENV available, uses NODE_ENV value
 * - **Fallback**: Defaults to 'production' for safety and consistency
 *
 * **Safety Considerations:**
 * - Always defaults to 'production' in browser environments
 * - Validates environment values against allowed types
 * - Provides sensible defaults for all configuration options
 * - Never throws errors during initialization
 *
 * @param {WatcherConfig} userConfig - Optional user configuration object
 *
 * @example
 * ```typescript
 * // Development environment with full error collection
 * initWatcher({
 *   environment: 'development',
 *   sampleRate: 1.0,           // Collect all errors
 *   maxBreadcrumbs: 100        // Store many breadcrumbs for debugging
 * });
 *
 * // Production environment with sampling for performance
 * initWatcher({
 *   environment: 'production',
 *   sampleRate: 0.1,           // Collect 10% of errors
 *   maxBreadcrumbs: 20         // Minimal breadcrumbs to save memory
 * });
 *
 * // Test environment with minimal overhead
 * initWatcher({
 *   environment: 'test',
 *   sampleRate: 0.01,          // Collect 1% of errors
 *   maxBreadcrumbs: 5          // Very few breadcrumbs
 * });
 *
 * // Automatic environment detection (recommended)
 * initWatcher(); // Uses NODE_ENV or defaults to 'production'
 *
 * // Partial configuration (fills in missing values)
 * initWatcher({
 *   environment: 'staging'
 *   // sampleRate and maxBreadcrumbs use defaults
 * });
 * ```
 *
 * **Current Implementation (Milestone 1.2):**
 * - ✅ Basic initialization and configuration management
 * - ✅ Environment detection and configuration merging
 * - ✅ Global handler installation (fully implemented)
 * - ✅ Configuration storage in singleton
 * - ✅ Initialization state management
 * - ✅ Error processing pipeline integration
 *
 * **Future Implementation (Milestone 1.4+):**
 * - Advanced transport layer initialization
 * - Breadcrumb tracking setup
 * - Performance monitoring hooks
 * - Advanced configuration validation
 * - Plugin system for extensibility
 * - Advanced environment detection strategies
 *
 * **Error Handling:**
 * The initialization process is designed to be robust and never fail:
 * - Graceful fallbacks for missing configuration
 * - Safe environment detection
 * - Non-blocking error handler installation
 * - Comprehensive logging for debugging
 *
 * @throws {never} This function is designed to never throw errors
 * @since 0.1.0
 * @version Milestone 1.2
 */
export function initWatcher(userConfig: WatcherConfig = {} as WatcherConfig) {
  // Prevent multiple initializations to maintain SDK consistency
  if (didInit) return;
  didInit = true;

  // Merge user configuration with defaults and environment detection
  const cfg: WatcherConfig = {
    // Environment: user config > NODE_ENV > fallback to 'production'
    // Always defaults to 'production' in browser for safety
    environment:
      userConfig.environment ??
      (isNode() ? (process.env.NODE_ENV as WatcherEnv) : 'production'),

    // Sampling rate: user config > default (1.0 = 100%)
    // Higher values = more errors collected, lower values = better performance
    sampleRate: userConfig.sampleRate ?? defaultConfig.sampleRate,

    // Max breadcrumbs: user config > default (20)
    // Breadcrumbs provide context but consume memory
    maxBreadcrumbs: userConfig.maxBreadcrumbs ?? defaultConfig.maxBreadcrumbs,
  };

  // Store merged configuration in global singleton
  // This makes configuration available to all SDK components
  setConfig(cfg);

  // Install environment-specific error handlers
  // Currently fully implemented with error normalization and handler chaining
  installGlobalHandlers(cfg);

  // Log successful initialization with configuration summary
  console.log('[watcher] initialized with config:', {
    environment: cfg.environment,
    sampleRate: cfg.sampleRate,
    maxBreadcrumbs: cfg.maxBreadcrumbs,
  });
}

/**
 * Re-exports all types from the types module
 *
 * This allows users to import types directly from the main package:
 * ```typescript
 * import { WatcherConfig, ErrorPayload, WatcherEnv } from 'watcher';
 * ```
 *
 * **Available Types:**
 * - **WatcherConfig**: SDK configuration interface
 * - **ErrorPayload**: Error data structure for processing
 * - **WatcherEnv**: Environment type definitions
 * - **ErrorKind**: Error category types
 * - **WatcherEnv**: Environment enumeration
 *
 * **Type Usage Examples:**
 * ```typescript
 * // Configuration typing
 * const config: WatcherConfig = {
 *   environment: 'production',
 *   sampleRate: 0.1
 * };
 *
 * // Error payload typing
 * const error: ErrorPayload = {
 *   type: 'runtime_error',
 *   message: 'Something went wrong',
 *   timestamp: new Date().toISOString()
 * };
 *
 * // Environment typing
 * const env: WatcherEnv = 'development';
 * ```
 *
 * **Benefits:**
 * - Full TypeScript support for all SDK types
 * - IntelliSense and type checking in IDEs
 * - Compile-time error detection
 * - Better developer experience
 */
export * from './types/types';
export { WatcherErrorBoundary } from './handlers/reactBoundary';
export { withWatcherBoundary } from './handlers/withBoundary';
