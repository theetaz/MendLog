import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mendlog/onboarding-complete-v1';

export interface FirstRunStore {
  hasCompletedOnboarding(): Promise<boolean>;
  markOnboardingComplete(): Promise<void>;
  reset(): Promise<void>;
}

export function makeFirstRunStore(
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'> = AsyncStorage,
): FirstRunStore {
  return {
    async hasCompletedOnboarding() {
      const v = await storage.getItem(KEY);
      return v === '1';
    },
    async markOnboardingComplete() {
      await storage.setItem(KEY, '1');
    },
    async reset() {
      await storage.removeItem(KEY);
    },
  };
}

export const firstRunStore = makeFirstRunStore();
