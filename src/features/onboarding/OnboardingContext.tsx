import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { firstRunStore, type FirstRunStore } from '../../lib/firstRun';

export type OnboardingStatus = 'loading' | 'pending' | 'complete';

interface OnboardingContextValue {
  status: OnboardingStatus;
  markComplete(): Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
  store?: FirstRunStore;
  children: React.ReactNode;
}

export function OnboardingProvider({ store = firstRunStore, children }: OnboardingProviderProps) {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    store.hasCompletedOnboarding().then((done) => {
      if (!cancelled) setStatus(done ? 'complete' : 'pending');
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const markComplete = useCallback(async () => {
    await store.markOnboardingComplete();
    setStatus('complete');
  }, [store]);

  const value = useMemo(() => ({ status, markComplete }), [status, markComplete]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
