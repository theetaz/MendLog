import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthProvider';

function makeFakeClient(initial: Session | null) {
  const listeners: Array<(event: string, s: Session | null) => void> = [];
  const signInMock = jest.fn(async ({ email }: { email: string; password: string }) => {
    if (email === 'bad@x.com') return { data: null, error: { message: 'Invalid login' } };
    const s = { user: { email } } as unknown as Session;
    listeners.forEach((fn) => fn('SIGNED_IN', s));
    return { data: { session: s }, error: null };
  });
  const signOutMock = jest.fn(async () => {
    listeners.forEach((fn) => fn('SIGNED_OUT', null));
    return { error: null };
  });
  const client = {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: initial }, error: null })),
      onAuthStateChange: (cb: (event: string, s: Session | null) => void) => {
        listeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const i = listeners.indexOf(cb);
                if (i >= 0) listeners.splice(i, 1);
              },
            },
          },
        };
      },
      signInWithPassword: signInMock,
      signOut: signOutMock,
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  } as unknown as SupabaseClient;
  return { client, signInMock, signOutMock };
}

function wrapper(client: SupabaseClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider client={client}>{children}</AuthProvider>;
  };
}

describe('AuthProvider', () => {
  it('starts in loading, resolves to signed-out when no session', async () => {
    const { client } = makeFakeClient(null);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(client) });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    expect(result.current.session).toBeNull();
  });

  it('resolves to signed-in when session is present', async () => {
    const session = { user: { email: 'a@b.com' } } as unknown as Session;
    const { client } = makeFakeClient(session);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
    expect(result.current.session).toBe(session);
  });

  it('signIn flips status on success', async () => {
    const { client } = makeFakeClient(null);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    await act(async () => {
      const res = await result.current.signIn('a@b.com', 'pw');
      expect(res.error).toBeUndefined();
    });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
  });

  it('signIn surfaces error string on failure', async () => {
    const { client } = makeFakeClient(null);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    let err: string | undefined;
    await act(async () => {
      const res = await result.current.signIn('bad@x.com', 'pw');
      err = res.error;
    });
    expect(err).toBe('Invalid login');
    expect(result.current.status).toBe('signed-out');
  });
});
