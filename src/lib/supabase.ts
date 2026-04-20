import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Factory — creates a Supabase client.
 * Exported for tests and for advanced cases (multiple clients).
 * Normal callers should use `getSupabaseClient()`.
 *
 * TODO(auth): pass `storage: AsyncStorage` once we install
 * `@react-native-async-storage/async-storage` during the sign-in slice.
 * Until then sessions won't persist across app restarts.
 */
export function makeSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let _client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set — see docs/supabase/README.md',
    );
  }
  _client = makeSupabaseClient(url, anon);
  return _client;
}

/**
 * Resets the cached singleton. Exposed for tests only.
 */
export function __resetSupabaseClientForTesting() {
  _client = undefined;
}
