export function initWatcher() {
  // * will be implemented in Milestone 1 Step 1.3/1.4
  if (typeof window !== 'undefined') {
    console.log('[watcher] init (browser)');
  } else {
    console.log('[watcher] init (server)');
  }
}
