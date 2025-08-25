/**
 * Watcher SDK - React Error Boundary Component
 *
 * This file contains the WatcherErrorBoundary component that provides
 * React error boundary functionality with automatic error reporting
 * to the Watcher SDK. It catches React rendering errors and provides
 * fallback UI and error recovery mechanisms.
 *
 * **Purpose:**
 * React Error Boundaries are React components that:
 * - Catch JavaScript errors anywhere in their child component tree
 * - Log those errors to the Watcher SDK for monitoring
 * - Display fallback UI instead of the crashed component tree
 * - Provide error recovery mechanisms for better user experience
 *
 * **Key Features:**
 * - **Automatic Error Capture**: Catches React rendering errors
 * - **Error Reporting**: Integrates with Watcher SDK for error tracking
 * - **Fallback UI**: Configurable error display and recovery
 * - **Error Recovery**: Reset functionality to recover from errors
 * - **Context Preservation**: Maintains error context and stack traces
 * - **Non-blocking**: Never throws errors that could crash the app
 *
 * **Error Boundary Behavior:**
 * - Only catches errors in the component tree below them
 * - Does not catch errors in event handlers, async code, or SSR
 * - Provides a way to gracefully handle component crashes
 * - Enables error monitoring and debugging in production
 */

import * as React from 'react';
import type { ErrorPayload, WatcherConfig } from '../types/types';
import { processError } from '../core/processor';
import { nowIso } from '../utils';

/**
 * Type definition for fallback UI rendering
 *
 * The fallback can be either:
 * - **ReactNode**: Static fallback UI (JSX element, string, etc.)
 * - **Function**: Dynamic fallback that receives error and reset function
 *
 * **Function Signature:**
 * - `error`: The Error object that caused the boundary to trigger
 * - `reset`: Function to reset the error boundary state
 *
 * @type {React.ReactNode | ((args: { error: Error; reset?: () => void }) => React.ReactNode)}
 */
type FallbackType =
  | React.ReactNode
  | ((args: { error: Error; reset?: () => void }) => React.ReactNode);

/**
 * Props interface for the WatcherErrorBoundary component
 *
 * This interface defines all configurable options for the error boundary,
 * allowing developers to customize error handling behavior and UI.
 *
 * **Configuration Options:**
 * - **config**: Watcher SDK configuration for error processing
 * - **fallback**: UI to display when errors occur
 * - **onErrorCaptured**: Callback function for error events
 * - **children**: React components to wrap with error protection
 *
 * @interface WatcherErrorBoundaryProps
 */
export interface WatcherErrorBoundaryProps {
  /** Optional Watcher SDK configuration for error processing */
  config?: WatcherConfig;
  /** UI to display when errors occur (static or dynamic) */
  fallback?: FallbackType;
  /** Callback function triggered when errors are captured */
  onErrorCaptured?: (payload: ErrorPayload) => void;
  /** React components to wrap with error boundary protection */
  children: React.ReactNode;
}

/**
 * Internal state interface for the error boundary
 *
 * This state tracks whether an error has occurred and stores
 * the error object for fallback UI rendering and error reporting.
 *
 * @interface State
 * @private
 */
interface State {
  /** Flag indicating if an error has occurred */
  hasError: boolean;
  /** The Error object that caused the boundary to trigger */
  error?: Error | null;
}

/**
 * React Error Boundary component with Watcher SDK integration
 *
 * This component implements React's error boundary pattern to catch
 * JavaScript errors in child components and provide graceful error
 * handling with automatic error reporting to the Watcher SDK.
 *
 * **Error Boundary Lifecycle:**
 * 1. **Normal Operation**: Component renders children normally
 * 2. **Error Occurs**: JavaScript error in child component tree
 * 3. **Error Caught**: getDerivedStateFromError updates state
 * 4. **Error Reported**: componentDidCatch processes and reports error
 * 5. **Fallback UI**: Component renders fallback instead of children
 * 6. **Error Recovery**: User can trigger reset to recover
 *
 * **Error Reporting Integration:**
 * - Automatically captures error details (name, message, stack)
 * - Includes React component stack information
 * - Adds browser context (URL, route, user agent)
 * - Processes errors through Watcher SDK pipeline
 * - Triggers optional onErrorCaptured callback
 *
 * **Fallback UI Rendering:**
 * - **Static Fallback**: Direct JSX element or string
 * - **Dynamic Fallback**: Function that receives error context
 * - **Reset Functionality**: Provides error recovery mechanism
 * - **Graceful Degradation**: Never crashes the application
 *
 * @class WatcherErrorBoundary
 * @extends {React.Component<WatcherErrorBoundaryProps, State>}
 *
 * @example
 * ```typescript
 * import { WatcherErrorBoundary } from 'watcher';
 *
 * // Basic usage with static fallback
 * <WatcherErrorBoundary fallback={<div>Something went wrong!</div>}>
 *   <MyComponent />
 * </WatcherErrorBoundary>
 *
 * // Advanced usage with dynamic fallback and error callback
 * <WatcherErrorBoundary
 *   fallback={({ error, reset }) => (
 *     <div>
 *       <h2>Error: {error.message}</h2>
 *       <button onClick={reset}>Try Again</button>
 *     </div>
 *   )}
 *   onErrorCaptured={(error) => console.log('Error captured:', error)}
 *   config={{ environment: 'production', sampleRate: 0.1 }}
 * >
 *   <MyComponent />
 * </WatcherErrorBoundary>
 * ```
 *
 * **Error Recovery:**
 * The error boundary provides a reset mechanism that allows users
 * to recover from errors without refreshing the page. This improves
 * user experience and reduces support requests.
 *
 * **Performance Considerations:**
 * - **Minimal Overhead**: No performance impact during normal operation
 * - **Error Isolation**: Errors are contained within the boundary
 * - **Memory Management**: Automatic cleanup of error state
 * - **Bundle Size**: Tree-shakeable when not used
 *
 * @since 0.1.0
 * @version Milestone 2 (React Integration)
 */
export class WatcherErrorBoundary extends React.Component<
  WatcherErrorBoundaryProps,
  State
> {
  /**
   * Initial component state
   *
   * The component starts in a normal state with no errors.
   * State changes to error state when getDerivedStateFromError is called.
   *
   * @type {State}
   */
  state: State = {
    hasError: false,
    error: null,
  };

  /**
   * Static method called when an error occurs in child components
   *
   * This method is part of React's error boundary API and is called
   * when a JavaScript error occurs anywhere in the child component tree.
   * It updates the component state to trigger fallback UI rendering.
   *
   * **React Error Boundary Contract:**
   * - Must be a static method
   * - Must return an object to update state
   * - Called during render phase (synchronous)
   * - Should not perform side effects
   *
   * @param {Error} error - The JavaScript error that occurred
   * @returns {State} New state indicating error condition
   *
   * @static
   */
  static getDerivedStateFromError(error: Error): State {
    // Update state to indicate error condition
    // This triggers re-render with fallback UI
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error is caught
   *
   * This method is called after getDerivedStateFromError and is responsible
   * for error processing, reporting, and any side effects. It integrates
   * with the Watcher SDK to capture and process React rendering errors.
   *
   * **Error Processing Pipeline:**
   * 1. **Error Capture**: Extract error details (name, message, stack)
   * 2. **Context Collection**: Gather browser and React context
   * 3. **Payload Creation**: Build ErrorPayload for Watcher SDK
   * 4. **Error Reporting**: Send to Watcher SDK via processError
   * 5. **Callback Trigger**: Execute optional onErrorCaptured callback
   * 6. **Error Recovery**: Never throw errors from boundary
   *
   * **Error Payload Structure:**
   * - **Type**: 'render_error' for React rendering errors
   * - **Error Details**: name, message, stack from Error object
   * - **React Context**: componentStack for component hierarchy
   * - **Browser Context**: URL, route, user agent information
   * - **Environment**: Watcher configuration context
   * - **Timestamp**: Precise error occurrence time
   *
   * @param {Error} error - The JavaScript error that occurred
   * @param {React.ErrorInfo} info - Additional error information from React
   *
   * @example
   * ```typescript
   * // Error info structure from React
   * interface ErrorInfo {
   *   componentStack: string; // Component stack trace
   * }
   * ```
   */
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    try {
      // Create comprehensive error payload for Watcher SDK
      const payload: ErrorPayload = {
        type: 'render_error',
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        route:
          typeof window !== 'undefined' ? window.location.pathname : undefined,
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        environment: this.props.config?.environment,
        timestamp: nowIso(),
      };

      // Process error through Watcher SDK pipeline
      // This handles deduplication, sampling, and transport
      processError(payload);

      // Trigger optional error callback for custom handling
      // Allows parent components to react to errors
      this.props.onErrorCaptured?.(payload);
    } catch {
      // Never throw errors from error boundary
      // This ensures the boundary never crashes the application
      // Even if error processing fails, the app continues running
    }
  }

  /**
   * Error recovery function that resets the boundary state
   *
   * This function allows users to recover from errors by resetting
   * the error boundary state. It's typically called from fallback UI
   * to provide a "Try Again" or "Reset" functionality.
   *
   * **Reset Behavior:**
   * - Clears error state (hasError: false)
   * - Removes error object (error: null)
   * - Triggers re-render of child components
   * - Allows normal component operation to resume
   *
   * **Usage in Fallback UI:**
   * ```typescript
   * fallback={({ error, reset }) => (
   *   <div>
   *     <p>Error: {error.message}</p>
   *     <button onClick={reset}>Try Again</button>
   *   </div>
   * )}
   * ```
   *
   * @returns {void}
   */
  reset: () => void = () => this.setState({ hasError: false, error: null });

  /**
   * Render method that conditionally renders children or fallback UI
   *
   * This method determines what to render based on the error state:
   * - **Normal State**: Renders children normally
   * - **Error State**: Renders fallback UI with error context
   *
   * **Fallback UI Resolution:**
   * 1. **Function Fallback**: Calls function with error and reset context
   * 2. **Static Fallback**: Renders fallback directly
   * 3. **No Fallback**: Renders nothing (null)
   * 4. **Children**: Renders wrapped components normally
   *
   * **Error Context for Dynamic Fallbacks:**
   * Dynamic fallbacks receive an object with:
   * - `error`: The Error object that caused the boundary to trigger
   * - `reset`: Function to reset the boundary and recover from error
   *
   * @returns {React.ReactNode} Either children or fallback UI
   */
  render() {
    // Check if an error has occurred
    if (this.state.hasError) {
      const { fallback } = this.props;

      // Handle function-based fallback with error context
      if (typeof fallback === 'function' && this.state.error) {
        return (fallback as any)({
          error: this.state.error,
          reset: this.reset,
        });
      }

      // Handle static fallback UI
      if (fallback) return fallback;
      
      // No fallback provided - render nothing
      return null;
    }

    // No error - render children normally
    return this.props.children as React.ReactNode;
  }
}
