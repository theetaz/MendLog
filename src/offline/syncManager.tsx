import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ensureBackgroundSyncRegistered } from './backgroundSync';
import { ensureUserScopedDataForSession } from './clearSession';
import { subscribeLocalDataChanges } from './dataBus';
import { subscribeRealtimeUpdates } from './realtime';
import { dispatchAllPendingAI } from './sync/aiDispatch';
import {
  type SyncCounts,
  type SyncResult,
  getCatalogLastPulledAt,
  getJobsLastPulledAt,
  getSyncCounts,
  runCatalogSync,
  runDataSync,
} from './sync';

const AUTO_SYNC_KEY = '@mendlog/auto_sync';

const DEBOUNCE_MS = 30_000;

// Local-write triggers (saveJob, addPhoto, etc.) get a much shorter debounce
// so the upload starts within seconds of the user tapping save instead of
// waiting for the periodic 30s cadence. Long enough to coalesce a typical
// burst of writes (job + photos + clip in one save), short enough that
// the queue badge clears while the user is still on the screen.
const QUICK_DEBOUNCE_MS = 3_000;

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export interface SyncLane {
  status: SyncStatus;
  lastResult: SyncResult | null;
  lastRunAt: number | null;
  lastPulledAt: number; // server cursor, ms; 0 means never pulled
}

export interface SyncContextValue {
  online: boolean;
  autoSync: boolean;
  data: SyncLane;
  catalog: SyncLane;
  counts: SyncCounts;
  triggerData(): Promise<void>;
  triggerCatalog(): Promise<void>;
  triggerAll(): Promise<void>;
  triggerFullHistory(): Promise<void>;
  triggerAIRetry(): Promise<void>;
  setAutoSync(next: boolean): void;
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
  photosProcessing: 0,
  photosError: 0,
  clipsProcessing: 0,
  clipsError: 0,
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
  const [autoSync, setAutoSyncState] = useState(true);
  const [data, setData] = useState<SyncLane>(EMPTY_LANE);
  const [catalog, setCatalog] = useState<SyncLane>(EMPTY_LANE);
  const [counts, setCounts] = useState<SyncCounts>(EMPTY_COUNTS);

  // Load persisted auto-sync preference once. Default on.
  useEffect(() => {
    AsyncStorage.getItem(AUTO_SYNC_KEY)
      .then((v) => {
        if (v === 'off') setAutoSyncState(false);
      })
      .catch(() => {});
  }, []);

  const setAutoSync = useCallback((next: boolean) => {
    setAutoSyncState(next);
    AsyncStorage.setItem(AUTO_SYNC_KEY, next ? 'on' : 'off').catch(() => {});
  }, []);

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

  const runDataLane = useCallback(
    async (opts: { full?: boolean } = {}) => {
      if (inFlightData.current || !userId) return;
      inFlightData.current = true;
      setData((d) => ({ ...d, status: 'syncing' }));
      const result = await runDataSync(supabase, userId, { full: opts.full });
      inFlightData.current = false;
      setData((d) => ({
        ...d,
        status: result.ok ? 'ok' : 'error',
        lastResult: result,
        lastRunAt: Date.now(),
      }));
      await refreshMeta();
    },
    [supabase, userId, refreshMeta],
  );

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

  // Re-kick every photo/clip whose AI workflow is still pending or errored.
  // Used by the Me-screen "Retry AI processing" affordance when the user
  // wants to force-drain annotations without waiting for the next sync.
  const triggerAIRetry = useCallback(async () => {
    await dispatchAllPendingAI(supabase);
    await refreshMeta();
  }, [supabase, refreshMeta]);

  // "Sync all history" — bypass the 90-day window on the next data pull.
  const triggerFullHistory = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await runDataLane({ full: true });
  }, [runDataLane]);

  const schedule = useCallback(
    (delayMs: number = DEBOUNCE_MS) => {
      // Auto-sync off → user controls everything via manual triggers. Debounce
      // becomes a no-op so we don't burn bandwidth silently.
      if (!autoSync) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void runDataLane();
        void runCatalogLane();
      }, delayMs);
    },
    [autoSync, runDataLane, runCatalogLane],
  );

  // Initial meta snapshot so the UI has something to show before any sync.
  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  // Re-read counts after any local mutation — otherwise the sync section
  // and AppBar dot stay stale until the next sync completes.
  //
  // Also kick off a quick auto-sync. Without this, creating a job leaves
  // the upload queue waiting for the next AppState/NetInfo event (or the
  // 15-min background tick), so the queue badge would sit at "1 pending"
  // until the user manually pulled to sync.
  useEffect(
    () =>
      subscribeLocalDataChanges(() => {
        void refreshMeta();
        schedule(QUICK_DEBOUNCE_MS);
      }),
    [refreshMeta, schedule],
  );

  // First-run pull — once auth is ready, kick both lanes immediately so the
  // local DB gets populated without waiting for the 30s debounce. Screens
  // read from local, so an empty mirror on cold start would show blank
  // lists; this fills them right away when online.
  //
  // Before syncing we also run ensureUserScopedDataForSession: if the on-disk
  // data belongs to a different user (interrupted logout, account switch),
  // wipe it first so the incoming user never sees the previous user's jobs.
  // Keyed on userId so a within-session account switch re-runs the check.
  const initialSyncFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || initialSyncFor.current === userId) return;
    initialSyncFor.current = userId;
    void (async () => {
      try {
        await ensureUserScopedDataForSession(userId);
      } catch {
        // If the mismatch check itself fails we still proceed with the
        // sync — runDataLane's pull is user-scoped, so any stale rows
        // that remain are a UI-level leak (covered by the logout wipe on
        // a normal flow) rather than a server-side authorization issue.
      }
      await refreshMeta();
      void runDataLane();
      void runCatalogLane();
    })();
  }, [userId, runDataLane, runCatalogLane, refreshMeta]);

  // Background task — ask the OS to wake us roughly every 15 minutes so
  // pending writes still reach the server when the app isn't in use. The
  // handler itself honors the auto-sync toggle and a missing session,
  // so we register once per mount without further gating here.
  useEffect(() => {
    void ensureBackgroundSyncRegistered();
  }, []);

  // Realtime — subscribe once we know the user. Supabase realtime handles
  // reconnection internally when the socket drops, so there's no need to
  // tear down on NetInfo offline events; the scheduled pull catches any
  // missed updates regardless.
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeRealtimeUpdates(supabase, userId);
    return () => unsubscribe();
  }, [supabase, userId]);

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
      autoSync,
      data,
      catalog,
      counts,
      triggerData,
      triggerCatalog,
      triggerAll,
      triggerFullHistory,
      triggerAIRetry,
      setAutoSync,
    }),
    [
      online,
      autoSync,
      data,
      catalog,
      counts,
      triggerData,
      triggerCatalog,
      triggerAll,
      triggerFullHistory,
      triggerAIRetry,
      setAutoSync,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
