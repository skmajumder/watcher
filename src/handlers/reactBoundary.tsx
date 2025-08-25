// src/handlers/reactBoundary.tsx

import * as React from 'react';
import type { ErrorPayload, WatcherConfig } from '../types/types';
import { processError } from '../core/processor';
import { nowIso } from '../utils';

type FallbackType =
  | React.ReactNode
  | ((args: { error: Error; reset?: () => void }) => React.ReactNode);

// Props for the WatcherErrorBoundary component
export interface WatcherErrorBoundaryProps {
  config?: WatcherConfig;
  fallback?: FallbackType;
  onErrorCaptured?: (payload: ErrorPayload) => void;
  children: React.ReactNode;
}

// State for the WatcherErrorBoundary component
interface State {
  hasError: boolean;
  error?: Error | null;
}

export class WatcherErrorBoundary extends React.Component<
  WatcherErrorBoundaryProps,
  State
> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    try {
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
      processError(payload);
      this.props.onErrorCaptured?.(payload);
    } catch {
      // never throw from boundary
    }
  }

  reset: () => void = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function' && this.state.error) {
        return (fallback as any)({
          error: this.state.error,
          reset: this.reset,
        });
      }

      if (fallback) return fallback;
      return null;
    }

    return this.props.children as React.ReactNode;
  }
}
