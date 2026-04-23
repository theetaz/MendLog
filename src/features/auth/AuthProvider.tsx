import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { clearUserScopedData } from '../../offline/clearSession';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  client: SupabaseClient;
  children: React.ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted.current) return;
        setSession(data.session);
        setStatus(data.session ? 'signed-in' : 'signed-out');
      })
      .catch(() => {
        if (!mounted.current) return;
        setStatus('signed-out');
      });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      if (!mounted.current) return;
      setSession(next);
      setStatus(next ? 'signed-in' : 'signed-out');
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  // Supabase requires auto-refresh to be paused while the app is backgrounded.
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    const sub = AppState.addEventListener('change', handler);
    handler(AppState.currentState);
    return () => sub.remove();
  }, [client]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error: error.message };
      return {};
    },
    [client],
  );

  const signOut = useCallback(async () => {
    // Wipe the local mirror BEFORE clearing the session so that if the
    // signOut call fails mid-flight, the next sign-in's mismatch check
    // (see ensureUserScopedDataForSession) still covers us.
    await clearUserScopedData().catch(() => {
      // Best-effort: sign-out should still proceed so the user isn't
      // stuck. The mismatch check at next sign-in is the safety net.
    });
    await client.auth.signOut();
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, signIn, signOut }),
    [status, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
