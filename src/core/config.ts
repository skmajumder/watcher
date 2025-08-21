/**
 * Watcher SDK - Core Configuration
 *
 * This file contains the configuration management for the Watcher SDK.
 * It provides functions to set and retrieve the configuration object.
 *
 * singleton to hold config object
 */

import { WatcherConfig } from '../types/types';

let _config: WatcherConfig | null = null;

export const setConfig = (c: WatcherConfig): void => {
  if (!c || typeof c !== 'object') {
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
