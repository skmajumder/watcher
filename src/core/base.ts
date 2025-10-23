/**
 * Watcher SDK - Base Field Builder
 *
 * Produces common fields (environment, timestamp, url, route, userAgent)
 * for error payloads, adapting to browser vs server environments.
 */
import { WatcherConfig } from '../types/types';
import { nowIso } from '../utils';

/**
 * Returns common, environment-aware fields for error payloads.
 * - Server: includes environment and timestamp only
 * - Browser: also includes url, route, userAgent
 */
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
