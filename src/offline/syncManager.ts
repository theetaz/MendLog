import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';
import { getSupabaseClient } from '../lib/supabase';
import { runSync, type SyncResult } from './sync';

const DEBOUNCE_MS = 30_000;

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastResult: SyncResult | null;
  lastRunAt: number | null;
  online: boolean;
  trigger(): void; // manual kick (pull-to-refresh, save button, etc.)
}

// Central coordinator. Listens for: app foreground, network regain, and
// manual triggers. All three collapse into a single debounced `runSync`
// call so we don't thrash the connection when it flaps.
export function useSyncManager(client: SupabaseClient = getSupabaseClient()): SyncState {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean>(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current || !userId) return;
    inFlight.current = true;
    setStatus('syncing');
    const result = await runSync(client, userId);
    inFlight.current = false;
    setLastResult(result);
    setLastRunAt(Date.now());
    setStatus(result.ok ? 'ok' : 'error');
  }, [client, userId]);

  const schedule = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(run, DEBOUNCE_MS);
  }, [run]);

  const trigger = useCallback(() => {
    // Manual triggers (user pulled to refresh, hit save) run immediately —
    // the debounce is for ambient events (network/app-state) only.
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void run();
  }, [run]);

  // Network state subscription.
  useEffect(() => {
    const handler = (state: NetInfoState) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      setOnline((prev) => {
        if (!prev && isOnline) schedule(); // came back online → sync soon
        return isOnline;
      });
      if (!isOnline) setStatus('offline');
    };
    const sub = NetInfo.addEventListener(handler);
    NetInfo.fetch().then(handler).catch(() => {});
    return () => sub();
  }, [schedule]);

  // App-state subscription.
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && online) schedule();
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [online, schedule]);

  // Cleanup any pending timer on unmount.
  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  return { status, lastResult, lastRunAt, online, trigger };
}
