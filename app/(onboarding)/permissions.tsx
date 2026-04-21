import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { OnboardingScreen } from '../../src/features/onboarding/OnboardingScreen';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';

export default function PermissionsRoute() {
  const router = useRouter();
  const { markComplete } = useOnboarding();

  const onComplete = useCallback(async () => {
    await markComplete();
    router.replace('/(auth)/login');
  }, [markComplete, router]);

  return <OnboardingScreen onComplete={onComplete} />;
}
