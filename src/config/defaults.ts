import { WatcherConfig } from '../types/types';

export const defaultConfig: Required<
  Pick<WatcherConfig, 'sampleRate' | 'maxBreadcrumbs'>
> = {
  sampleRate: 1,
  maxBreadcrumbs: 20,
};
