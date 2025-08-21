export type WatcherEnv = 'development' | 'production' | 'test' | 'staging';

export interface WatcherConfig {
  environment: WatcherEnv;
  sampleRate?: number; // 0..1 (default later = 1)
  maxBreadcrumbs?: number; // future use (default later = 20)
}

export type ErrorKind =
  | 'runtime_error'
  | 'unhandled_promise'
  | 'promise_rejection'
  | 'network_error'
  | 'http_error'
  | 'render_error';

export interface ErrorPayload {
  type: ErrorKind;
  name?: string;
  message?: string;
  stack?: string;
  source?: string;
  position?: string; // "line:col"
  url?: string;
  route?: string;
  userAgent?: string;
  timestamp: string; // ISO
  environment?: WatcherEnv;
  sessionId?: string;
}
