import { WatcherConfig } from '../types/types';

let _config: WatcherConfig | null = null;

export const setConfig = (c: WatcherConfig): void => {
  if (!c || typeof c !== 'object') {
    // Optionally, you could throw a custom error here for stricter validation
    console.error('Invalid configuration object provided to setConfig.');
    return;
  }
  _config = c;
};

export const getConfig = (): WatcherConfig => {
  if (_config === null) {
    console.error(
      'Configuration has not been set. Returning empty config object.',
    );
    return {} as WatcherConfig;
  }
  return _config;
};
