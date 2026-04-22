import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';
import { getSupabaseClient } from '../lib/supabase';
import {
  type SyncCounts,
  type SyncResult,
  getCatalogLastPulledAt,
  getJobsLastPulledAt,
  getSyncCounts,
  runCatalogSync,
  runDataSync,
} from './sync';

const DEBOUNCE_MS = 30_000;

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export interface SyncLane {
  status: SyncStatus;
  lastResult: SyncResult | null;
  lastRunAt: number | null;
  lastPulledAt: number; // server cursor, ms; 0 means never pulled
}

export interface SyncContextValue {
  online: boolean;
  data: SyncLane;
  catalog: SyncLane;
  counts: SyncCounts;
  triggerData(): Promise<void>;
  triggerCatalog(): Promise<void>;
  triggerAll(): Promise<void>;
}

const EMPTY_LANE: SyncLane = {
  status: 'idle',
  lastResult: null,
  lastRunAt: null,
  lastPulledAt: 0,
};

const EMPTY_COUNTS: SyncCounts = {
  pendingJobs: 0,
  pendingPhotos: 0,
  pendingClips: 0,
  pendingUploads: 0,
};

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// Throws outside SyncProvider — used by the sync UI in production.
export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}

// Returns undefined outside SyncProvider — used by components that need to
// render in isolated tests where no provider is set up.
export function useOptionalSync(): SyncContextValue | undefined {
  return useContext(SyncContext);
}

interface SyncProviderProps {
  children: React.ReactNode;
  client?: SupabaseClient;
}

// Central coordinator. Owns two lanes (data + catalog) and a debounced
// auto-runner wired to NetInfo + AppState. Exposed via context so any screen
// (chiefly the Me / Sync section) can read status and trigger manually.
export function SyncProvider({ children, client }: SyncProviderProps) {
  const supabase = client ?? getSupabaseClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [online, setOnline] = useState(true);
  const [data, setData] = useState<SyncLane>(EMPTY_LANE);
  const [catalog, setCatalog] = useState<SyncLane>(EMPTY_LANE);
  const [counts, setCounts] = useState<SyncCounts>(EMPTY_COUNTS);

  const inFlightData = useRef(false);
  const inFlightCatalog = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshMeta = useCallback(async () => {
    const [cnt, jobsAt, catAt] = await Promise.all([
      getSyncCounts(),
      getJobsLastPulledAt(),
      getCatalogLastPulledAt(),
    ]);
    setCounts(cnt);
    setData((d) => ({ ...d, lastPulledAt: jobsAt }));
    setCatalog((c) => ({ ...c, lastPulledAt: catAt }));
  }, []);

  const runDataLane = useCallback(async () => {
    if (inFlightData.current || !userId) return;
    inFlightData.current = true;
    setData((d) => ({ ...d, status: 'syncing' }));
    const result = await runDataSync(supabase, userId);
    inFlightData.current = false;
    setData((d) => ({
      ...d,
      status: result.ok ? 'ok' : 'error',
      lastResult: result,
      lastRunAt: Date.now(),
    }));
    await refreshMeta();
  }, [supabase, userId, refreshMeta]);

  const runCatalogLane = useCallback(async () => {
    if (inFlightCatalog.current) return;
    inFlightCatalog.current = true;
    setCatalog((c) => ({ ...c, status: 'syncing' }));
    const result = await runCatalogSync(supabase);
    inFlightCatalog.current = false;
    setCatalog((c) => ({
      ...c,
      status: result.ok ? 'ok' : 'error',
      lastResult: result,
      lastRunAt: Date.now(),
    }));
    await refreshMeta();
  }, [supabase, refreshMeta]);

  const triggerData = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await runDataLane();
  }, [runDataLane]);

  const triggerCatalog = useCallback(async () => {
    await runCatalogLane();
  }, [runCatalogLane]);

  const triggerAll = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await Promise.all([runDataLane(), runCatalogLane()]);
  }, [runDataLane, runCatalogLane]);

  const schedule = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void runDataLane();
      void runCatalogLane();
    }, DEBOUNCE_MS);
  }, [runDataLane, runCatalogLane]);

  // Initial meta snapshot so the UI has something to show before any sync.
  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  // First-run pull — once auth is ready, kick both lanes immediately so the
  // local DB gets populated without waiting for the 30s debounce. Screens
  // read from local, so an empty mirror on cold start would show blank
  // lists; this fills them right away when online.
  const didInitialSync = useRef(false);
  useEffect(() => {
    if (!userId || didInitialSync.current) return;
    didInitialSync.current = true;
    void runDataLane();
    void runCatalogLane();
  }, [userId, runDataLane, runCatalogLane]);

  // Network state subscription.
  useEffect(() => {
    const handler = (state: NetInfoState) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      setOnline((prev) => {
        if (!prev && isOnline) schedule();
        return isOnline;
      });
      if (!isOnline) {
        setData((d) => (d.status === 'syncing' ? d : { ...d, status: 'offline' }));
        setCatalog((c) => (c.status === 'syncing' ? c : { ...c, status: 'offline' }));
      }
    };
    const sub = NetInfo.addEventListener(handler);
    NetInfo.fetch().then(handler).catch(() => {});
    return () => sub();
  }, [schedule]);

  // App foreground → kick a debounced sync.
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && online) schedule();
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [online, schedule]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const value = useMemo<SyncContextValue>(
    () => ({
      online,
      data,
      catalog,
      counts,
      triggerData,
      triggerCatalog,
      triggerAll,
    }),
    [online, data, catalog, counts, triggerData, triggerCatalog, triggerAll],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
