// src/core/normalize.ts

import { safeJson } from '../utils';

// Normalize anything (Error | string | object | unknown) into {name,message,stack}
export function normalizeThrowable(err: unknown): {
  name?: string;
  message?: string;
  stack?: string;
} {
  // Native Error
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }

  // string thrown
  if (typeof err === 'string') return { message: err };

  // objects that look like errors (from libs)
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;

    const name = typeof anyErr.name === 'string' ? anyErr.name : undefined;
    const message =
      typeof anyErr.message === 'string'
        ? anyErr.message
        : safeJson(anyErr.message);
    const stack = typeof anyErr.stack === 'string' ? anyErr.stack : undefined;

    return { name, message, stack };
  }

  // everything else
  return { message: String(err) };
}
