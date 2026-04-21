import { makeFirstRunStore } from './firstRun';

function makeMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: async (k: string) => {
      store.delete(k);
    },
  };
}

describe('firstRunStore', () => {
  it('reports false until marked complete', async () => {
    const s = makeFirstRunStore(makeMemoryStorage());
    expect(await s.hasCompletedOnboarding()).toBe(false);
    await s.markOnboardingComplete();
    expect(await s.hasCompletedOnboarding()).toBe(true);
  });

  it('reset clears the flag', async () => {
    const s = makeFirstRunStore(makeMemoryStorage());
    await s.markOnboardingComplete();
    await s.reset();
    expect(await s.hasCompletedOnboarding()).toBe(false);
  });
});
