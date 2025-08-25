import * as React from 'react';
import type { WatcherErrorBoundaryProps } from './reactBoundary';
import { WatcherErrorBoundary } from './reactBoundary';

export function withWatcherBoundary<P extends Record<string, any>>(
  App: React.ComponentType<P>,
  props?: WatcherErrorBoundaryProps,
): React.FC<P> {
  return function Wrapped(propsIn: P) {
    return (
      <WatcherErrorBoundary {...props}>
        <App {...propsIn} />
      </WatcherErrorBoundary>
    );
  };
}
