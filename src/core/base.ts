import { WatcherConfig } from '../types/types';
import { nowIso } from '../utils';

export function baseFields(config: WatcherConfig) {
  const ts = nowIso();

  if (typeof window === 'undefined') {
    return {
      environment: config.environment,
      timestamp: ts,
      url: undefined,
      route: undefined,
      userAgent: undefined,
    };
  }

  return {
    environment: config.environment,
    timestamp: ts,
    url: window.location.href,
    route: window.location.pathname,
    userAgent: navigator.userAgent,
  };
}
