import { ErrorPayload } from '../types/types';
import { simpleHash } from '../utils';

const recent: Set<string> = new Set<string>();
const dedupeMs: number = 3000;

export function processError(p: ErrorPayload) {
  try {
    const key: string = simpleHash(
      [p.message, p.message, p.stack].filter(Boolean).join('|'),
    );
    if (recent.has(key)) return;
    recent.add(key);

    setTimeout(() => recent.delete(key), dedupeMs);
    // For Step 1, we leave the transport empty; Step 1.4 will log to console.
    // noop
  } catch {
    /** Throw never */
  }
}
