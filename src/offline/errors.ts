// Robust error-to-string. Hand-rolled because `String(err)` on a plain object
// yields `[object Object]` — which leaked through to the UI whenever a fetch
// rejected with a non-Error value (common for RN network failures and some
// supabase-js internals).

export function errorMessage(e: unknown): string {
  if (e == null) return 'Unknown error';
  if (e instanceof Error) return e.message || 'Unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message) return obj.message;
    if (typeof obj.error === 'string' && obj.error) return obj.error;
    if (typeof obj.details === 'string' && obj.details) return obj.details;
    try {
      const json = JSON.stringify(obj);
      if (json && json !== '{}') return json;
    } catch {
      /* fallthrough */
    }
  }
  return 'Unknown error';
}
