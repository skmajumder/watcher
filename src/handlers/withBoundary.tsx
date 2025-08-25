/**
 * Watcher SDK - Higher-Order Component (HOC) Wrapper
 *
 * This file contains the `withWatcherBoundary` HOC that wraps React components
 * with error boundary protection. It provides a convenient way to add error
 * tracking to existing components without modifying their implementation.
 *
 * **Purpose:**
 * The HOC pattern allows developers to:
 * - Add error boundary protection to any component
 * - Maintain component composition and reusability
 * - Provide consistent error handling across the application
 * - Wrap components at different levels of the component tree
 *
 * **Benefits:**
 * - **Non-invasive**: Wraps components without changing their code
 * - **Reusable**: Can be applied to multiple components
 * - **Configurable**: Accepts custom error boundary props
 * - **Type-safe**: Maintains full TypeScript support for wrapped components
 *
 * **Use Cases:**
 * - Wrapping entire applications for global error protection
 * - Adding error boundaries to specific feature components
 * - Providing different error handling strategies per component
 * - Testing error boundaries with different configurations
 */

import * as React from 'react';
import type { WatcherErrorBoundaryProps } from './reactBoundary';
import { WatcherErrorBoundary } from './reactBoundary';

/**
 * Higher-Order Component that wraps a React component with error boundary protection
 *
 * This HOC creates a new component that wraps the original component with
 * the WatcherErrorBoundary, providing automatic error capture and reporting
 * for React rendering errors.
 *
 * **How it works:**
 * 1. **Component Wrapping**: Creates a new component that renders the original
 * 2. **Error Boundary Integration**: Wraps the original component with WatcherErrorBoundary
 * 3. **Props Forwarding**: Passes all props to the wrapped component
 * 4. **Error Handling**: Automatically captures and reports React errors
 *
 * **Generic Type Constraints:**
 * - `P extends Record<string, any>` ensures the generic type is an object
 * - This prevents TypeScript errors with React's IntrinsicAttributes
 * - Maintains full type safety for the wrapped component's props
 *
 * **Error Boundary Configuration:**
 * - Accepts optional WatcherErrorBoundaryProps for customization
 * - Can configure fallback UI, error callbacks, and other options
 * - Default configuration provides sensible error handling behavior
 *
 * @template P - The props type of the component to wrap (must be an object)
 * @param {React.ComponentType<P>} App - The React component to wrap with error boundary
 * @param {WatcherErrorBoundaryProps} [props] - Optional configuration for the error boundary
 * @returns {React.FC<P>} A new component wrapped with error boundary protection
 *
 * @example
 * ```typescript
 * import { withWatcherBoundary } from 'watcher';
 * import { MyComponent } from './MyComponent';
 *
 * // Basic usage - wrap component with default error boundary
 * const ProtectedComponent = withWatcherBoundary(MyComponent);
 *
 * // Advanced usage - wrap with custom error boundary configuration
 * const ProtectedComponent = withWatcherBoundary(MyComponent, {
 *   fallback: <div>Something went wrong!</div>,
 *   onErrorCaptured: (error) => console.log('Error captured:', error),
 *   config: { environment: 'production', sampleRate: 0.1 }
 * });
 *
 * // Usage in JSX
 * function App() {
 *   return (
 *     <div>
 *       <ProtectedComponent 
 *         title="My App"
 *         data={someData}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * **Error Handling Flow:**
 * 1. **Component Renders**: Original component renders normally
 * 2. **Error Occurs**: If a React error occurs during rendering
 * 3. **Boundary Catches**: WatcherErrorBoundary catches the error
 * 4. **Error Processing**: Error is processed and reported via Watcher SDK
 * 5. **Fallback UI**: Optional fallback UI is displayed
 * 6. **Error Callback**: Optional onErrorCaptured callback is triggered
 *
 * **Performance Considerations:**
 * - **Minimal Overhead**: HOC adds minimal runtime overhead
 * - **Bundle Size**: Error boundary code is tree-shakeable
 * - **Memory Usage**: No additional memory allocation during normal operation
 * - **Error Recovery**: Automatic error recovery and boundary reset
 *
 * **Best Practices:**
 * - Wrap components at appropriate levels (not too deep, not too shallow)
 * - Use consistent error boundary configurations across similar components
 * - Provide meaningful fallback UI for better user experience
 * - Monitor error patterns through the Watcher SDK
 * - Test error boundaries with intentional error scenarios
 *
 * @since 0.1.0
 * @version Milestone 2 (React Integration)
 */
export function withWatcherBoundary<P extends Record<string, any>>(
  App: React.ComponentType<P>,
  props?: WatcherErrorBoundaryProps,
): React.FC<P> {
  /**
   * Wrapped component that provides error boundary protection
   *
   * This inner component:
   * - Receives all props from the parent component
   * - Wraps the original component with WatcherErrorBoundary
   * - Forwards all props to the original component
   * - Maintains the same component interface
   *
   * @param {P} propsIn - All props passed to the wrapped component
   * @returns {JSX.Element} The wrapped component with error boundary
   */
  return function Wrapped(propsIn: P) {
    return (
      <WatcherErrorBoundary {...props}>
        <App {...propsIn} />
      </WatcherErrorBoundary>
    );
  };
}
